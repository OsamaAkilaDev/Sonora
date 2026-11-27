import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const ms = (name: string) => integer(name, { mode: "timestamp_ms" });

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarSeed: text("avatar_seed").notNull(),
  about: text("about").notNull().default(""),
  /** Chosen status; shown only while connected. */
  status: text("status", { enum: ["online", "idle", "dnd", "invisible"] })
    .notNull()
    .default("online"),
  /** Set by the user's realtime hub on first connect / last disconnect. */
  connected: integer("connected", { mode: "boolean" }).notNull().default(false),
  lastSeenAt: ms("last_seen_at"),
  createdAt: ms("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 of the cookie token; the token itself is never stored. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userAgent: text("user_agent").notNull().default(""),
    city: text("city"),
    createdAt: ms("created_at").notNull(),
    lastSeenAt: ms("last_seen_at").notNull(),
    expiresAt: ms("expires_at").notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** One row per pair, stored with userA < userB so the pair is unique regardless of direction. */
export const friendships = sqliteTable(
  "friendships",
  {
    userA: text("user_a")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userB: text("user_b")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted"] }).notNull(),
    requestedBy: text("requested_by").notNull(),
    createdAt: ms("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userA, t.userB] }), index("friendships_b_idx").on(t.userB)],
);

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  kind: text("kind", { enum: ["dm", "group"] }).notNull(),
  name: text("name"),
  /** "a:b" with sorted ids, so a DM between two people exists once. Null for groups. */
  dmKey: text("dm_key").unique(),
  createdBy: text("created_by").notNull(),
  createdAt: ms("created_at").notNull(),
  lastMessageAt: ms("last_message_at").notNull(),
});

export const chatMembers = sqliteTable(
  "chat_members",
  {
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "member"] })
      .notNull()
      .default("member"),
    lastReadId: text("last_read_id"),
    joinedAt: ms("joined_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.chatId, t.userId] }), index("members_user_idx").on(t.userId)],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: text("client_id"),
    body: text("body").notNull(),
    replyToId: text("reply_to_id"),
    createdAt: ms("created_at").notNull(),
    editedAt: ms("edited_at"),
    deletedAt: ms("deleted_at"),
  },
  (t) => [
    index("messages_chat_idx").on(t.chatId, t.id),
    uniqueIndex("messages_client_idx").on(t.senderId, t.clientId),
  ],
);

/** One row per (message, user, emoji): a user can add several different emoji. */
export const reactions = sqliteTable(
  "reactions",
  {
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: ms("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.userId, t.emoji] })],
);

/** Uploaded first (messageId null), then claimed by the message that sends it. Bytes live in B2 (core/storage). */
export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => messages.id, { onDelete: "cascade" }),
    fileKey:
      text("r2_key") /* column predates the move to B2 */
        .notNull(),
    name: text("name").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: ms("created_at").notNull(),
  },
  (t) => [index("attachments_message_idx").on(t.messageId)],
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type AttachmentRow = typeof attachments.$inferSelect;

/** One per browser that asked to be rung. Signing that session out removes it. */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    endpoint: text("endpoint").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: ms("created_at").notNull(),
  },
  (t) => [index("push_user_idx").on(t.userId)],
);
