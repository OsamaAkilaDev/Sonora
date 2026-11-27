import { extendTailwindMerge } from "tailwind-merge";

// Our design tokens (styles.css @theme), so merge knows `text-ink` is a color, not a size.
const merge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "canvas",
        "panel",
        "inset",
        "hover",
        "line",
        "ink",
        "ink-2",
        "slate",
        "ash",
        "on-ink",
        "cyan",
        "cyan-ink",
        "cyan-wash",
        "red",
        "green",
        "amber",
        "red-solid",
        "green-solid",
      ],
      shadow: ["panel", "pop", "btn"],
      ease: ["out-quint"],
    },
  },
});

/** Join class names; a later class overrides a conflicting earlier one (h-10 after h-8 wins). */
export const cx = (...c: (string | false | null | undefined)[]) =>
  merge(c.filter(Boolean).join(" "));
