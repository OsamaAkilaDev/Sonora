import type { FriendRequest, PublicUser } from "@sonora/shared";
import { and, eq, inArray, or } from "drizzle-orm";
import type { Db } from "../../core/db";
import { AppError } from "../../core/errors";
import { friendships, type User, users } from "../../db/schema";
import { toPublicUser, usersByIds } from "../users/users.service";

/** Friendships are stored once per pair with userA < userB. */
const pair = (a: string, b: string) => (a < b ? { userA: a, userB: b } : { userA: b, userB: a });
const pairIs = (a: string, b: string) => {
  const p = pair(a, b);
  return and(eq(friendships.userA, p.userA), eq(friendships.userB, p.userB));
};
const findPair = (db: Db, a: string, b: string) =>
  db.select().from(friendships).where(pairIs(a, b)).get();

export async function listFriends(db: Db, me: string) {
  const rows = await db
    .select()
    .from(friendships)
    .where(or(eq(friendships.userA, me), eq(friendships.userB, me)))
    .all();
  const other = (r: (typeof rows)[number]) => (r.userA === me ? r.userB : r.userA);
  const people = await usersByIds(db, rows.map(other));

  const friends: PublicUser[] = rows
    .filter((r) => r.status === "accepted")
    .map((r) => toPublicUser(people.get(other(r)) as User))
    .sort((a, b) => a.username.localeCompare(b.username));
  const requests: FriendRequest[] = rows
    .filter((r) => r.status === "pending")
    .map((r) => ({
      user: toPublicUser(people.get(other(r)) as User),
      direction: r.requestedBy === me ? ("outgoing" as const) : ("incoming" as const),
      createdAt: r.createdAt.getTime(),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
  return { friends, requests };
}

/** Subset of `ids` that are accepted friends of `me`. */
export async function friendIdsAmong(db: Db, me: string, ids: string[]) {
  if (!ids.length) return new Set<string>();
  const rows = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(
          and(eq(friendships.userA, me), inArray(friendships.userB, ids)),
          and(eq(friendships.userB, me), inArray(friendships.userA, ids)),
        ),
      ),
    )
    .all();
  return new Set(rows.map((r) => (r.userA === me ? r.userB : r.userA)));
}

const accept = (db: Db, a: string, b: string) =>
  db.update(friendships).set({ status: "accepted" }).where(pairIs(a, b));

/** Sends a request, or accepts if the target already asked us. */
export async function requestFriend(db: Db, me: User, username: string) {
  const target = await db.select().from(users).where(eq(users.username, username)).get();
  if (!target) throw new AppError(404, "user_not_found", `No one goes by @${username}`);
  if (target.id === me.id) throw new AppError(422, "self", "That's you");

  const existing = await findPair(db, me.id, target.id);
  if (existing?.status === "accepted")
    throw new AppError(409, "already_friends", "You're already friends");
  if (existing?.requestedBy === me.id)
    throw new AppError(409, "already_requested", "Request already sent");
  if (existing) {
    await accept(db, me.id, target.id);
    return { accepted: true as const, target };
  }

  const createdAt = new Date();
  await db
    .insert(friendships)
    .values({ ...pair(me.id, target.id), status: "pending", requestedBy: me.id, createdAt });
  const request: FriendRequest = {
    user: toPublicUser(target),
    direction: "outgoing",
    createdAt: createdAt.getTime(),
  };
  return { accepted: false as const, target, request };
}

export async function acceptRequest(db: Db, me: string, fromId: string) {
  const row = await findPair(db, me, fromId);
  if (row?.status !== "pending" || row.requestedBy !== fromId)
    throw new AppError(404, "request_not_found", "No such request");
  await accept(db, me, fromId);
  return (await usersByIds(db, [fromId])).get(fromId) as User;
}

/** Decline, cancel or unfriend: deletes the pair if it is in the given state. */
export async function removePair(
  db: Db,
  me: string,
  otherId: string,
  status: "pending" | "accepted",
) {
  const gone = await db
    .delete(friendships)
    .where(and(pairIs(me, otherId), eq(friendships.status, status)))
    .returning()
    .all();
  if (!gone.length)
    throw new AppError(
      404,
      status === "pending" ? "request_not_found" : "friend_not_found",
      status === "pending" ? "No such request" : "Not friends",
    );
}
