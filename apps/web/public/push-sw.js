/*
 * Call notifications, loaded into the generated service worker. This is what rings when
 * Sonora is closed, in the background, or asleep on a phone. Payloads: shared/src/push.ts.
 */

// Apple's push service withdraws permission from pushes that show nothing.
const mustAlwaysShow =
  /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Android/.test(navigator.userAgent);

self.addEventListener("push", (event) => {
  const data = event.data?.json();
  if (data) event.waitUntil(notice(data));
});

async function notice(data) {
  const icon = "/pwa-192x192.png";
  if (data.type === "test") {
    return self.registration.showNotification("Sonora can reach you", {
      body: "Calls will ring here, even when Sonora is closed.",
      tag: "sonora-test",
      renotify: true,
      icon,
    });
  }

  const tag = `call:${data.callId}`;
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  // An open app in front of you is already ringing (or you just answered there).
  if (!mustAlwaysShow && data.type !== "missed" && windows.some((w) => w.focused)) {
    for (const n of await self.registration.getNotifications({ tag })) n.close();
    return;
  }

  const kind = data.video ? "video" : "voice";
  const title = data.group ? `${data.from} · ${data.group}` : data.from;
  const options = { tag, icon, data };
  if (data.type === "ring") {
    return self.registration.showNotification(title, {
      ...options,
      body: `Incoming ${kind} call`,
      // Each repeat rings again; it stays up until you deal with it.
      renotify: true,
      requireInteraction: true,
      vibrate: [400, 200, 400, 200, 600],
      actions: [
        { action: "open", title: "Open" },
        { action: "decline", title: "Decline" },
      ],
    });
  }
  return self.registration.showNotification(title, {
    ...options,
    body: data.type === "missed" ? `Missed ${kind} call` : "Call handled on another device",
    silent: true,
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data;
  if (event.action === "decline") {
    event.waitUntil(
      fetch(`/api/calls/${data.chatId}/decline`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ callId: data.callId }),
      }),
    );
    return;
  }
  const path = data ? `/c/${data.chatId}` : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async ([open]) => {
      if (!open) return self.clients.openWindow(path);
      await open.focus();
      open.postMessage({ type: "open-chat", chatId: data?.chatId });
    }),
  );
});
