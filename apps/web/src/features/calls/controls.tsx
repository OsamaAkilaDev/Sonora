import {
  type Icon,
  Microphone,
  MicrophoneSlash,
  Screencast,
  VideoCamera,
  VideoCameraSlash,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cx } from "../../lib/cx";
import { canShareScreen } from "./devices";
import { toggleCamera, toggleMute, toggleScreen } from "./session";
import { useCall } from "./store";

type Tone = "plain" | "off" | "on";

const tones: Record<Tone, string> = {
  plain: "bg-panel text-ink shadow-panel hover:bg-hover",
  /** Something of yours is switched off. */
  off: "bg-[color-mix(in_oklab,var(--red)_14%,var(--panel))] text-red",
  /** Something extra is switched on. */
  on: "bg-ink text-on-ink shadow-btn",
};

export function ControlButton({
  label,
  tone = "plain",
  className,
  children,
  onClick,
}: {
  label: string;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        "grid size-11 shrink-0 place-items-center rounded-full text-xl",
        "transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.96]",
        tones[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Both icons stay mounted and cross-fade. */
function Swap({ on, a: A, b: B }: { on: boolean; a: Icon; b: Icon }) {
  const base =
    "col-start-1 row-start-1 transition-[opacity,scale,filter] duration-300 ease-out-quint";
  const hidden = "scale-25 opacity-0 blur-[4px]";
  return (
    <span aria-hidden className="grid">
      <A className={cx(base, on && hidden)} />
      <B className={cx(base, !on && hidden)} />
    </span>
  );
}

export function MicButton({ className }: { className?: string }) {
  const muted = useCall((s) => s.muted);
  return (
    <ControlButton
      label={muted ? "Unmute microphone" : "Mute microphone"}
      tone={muted ? "off" : "plain"}
      onClick={toggleMute}
      className={className}
    >
      <Swap on={muted} a={Microphone} b={MicrophoneSlash} />
    </ControlButton>
  );
}

export function CameraButton() {
  const on = useCall((s) => s.camera);
  return (
    <ControlButton
      label={on ? "Turn camera off" : "Turn camera on"}
      tone={on ? "plain" : "off"}
      onClick={toggleCamera}
    >
      <Swap on={!on} a={VideoCamera} b={VideoCameraSlash} />
    </ControlButton>
  );
}

export function ScreenButton() {
  const on = useCall((s) => s.screen);
  if (!canShareScreen()) return null;
  return (
    <ControlButton
      label={on ? "Stop sharing your screen" : "Share your screen"}
      tone={on ? "on" : "plain"}
      onClick={toggleScreen}
    >
      <Screencast />
    </ControlButton>
  );
}

const format = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mmss = `${Math.floor(s / 60) % 60}:${String(s % 60).padStart(2, "0")}`;
  return s < 3600 ? mmss : `${Math.floor(s / 3600)}:${mmss.padStart(5, "0")}`;
};

/** Where the call stands, with a running timer once someone is connected. */
export function CallStatus({ className }: { className?: string }) {
  const status = useCall((s) => s.status);
  const liveAt = useCall((s) => s.liveAt);
  const others = useCall((s) => Object.keys(s.peers).length);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const text =
    status === "reconnecting"
      ? "Reconnecting…"
      : status === "live" && liveAt
        ? format(now - liveAt)
        : others
          ? "Connecting…"
          : status === "waiting"
            ? "Waiting for others…"
            : "Starting…";
  return <span className={cx("tabular-nums", className)}>{text}</span>;
}
