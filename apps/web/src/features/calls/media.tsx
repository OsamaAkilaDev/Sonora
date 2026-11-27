import { useEffect, useRef } from "react";
import { cx } from "../../lib/cx";
import { useDevicePrefs } from "./devices";

/** Picture only: sound plays through <RemoteAudio>, which outlives the call screen. */
export function Video({ track, className }: { track: MediaStreamTrack; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = new MediaStream([track]);
  }, [track]);
  return <video ref={ref} autoPlay playsInline muted className={cx("size-full", className)} />;
}

export function RemoteAudio({ track }: { track: MediaStreamTrack }) {
  const ref = useRef<HTMLAudioElement>(null);
  const speaker = useDevicePrefs((p) => p.speaker);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = new MediaStream([track]);
  }, [track]);
  useEffect(() => {
    // Choosing a speaker isn't available everywhere (e.g. iOS): the default then applies.
    ref.current?.setSinkId?.(speaker).catch(() => {});
  }, [speaker]);
  // biome-ignore lint/a11y/useMediaCaption: a live voice call has no caption track
  return <audio ref={ref} autoPlay />;
}
