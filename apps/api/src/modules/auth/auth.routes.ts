import { loginInput, type SessionInfo, signupInput } from "@sonora/shared";
import { Hono } from "hono";
import type { AppEnv } from "../../core/app";
import { rateLimit, sameOrigin } from "../../core/guards";
import { body } from "../../core/validate";
import { login, signup, toMe } from "./auth.service";
import {
  clearSessionCookie,
  createSession,
  listSessions,
  requireAuth,
  revokeOtherSessions,
  revokeSession,
  sessionMeta,
  setSessionCookie,
} from "./session";

export const authRoutes = new Hono<AppEnv>()
  .post("/signup", sameOrigin, rateLimit("signup"), body(signupInput), async (c) => {
    const user = await signup(c.var.db, c.req.valid("json"));
    setSessionCookie(c, await createSession(c.var.db, user.id, sessionMeta(c)));
    return c.json({ user: toMe(user) }, 201);
  })
  .post("/login", sameOrigin, rateLimit("login"), body(loginInput), async (c) => {
    const user = await login(c.var.db, c.req.valid("json"));
    setSessionCookie(c, await createSession(c.var.db, user.id, sessionMeta(c)));
    return c.json({ user: toMe(user) });
  })
  .post("/logout", sameOrigin, requireAuth, async (c) => {
    await revokeSession(c.var.db, c.var.user.id, c.var.sessionId);
    clearSessionCookie(c);
    return c.json({ ok: true });
  })
  .get("/me", requireAuth, (c) => c.json({ user: toMe(c.var.user) }))
  .get("/sessions", requireAuth, async (c) => {
    const rows = await listSessions(c.var.db, c.var.user.id);
    const list: SessionInfo[] = rows
      .map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        city: s.city,
        createdAt: s.createdAt.getTime(),
        lastSeenAt: s.lastSeenAt.getTime(),
        current: s.id === c.var.sessionId,
      }))
      .sort((a, b) => Number(b.current) - Number(a.current) || b.lastSeenAt - a.lastSeenAt);
    return c.json({ sessions: list });
  })
  .delete("/sessions/:id", sameOrigin, requireAuth, async (c) => {
    await revokeSession(c.var.db, c.var.user.id, c.req.param("id"));
    return c.json({ ok: true });
  })
  .delete("/sessions", sameOrigin, requireAuth, async (c) => {
    await revokeOtherSessions(c.var.db, c.var.user.id, c.var.sessionId);
    return c.json({ ok: true });
  });
