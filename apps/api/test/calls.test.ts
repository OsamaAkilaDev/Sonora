import { env, SELF } from "cloudflare:test";
import type { RoomEvent, ServerEvent } from "@sonora/shared";
import { expect, it } from "vitest";

const ORIGIN = "https://sonora.test";
const post = (path: string, cookie: string, data: unknown) =>
  SELF.fetch(`${ORIGIN}/api${path}`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "content-type": "application/json", origin: ORIGIN, cookie },
  });

async function signup(username: string) {
  const res = await post("/auth/signup", "", {
    email: `${username}@example.com`,
    password: "correct-horse-battery",
    username,
  });
  const { user } = await res.json<{ user: { id: string } }>();
  return { id: user.id, cookie: res.headers.get("set-cookie")?.split(";")[0] ?? "" };
}

/** Opens a socket and returns a reader that resolves with the next event of a type. */
async function connect<E extends { type: string }>(path: string, cookie: string) {
  const res = await SELF.fetch(`${ORIGIN}/api${path}`, {
    headers: { upgrade: "websocket", origin: ORIGIN, cookie },
  });
  const ws = res.webSocket;
  const seen: E[] = [];
  ws?.accept();
  ws?.addEventListener("message", (m) => {
    seen.push(JSON.parse(m.data as string));
  });
  const next = async <T extends E["type"]>(type: T) => {
    let found = -1;
    await expect
      .poll(() => {
        found = seen.findIndex((e) => e.type === type);
        return found;
      })
      .toBeGreaterThanOrEqual(0);
    return seen.splice(found, 1)[0] as Extract<E, { type: T }>;
  };
  return { status: res.status, ws: ws as WebSocket, next };
}

/** What a browser's PushManager would hand us: real keys, so encryption actually runs. */
async function subscription(path: string) {
  const pair = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ])) as CryptoKeyPair;
  const b64 = (b: ArrayBuffer | Uint8Array) =>
    btoa(String.fromCharCode(...new Uint8Array(b)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const raw = (await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer;
  return {
    endpoint: `https://fcm.googleapis.com/fcm/send/${path}`,
    keys: { p256dh: b64(raw), auth: b64(crypto.getRandomValues(new Uint8Array(16))) },
  };
}

const endpoints = async () =>
  (
    await env.DB.prepare("select endpoint from push_subscriptions order by endpoint").all()
  ).results.map((r) => (r.endpoint as string).split("/").pop());

it("rings the callee's devices and forgets dead ones", async () => {
  const [dana, sami] = await Promise.all([signup("dana"), signup("sami")]);
  await post("/friends/requests", dana.cookie, { username: "sami" });
  await post(`/friends/requests/${dana.id}/accept`, sami.cookie, {});
  const { chat } = await (await post("/chats/dm", dana.cookie, { userId: sami.id })).json<{
    chat: { id: string };
  }>();
  const save = (data: unknown) =>
    SELF.fetch(`${ORIGIN}/api/push/subscription`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "content-type": "application/json", origin: ORIGIN, cookie: sami.cookie },
    });

  // only real push services: the server must never post to an arbitrary URL
  const evil = { ...(await subscription("x")), endpoint: "https://evil.example/hook" };
  expect((await save(evil)).status).toBe(422);
  expect((await save(await subscription("live"))).status).toBe(200);
  expect((await save(await subscription("gone"))).status).toBe(200);

  const call = await connect<RoomEvent>(`/calls/${chat.id}/ws`, dana.cookie);
  await call.next("welcome");
  await expect.poll(endpoints).toEqual(["live"]);

  // signing out stops the ringing on that browser
  await post("/auth/logout", sami.cookie, {});
  expect(await endpoints()).toEqual([]);
  call.ws.send(JSON.stringify({ type: "leave" }));
});

it("joins, relays signals, hangs up and declines", async () => {
  const [salma, hadi, rami] = await Promise.all([signup("salma"), signup("hadi"), signup("rami")]);
  await post("/friends/requests", salma.cookie, { username: "hadi" });
  await post(`/friends/requests/${salma.id}/accept`, hadi.cookie, {});
  const { chat } = await (await post("/chats/dm", salma.cookie, { userId: hadi.id })).json<{
    chat: { id: string };
  }>();
  const room = `/calls/${chat.id}/ws`;

  expect((await connect(room, rami.cookie)).status).toBe(404);

  const feed = await connect<ServerEvent>("/ws", hadi.cookie);
  const a = await connect<RoomEvent>(room, salma.cookie);
  const first = await a.next("welcome");
  expect(first.peers).toEqual([]);
  expect((await feed.next("call.state")).call?.ringingUntil).toBeGreaterThan(Date.now());

  const b = await connect<RoomEvent>(`${room}?callId=${first.call.callId}`, hadi.cookie);
  const second = await b.next("welcome");
  expect(second.peers.map((p) => p.userId)).toEqual([salma.id]);
  await a.next("peer.join");

  const offer = { description: { type: "offer", sdp: "v=0" } };
  b.ws.send(JSON.stringify({ type: "signal", to: first.peerId, signal: offer }));
  expect(await a.next("signal")).toMatchObject({ from: second.peerId, signal: offer });

  // Hanging up ends a one-to-one call for both.
  b.ws.send(JSON.stringify({ type: "leave" }));
  expect((await a.next("end")).reason).toBe("ended");

  const late = await connect<RoomEvent>(`${room}?callId=${first.call.callId}`, hadi.cookie);
  expect((await late.next("end")).reason).toBe("gone");

  const c = await connect<RoomEvent>(room, salma.cookie);
  const { call } = await c.next("welcome");
  await post(`/calls/${chat.id}/decline`, hadi.cookie, { callId: call.callId });
  expect((await c.next("end")).reason).toBe("declined");
});
