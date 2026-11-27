import { BellRinging } from "@phosphor-icons/react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Button } from "../../ui/button";
import { toast } from "../../ui/toast";
import { enableNotifications, useNotifyState } from "./push";

const DISMISSED = "sonora-notify-later";

/** Asked once, in the side rail, because calls are the thing you can't afford to miss. */
export function NotifyPrompt() {
  const state = useNotifyState();
  const [later, setLater] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED) === "1";
    } catch {
      return false;
    }
  });
  if (state !== "default" || later) return null;

  const dismiss = () => {
    setLater(true);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
  };

  return (
    <m.section
      aria-label="Turn on call notifications"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="mt-2 grid gap-2.5 rounded-xl bg-inset p-3 max-md:mt-0 max-md:mb-2"
    >
      <div className="flex gap-2.5">
        <BellRinging aria-hidden weight="fill" className="mt-0.5 text-lg text-cyan-ink" />
        <div>
          <p className="text-[13.5px] font-semibold">Don't miss a call</p>
          <p className="text-[13px] text-slate">
            Let Sonora ring you when it's in the background or closed.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-1.5">
        <Button variant="plain" size="sm" onClick={dismiss}>
          Not now
        </Button>
        <Button
          size="sm"
          onClick={() =>
            enableNotifications().catch(() =>
              toast.add({
                title: "Couldn't turn notifications on",
                description: "Try again from Settings.",
              }),
            )
          }
        >
          Turn on
        </Button>
      </div>
    </m.section>
  );
}
