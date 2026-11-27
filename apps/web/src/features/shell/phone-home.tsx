import { MagnifyingGlass, NotePencil } from "@phosphor-icons/react";
import { type ReactNode, type Ref, useRef, useState } from "react";
import { cx } from "../../lib/cx";
import { IconButton } from "../../ui/button";
import { ChatList } from "../chats/chat-list";
import { NewGroupDialog } from "../chats/new-group-dialog";
import { NotifyPrompt } from "../notifications/prompt";
import { connectionLabel, useConnection } from "../realtime/socket";
import { FriendList } from "../social/friend-list";
import { RequestList } from "../social/request-list";
import { useSwitcher } from "../switcher/switcher";
import { BottomNav } from "./bottom-nav";
import { useGoTab, useUrlTab } from "./navigation";
import { phoneTab, type Tab } from "./tabs";
import { YouScreen } from "./you-screen";

/** The phone's home: one screen per tab above the bottom bar. Each keeps its own scroll. */
export function PhoneHome() {
  const tab = phoneTab(useUrlTab());
  const goTab = useGoTab();
  const down = connectionLabel(useConnection());
  const [newGroup, setNewGroup] = useState(false);
  const scrollers = useRef<Partial<Record<Tab, HTMLDivElement | null>>>({});

  const select = (t: Tab) => {
    if (goTab(t) === "top") scrollers.current[t]?.scrollTo({ top: 0 });
  };
  const screen = (id: Tab) => ({
    on: tab === id,
    ref: (el: HTMLDivElement | null) => {
      scrollers.current[id] = el;
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <Screen
          {...screen("chats")}
          title={down ?? "Chats"}
          actions={
            <>
              <IconButton label="Search" onClick={() => useSwitcher.getState().set(true)}>
                <MagnifyingGlass className="text-[22px]" />
              </IconButton>
              <IconButton label="New group" onClick={() => setNewGroup(true)}>
                <NotePencil className="text-[22px]" />
              </IconButton>
            </>
          }
        >
          <NotifyPrompt />
          <ChatList onFindFriends={() => select("friends")} />
        </Screen>
        <Screen {...screen("friends")} title="Friends">
          <FriendList requests={<RequestList inline />} />
        </Screen>
        <Screen {...screen("you")} title="You">
          <YouScreen />
        </Screen>
      </div>
      <BottomNav tab={tab} onSelect={select} />
      <NewGroupDialog open={newGroup} onOpenChange={setNewGroup} />
    </div>
  );
}

function Screen({
  title,
  actions,
  on,
  ref,
  children,
}: {
  title: string;
  actions?: ReactNode;
  on: boolean;
  ref: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    // Hidden with visibility, not display, so the scroll position survives.
    <section
      aria-label={title}
      className={cx("absolute inset-0 flex flex-col", !on && "invisible")}
    >
      <header className="flex h-14 shrink-0 items-center gap-1 pr-2 pl-4">
        <h1 className="min-w-0 flex-1 truncate text-[22px] font-semibold tracking-[-0.37px]">
          {title}
        </h1>
        {actions}
      </header>
      <div
        ref={ref}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 motion-safe:scroll-smooth"
      >
        {children}
      </div>
    </section>
  );
}
