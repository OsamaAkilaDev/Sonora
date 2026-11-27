import { createMiddleware } from "hono/factory";
import type { AppEnv } from "./app";
import { AppError } from "./errors";

/** CSRF: mutating requests must come from our own origin (on top of SameSite=Lax cookies). */
export const sameOrigin = createMiddleware<AppEnv>(async (c, next) => {
  const origin = c.req.header("origin");
  if (!origin || new URL(origin).host !== new URL(c.req.url).host) {
    throw new AppError(403, "bad_origin", "Request blocked");
  }
  await next();
});

/** Fixed-window limit per client IP and route bucket, via the Workers Rate Limiting binding. */
export const rateLimit = (bucket: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const ip = c.req.header("cf-connecting-ip") ?? "local";
    const { success } = await c.env.AUTH_LIMITER.limit({ key: `${bucket}:${ip}` });
    if (!success)
      throw new AppError(429, "rate_limited", "Too many attempts. Try again in a minute.");
    await next();
  });
