import { Menu as M } from "@base-ui/react/menu";
import type { ReactElement, ReactNode } from "react";
import { cx } from "../lib/cx";

/** Frequent-use menu: opens instantly, animates only on close (scale from the trigger). */
export function Menu({
  trigger,
  children,
  align = "start",
}: {
  trigger: ReactElement;
  children: ReactNode;
  align?: "start" | "end";
}) {
  return (
    <M.Root>
      <M.Trigger render={trigger} />
      <M.Portal>
        <M.Positioner sideOffset={6} align={align} className="z-50">
          <M.Popup
            className={cx(
              "min-w-[200px] origin-(--transform-origin) rounded-[14px] bg-panel p-[5px] shadow-pop outline-none",
              "transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-[0.99] data-ending-style:opacity-0",
            )}
          >
            {children}
          </M.Popup>
        </M.Positioner>
      </M.Portal>
    </M.Root>
  );
}

export function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <M.Item
      onClick={onClick}
      className={cx(
        "flex h-[34px] pointer-coarse:h-11 cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px] outline-none select-none",
        "data-highlighted:bg-hover [&>svg]:text-base",
        danger ? "text-red" : "text-ink",
      )}
    >
      {children}
    </M.Item>
  );
}

export const MenuSeparator = () => <M.Separator className="mx-2 my-1 h-px bg-line" />;
