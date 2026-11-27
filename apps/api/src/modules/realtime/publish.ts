import type { ServerEvent } from "@sonora/shared";

export const hub = (env: Env, userId: string) => env.USER_HUB.getByName(userId);

/**
 * Push an event to every connected device of each user. Best effort: a user with no open
 * sockets simply misses it and resyncs from the API when they reconnect.
 * ponytail: one RPC per recipient; fine for DMs and groups ≤ 10. Batch via a ChatRoom DO if groups grow.
 */
export async function publish(env: Env, userIds: Iterable<string>, event: ServerEvent) {
  await Promise.allSettled([...new Set(userIds)].map((id) => hub(env, id).publish(event)));
}
