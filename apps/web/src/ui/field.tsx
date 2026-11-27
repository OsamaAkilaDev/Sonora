import { Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";
import { type InputHTMLAttributes, type ReactNode, useId, useState } from "react";
import { cx } from "../lib/cx";
import { IconButton } from "./button";

export const inputClass = cx(
  "h-[38px] w-full rounded-[10px] bg-inset px-3.5 text-ink outline-none",
  "shadow-[inset_0_0_0_1px_transparent] transition-[box-shadow,background-color] duration-150",
  "focus:bg-panel focus:shadow-[inset_0_0_0_1px_var(--cyan),0_0_0_3px_color-mix(in_oklab,var(--cyan)_18%,transparent)]",
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--red)]",
);

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  aside?: ReactNode;
};

/** Label + input + hint/error, wired with ids for screen readers. */
export function Field({ label, hint, error, aside, type, className, ...rest }: FieldProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const msgId = `${id}-msg`;

  return (
    <div className={cx("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className={cx(inputClass, isPassword && "pr-11")}
          {...rest}
        />
        {isPassword && (
          <IconButton
            label={reveal ? "Hide password" : "Show password"}
            pressed={reveal}
            onClick={() => setReveal((r) => !r)}
            className="absolute top-[3px] right-[3px]"
          >
            {reveal ? <EyeSlash /> : <Eye />}
          </IconButton>
        )}
      </div>
      {error ? (
        <p id={msgId} className="flex items-center gap-1.5 text-[12.5px] text-red">
          <WarningCircle aria-hidden className="shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-[12.5px] text-slate">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
