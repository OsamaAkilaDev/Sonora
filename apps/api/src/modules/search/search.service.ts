import type { SearchHit } from "@sonora/shared";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../../core/db";
import { chatMembers, messages } from "../../db/schema";
import { hydrate } from "../chats/chats.service";

/** Every term quoted (so user input can't inject FTS syntax) and prefix-matched; terms are ANDed. */
const matchExpr = (q: string) =>
  q
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t.replaceAll('"', '""')}"*`)
    .join(" ");

export async function searchMessages(db: Db, me: string, q: string): Promise<SearchHit[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(
      and(
        isNull(messages.deletedAt),
        inArray(
          messages.chatId,
          db.select({ id: chatMembers.chatId }).from(chatMembers).where(eq(chatMembers.userId, me)),
        ),
        sql`${messages}.rowid in (select rowid from messages_fts where messages_fts match ${matchExpr(q)})`,
      ),
    )
    .orderBy(desc(messages.id))
    .limit(30)
    .all();
  return (await hydrate(db, rows)).map((message) => ({ message, chatId: message.chatId }));
}
