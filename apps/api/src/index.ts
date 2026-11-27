import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { type AppEnv, withDb } from "./core/app";
import { onError } from "./core/errors";
import { authRoutes } from "./modules/auth/auth.routes";
import { chatsRoutes } from "./modules/chats/chats.routes";
import { filesRoutes } from "./modules/files/files.routes";
import { friendsRoutes } from "./modules/friends/friends.routes";
import { realtimeRoutes } from "./modules/realtime/realtime.routes";
import { searchRoutes } from "./modules/search/search.routes";

const headers = secureHeaders();

const app = new Hono<AppEnv>()
  .basePath("/api")
  // Not on the WebSocket upgrade: its 101 response headers are immutable.
  .use((c, next) => (c.req.path === "/api/ws" ? next() : headers(c, next)))
  .use(withDb)
  .get("/health", (c) => c.json({ ok: true, time: Date.now() }))
  .route("/auth", authRoutes)
  .route("/friends", friendsRoutes)
  .route("/chats", chatsRoutes)
  .route("/files", filesRoutes)
  .route("/search", searchRoutes)
  .route("/ws", realtimeRoutes);

app.onError(onError);
app.notFound((c) => c.json({ error: { code: "not_found", message: "Not found" } }, 404));

export type AppType = typeof app;
export default app;
export { UserHub } from "./modules/realtime/user-hub";
