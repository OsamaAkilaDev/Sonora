import { type RefObject, useRef, useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  document.addEventListener("fullscreenchange", cb);
  return () => document.removeEventListener("fullscreenchange", cb);
};

/**
 * Full screen for one element. iPhone Safari can't (only <video> there), so `supported`
 * hides the button; the call already fills the screen on phones.
 */
export function useFullscreen<T extends HTMLElement>() {
  const ref: RefObject<T | null> = useRef<T>(null);
  const active = useSyncExternalStore(
    subscribe,
    () => !!ref.current && document.fullscreenElement === ref.current,
  );
  const toggle = () => {
    const request = active ? document.exitFullscreen() : ref.current?.requestFullscreen();
    request?.catch(() => {}); // refused by the browser: stay as we are
  };
  return { ref, active, toggle, supported: document.fullscreenEnabled };
}
