import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { type AppEnv, withDb } from "./core/app";
import { onError } from "./core/errors";
import { authRoutes } from "./modules/auth/auth.routes";

const app = new Hono<AppEnv>()
  .basePath("/api")
  .use(secureHeaders())
  .use(withDb)
  .get("/health", (c) => c.json({ ok: true, time: Date.now() }))
  .route("/auth", authRoutes);

app.onError(onError);
app.notFound((c) => c.json({ error: { code: "not_found", message: "Not found" } }, 404));

export type AppType = typeof app;
export default app;
