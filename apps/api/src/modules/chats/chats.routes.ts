import { zValidator } from "@hono/zod-validator";
import { createGroupInput, markReadInput, openDmInput, sendMessageInput } from "@sonora/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../core/app";
import { AppError } from "../../core/errors";
import { sameOrigin } from "../../core/guards";
import { body } from "../../core/validate";
import { requireAuth } from "../auth/session";
import { publish } from "../realtime/publish";
import {
  createGroup,
  getChat,
  listChats,
  markRead,
  messagePage,
  openDm,
  sendMessage,
} from "./chats.service";

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
  });
