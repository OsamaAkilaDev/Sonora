// Video tiles without WebRTC: the <video> keeps the app's classes and names its feed, and the
// film puts a stock clip there.
import { cx } from "../../../apps/web/src/lib/cx";

export function Video({ track, className }: { track: { id: string }; className?: string }) {
  return <video data-feed={track.id} muted playsInline className={cx("size-full", className)} />;
}

export const RemoteAudio = () => null;
