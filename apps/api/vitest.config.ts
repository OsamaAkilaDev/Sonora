import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

/** Stands in for B2's S3 API (PUT, GET with Range, DELETE), so tests never touch the network. */
function fakeS3() {
  const files = new Map<string, Uint8Array>();
  return async (req: Request) => {
    const key = new URL(req.url).pathname;
    if (req.method === "PUT") {
      files.set(key, new Uint8Array(await req.arrayBuffer()));
      return new Response(null);
    }
    if (req.method === "DELETE") {
      files.delete(key);
      return new Response(null, { status: 204 });
    }
    const file = files.get(key);
    if (!file) return new Response("NoSuchKey", { status: 404 });
    const m = /bytes=(\d+)-(\d*)/.exec(req.headers.get("range") ?? "");
    if (!m) return new Response(file, { headers: { "content-length": String(file.length) } });
    const start = Number(m[1]);
    const end = m[2] ? Number(m[2]) : file.length - 1;
    return new Response(file.slice(start, end + 1), {
      status: 206,
      headers: { "content-range": `bytes ${start}-${end}/${file.length}` },
    });
  };
}

/** Accepts a well-formed Web Push request; endpoints containing "gone" have unsubscribed. */
function fakePush(req: Request) {
  const ok =
    req.headers.get("authorization")?.startsWith("vapid t=") &&
    req.headers.get("content-encoding") === "aes128gcm";
  return new Response(null, { status: !ok ? 400 : req.url.includes("gone") ? 410 : 201 });
}

/** A throwaway signing key pair, so tests never use the real one. */
async function vapidKeys() {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ]);
  const raw = await crypto.subtle.exportKey("raw", pair.publicKey);
  return {
    VAPID_PUBLIC_KEY: Buffer.from(raw).toString("base64url"),
    VAPID_PRIVATE_KEY: (await crypto.subtle.exportKey("jwk", pair.privateKey)).d as string,
  };
}

export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations");
  const s3 = fakeS3();
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            B2_KEY_ID: "test",
            B2_APP_KEY: "test",
            ...(await vapidKeys()),
          },
          outboundService: (req: Request) =>
            new URL(req.url).hostname === "fcm.googleapis.com" ? fakePush(req) : s3(req),
        },
      }),
    ],
    test: { setupFiles: ["./test/setup.ts"] },
  };
});
