import { Hono } from "hono";
import type { AppEnv } from "../../core/app";
import { AppError } from "../../core/errors";
import { sameOrigin } from "../../core/guards";
import { requireAuth } from "../auth/session";
import { hub } from "./publish";
import { USER_HEADER } from "./user-hub";

/** GET /api/ws: authenticated upgrade, handed to the caller's own UserHub. */
export const realtimeRoutes = new Hono<AppEnv>().get("/", sameOrigin, requireAuth, (c) => {
  if (c.req.header("upgrade")?.toLowerCase() !== "websocket") {
    throw new AppError(426, "upgrade_required", "Expected a WebSocket upgrade");
  }
  const headers = new Headers(c.req.raw.headers);
  headers.set(USER_HEADER, c.var.user.id); // trusted: set only here, after auth
  return hub(c.env, c.var.user.id).fetch(new Request(c.req.raw, { headers }));
});
