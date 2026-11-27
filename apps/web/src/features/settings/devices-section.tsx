import { useCallback, useEffect, useState } from "react";
import { cx } from "../../lib/cx";
import { Button } from "../../ui/button";
import { inputClass } from "../../ui/field";
import { Switch } from "../../ui/switch";
import { deviceError, openMic, useDevicePrefs } from "../calls/devices";
import { watchLevel } from "../calls/meter";

const card = "mb-3.5 grid gap-3.5 rounded-[14px] p-4 shadow-[inset_0_0_0_1px_var(--line)]";

/** Device names stay hidden until the browser has granted access at least once. */
function useDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const reload = useCallback(() => {
    navigator.mediaDevices?.enumerateDevices().then(setDevices);
  }, []);
  useEffect(() => {
    reload();
    navigator.mediaDevices?.addEventListener("devicechange", reload);
    return () => navigator.mediaDevices?.removeEventListener("devicechange", reload);
  }, [reload]);
  return { devices, reload };
}

export function DevicesCards() {
  const prefs = useDevicePrefs();
  const { devices, reload } = useDevices();
  const speakers = "setSinkId" in HTMLMediaElement.prototype;

  const select = (kind: MediaDeviceKind, key: "mic" | "camera" | "speaker", label: string) => {
    const list = devices.filter((d) => d.kind === kind && d.deviceId && d.deviceId !== "default");
    return (
      <label className="grid gap-1.5 text-sm font-medium">
        {label}
        <select
          value={list.some((d) => d.deviceId === prefs[key]) ? prefs[key] : ""}
          onChange={(e) => useDevicePrefs.setState({ [key]: e.target.value })}
          className={cx(inputClass, "font-normal")}
        >
          <option value="">System default</option>
          {list.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `${label} ${i + 1}`}
            </option>
          ))}
        </select>
      </label>
    );
  };

  return (
    <>
      <div className={card}>
        {select("audioinput", "mic", "Microphone")}
        <MicTest onGranted={reload} />
        {speakers && select("audiooutput", "speaker", "Speaker")}
        {select("videoinput", "camera", "Camera")}
      </div>
      <div className={card}>
        {(
          [
            ["noiseSuppression", "Noise suppression", "Filters keyboard clicks and fans."],
            ["echoCancellation", "Echo cancellation", "Keeps your speakers out of your mic."],
            ["autoGain", "Automatic gain", "Evens out loud and quiet voices."],
          ] as const
        ).map(([key, title, hint]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-[13px] text-slate">{hint}</p>
            </div>
            <Switch
              label={title}
              checked={prefs[key]}
              onChange={(on) => useDevicePrefs.setState({ [key]: on })}
            />
          </div>
        ))}
      </div>
    </>
  );
}

/** Opens the microphone only when asked, and releases it when you leave this page. */
function MicTest({ onGranted }: { onGranted: () => void }) {
  const [on, setOn] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const mic = useDevicePrefs((p) => p.mic);

  useEffect(() => {
    if (!on) return;
    let stop: (() => void) | undefined;
    let track: MediaStreamTrack | undefined;
    let cancelled = false;
    openMic(mic).then(
      (t) => {
        if (cancelled) return t.stop();
        track = t;
        stop = watchLevel(t, setLevel);
        setError("");
        onGranted();
      },
      (e) => {
        setError(deviceError(e, "microphone"));
        setOn(false);
      },
    );
    return () => {
      cancelled = true;
      stop?.();
      track?.stop();
      setLevel(0);
    };
  }, [on, mic, onGranted]);

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setOn(!on)}>
          {on ? "Stop test" : "Test microphone"}
        </Button>
        {/* biome-ignore lint/a11y/useSemanticElements: <meter> can't be styled consistently */}
        <div
          role="meter"
          aria-label="Microphone level"
          aria-valuenow={Math.round(Math.min(1, level * 6) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 flex-1 overflow-hidden rounded-full bg-inset"
        >
          <div
            className="h-full origin-left rounded-full bg-cyan transition-transform duration-100 ease-linear"
            style={{ transform: `scaleX(${Math.min(1, level * 6)})` }}
          />
        </div>
      </div>
      <p className={cx("text-[13px]", error ? "text-red" : "text-slate")} role="status">
        {error || (on ? "Say something. The bar should move." : "Check that Sonora can hear you.")}
      </p>
    </div>
  );
}
