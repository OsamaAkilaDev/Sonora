import type { PublicUser } from "@sonora/shared";
import { inArray } from "drizzle-orm";
import type { Db } from "../../core/db";
import { type User, users } from "../../db/schema";

/** What other people see. Invisible and disconnected both read as offline. */
export const toPublicUser = (u: User): PublicUser => ({
  id: u.id,
  username: u.username,
  avatarSeed: u.avatarSeed,
  about: u.about,
  presence: !u.connected || u.status === "invisible" ? "offline" : u.status,
  lastSeenAt: u.connected ? null : (u.lastSeenAt?.getTime() ?? null),
});

export async function usersByIds(db: Db, ids: string[]) {
  if (!ids.length) return new Map<string, User>();
  const rows = await db.select().from(users).where(inArray(users.id, ids)).all();
  return new Map(rows.map((u) => [u.id, u]));
}
