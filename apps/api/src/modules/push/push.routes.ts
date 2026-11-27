import { pushSubscriptionInput } from "@sonora/shared";
import { Hono } from "hono";
import type { AppEnv } from "../../core/app";
import { rateLimit, sameOrigin } from "../../core/guards";
import { body } from "../../core/validate";
import { requireAuth } from "../auth/session";
import { saveSubscription, sendPush } from "./push.service";

export const pushRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get("/key", (c) => c.json({ publicKey: c.env.VAPID_PUBLIC_KEY }))
  .put("/subscription", sameOrigin, body(pushSubscriptionInput), async (c) => {
    await saveSubscription(c.var.db, c.var.user.id, c.var.sessionId, c.req.valid("json"));
    return c.json({ ok: true });
  })
  /** "Send me a test": proves the whole path on this account's devices. */
  .post("/test", sameOrigin, rateLimit("push-test"), async (c) => {
    const sent = await sendPush(
      c.env,
      c.var.db,
      [c.var.user.id],
      { type: "test" },
      { ttl: 60, urgency: "high", origin: new URL(c.req.url).origin },
    );
    return c.json({ sent });
  });
