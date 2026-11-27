import { AwsClient } from "aws4fetch";

/**
 * File bytes live in Backblaze B2 through its S3 API (free tier, no card on file).
 * The Worker proxies every byte, so membership checks stay in one place.
 */
export function storage(env: Env) {
  const aws = new AwsClient({
    accessKeyId: env.B2_KEY_ID,
    secretAccessKey: env.B2_APP_KEY,
    service: "s3",
    region: env.B2_ENDPOINT.split(".")[1] ?? "",
  });
  const url = (key: string) => `https://${env.B2_ENDPOINT}/${env.B2_BUCKET}/${key}`;
  const send = async (key: string, init: RequestInit) => {
    const res = await aws.fetch(url(key), init);
    if (!res.ok && res.status !== 404)
      throw new Error(`storage ${res.status}: ${await res.text()}`);
    return res;
  };

  return {
    /** Streams `size` bytes without buffering; S3 needs the length up front. */
    async put(key: string, body: ReadableStream, size: number, type: string) {
      const { readable, writable } = new FixedLengthStream(size);
      const [res] = await Promise.all([
        send(key, {
          method: "PUT",
          body: readable,
          headers: { "content-type": type, "x-amz-content-sha256": "UNSIGNED-PAYLOAD" },
        }),
        body.pipeTo(writable),
      ]);
      await res.body?.cancel();
    },
    /** Passes Range through, so the response may be a 206. Null when missing. */
    async get(key: string, range?: string | null) {
      const res = await send(key, { headers: range ? { range } : {} });
      return res.status === 404 ? null : res;
    },
    delete: (keys: string[]) =>
      Promise.all(keys.map((k) => send(k, { method: "DELETE" }).then((r) => r.body?.cancel()))),
  };
}
