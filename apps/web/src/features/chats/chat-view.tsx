import {
  ArrowDown,
  CaretLeft,
  Check,
  Checks,
  PaperPlaneRight,
  WarningCircle,
} from "@phosphor-icons/react";
import type { ChatSummary, Me } from "@sonora/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../../lib/cx";
import { clock, dayLabel, shortClock } from "../../lib/format";
import { Avatar } from "../../ui/avatar";
import { meQuery } from "../auth/queries";
import { announceTyping, useTypingIn } from "../realtime/typing";
import { EmptyState } from "../shell/empty-state";
import { presenceLabel } from "../social/friend-list";
import { chatTitle, GroupAvatar, peerOf } from "./chat-list";
import {
  chatsQuery,
  draftMessage,
  type LocalMessage,
  messagesQuery,
  useMarkRead,
  useSendMessage,
} from "./queries";

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
      <Composer chat={chat} me={me} />
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
  const q = useInfiniteQuery(messagesQuery(chat.id));
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);
  const markRead = useMarkRead(chat.id, me.id);

  const msgs = useMemo(
    () => (q.data ? [...q.data.pages].reverse().flatMap((p) => p.messages) : []),
    [q.data],
  );

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
    peer && last?.senderId === me.id && !last.local
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
                item={it}
                chat={chat}
                me={me}
                receipt={it.msg === last ? receipt : undefined}
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

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\s)+$/u;
const isBigEmoji = (s: string) => EMOJI_ONLY.test(s) && [...s.replace(/\s/g, "")].length <= 6;

type Receipt = "sent" | "seen";

function MessageLine({
  item,
  chat,
  me,
  receipt,
}: {
  item: Extract<Item, { kind: "msg" }>;
  receipt?: Receipt;
  chat: ChatSummary;
  me: Me;
}) {
  const { msg, head } = item;
  const sender = chat.members.find((u) => u.id === msg.senderId);
  const send = useSendMessage(chat.id, me.id);
  const fresh = Date.now() - msg.createdAt < 4000; // only brand-new lines animate in

  return (
    <m.div
      initial={fresh ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cx(
        "group relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 rounded-lg px-2.5 transition-colors duration-100 hover:bg-hover",
        head ? "mt-2 pt-1.5 pb-0.5" : "py-0.5",
      )}
    >
      {head ? (
        <Avatar seed={sender?.avatarSeed ?? msg.senderId} size={40} className="mt-0.5" />
      ) : (
        <time
          title={clock(msg.createdAt)}
          className="pt-[3px] text-right text-[10.5px] whitespace-nowrap text-ash tabular-nums opacity-0 group-hover:opacity-100"
        >
          {shortClock(msg.createdAt)}
        </time>
      )}
      <div className="min-w-0">
        {head && (
          <p className="flex items-baseline gap-2">
            <span className="text-[14.5px] font-semibold">{sender?.username ?? "someone"}</span>
            <time className="text-[11.5px] text-ash tabular-nums">{clock(msg.createdAt)}</time>
          </p>
        )}
        <p
          className={cx(
            "max-w-[68ch] break-words whitespace-pre-wrap",
            isBigEmoji(msg.body) ? "text-[34px] leading-tight" : "text-[15px]",
            msg.local === "sending" && "text-ash",
            msg.local === "failed" && "text-red",
          )}
        >
          {msg.body}
        </p>
        {receipt && <ReceiptLine receipt={receipt} />}
        {msg.local === "failed" && (
          <p className="flex items-center gap-1.5 text-[12px] text-red">
            <WarningCircle aria-hidden /> Not sent ·
            <button
              type="button"
              onClick={() => send.mutate(msg)}
              className="font-medium underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </p>
        )}
      </div>
    </m.div>
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

const DRAFT = (chatId: string) => `sonora-draft:${chatId}`;

function Composer({ chat, me }: { chat: ChatSummary; me: Me }) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const send = useSendMessage(chat.id, me.id);
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(DRAFT(chat.id)) ?? "";
    } catch {
      return "";
    }
  });

  // Grow with content up to a cap; persist the draft per chat.
  useEffect(() => {
    const el = ta.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }
    try {
      if (text) localStorage.setItem(DRAFT(chat.id), text);
      else localStorage.removeItem(DRAFT(chat.id));
    } catch {}
  }, [text, chat.id]);

  useEffect(() => {
    // Phones: don't pop the keyboard on open. Desktop: ready to type.
    if (matchMedia("(pointer: fine)").matches) ta.current?.focus({ preventScroll: true });
  }, []);

  function submit() {
    const body = text.trim();
    if (!body) return;
    send.mutate(draftMessage(chat.id, me.id, body));
    setText("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  const ready = !!text.trim();
  const peer = peerOf(chat, me.id);
  return (
    <div className="px-3 pt-1 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="flex items-end gap-1 rounded-[20px] bg-panel p-1.5 shadow-[inset_0_0_0_1px_var(--line)] transition-shadow duration-150 focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--cyan)_60%,var(--line)),0_0_0_3px_color-mix(in_oklab,var(--cyan)_12%,transparent)]">
        <textarea
          ref={ta}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value) announceTyping(chat.id);
          }}
          onKeyDown={onKeyDown}
          maxLength={4000}
          placeholder={`Message ${peer ? peer.username : (chat.name ?? "the group")}`}
          aria-label="Message"
          className="max-h-[180px] min-h-8 flex-1 resize-none bg-transparent px-2.5 py-[5px] leading-[1.45] outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!ready}
          aria-label="Send message"
          className={cx(
            "grid size-8 shrink-0 place-items-center rounded-full text-base transition-[background-color,color,scale] duration-150 enabled:active:scale-[0.96]",
            ready ? "bg-ink text-on-ink" : "bg-inset text-ash",
          )}
        >
          <PaperPlaneRight weight="fill" />
        </button>
      </div>
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

/** Sits under the message text, so it reads as part of the message. Sent → Seen cross-fades. */
function ReceiptLine({ receipt }: { receipt: Receipt }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.p
        key={receipt}
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ash"
      >
        {receipt === "seen" ? (
          <Checks weight="bold" className="text-cyan-ink" />
        ) : (
          <Check weight="bold" />
        )}
        {receipt === "seen" ? "Seen" : "Sent"}
      </m.p>
    </AnimatePresence>
  );
}
