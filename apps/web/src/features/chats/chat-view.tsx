import { ArrowDown, CaretLeft } from "@phosphor-icons/react";
import type { ChatSummary, Me } from "@sonora/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../../lib/cx";
import { dayLabel } from "../../lib/format";
import { Avatar } from "../../ui/avatar";
import { meQuery } from "../auth/queries";
import { useTypingIn } from "../realtime/typing";
import { EmptyState } from "../shell/empty-state";
import { presenceLabel } from "../social/friend-list";
import { chatTitle, GroupAvatar, peerOf } from "./chat-list";
import { Composer } from "./composer";
import { MessageLine, type Receipt } from "./message-line";
import { chatsQuery, type LocalMessage, messagesQuery, useMarkRead } from "./queries";

const GROUP_GAP = 5 * 60_000;

export function ChatView({ chatId }: { chatId: string }) {
  const me = useQuery(meQuery).data;
  const chats = useQuery(chatsQuery);
  const chat = chats.data?.find((c) => c.id === chatId);

  if (!me || chats.isPending) return <ViewSkeleton />;
  if (!chat)
    return (
      <EmptyState
        title="Chat not found"
        body="It may have been removed, or you're not part of it."
        action={
          <Link to="/" className="text-sm font-medium text-cyan-ink hover:underline">
            Back to chats
          </Link>
        }
      />
    );
  return (
    <div className="flex h-full flex-col">
      <Header chat={chat} me={me} />
      <Feed chat={chat} me={me} />
      <ChatComposer chat={chat} me={me} />
    </div>
  );
}

function Header({ chat, me }: { chat: ChatSummary; me: Me }) {
  const peer = peerOf(chat, me.id);
  const typing = useTypingIn(chat.id);
  const online = chat.members.filter((u) => u.id !== me.id && u.presence !== "offline").length;
  const sub = typing.length
    ? peer
      ? "typing…"
      : `${typing.map((id) => chat.members.find((u) => u.id === id)?.username).join(", ")} typing…`
    : peer
      ? presenceLabel(peer)
      : `${chat.members.length} members${online ? ` · ${online} online` : ""}`;

  return (
    <header className="flex min-h-[60px] items-center gap-3 border-b border-line py-2.5 pr-3 pl-2 md:pl-3.5">
      <Link
        to="/"
        aria-label="Back to chats"
        className="grid size-8 place-items-center rounded-full text-lg text-slate hover:bg-hover hover:text-ink md:hidden"
      >
        <CaretLeft />
      </Link>
      {peer ? (
        <Avatar seed={peer.avatarSeed} size={38} status={peer.presence} />
      ) : (
        <GroupAvatar chat={chat} meId={me.id} size={38} />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] leading-tight font-semibold">
          {chatTitle(chat, me.id)}
        </h1>
        <p
          className={cx(
            "truncate text-[12.5px] leading-snug",
            typing.length ? "text-cyan-ink" : "text-slate",
          )}
        >
          {sub}
        </p>
      </div>
    </header>
  );
}

type Item =
  | { kind: "day"; key: string; label: string }
  | { kind: "msg"; key: string; msg: LocalMessage; head: boolean };

function Feed({ chat, me }: { chat: ChatSummary; me: Me }) {
  const { q, msgs } = useChatMessages(chat.id);
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);
  const markRead = useMarkRead(chat.id, me.id);

  const byId = useMemo(() => new Map(msgs.map((x) => [x.id, x])), [msgs]);

  const items = useMemo(() => {
    const out: Item[] = [];
    let prev: LocalMessage | undefined;
    for (const msg of msgs) {
      const day = dayLabel(msg.createdAt);
      const newDay = !prev || dayLabel(prev.createdAt) !== day;
      if (newDay) out.push({ kind: "day", key: `d-${msg.createdAt}`, label: day });
      const head =
        newDay ||
        prev?.senderId !== msg.senderId ||
        msg.createdAt - (prev?.createdAt ?? 0) > GROUP_GAP;
      out.push({ kind: "msg", key: msg.clientId ?? msg.id, msg, head });
      prev = msg;
    }
    return out;
  }, [msgs]);

  // Load older history when the top sentinel scrolls into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !q.hasNextPage) return;
    const io = new IntersectionObserver(
      ([e]) => e?.isIntersecting && !q.isFetchingNextPage && q.fetchNextPage(),
      { root: scroller.current, rootMargin: "400px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage]);

  // Mark read while the chat is visible and something newer from others has arrived.
  const latest = [...msgs].reverse().find((x) => !x.local);
  const myRead = chat.readBy[me.id];
  useEffect(() => {
    if (!latest || (myRead && myRead >= latest.id)) return;
    const mark = () => document.visibilityState === "visible" && markRead.mutate(latest.id);
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [latest, myRead, markRead.mutate]);

  // Sending always brings you back to the newest message.
  const lastKey = msgs[msgs.length - 1];
  useEffect(() => {
    if (lastKey?.senderId === me.id && lastKey.local === "sending")
      scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [lastKey, me.id]);

  // Receipt under my latest message in a DM: Sent once stored, Seen once they've read it.
  const peer = peerOf(chat, me.id);
  const last = msgs[msgs.length - 1];
  const peerRead = peer ? chat.readBy[peer.id] : null;
  const receipt: Receipt | undefined =
    peer && last?.senderId === me.id && !last.local && !last.deletedAt
      ? peerRead && peerRead >= last.id
        ? "seen"
        : "sent"
      : undefined;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scroller}
        onScroll={(e) => setAway(e.currentTarget.scrollTop < -240)}
        className="flex h-full flex-col-reverse overflow-y-auto overscroll-contain"
      >
        <div className="px-2 pt-2 pb-3">
          {q.isPending ? (
            <FeedSkeleton />
          ) : q.hasNextPage ? (
            <div ref={sentinel} className="py-3">
              <FeedSkeleton short />
            </div>
          ) : (
            <ChatIntro chat={chat} me={me} />
          )}
          {items.map((it) =>
            it.kind === "day" ? (
              <p
                key={it.key}
                className="my-3 flex items-center gap-3 px-2.5 text-xs font-medium text-ash before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line"
              >
                {it.label}
              </p>
            ) : (
              <MessageLine
                key={it.key}
                msg={it.msg}
                head={it.head}
                chat={chat}
                me={me}
                receipt={it.msg === last ? receipt : undefined}
                replyTo={it.msg.replyToId ? byId.get(it.msg.replyToId) : undefined}
              />
            ),
          )}
        </div>
      </div>
      <AnimatePresence>
        {away && (
          <m.button
            type="button"
            onClick={() => scroller.current?.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="absolute bottom-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-panel px-3 text-[13px] font-medium shadow-pop active:scale-[0.96]"
          >
            <ArrowDown /> Latest
          </m.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatIntro({ chat, me }: { chat: ChatSummary; me: Me }) {
  const peer = peerOf(chat, me.id);
  return (
    <div className="grid justify-items-start gap-1.5 px-2.5 pt-6 pb-4">
      {peer ? (
        <Avatar seed={peer.avatarSeed} size={64} />
      ) : (
        <GroupAvatar chat={chat} meId={me.id} size={64} />
      )}
      <h2 className="mt-2 text-[22px] leading-tight font-semibold tracking-[-0.37px]">
        {chatTitle(chat, me.id)}
      </h2>
      <p className="text-sm text-slate">
        {peer
          ? `This is the beginning of your conversation with ${peer.username}.`
          : `The start of ${chat.name ?? "this group"}. ${chat.members.length} members.`}
      </p>
    </div>
  );
}

function FeedSkeleton({ short }: { short?: boolean }) {
  const rows = short ? [60] : [62, 40, 75, 48];
  return (
    <div aria-hidden className="grid gap-4 px-2.5 py-2">
      {rows.map((w) => (
        <div key={w} className="grid grid-cols-[40px_minmax(0,1fr)] gap-3">
          <span className="skeleton size-10 rounded-full" />
          <div className="grid gap-2 pt-1">
            <span className="skeleton h-3 w-24" />
            <span className="skeleton h-3" style={{ width: `${w}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ViewSkeleton() {
  return (
    <div aria-hidden className="flex h-full flex-col">
      <div className="flex min-h-[60px] items-center gap-3 border-b border-line px-3.5">
        <span className="skeleton size-[38px] rounded-full" />
        <div className="grid gap-2">
          <span className="skeleton h-3 w-32" />
          <span className="skeleton h-2.5 w-20" />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end">
        <FeedSkeleton />
      </div>
    </div>
  );
}

/** One flattened, oldest-first message list shared by the feed and the composer. */
function useChatMessages(chatId: string) {
  const q = useInfiniteQuery(messagesQuery(chatId));
  const msgs = useMemo(
    () => (q.data ? [...q.data.pages].reverse().flatMap((p) => p.messages) : []),
    [q.data],
  );
  return { q, msgs };
}

function ChatComposer({ chat, me }: { chat: ChatSummary; me: Me }) {
  const { msgs } = useChatMessages(chat.id);
  return <Composer chat={chat} me={me} messages={msgs} />;
}
