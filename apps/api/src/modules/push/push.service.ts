import { buildPushPayload } from "@block65/webcrypto-web-push";
import type { PushPayload, PushSubscriptionInput } from "@sonora/shared";
import { eq, inArray } from "drizzle-orm";
import type { Db } from "../../core/db";
import { pushSubscriptions } from "../../db/schema";

/** Idempotent. A browser that changes hands (new sign-in) moves to the new session. */
export async function saveSubscription(
  db: Db,
  userId: string,
  sessionId: string,
  { endpoint, keys }: PushSubscriptionInput,
) {
  const owner = { userId, sessionId, p256dh: keys.p256dh, auth: keys.auth };
  await db
    .insert(pushSubscriptions)
    .values({ endpoint, ...owner, createdAt: new Date() })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: owner });
}

type Delivery = {
  /** Seconds the push service may hold it for an offline device. */
  ttl: number;
  urgency: "normal" | "high";
  /** A newer message with the same topic replaces an undelivered one. */
  topic?: string;
  /** Identifies this server to the push services (the app's https origin). */
  origin: string;
};

/** Best effort to every browser of each user; forgets the ones that are gone. */
export async function sendPush(
  env: Env,
  db: Db,
  userIds: string[],
  payload: PushPayload,
  { origin, ...options }: Delivery,
) {
  if (!userIds.length || !env.VAPID_PRIVATE_KEY) return 0;
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds))
    .all();
  const vapid = {
    subject: origin.startsWith("https:") ? origin : "mailto:push@sonora.example",
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };
  const results = await Promise.allSettled(
    subs.map(async (s) => {
      const request = await buildPushPayload(
        { data: payload, options },
        { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } },
        vapid,
      );
      const res = await fetch(s.endpoint, request);
      await res.body?.cancel();
      if (res.status === 404 || res.status === 410)
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint));
      else if (!res.ok) console.warn("push rejected", res.status, new URL(s.endpoint).host);
      return res.ok;
    }),
  );
  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}
