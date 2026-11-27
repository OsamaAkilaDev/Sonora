import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../core/app";
import { AppError } from "../../core/errors";
import { storage } from "../../core/storage";
import { attachments, chatMembers } from "../../db/schema";
import { requireAuth } from "../auth/session";

const INLINE = /^(image|video|audio)\/|^application\/pdf$/;
// RFC 5987 attr-char excludes ' ( ) * which encodeURIComponent leaves alone.
const rfc5987 = (s: string) =>
  encodeURIComponent(s).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export const filesRoutes = new Hono<AppEnv>().use(requireAuth).get("/:id", async (c) => {
  const notFound = new AppError(404, "not_found", "Not found");
  const row = await c.var.db
    .select({ file: attachments })
    .from(attachments)
    .innerJoin(
      chatMembers,
      and(eq(chatMembers.chatId, attachments.chatId), eq(chatMembers.userId, c.var.user.id)),
    )
    .where(eq(attachments.id, c.req.param("id")))
    .get();
  if (!row) throw notFound;
  const { file } = row;

  const obj = await storage(c.env).get(file.fileKey, c.req.header("range"));
  if (!obj) throw notFound;

  // B2 answers Range itself (206 + Content-Range); keep its length/range/etag, set our own policy.
  const headers = new Headers({
    "Content-Type": file.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Disposition": `${INLINE.test(file.mime) ? "inline" : "attachment"}; filename*=UTF-8''${rfc5987(file.name)}`,
  });
  for (const h of ["content-length", "content-range", "etag"]) {
    const v = obj.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(obj.body, { status: obj.status, headers });
});
