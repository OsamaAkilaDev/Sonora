import { and, eq, ne } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../../core/app";
import type { Db } from "../../core/db";
import { AppError } from "../../core/errors";
import { type Session, sessions, type User, users } from "../../db/schema";

const COOKIE = "__Host-sid";
const DAY = 86_400_000;
const TTL = 30 * DAY;
const TOUCH_EVERY = 3_600_000; // write last_seen at most hourly

const sha256 = async (s: string) =>
  Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))).toString("hex");

export type SessionMeta = { userAgent: string; city: string | null };

export async function createSession(db: Db, userId: string, meta: SessionMeta) {
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const now = Date.now();
  await db.insert(sessions).values({
    id: await sha256(token),
    userId,
    ...meta,
    createdAt: new Date(now),
    lastSeenAt: new Date(now),
    expiresAt: new Date(now + TTL),
  });
  return token;
}

/** Validates a cookie token. Sliding expiry: returns `refreshed` when the cookie should be re-set. */
export async function resolveSession(
  db: Db,
  token: string,
): Promise<{ user: User; session: Session; refreshed: boolean } | null> {
  const id = await sha256(token);
  const row = await db
    .select()
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .get();
  if (!row) return null;

  const now = Date.now();
  if (row.sessions.expiresAt.getTime() <= now) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  const refreshed = now - row.sessions.lastSeenAt.getTime() > TOUCH_EVERY;
  if (refreshed) {
    await db
      .update(sessions)
      .set({ lastSeenAt: new Date(now), expiresAt: new Date(now + TTL) })
      .where(eq(sessions.id, id));
  }
  return { user: row.users, session: row.sessions, refreshed };
}

export const revokeSession = (db: Db, userId: string, id: string) =>
  db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, userId)));

export const revokeOtherSessions = (db: Db, userId: string, keepId: string) =>
  db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, keepId)));

export const listSessions = (db: Db, userId: string) =>
  db.select().from(sessions).where(eq(sessions.userId, userId)).all();

export const setSessionCookie = (c: Context, token: string) =>
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: TTL / 1000,
  });

export const clearSessionCookie = (c: Context) =>
  deleteCookie(c, COOKIE, { path: "/", secure: true });

export const sessionMeta = (c: Context<AppEnv>): SessionMeta => ({
  userAgent: (c.req.header("user-agent") ?? "").slice(0, 300),
  city: (c.req.raw.cf?.city as string | undefined) ?? null,
});

/** Requires a valid session; exposes c.var.user and c.var.sessionId. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, COOKIE);
  const found = token ? await resolveSession(c.var.db, token) : null;
  if (!found || !token) throw new AppError(401, "unauthenticated", "Sign in to continue");
  if (found.refreshed) setSessionCookie(c, token);
  c.set("user", found.user);
  c.set("sessionId", found.session.id);
  await next();
});
