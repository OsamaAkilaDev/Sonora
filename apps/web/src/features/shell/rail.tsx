import { ChatsCircle, type Icon, NotePencil, UserPlus, UsersThree } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { cx } from "../../lib/cx";
import { IconButton } from "../../ui/button";
import { CallDock, useCallElsewhere } from "../calls/call-dock";
import { ChatList } from "../chats/chat-list";
import { NewGroupDialog } from "../chats/new-group-dialog";
import { NotifyPrompt } from "../notifications/prompt";
import { FriendList } from "../social/friend-list";
import { socialQuery } from "../social/queries";
import { RequestList } from "../social/request-list";
import { useUrlTab } from "./navigation";
import { railTab } from "./tabs";

type Tab = ReturnType<typeof railTab>;
const tabs: { id: Tab; label: string; icon: Icon }[] = [
  { id: "chats", label: "Chats", icon: ChatsCircle },
  { id: "friends", label: "Friends", icon: UsersThree },
  { id: "requests", label: "Requests", icon: UserPlus },
];

/** Side rail. The active tab grows to show its label (kept from Sonora v1). */
export function Rail() {
  const tab = railTab(useUrlTab());
  const navigate = useNavigate();
  const setTab = (t: Tab) =>
    navigate({ to: ".", search: (p) => ({ ...p, tab: t }), replace: true });
  const [newGroup, setNewGroup] = useState(false);
  const call = useCallElsewhere();
  const incoming =
    useQuery(socialQuery).data?.requests.filter((r) => r.direction === "incoming").length ?? 0;

  return (
    <div className="flex h-full flex-col p-2">
      <div className="flex items-center gap-1.5">
        <div role="tablist" aria-label="Sections" className="flex flex-1 gap-1.5">
          {tabs.map(({ id, label, icon: I }) => {
            const on = id === tab;
            const badge = id === "requests" && incoming > 0;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={badge ? `${label}, ${incoming} new` : label}
                onClick={() => setTab(id)}
                className={cx(
                  "relative flex h-[34px] min-w-0 basis-11 items-center justify-center rounded-full text-[13.5px] font-medium",
                  "transition-[flex-grow,background-color,color] duration-300 ease-out-quint",
                  on ? "grow bg-inset text-ink-2" : "text-slate hover:bg-hover hover:text-ink-2",
                )}
              >
                <I className="shrink-0 text-lg" weight={on ? "fill" : "regular"} />
                <span
                  className={cx(
                    "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-out-quint",
                    on ? "ml-1.5 max-w-24 opacity-100" : "ml-0 max-w-0 opacity-0",
                  )}
                >
                  {label}
                </span>
                {badge && (
                  <span
                    className={cx(
                      "inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-cyan px-1 text-[10.5px] leading-none font-semibold text-white tabular-nums",
                      on ? "ml-1.5" : "absolute -top-0.5 -right-0.5 ring-2 ring-panel",
                    )}
                  >
                    {incoming}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <IconButton label="New group" onClick={() => setNewGroup(true)} className="bg-inset">
          <NotePencil />
        </IconButton>
      </div>

      <div role="tabpanel" className="-mx-1 mt-2 min-h-0 flex-1 overflow-y-auto px-1">
        {tab === "chats" && <ChatList onFindFriends={() => setTab("friends")} />}
        {tab === "friends" && <FriendList />}
        {tab === "requests" && <RequestList />}
      </div>
      <NotifyPrompt />
      {call.desktop && <CallDock variant="card" />}
      <NewGroupDialog open={newGroup} onOpenChange={setNewGroup} />
    </div>
  );
}
