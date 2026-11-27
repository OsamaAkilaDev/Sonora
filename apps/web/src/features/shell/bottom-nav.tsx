import { ChatsCircle, UsersThree } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Avatar } from "../../ui/avatar";
import { meQuery } from "../auth/queries";
import { chatsQuery } from "../chats/queries";
import { socialQuery } from "../social/queries";
import type { Tab } from "./tabs";

/** The phone's main navigation: always labelled, badges for what's waiting. */
export function BottomNav({ tab, onSelect }: { tab: Tab; onSelect: (t: Tab) => void }) {
  const me = useQuery(meQuery).data;
  const unread = useQuery(chatsQuery).data?.filter((c) => c.unread > 0).length ?? 0;
  const requests =
    useQuery(socialQuery).data?.requests.filter((r) => r.direction === "incoming").length ?? 0;

  const item = (id: Tab, label: string, badge: number, icon: (on: boolean) => ReactNode) => {
    const on = tab === id;
    return (
      <button
        type="button"
        onClick={() => onSelect(id)}
        aria-current={on ? "page" : undefined}
        aria-label={badge ? `${label}, ${badge} new` : label}
        className={cx(
          "group flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] leading-4",
          on ? "font-semibold text-ink" : "font-medium text-slate",
        )}
      >
        <span className="relative grid h-7 w-12 place-items-center text-2xl transition-[scale] duration-150 ease-out group-active:scale-[0.92]">
          {icon(on)}
          {badge > 0 && (
            <span className="absolute -top-0.5 left-[calc(50%+4px)] inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-cyan px-1 text-[10.5px] leading-none font-semibold text-white tabular-nums ring-2 ring-panel">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
        {label}
      </button>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="bottom-nav grid shrink-0 grid-cols-3 border-t border-line pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] select-none"
    >
      {item("chats", "Chats", unread, (on) => (
        <ChatsCircle weight={on ? "fill" : "regular"} />
      ))}
      {item("friends", "Friends", requests, (on) => (
        <UsersThree weight={on ? "fill" : "regular"} />
      ))}
      {item("you", "You", 0, (on) =>
        me ? (
          <span className={cx("flex rounded-full", on && "ring-2 ring-ink")}>
            <Avatar seed={me.avatarSeed} size={24} />
          </span>
        ) : null,
      )}
    </nav>
  );
}
