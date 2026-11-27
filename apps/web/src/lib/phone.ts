import { useSyncExternalStore } from "react";

/** Tailwind's `max-md`: below this the app is laid out as a phone app. */
const media = matchMedia("(width < 48rem)");

export const isPhone = () => media.matches;

const subscribe = (cb: () => void) => {
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
};

export const usePhone = () => useSyncExternalStore(subscribe, isPhone);
