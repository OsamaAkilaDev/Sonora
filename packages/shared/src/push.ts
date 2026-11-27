import { z } from "zod";

/** The browsers' push services. The server only ever posts to these, never to an arbitrary URL. */
const PUSH_HOSTS =
  /^(fcm\.googleapis\.com|web\.push\.apple\.com|[a-z0-9.-]+\.(push\.services\.mozilla\.com|notify\.windows\.com))$/;

/** A browser's PushSubscription, as its toJSON() gives it. */
export const pushSubscriptionInput = z.object({
  endpoint: z
    .url({ protocol: /^https$/, hostname: PUSH_HOSTS, error: "Unsupported push service" })
    .max(1000),
  keys: z.object({
    p256dh: z.string().min(80).max(100),
    auth: z.string().min(16).max(32),
  }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInput>;

type CallNotice = {
  chatId: string;
  callId: string;
  /** Who is calling. */
  from: string;
  /** Group name, or null for a one-to-one call. */
  group: string | null;
  video: boolean;
};

/** What the service worker receives (public/push-sw.js). */
export type PushPayload =
  | ({ type: "ring" | "missed" | "answered" } & CallNotice)
  | { type: "test" };
