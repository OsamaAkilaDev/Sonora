import { PhoneX } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { cx } from "../../lib/cx";
import { meQuery } from "../auth/queries";
import { chatTitle } from "../chats/chat-list";
import { chatsQuery } from "../chats/queries";
import { CallStatus, MicButton } from "./controls";
import { leaveCall } from "./session";
import { useCall } from "./store";

/** Whether the call needs its own handle because its screen isn't showing. */
export function useCallElsewhere() {
  const chatId = useCall((s) => s.chatId);
  const minimized = useCall((s) => s.minimized);
  const open = useParams({ strict: false }).chatId;
  return {
    desktop: !!chatId && chatId !== open,
    phone: !!chatId && (chatId !== open || minimized),
  };
}

/** The call while you look elsewhere: a rail card on desktop, a slim bar on phones. */
export function CallDock({ variant }: { variant: "card" | "bar" }) {
  const chatId = useCall((s) => s.chatId);
  const me = useQuery(meQuery).data;
  const chat = useQuery(chatsQuery).data?.find((c) => c.id === chatId);
  if (!chatId || !me || !chat) return null;
  const bar = variant === "bar";

  return (
    <section
      aria-label="Ongoing call"
      className={cx(
        "flex items-center gap-2",
        bar ? "panel h-full px-2" : "mt-2 rounded-xl bg-inset p-2.5",
      )}
    >
      <Link
        to="/c/$chatId"
        params={{ chatId }}
        onClick={() => useCall.setState({ minimized: false })}
        aria-label={`Return to call with ${chatTitle(chat, me.id)}`}
        className="min-w-0 flex-1 rounded-lg px-1.5 py-0.5 hover:bg-hover"
      >
        <span className="flex items-center gap-2 text-[12.5px] font-semibold text-cyan-ink">
          <span className="size-[7px] rounded-full bg-cyan shadow-[0_0_0_3px_color-mix(in_oklab,var(--cyan)_25%,transparent)]" />
          <CallStatus />
        </span>
        <span className="block truncate text-[13px] text-slate">{chatTitle(chat, me.id)}</span>
      </Link>
      <MicButton className="size-9 text-lg" />
      <button
        type="button"
        onClick={leaveCall}
        aria-label="Leave call"
        title="Leave call"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-red-solid text-lg text-white transition-[filter,scale] duration-150 hover:brightness-110 active:scale-[0.96]"
      >
        <PhoneX weight="fill" />
      </button>
    </section>
  );
}
