import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../core/app";
import { AppError } from "../../core/errors";
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

  const ranged = c.req.raw.headers.has("range");
  const obj = await c.env.FILES.get(file.r2Key, { range: c.req.raw.headers });
  if (!obj) throw notFound;

  const mime = obj.httpMetadata?.contentType ?? file.mime;
  let status: 200 | 206 = 200;
  let length = obj.size;
  const headers = new Headers({
    "Content-Type": mime,
    ETag: obj.httpEtag,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Disposition": `${INLINE.test(mime) ? "inline" : "attachment"}; filename*=UTF-8''${rfc5987(file.name)}`,
  });
  const r = ranged ? obj.range : undefined;
  if (r) {
    const {
      offset = 0,
      length: len,
      suffix,
    } = r as { offset?: number; length?: number; suffix?: number };
    const start = suffix === undefined ? offset : obj.size - suffix;
    length = len ?? obj.size - start;
    status = 206;
    headers.set("Content-Range", `bytes ${start}-${start + length - 1}/${obj.size}`);
  }
  headers.set("Content-Length", String(length));
  return new Response(obj.body, { status, headers });
});
