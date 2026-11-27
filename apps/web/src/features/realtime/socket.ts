import type { ClientEvent, ServerEvent } from "@sonora/shared";
import { useSyncExternalStore } from "react";

export type Connection = "connecting" | "online" | "offline";

type Handlers = { onEvent: (e: ServerEvent) => void; onResync: () => void };

let ws: WebSocket | undefined;
let handlers: Handlers | undefined;
let state: Connection = "connecting";
let attempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let pingTimer: ReturnType<typeof setInterval> | undefined;
/** True once the socket has been down at least once, i.e. events may have been missed. */
let hadGap = false;
const listeners = new Set<() => void>();

const setState = (s: Connection) => {
  if (state === s) return;
  state = s;
  for (const l of listeners) l();
};

function open() {
  clearTimeout(retryTimer);
  if (!handlers || ws) return;
  setState("connecting");
  const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/ws`;
  const sock = new WebSocket(url);
  ws = sock;

  sock.onopen = () => {
    attempt = 0;
    setState("online");
    // Anything that happened while we were away: refetch rather than replay.
    if (hadGap) handlers?.onResync();
    hadGap = false;
    clearInterval(pingTimer);
    pingTimer = setInterval(() => sock.readyState === WebSocket.OPEN && sock.send("ping"), 25_000);
  };
  sock.onmessage = (m) => {
    if (m.data === "pong") return;
    try {
      handlers?.onEvent(JSON.parse(m.data));
    } catch {}
  };
  sock.onclose = () => {
    hadGap = true;
    clearInterval(pingTimer);
    ws = undefined;
    if (!handlers) return;
    setState(navigator.onLine ? "connecting" : "offline");
    // Exponential backoff with jitter: 0.5s, 1s, 2s … capped at 15s.
    const delay = Math.min(15_000, 500 * 2 ** attempt++) * (0.75 + Math.random() * 0.5);
    retryTimer = setTimeout(open, navigator.onLine ? delay : 60_000);
  };
}

const reconnectNow = () => {
  attempt = 0;
  if (!ws) open();
};
const wentOffline = () => setState("offline");

export function startRealtime(h: Handlers) {
  handlers = h;
  hadGap = false;
  addEventListener("online", reconnectNow);
  addEventListener("offline", wentOffline);
  open();
}

export function stopRealtime() {
  handlers = undefined;
  removeEventListener("online", reconnectNow);
  removeEventListener("offline", wentOffline);
  clearTimeout(retryTimer);
  clearInterval(pingTimer);
  ws?.close();
  ws = undefined;
}

export function send(e: ClientEvent) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(e));
}

export const useConnection = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
