import { startLoop } from "../../lib/sound";

type IncomingAlert = { callId: string; title: string; body: string };

const VIBRATION = [400, 200, 400, 200, 600];

/**
 * Everything the open app does to get your attention while a call rings: the ringtone,
 * vibration, a flashing tab title, and a system notification if you're looking elsewhere and
 * push isn't set up. Returns how to stop it all.
 */
export function ringIncoming({ callId, title, body }: IncomingAlert) {
  const stopTone = startLoop("ring");
  const buzz = () => navigator.vibrate?.(VIBRATION);
  buzz();
  const buzzing = setInterval(buzz, 3200);

  const original = document.title;
  let flash = false;
  const flashing = setInterval(() => {
    flash = !flash;
    document.title = flash ? `📞 ${title} is calling` : original;
  }, 1000);

  const tag = `call:${callId}`;
  let notification: Notification | undefined;
  const notify = async () => {
    if (!document.hidden || globalThis.Notification?.permission !== "granted") return;
    const registration = await navigator.serviceWorker?.getRegistration();
    // With a push subscription the service worker shows (and repeats) the notification.
    if (await registration?.pushManager.getSubscription()) return;
    try {
      notification = new Notification(title, { body, tag, requireInteraction: true });
      notification.onclick = () => {
        focus();
        notification?.close();
      };
    } catch {
      // Android only allows notifications from a service worker.
    }
  };
  void notify();
  document.addEventListener("visibilitychange", notify);

  return () => {
    stopTone();
    clearInterval(buzzing);
    navigator.vibrate?.(0);
    clearInterval(flashing);
    document.title = original;
    document.removeEventListener("visibilitychange", notify);
    notification?.close();
    void navigator.serviceWorker
      ?.getRegistration()
      .then((r) => r?.getNotifications({ tag }))
      .then((list) => {
        for (const n of list ?? []) n.close();
      });
  };
}
