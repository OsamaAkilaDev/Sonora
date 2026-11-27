import { SELF } from "cloudflare:test";
import type { Attachment, ChatSummary, Message, MessagePage, SearchHit } from "@sonora/shared";
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

const upload = (chatId: string, cookie: string, mime: string, body: string) =>
  SELF.fetch(`${ORIGIN}/api/chats/${chatId}/uploads`, {
    method: "POST",
    body,
    headers: { "content-type": mime, origin: ORIGIN, cookie, "x-file-name": "my%20notes.txt" },
  });

it("edit, react, upload, claim, delete and search", async () => {
  const [mariam, yousef, karim] = await Promise.all([
    signup("mariam"),
    signup("yousef"),
    signup("karim"),
  ]);
  await call("/friends/requests", mariam.cookie, "POST", { username: "yousef" });
  await call(`/friends/requests/${mariam.id}/accept`, yousef.cookie, "POST");
  const chatId = (
    await (
      await call("/chats/dm", mariam.cookie, "POST", { userId: yousef.id })
    ).json<{
      chat: ChatSummary;
    }>()
  ).chat.id;
  const send = async (clientId: string, body: string, attachmentIds: string[] = []) =>
    call(`/chats/${chatId}/messages`, mariam.cookie, "POST", { clientId, body, attachmentIds });

  const sent = await send("client-id-0001", "the shawarma place");
  const msg = (await sent.json<{ message: Message }>()).message;
  const path = `/chats/${chatId}/messages/${msg.id}`;

  // edit: sender only
  const edited = await call(path, mariam.cookie, "PATCH", { body: "the shawarma spot" });
  expect((await edited.json<{ message: Message }>()).message.editedAt).not.toBeNull();
  expect((await call(path, yousef.cookie, "PATCH", { body: "hax" })).status).toBe(403);

  // reaction toggles on, then off
  const react = async (who: { cookie: string }) =>
    (
      await (
        await call(`${path}/reactions`, who.cookie, "PUT", { emoji: "🔥" })
      ).json<{
        message: Message;
      }>()
    ).message.reactions;
  expect(await react(yousef)).toEqual([{ emoji: "🔥", userIds: [yousef.id] }]);
  expect(await react(yousef)).toEqual([]);
  await react(yousef);

  // upload → claim → visible on the message
  expect((await upload(chatId, mariam.cookie, "image/svg+xml", "<svg/>")).status).toBe(415);
  const up = await upload(chatId, mariam.cookie, "text/plain", "hello file");
  expect(up.status).toBe(201);
  const att = (await up.json<{ attachment: Attachment }>()).attachment;
  expect(att.name).toBe("my notes.txt");
  const withFile = await send("client-id-0002", "", [att.id]);
  expect(withFile.status).toBe(201);
  expect((await send("client-id-0003", "again", [att.id])).status).toBe(422);
  const page = await (await call(`/chats/${chatId}/messages`, yousef.cookie)).json<MessagePage>();
  expect(page.messages[1]?.attachments[0]?.url).toBe(`/api/files/${att.id}`);

  // file access: members only
  const file = await call(`/files/${att.id}`, yousef.cookie);
  expect(await file.text()).toBe("hello file");
  expect((await call(`/files/${att.id}`, karim.cookie)).status).toBe(404);

  // search: members only
  const hits = async (who: { cookie: string }) =>
    (await (await call("/search?q=shaw", who.cookie)).json<{ results: SearchHit[] }>()).results;
  expect((await hits(mariam)).map((h) => h.message.id)).toEqual([msg.id]);
  expect(await hits(karim)).toEqual([]);

  // delete → tombstone, reactions gone, no longer searchable
  const gone = (await (await call(path, mariam.cookie, "DELETE")).json<{ message: Message }>())
    .message;
  expect(gone).toMatchObject({ body: "", reactions: [], attachments: [] });
  expect(gone.deletedAt).not.toBeNull();
  expect(await hits(mariam)).toEqual([]);
});
