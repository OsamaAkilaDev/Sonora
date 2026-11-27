import { eq } from "drizzle-orm";
import type { Db } from "../../core/db";
import { chatMembers, chats } from "../../db/schema";
import { requireMember } from "../chats/chats.service";

/** Who may be rung, for a chat the caller belongs to (404 otherwise). */
export async function callContext(db: Db, chatId: string, userId: string) {
  await requireMember(db, chatId, userId);
  const rows = await db
    .select({ userId: chatMembers.userId, kind: chats.kind })
    .from(chatMembers)
    .innerJoin(chats, eq(chats.id, chatMembers.chatId))
    .where(eq(chatMembers.chatId, chatId))
    .all();
  return { kind: rows[0]?.kind ?? "group", memberIds: rows.map((r) => r.userId) };
}
