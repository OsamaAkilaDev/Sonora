import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";
import { toast } from "../../ui/toast";

const HOUR = 3_600_000;

/** Registers the service worker; when a new build is waiting, asks before reloading. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Long-lived installed sessions: check for new builds hourly.
      if (reg) setInterval(() => reg.update(), HOUR);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    const id = toast.add({
      title: "New version ready",
      description: "Reload to get the latest Sonora.",
      timeout: 0,
      actionProps: { children: "Reload", onClick: () => updateServiceWorker(true) },
    });
    return () => toast.close(id);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
