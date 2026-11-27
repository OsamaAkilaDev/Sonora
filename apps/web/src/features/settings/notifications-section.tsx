import { Play } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import {
  setRingtoneEnabled,
  setSoundsEnabled,
  startLoop,
  useRingtoneEnabled,
  useSoundsEnabled,
} from "../../lib/sound";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { toast } from "../../ui/toast";
import {
  enableNotifications,
  type NotifyState,
  sendTestNotification,
  useNotifyState,
} from "../notifications/push";

const card = "mb-3.5 grid gap-3.5 rounded-[14px] p-4 shadow-[inset_0_0_0_1px_var(--line)]";

const explain: Record<NotifyState, string> = {
  granted: "On for this device. Calls ring even when Sonora is closed.",
  default: "Off. Without them, calls only ring while Sonora is open.",
  denied: "Blocked. Allow notifications for this site in your browser's settings.",
  install: "On iPhone and iPad, add Sonora to your Home Screen first, then open it from there.",
  unsupported: "This browser can't show notifications.",
};

export function NotificationsCards() {
  const state = useNotifyState();
  const sounds = useSoundsEnabled();
  const ringtone = useRingtoneEnabled();
  const preview = useRef<ReturnType<typeof setTimeout>>(undefined);

  const enable = useMutation({
    mutationFn: enableNotifications,
    onError: () => toast.add({ title: "Couldn't turn notifications on" }),
  });
  const test = useMutation({
    mutationFn: sendTestNotification,
    onSuccess: ({ sent }) =>
      toast.add(
        sent
          ? { title: "Test sent", description: "It should arrive in a few seconds." }
          : { title: "Nothing to send to yet", description: "Reload Sonora and try again." },
      ),
    onError: (e) => toast.add({ title: "Couldn't send the test", description: e.message }),
  });

  const playRingtone = () => {
    clearTimeout(preview.current);
    const stop = startLoop("ring");
    preview.current = setTimeout(stop, 3100);
  };

  return (
    <>
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 basis-52">
            <p className="text-sm font-medium">Call notifications</p>
            <p className="text-[13px] text-slate">{explain[state]}</p>
          </div>
          {state === "default" && (
            <Button size="sm" loading={enable.isPending} onClick={() => enable.mutate()}>
              Turn on
            </Button>
          )}
          {state === "granted" && (
            <Button
              variant="ghost"
              size="sm"
              loading={test.isPending}
              onClick={() => test.mutate()}
            >
              Send a test
            </Button>
          )}
        </div>
        <p className="text-[13px] text-slate">
          Silent mode, Do Not Disturb and battery savers on your device can still mute them.
        </p>
      </div>
      <div className={card}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Ringtone</p>
            <p className="text-[13px] text-slate">Plays for incoming and outgoing calls.</p>
          </div>
          <Button variant="ghost" size="sm" disabled={!ringtone} onClick={playRingtone}>
            <Play weight="fill" /> Play
          </Button>
          <Switch label="Ringtone" checked={ringtone} onChange={setRingtoneEnabled} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Interface sounds</p>
            <p className="text-[13px] text-slate">
              Quiet cues for sending, deleting, muting and other actions.
            </p>
          </div>
          <Switch label="Interface sounds" checked={sounds} onChange={setSoundsEnabled} />
        </div>
      </div>
    </>
  );
}
