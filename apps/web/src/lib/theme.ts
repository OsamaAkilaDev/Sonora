import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark";
export type ThemePref = Theme | "system";

const KEY = "sonora-theme";
const root = document.documentElement;
const media = matchMedia("(prefers-color-scheme: dark)");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const listeners = new Set<() => void>();

const read = (): ThemePref => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
};
let pref = read();
const resolve = (p: ThemePref): Theme => (p === "system" ? (media.matches ? "dark" : "light") : p);

// Where the last click landed: the theme reveal grows from there.
let origin = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener("pointerdown", (e) => (origin = { x: e.clientX, y: e.clientY }), {
  capture: true,
  passive: true,
});

function paint() {
  root.dataset.theme = resolve(pref);
  for (const l of listeners) l();
}

/** Apply the current pref. Animated as a circular reveal; a plain cross-fade under reduced motion. */
function apply() {
  if (root.dataset.theme === resolve(pref)) return paint();
  if (!document.startViewTransition) return paint();

  const reveal = !reduceMotion.matches;
  if (reveal) root.classList.add("theme-reveal");
  // flushSync so React (theme-aware UI) commits inside the transition snapshot.
  const t = document.startViewTransition(() => flushSync(paint));
  if (reveal) {
    const { x, y } = origin;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    t.ready.then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        {
          duration: 400,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      ),
    );
  }
  t.finished.finally(() => root.classList.remove("theme-reveal"));
}

media.addEventListener("change", () => pref === "system" && apply());

export function setThemePref(p: ThemePref) {
  pref = p;
  try {
    if (p === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, p);
  } catch {}
  apply();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const useTheme = () => useSyncExternalStore(subscribe, () => resolve(pref));
export const useThemePref = () => useSyncExternalStore(subscribe, () => pref);
