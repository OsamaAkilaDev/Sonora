import { declineCallInput } from "@sonora/shared";
import { Hono } from "hono";
import type { AppEnv } from "../../core/app";
import { AppError } from "../../core/errors";
import { sameOrigin } from "../../core/guards";
import { body } from "../../core/validate";
import { requireAuth } from "../auth/session";
import { JOIN_HEADER, type Join } from "./call-room";
import { callContext } from "./calls.service";

const room = (env: Env, chatId: string) => env.CALL_ROOM.getByName(chatId);

export const callsRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  /** WebSocket upgrade: start or join the chat's call. */
  .get("/:chatId/ws", sameOrigin, async (c) => {
    if (c.req.header("upgrade")?.toLowerCase() !== "websocket") {
      throw new AppError(426, "upgrade_required", "Expected a WebSocket upgrade");
    }
    const chatId = c.req.param("chatId");
    const join: Join = {
      ...(await callContext(c.var.db, chatId, c.var.user.id)),
      chatId,
      userId: c.var.user.id,
      video: c.req.query("video") === "1",
      callId: c.req.query("callId") ?? null,
    };
    const headers = new Headers(c.req.raw.headers);
    headers.set(JOIN_HEADER, JSON.stringify(join)); // trusted: set only here, after the checks
    return room(c.env, chatId).fetch(new Request(c.req.raw, { headers }));
  })
  .post("/:chatId/decline", sameOrigin, body(declineCallInput), async (c) => {
    const chatId = c.req.param("chatId");
    await callContext(c.var.db, chatId, c.var.user.id);
    await room(c.env, chatId).decline(c.var.user.id, c.req.valid("json").callId);
    return c.json({ ok: true });
  });
