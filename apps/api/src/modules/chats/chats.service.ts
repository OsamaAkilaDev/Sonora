import {
  type Attachment,
  type ChatSummary,
  MAX_GROUP_MEMBERS,
  type Message,
  PAGE_SIZE,
  type Reaction,
} from "@sonora/shared";
import { and, asc, desc, eq, gt, inArray, isNull, lt, max, ne, or, sql } from "drizzle-orm";
import { ulid } from "ulid";
import type { Db } from "../../core/db";
import { AppError } from "../../core/errors";
import {
  type AttachmentRow,
  attachments,
  chatMembers,
  chats,
  type MessageRow,
  messages,
  reactions,
  type User,
} from "../../db/schema";
import { friendIdsAmong } from "../friends/friends.service";
import { toPublicUser, usersByIds } from "../users/users.service";

const toAttachment = (a: AttachmentRow): Attachment => ({
  id: a.id,
  name: a.name,
  mime: a.mime,
  size: a.size,
  width: a.width,
  height: a.height,
  url: `/api/files/${a.id}`,
});

/** Turns rows into API messages with attachments and reactions, in two batched queries. */
export async function hydrate(db: Db, rows: MessageRow[]): Promise<Message[]> {
  const live = rows.filter((m) => !m.deletedAt).map((m) => m.id);
  const [atts, reacts] = live.length
    ? await Promise.all([
        db
          .select()
          .from(attachments)
          .where(inArray(attachments.messageId, live))
          .orderBy(asc(attachments.id))
          .all(),
        db
          .select()
          .from(reactions)
          .where(inArray(reactions.messageId, live))
          .orderBy(asc(reactions.createdAt), sql`rowid`)
          .all(),
      ])
    : [[], []];
  const attsBy = new Map<string, Attachment[]>();
  for (const a of atts) {
    const list = attsBy.get(a.messageId as string) ?? [];
    list.push(toAttachment(a));
    attsBy.set(a.messageId as string, list);
  }
  const reactsBy = new Map<string, Map<string, Reaction>>();
  for (const r of reacts) {
    const byEmoji = reactsBy.get(r.messageId) ?? new Map<string, Reaction>();
    const entry = byEmoji.get(r.emoji) ?? { emoji: r.emoji, userIds: [] };
    entry.userIds.push(r.userId);
    byEmoji.set(r.emoji, entry);
    reactsBy.set(r.messageId, byEmoji);
  }
  return rows.map((m) => ({
    id: m.id,
    chatId: m.chatId,
    senderId: m.senderId,
    clientId: m.clientId,
    body: m.deletedAt ? "" : m.body,
    replyToId: m.replyToId,
    attachments: attsBy.get(m.id) ?? [],
    reactions: [...(reactsBy.get(m.id)?.values() ?? [])],
    createdAt: m.createdAt.getTime(),
    editedAt: m.editedAt?.getTime() ?? null,
    deletedAt: m.deletedAt?.getTime() ?? null,
  }));
}

const hydrateOne = async (db: Db, row: MessageRow) => (await hydrate(db, [row]))[0] as Message;

const notFound = () => new AppError(404, "chat_not_found", "Chat not found");

/** Throws 404 unless `userId` belongs to the chat, so existence isn't leaked. */
export async function requireMember(db: Db, chatId: string, userId: string) {
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
  const lastMsgs = await hydrate(db, lastRows);
  const last = new Map(lastMsgs.map((m) => [m.chatId, m]));
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
  const page = await hydrate(db, rows.slice(0, PAGE_SIZE).reverse());
  return { messages: page, nextCursor: rows.length > PAGE_SIZE ? (page[0]?.id ?? null) : null };
}

/** Idempotent on (sender, clientId): a repeat returns the stored message with `created: false`. */
export async function sendMessage(
  db: Db,
  me: string,
  chatId: string,
  input: { clientId: string; body: string; replyToId?: string | null; attachmentIds: string[] },
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
    return (
      dupe && { message: await hydrateOne(db, dupe), created: false, memberIds: [] as string[] }
    );
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

  const attachmentIds = [...new Set(input.attachmentIds)];
  if (attachmentIds.length) {
    const ok = await db
      .select({ id: attachments.id })
      .from(attachments)
      .where(
        and(
          inArray(attachments.id, attachmentIds),
          eq(attachments.chatId, chatId),
          eq(attachments.uploaderId, me),
          isNull(attachments.messageId),
        ),
      )
      .all();
    if (ok.length !== attachmentIds.length)
      throw new AppError(422, "bad_attachment", "An attachment is missing or already used");
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
    deletedAt: null,
  };
  try {
    await db.batch([
      db.insert(messages).values(row),
      db
        .update(attachments)
        .set({ messageId: row.id })
        .where(and(inArray(attachments.id, attachmentIds), isNull(attachments.messageId))),
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
  return {
    message: await hydrateOne(db, row),
    created: true,
    memberIds: members.map((m) => m.id),
  };
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

const memberIdsOf = async (db: Db, chatId: string) =>
  (
    await db
      .select({ id: chatMembers.userId })
      .from(chatMembers)
      .where(eq(chatMembers.chatId, chatId))
      .all()
  ).map((m) => m.id);

/** The message, for a member of its chat. */
async function loadMessage(db: Db, me: string, chatId: string, messageId: string) {
  await requireMember(db, chatId, me);
  const row = await db
    .select()
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.chatId, chatId)))
    .get();
  if (!row) throw new AppError(404, "message_not_found", "Message not found");
  return row;
}

async function loadOwn(db: Db, me: string, chatId: string, messageId: string) {
  const row = await loadMessage(db, me, chatId, messageId);
  if (row.senderId !== me)
    throw new AppError(403, "not_yours", "You can only change your own messages");
  return row;
}

const goneError = () => new AppError(409, "deleted", "That message was deleted");

export async function editMessage(
  db: Db,
  me: string,
  chatId: string,
  messageId: string,
  body: string,
) {
  const row = await loadOwn(db, me, chatId, messageId);
  if (row.deletedAt) throw goneError();
  const updated = { ...row, body, editedAt: new Date() };
  await db
    .update(messages)
    .set({ body, editedAt: updated.editedAt })
    .where(eq(messages.id, row.id));
  return { message: await hydrateOne(db, updated), memberIds: await memberIdsOf(db, chatId) };
}

/** Soft delete. Returns the R2 keys of the removed attachments for the caller to purge. */
export async function deleteMessage(db: Db, me: string, chatId: string, messageId: string) {
  const row = await loadOwn(db, me, chatId, messageId);
  if (row.deletedAt) return { message: await hydrateOne(db, row), memberIds: [], keys: [] };
  const files = await db
    .select({ key: attachments.r2Key })
    .from(attachments)
    .where(eq(attachments.messageId, row.id))
    .all();
  const gone = { ...row, body: "", deletedAt: new Date() };
  await db.batch([
    db.update(messages).set({ body: "", deletedAt: gone.deletedAt }).where(eq(messages.id, row.id)),
    db.delete(reactions).where(eq(reactions.messageId, row.id)),
    db.delete(attachments).where(eq(attachments.messageId, row.id)),
  ]);
  return {
    message: await hydrateOne(db, gone),
    memberIds: await memberIdsOf(db, chatId),
    keys: files.map((f) => f.key),
  };
}

const MAX_EMOJI = 20;

/** Toggles the caller's reaction. */
export async function toggleReaction(
  db: Db,
  me: string,
  chatId: string,
  messageId: string,
  emoji: string,
) {
  const row = await loadMessage(db, me, chatId, messageId);
  if (row.deletedAt) throw goneError();
  const mine = and(
    eq(reactions.messageId, row.id),
    eq(reactions.userId, me),
    eq(reactions.emoji, emoji),
  );
  if (await db.select().from(reactions).where(mine).get()) {
    await db.delete(reactions).where(mine);
  } else {
    const emojis = await db
      .selectDistinct({ emoji: reactions.emoji })
      .from(reactions)
      .where(eq(reactions.messageId, row.id))
      .all();
    if (emojis.length >= MAX_EMOJI && !emojis.some((e) => e.emoji === emoji))
      throw new AppError(422, "too_many_reactions", "That message has enough reactions");
    await db
      .insert(reactions)
      .values({ messageId: row.id, userId: me, emoji, createdAt: new Date() })
      .onConflictDoNothing();
  }
  return { message: await hydrateOne(db, row), memberIds: await memberIdsOf(db, chatId) };
}

export type UploadMeta = {
  name: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
};

export async function createAttachment(
  db: Db,
  files: R2Bucket,
  me: string,
  chatId: string,
  meta: UploadMeta,
  stream: ReadableStream | null,
) {
  await requireMember(db, chatId, me);
  const id = ulid();
  const r2Key = `chats/${chatId}/${id}`;
  const obj = await files.put(r2Key, stream, { httpMetadata: { contentType: meta.mime } });
  const row: AttachmentRow = {
    id,
    chatId,
    uploaderId: me,
    messageId: null,
    r2Key,
    ...meta,
    size: obj.size,
    createdAt: new Date(),
  };
  await db.insert(attachments).values(row);
  return toAttachment(row);
}
