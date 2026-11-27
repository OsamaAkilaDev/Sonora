import { useNavigate } from "@tanstack/react-router";
import { useEffect, useSyncExternalStore } from "react";
import { api, unwrap } from "../../lib/api";

/**
 * - `install`: iPhone and iPad only allow notifications once Sonora is on the Home Screen
 * - `default`: not asked yet
 */
export type NotifyState = "unsupported" | "install" | "default" | "denied" | "granted";

const listeners = new Set<() => void>();
const changed = () => {
  for (const l of listeners) l();
};

function current(): NotifyState {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (ios && !matchMedia("(display-mode: standalone)").matches) return "install";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window))
    return "unsupported";
  return Notification.permission;
}

export const useNotifyState = () =>
  useSyncExternalStore((cb) => {
    listeners.add(cb);
    // Permission can also change in the browser's own settings while we're away.
    addEventListener("focus", cb);
    return () => {
      listeners.delete(cb);
      removeEventListener("focus", cb);
    };
  }, current);

const bytes = (base64url: string) =>
  Uint8Array.from(atob(base64url.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** Registers this browser to be rung. Safe to repeat: it also moves it to the current session. */
async function subscribe() {
  // Resolves once the service worker is active; the dev server doesn't run one.
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const { publicKey } = await unwrap(api.push.key.$get());
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: bytes(publicKey),
    });
  }
  const { endpoint, keys } = subscription.toJSON();
  if (!endpoint || !keys?.p256dh || !keys.auth) return;
  await unwrap(
    api.push.subscription.$put({
      json: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
    }),
  );
}

/** Must run from a tap or click: browsers ignore unprompted permission requests. */
export async function enableNotifications() {
  const permission = await Notification.requestPermission();
  changed();
  if (permission === "granted") await subscribe();
}

export const sendTestNotification = () => unwrap(api.push.test.$post());

/** Keeps this browser subscribed while signed in, and opens chats picked from notifications. */
export function usePush() {
  const state = useNotifyState();
  const navigate = useNavigate();

  useEffect(() => {
    if (state === "granted") subscribe().catch((e) => console.warn("push subscribe", e));
  }, [state]);

  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "open-chat" && e.data.chatId)
        navigate({ to: "/c/$chatId", params: { chatId: e.data.chatId } });
    };
    sw.addEventListener("message", onMessage);
    return () => sw.removeEventListener("message", onMessage);
  }, [navigate]);
}
