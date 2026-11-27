import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const ms = (name: string) => integer(name, { mode: "timestamp_ms" });

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarSeed: text("avatar_seed").notNull(),
  about: text("about").notNull().default(""),
  status: text("status", { enum: ["online", "idle", "dnd", "invisible"] })
    .notNull()
    .default("online"),
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

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
