import { zValidator } from "@hono/zod-validator";
import {
  createGroupInput,
  editMessageInput,
  MAX_UPLOAD_BYTES,
  markReadInput,
  openDmInput,
  reactInput,
  sendMessageInput,
  uploadAllowed,
} from "@sonora/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../core/app";
import { AppError } from "../../core/errors";
import { sameOrigin } from "../../core/guards";
import { body } from "../../core/validate";
import { requireAuth } from "../auth/session";
import { publish } from "../realtime/publish";
import {
  createAttachment,
  createGroup,
  deleteMessage,
  editMessage,
  getChat,
  listChats,
  markRead,
  messagePage,
  openDm,
  requireMember,
  sendMessage,
  toggleReaction,
} from "./chats.service";

const dimension = (v: string | undefined) => {
  const n = Number(v);
  return v && Number.isInteger(n) && n > 0 && n <= 20000 ? n : null;
};

/** Decoded, separator- and control-free, capped; "file" when nothing is left. */
function fileName(raw: string | undefined) {
  let name = raw ?? "";
  try {
    name = decodeURIComponent(name);
  } catch {}
  return (
    name
      .replace(/[\\/\p{Cc}]/gu, "")
      .trim()
      .slice(0, 200) || "file"
  );
}

export const chatsRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get("/", async (c) => c.json({ chats: await listChats(c.var.db, c.var.user.id) }))
  .post("/dm", sameOrigin, body(openDmInput), async (c) => {
    const { chat, created } = await openDm(c.var.db, c.var.user.id, c.req.valid("json").userId);
    if (created)
      c.executionCtx.waitUntil(
        publish(
          c.env,
          chat.members.filter((m) => m.id !== c.var.user.id).map((m) => m.id),
          { type: "chat.new", chat: { ...chat, unread: 0 } },
        ),
      );
    return c.json({ chat });
  })
  .post("/group", sameOrigin, body(createGroupInput), async (c) => {
    const { name, memberIds } = c.req.valid("json");
    const { chat, memberIds: others } = await createGroup(c.var.db, c.var.user.id, name, memberIds);
    c.executionCtx.waitUntil(publish(c.env, others, { type: "chat.new", chat }));
    return c.json({ chat }, 201);
  })
  .get("/:id", async (c) =>
    c.json({ chat: await getChat(c.var.db, c.var.user.id, c.req.param("id")) }),
  )
  .get(
    "/:id/messages",
    zValidator("query", z.object({ before: z.string().max(40).optional() }), (r) => {
      if (!r.success) throw new AppError(422, "invalid_input", "Bad cursor");
    }),
    async (c) =>
      c.json(
        await messagePage(c.var.db, c.var.user.id, c.req.param("id"), c.req.valid("query").before),
      ),
  )
  .post("/:id/messages", sameOrigin, body(sendMessageInput), async (c) => {
    const { message, created, memberIds } = await sendMessage(
      c.var.db,
      c.var.user.id,
      c.req.param("id"),
      c.req.valid("json"),
    );
    if (!created) return c.json({ message });
    c.executionCtx.waitUntil(publish(c.env, memberIds, { type: "message.new", message }));
    return c.json({ message }, 201);
  })
  .post("/:id/read", sameOrigin, body(markReadInput), async (c) => {
    const { lastReadId } = c.req.valid("json");
    const chatId = c.req.param("id");
    const others = await markRead(c.var.db, c.var.user.id, chatId, lastReadId);
    if (others)
      c.executionCtx.waitUntil(
        publish(c.env, others, { type: "read", chatId, userId: c.var.user.id, lastReadId }),
      );
    return c.json({ ok: true });
  })
  .patch("/:id/messages/:messageId", sameOrigin, body(editMessageInput), async (c) => {
    const { message, memberIds } = await editMessage(
      c.var.db,
      c.var.user.id,
      c.req.param("id"),
      c.req.param("messageId"),
      c.req.valid("json").body,
    );
    c.executionCtx.waitUntil(publish(c.env, memberIds, { type: "message.updated", message }));
    return c.json({ message });
  })
  .delete("/:id/messages/:messageId", sameOrigin, async (c) => {
    const { message, memberIds, keys } = await deleteMessage(
      c.var.db,
      c.var.user.id,
      c.req.param("id"),
      c.req.param("messageId"),
    );
    if (keys.length) c.executionCtx.waitUntil(c.env.FILES.delete(keys));
    c.executionCtx.waitUntil(publish(c.env, memberIds, { type: "message.updated", message }));
    return c.json({ message });
  })
  .put("/:id/messages/:messageId/reactions", sameOrigin, body(reactInput), async (c) => {
    const { message, memberIds } = await toggleReaction(
      c.var.db,
      c.var.user.id,
      c.req.param("id"),
      c.req.param("messageId"),
      c.req.valid("json").emoji,
    );
    c.executionCtx.waitUntil(publish(c.env, memberIds, { type: "message.updated", message }));
    return c.json({ message });
  })
  .post("/:id/uploads", sameOrigin, async (c) => {
    // Membership first, so non-members can't probe which chats exist via type/size errors.
    await requireMember(c.var.db, c.req.param("id"), c.var.user.id);
    const h = c.req.header.bind(c.req);
    const mime = (h("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
    if (!uploadAllowed(mime))
      throw new AppError(415, "unsupported_type", "That file type isn't supported");
    const size = Number(h("content-length"));
    if (!h("content-length") || !Number.isInteger(size) || size < 0)
      throw new AppError(411, "length_required", "Content-Length is required");
    if (size > MAX_UPLOAD_BYTES) throw new AppError(413, "too_large", "That file is too large");
    const attachment = await createAttachment(
      c.var.db,
      c.env.FILES,
      c.var.user.id,
      c.req.param("id"),
      {
        name: fileName(h("x-file-name")),
        mime,
        size,
        width: dimension(h("x-width")),
        height: dimension(h("x-height")),
      },
      c.req.raw.body,
    );
    return c.json({ attachment }, 201);
  });
