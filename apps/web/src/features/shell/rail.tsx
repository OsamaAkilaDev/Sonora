import { ChatsCircle, type Icon, UserPlus, UsersThree } from "@phosphor-icons/react";
import { useState } from "react";
import { cx } from "../../lib/cx";
import { EmptyState } from "./empty-state";

type Tab = "chats" | "friends" | "requests";
const tabs: { id: Tab; label: string; icon: Icon }[] = [
  { id: "chats", label: "Chats", icon: ChatsCircle },
  { id: "friends", label: "Friends", icon: UsersThree },
  { id: "requests", label: "Requests", icon: UserPlus },
];

const empty: Record<Tab, { title: string; body: string }> = {
  chats: { title: "No chats yet", body: "Add a friend and your conversations will show up here." },
  friends: { title: "No friends yet", body: "Add people by their username to start talking." },
  requests: {
    title: "All caught up",
    body: "Friend requests you send or receive will appear here.",
  },
};

/** Side rail. The active tab grows to show its label (kept from Sonora v1). */
export function Rail() {
  const [tab, setTab] = useState<Tab>("chats");
  return (
    <div className="flex h-full flex-col p-2">
      <div role="tablist" aria-label="Sections" className="flex gap-1.5">
        {tabs.map(({ id, label, icon: I }) => {
          const on = id === tab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={label}
              onClick={() => setTab(id)}
              className={cx(
                "flex h-[34px] min-w-0 basis-11 items-center justify-center gap-1.5 rounded-full text-[13.5px] font-medium",
                "transition-[flex-grow,background-color,color] duration-300 ease-out-quint",
                on ? "grow bg-inset text-ink" : "text-slate hover:bg-hover hover:text-ink",
              )}
            >
              <I className="shrink-0 text-lg" weight={on ? "fill" : "regular"} />
              <span
                className={cx(
                  "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out-quint",
                  on ? "max-w-24 opacity-100" : "max-w-0 opacity-0",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="min-h-0 flex-1">
        <EmptyState {...empty[tab]} />
      </div>
    </div>
  );
}
