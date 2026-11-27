import { type ChatSummary, MAX_GROUP_MEMBERS, type Message, PAGE_SIZE } from "@sonora/shared";
import { and, desc, eq, gt, inArray, lt, max, ne, or, sql } from "drizzle-orm";
import { ulid } from "ulid";
import type { Db } from "../../core/db";
import { AppError } from "../../core/errors";
import { chatMembers, chats, type MessageRow, messages, type User } from "../../db/schema";
import { friendIdsAmong } from "../friends/friends.service";
import { toPublicUser, usersByIds } from "../users/users.service";

const toMessage = (m: MessageRow): Message => ({
  id: m.id,
  chatId: m.chatId,
  senderId: m.senderId,
  clientId: m.clientId,
  body: m.body,
  replyToId: m.replyToId,
  createdAt: m.createdAt.getTime(),
  editedAt: m.editedAt?.getTime() ?? null,
});

const notFound = () => new AppError(404, "chat_not_found", "Chat not found");

/** Throws 404 unless `userId` belongs to the chat, so existence isn't leaked. */
async function requireMember(db: Db, chatId: string, userId: string) {
  const row = await db
    .select()
    .from(chatMembers)
    .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)))
    .get();
  if (!row) throw notFound();
  return row;
}

/** Summaries for the given chats as seen by `viewer`, in a handful of queries. */
async function summaries(db: Db, viewer: string, chatIds: string[]): Promise<ChatSummary[]> {
  if (!chatIds.length) return [];
  const [chatRows, memberRows, lastRows, unreadRows] = await Promise.all([
    db.select().from(chats).where(inArray(chats.id, chatIds)).all(),
    db.select().from(chatMembers).where(inArray(chatMembers.chatId, chatIds)).all(),
    db
      .select()
      .from(messages)
      .where(
        inArray(
          messages.id,
          db
            .select({ id: max(messages.id) })
            .from(messages)
            .where(inArray(messages.chatId, chatIds))
            .groupBy(messages.chatId),
        ),
      )
      .all(),
    db
      .select({ chatId: messages.chatId, n: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(
        chatMembers,
        and(eq(chatMembers.chatId, messages.chatId), eq(chatMembers.userId, viewer)),
      )
      .where(
        and(
          inArray(messages.chatId, chatIds),
          ne(messages.senderId, viewer),
          or(sql`${chatMembers.lastReadId} is null`, gt(messages.id, chatMembers.lastReadId)),
        ),
      )
      .groupBy(messages.chatId)
      .all(),
  ]);
  const people = await usersByIds(db, [...new Set(memberRows.map((m) => m.userId))]);
  const last = new Map(lastRows.map((m) => [m.chatId, toMessage(m)]));
  const unread = new Map(unreadRows.map((r) => [r.chatId, r.n]));

  return chatRows
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
    .map((chat) => {
      const members = memberRows.filter((m) => m.chatId === chat.id);
      return {
        id: chat.id,
        kind: chat.kind,
        name: chat.name,
        members: members.map((m) => toPublicUser(people.get(m.userId) as User)),
        lastMessage: last.get(chat.id) ?? null,
        lastActivityAt: chat.lastMessageAt.getTime(),
        unread: unread.get(chat.id) ?? 0,
        readBy: Object.fromEntries(members.map((m) => [m.userId, m.lastReadId])),
      };
    });
}

const summaryOf = async (db: Db, viewer: string, chatId: string) =>
  (await summaries(db, viewer, [chatId]))[0] as ChatSummary;

export async function listChats(db: Db, me: string) {
  const mine = await db
    .select({ id: chatMembers.chatId })
    .from(chatMembers)
    .where(eq(chatMembers.userId, me))
    .all();
  return summaries(
    db,
    me,
    mine.map((m) => m.id),
  );
}

export async function getChat(db: Db, me: string, chatId: string) {
  await requireMember(db, chatId, me);
  return summaryOf(db, me, chatId);
}

export async function openDm(db: Db, me: string, otherId: string) {
  if (!(await friendIdsAmong(db, me, [otherId])).has(otherId))
    throw new AppError(403, "not_friends", "You can only message friends");
  const dmKey = [me, otherId].sort().join(":");
  const existing = await db.select().from(chats).where(eq(chats.dmKey, dmKey)).get();
  if (existing) return { chat: await summaryOf(db, me, existing.id), created: false };

  const now = new Date();
  const id = ulid();
  await db.batch([
    db
      .insert(chats)
      .values({ id, kind: "dm", dmKey, createdBy: me, createdAt: now, lastMessageAt: now }),
    db.insert(chatMembers).values([
      { chatId: id, userId: me, joinedAt: now },
      { chatId: id, userId: otherId, joinedAt: now },
    ]),
  ]);
  return { chat: await summaryOf(db, me, id), created: true };
}

export async function createGroup(db: Db, me: string, name: string, memberIds: string[]) {
  const others = [...new Set(memberIds)].filter((id) => id !== me);
  const friends = await friendIdsAmong(db, me, others);
  if (!others.length || others.some((id) => !friends.has(id)))
    throw new AppError(403, "not_friends", "You can only add friends");
  if (others.length + 1 > MAX_GROUP_MEMBERS)
    throw new AppError(422, "too_many", `Groups hold up to ${MAX_GROUP_MEMBERS} people`);

  const now = new Date();
  const id = ulid();
  await db.batch([
    db
      .insert(chats)
      .values({ id, kind: "group", name, createdBy: me, createdAt: now, lastMessageAt: now }),
    db
      .insert(chatMembers)
      .values([
        { chatId: id, userId: me, role: "owner", joinedAt: now },
        ...others.map((userId) => ({ chatId: id, userId, joinedAt: now })),
      ]),
  ]);
  return { chat: await summaryOf(db, me, id), memberIds: others };
}

export async function messagePage(db: Db, me: string, chatId: string, before?: string) {
  await requireMember(db, chatId, me);
  const rows = await db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), before ? lt(messages.id, before) : undefined))
    .orderBy(desc(messages.id))
    .limit(PAGE_SIZE + 1)
    .all();
  const page = rows.slice(0, PAGE_SIZE).reverse().map(toMessage);
  return { messages: page, nextCursor: rows.length > PAGE_SIZE ? (page[0]?.id ?? null) : null };
}

/** Idempotent on (sender, clientId): a repeat returns the stored message with `created: false`. */
export async function sendMessage(
  db: Db,
  me: string,
  chatId: string,
  input: { clientId: string; body: string; replyToId?: string | null },
) {
  await requireMember(db, chatId, me);
  const findDupe = async () => {
    const dupe = await db
      .select()
      .from(messages)
      .where(and(eq(messages.senderId, me), eq(messages.clientId, input.clientId)))
      .get();
    // A clientId is unique per sender; reusing one in another chat is a client bug, not a retry.
    if (dupe && dupe.chatId !== chatId)
      throw new AppError(409, "client_id_reused", "Send it again as a new message");
    return dupe && { message: toMessage(dupe), created: false, memberIds: [] as string[] };
  };
  const existing = await findDupe();
  if (existing) return existing;

  if (input.replyToId) {
    const target = await db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.id, input.replyToId), eq(messages.chatId, chatId)))
      .get();
    if (!target) throw new AppError(422, "bad_reply", "That message isn't in this chat");
  }

  const now = new Date();
  const row: MessageRow = {
    id: ulid(),
    chatId,
    senderId: me,
    clientId: input.clientId,
    body: input.body,
    replyToId: input.replyToId ?? null,
    createdAt: now,
    editedAt: null,
  };
  try {
    await db.batch([
      db.insert(messages).values(row),
      db.update(chats).set({ lastMessageAt: now }).where(eq(chats.id, chatId)),
      db
        .update(chatMembers)
        .set({ lastReadId: row.id })
        .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, me))),
    ]);
  } catch (e) {
    // Lost a race with a concurrent retry of the same send: return the winner.
    const won = String(e).includes("UNIQUE") && (await findDupe());
    if (won) return won;
    throw e;
  }
  const members = await db
    .select({ id: chatMembers.userId })
    .from(chatMembers)
    .where(eq(chatMembers.chatId, chatId))
    .all();
  return { message: toMessage(row), created: true, memberIds: members.map((m) => m.id) };
}

/** Returns the other members to notify, or null when the marker didn't advance. */
export async function markRead(db: Db, me: string, chatId: string, lastReadId: string) {
  const mine = await requireMember(db, chatId, me);
  const msg = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.id, lastReadId), eq(messages.chatId, chatId)))
    .get();
  if (!msg) throw new AppError(422, "bad_message", "That message isn't in this chat");
  if (mine.lastReadId && mine.lastReadId >= lastReadId) return null;

  await db
    .update(chatMembers)
    .set({ lastReadId })
    .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, me)));
  const others = await db
    .select({ id: chatMembers.userId })
    .from(chatMembers)
    .where(and(eq(chatMembers.chatId, chatId), ne(chatMembers.userId, me)))
    .all();
  return others.map((o) => o.id);
}
