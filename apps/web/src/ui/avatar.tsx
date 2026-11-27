import type { UserStatus } from "@sonora/shared";
import { cx } from "../lib/cx";

export const avatarUrl = (seed: string) =>
  // Transparent art; the circle behind it carries the theme color.
  `https://api.dicebear.com/11.x/slice/svg?seed=${encodeURIComponent(seed)}&backgroundColor=00000000`;

const dot: Record<UserStatus | "offline", string> = {
  online: "bg-green",
  idle: "bg-amber",
  dnd: "bg-red",
  invisible: "bg-panel shadow-[inset_0_0_0_2px_var(--ash)]",
  offline: "bg-panel shadow-[inset_0_0_0_2px_var(--ash)]",
};

type Props = { seed: string; size?: number; status?: UserStatus | "offline"; className?: string };

export function Avatar({ seed, size = 36, status, className }: Props) {
  return (
    <span
      className={cx(
        "relative inline-block shrink-0 rounded-full bg-(--avatar-bg) align-middle",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={avatarUrl(seed)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="size-full rounded-full"
      />
      {status && (
        <span
          className={cx(
            "absolute -right-px -bottom-px size-[31%] min-h-[9px] min-w-[9px] rounded-full border-[2.5px] border-panel",
            dot[status],
          )}
        />
      )}
    </span>
  );
}
