import type { ButtonHTMLAttributes } from "react";
import { cx } from "../lib/cx";
import { Spinner } from "./spinner";

const variants = {
  ink: "bg-ink text-on-ink shadow-btn enabled:hover:bg-ink/86",
  ghost: "text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-hover hover:text-ink",
  danger:
    "text-red shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--red)_45%,transparent)] hover:bg-red hover:text-white hover:shadow-none focus-visible:bg-red focus-visible:text-white",
  plain: "text-slate hover:bg-hover hover:text-ink",
} as const;

const sizes = {
  sm: "h-7 px-3 text-[13px] pointer-coarse:h-11",
  md: "h-[34px] px-3.5 text-sm pointer-coarse:h-11",
  lg: "h-10 px-4 text-[14.5px] pointer-coarse:h-11",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
};

export function Button({
  variant = "ink",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        "transition-[background-color,color,box-shadow,scale] duration-150 ease-out",
        "enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

type IconProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; pressed?: boolean };

/** Circular icon-only button. `label` is required: it's the accessible name. */
export function IconButton({ label, pressed, className, children, ...rest }: IconProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      {...rest}
      className={cx(
        "inline-grid size-8 shrink-0 place-items-center rounded-full text-lg text-slate pointer-coarse:size-11",
        "transition-[background-color,color,scale] duration-150 ease-out hover:bg-hover hover:text-ink",
        "enabled:active:scale-[0.96] aria-pressed:bg-inset aria-pressed:text-ink disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}
