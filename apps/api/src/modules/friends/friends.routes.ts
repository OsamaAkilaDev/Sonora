import { friendRequestInput } from "@sonora/shared";
import { Hono } from "hono";
import type { AppEnv } from "../../core/app";
import { sameOrigin } from "../../core/guards";
import { body } from "../../core/validate";
import { requireAuth } from "../auth/session";
import { publish } from "../realtime/publish";
import { toPublicUser } from "../users/users.service";
import { acceptRequest, listFriends, removePair, requestFriend } from "./friends.service";

export const friendsRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get("/", async (c) => c.json(await listFriends(c.var.db, c.var.user.id)))
  .post("/requests", sameOrigin, body(friendRequestInput), async (c) => {
    const me = c.var.user;
    const res = await requestFriend(c.var.db, me, c.req.valid("json").username);
    if (res.accepted) {
      c.executionCtx.waitUntil(
        Promise.all([
          publish(c.env, [res.target.id], { type: "friend.accepted", friend: toPublicUser(me) }),
          publish(c.env, [me.id], { type: "friend.accepted", friend: toPublicUser(res.target) }),
        ]),
      );
      return c.json({ friend: toPublicUser(res.target) });
    }
    c.executionCtx.waitUntil(
      publish(c.env, [res.target.id], {
        type: "friend.request",
        request: { ...res.request, user: toPublicUser(me), direction: "incoming" },
      }),
    );
    return c.json({ request: res.request }, 201);
  })
  .post("/requests/:userId/accept", sameOrigin, async (c) => {
    const me = c.var.user;
    const requester = await acceptRequest(c.var.db, me.id, c.req.param("userId"));
    c.executionCtx.waitUntil(
      publish(c.env, [requester.id], { type: "friend.accepted", friend: toPublicUser(me) }),
    );
    return c.json({ friend: toPublicUser(requester) });
  })
  .delete("/requests/:userId", sameOrigin, async (c) => {
    const otherId = c.req.param("userId");
    await removePair(c.var.db, c.var.user.id, otherId, "pending");
    c.executionCtx.waitUntil(
      publish(c.env, [otherId], { type: "friend.removed", userId: c.var.user.id }),
    );
    return c.json({ ok: true });
  })
  .delete("/:userId", sameOrigin, async (c) => {
    const otherId = c.req.param("userId");
    await removePair(c.var.db, c.var.user.id, otherId, "accepted");
    c.executionCtx.waitUntil(
      publish(c.env, [otherId], { type: "friend.removed", userId: c.var.user.id }),
    );
    return c.json({ ok: true });
  });
