import { SELF } from "cloudflare:test";
import type { ChatSummary, FriendRequest, Message, MessagePage, PublicUser } from "@sonora/shared";
import { expect, it } from "vitest";

const ORIGIN = "https://sonora.test";
const call = (path: string, cookie: string, method = "GET", data?: unknown) =>
  SELF.fetch(`${ORIGIN}/api${path}`, {
    method,
    body: data ? JSON.stringify(data) : undefined,
    headers: { "content-type": "application/json", origin: ORIGIN, cookie },
  });

async function signup(username: string) {
  const res = await SELF.fetch(`${ORIGIN}/api/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({
      email: `${username}@example.com`,
      password: "correct-horse-battery",
      username,
    }),
  });
  const { user } = await res.json<{ user: { id: string } }>();
  return { id: user.id, cookie: res.headers.get("set-cookie")?.split(";")[0] ?? "" };
}

it("friend request → DM → idempotent send → unread/read, with strangers kept out", async () => {
  const [layla, yousef, noor] = await Promise.all([
    signup("layla"),
    signup("yousef"),
    signup("noor"),
  ]);

  const ghost = await call("/friends/requests", layla.cookie, "POST", { username: "nobody" });
  expect(ghost.status).toBe(404);

  const asked = await call("/friends/requests", layla.cookie, "POST", { username: "yousef" });
  expect(asked.status).toBe(201);
  const incoming = await (await call("/friends", yousef.cookie)).json<{
    requests: FriendRequest[];
  }>();
  expect(incoming.requests.map((r) => [r.user.username, r.direction])).toEqual([
    ["layla", "incoming"],
  ]);

  const accepted = await call(`/friends/requests/${layla.id}/accept`, yousef.cookie, "POST");
  expect(accepted.status).toBe(200);
  for (const [who, other] of [
    [layla, "yousef"],
    [yousef, "layla"],
  ] as const) {
    const { friends } = await (await call("/friends", who.cookie)).json<{
      friends: PublicUser[];
    }>();
    expect(friends.map((f) => f.username)).toEqual([other]);
  }

  const dm = () => call("/chats/dm", layla.cookie, "POST", { userId: yousef.id });
  const chatId = (await (await dm()).json<{ chat: ChatSummary }>()).chat.id;
  expect((await (await dm()).json<{ chat: ChatSummary }>()).chat.id).toBe(chatId);

  const send = () =>
    call(`/chats/${chatId}/messages`, layla.cookie, "POST", {
      clientId: "client-id-0001",
      body: "hey",
    });
  const first = await send();
  expect(first.status).toBe(201);
  const again = await send();
  expect(again.status).toBe(200);
  const msg = (await first.json<{ message: Message }>()).message;
  expect((await again.json<{ message: Message }>()).message.id).toBe(msg.id);

  const unread = async () =>
    (await (await call("/chats", yousef.cookie)).json<{ chats: ChatSummary[] }>()).chats.find(
      (c) => c.id === chatId,
    )?.unread;
  expect(await unread()).toBe(1);
  expect(
    (await call(`/chats/${chatId}/read`, yousef.cookie, "POST", { lastReadId: msg.id })).status,
  ).toBe(200);
  expect(await unread()).toBe(0);

  const page = await (await call(`/chats/${chatId}/messages`, yousef.cookie)).json<MessagePage>();
  expect(page.messages.map((m) => m.id)).toEqual([msg.id]);
  expect(page.nextCursor).toBeNull();

  expect((await call(`/chats/${chatId}/messages`, noor.cookie)).status).toBe(404);
  expect((await call("/chats/dm", noor.cookie, "POST", { userId: layla.id })).status).toBe(403);
});
