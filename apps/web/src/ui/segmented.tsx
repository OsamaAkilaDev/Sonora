import * as m from "motion/react-m";
import { useId } from "react";
import { cx } from "../lib/cx";

type Option<T extends string> = { value: T; label: string };
type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
};

/** Pill segmented control; the thumb slides between options (shared layout animation). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: Props<T>) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx("flex rounded-full bg-inset p-[3px]", className)}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "relative h-[30px] flex-1 rounded-full text-[13.5px] font-medium transition-colors duration-150",
              on ? "text-ink" : "text-slate hover:text-ink",
            )}
          >
            {on && (
              <m.span
                layoutId={`seg-${id}`}
                transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                className="absolute inset-0 rounded-full bg-panel shadow-panel"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
