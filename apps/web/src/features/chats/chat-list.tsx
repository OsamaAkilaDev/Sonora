import type { ChatSummary, Me, Message } from "@sonora/shared";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import * as m from "motion/react-m";
import { cx } from "../../lib/cx";
import { listTime } from "../../lib/format";
import { usePhone } from "../../lib/phone";
import { Avatar } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { meQuery } from "../auth/queries";
import { useCalls } from "../calls/store";
import { useTypingIn } from "../realtime/typing";
import { EmptyState } from "../shell/empty-state";
import { chatsQuery } from "./queries";

/** The other person in a DM, or null for groups. */
export const peerOf = (chat: ChatSummary, meId: string) =>
  chat.kind === "dm" ? (chat.members.find((u) => u.id !== meId) ?? null) : null;

export const chatTitle = (chat: ChatSummary, meId: string) =>
  peerOf(chat, meId)?.username ??
  chat.name ??
  chat.members
    .filter((u) => u.id !== meId)
    .map((u) => u.username)
    .join(", ");

export function ChatList({ onFindFriends }: { onFindFriends: () => void }) {
  const me = useQuery(meQuery).data;
  const { data, isPending } = useQuery(chatsQuery);
  const { chatId } = useParams({ strict: false });

  if (isPending) return <RowSkeletons />;
  if (!me || !data?.length)
    return (
      <EmptyState
        title="No chats yet"
        body="Add a friend and your conversations will show up here."
        action={
          <Button variant="ghost" size="sm" onClick={onFindFriends}>
            Find friends
          </Button>
        }
      />
    );

  return (
    <ul className="flex flex-col gap-0.5">
      {data.map((chat) => (
        <m.li
          key={chat.id}
          layout="position"
          transition={{ type: "spring", duration: 0.38, bounce: 0 }}
        >
          <ChatRow chat={chat} me={me} active={chat.id === chatId} />
        </m.li>
      ))}
    </ul>
  );
}

function ChatRow({ chat, me, active }: { chat: ChatSummary; me: Me; active: boolean }) {
  const peer = peerOf(chat, me.id);
  const typing = useTypingIn(chat.id);
  const calling = useCalls((s) => !!s.byChat[chat.id]);
  const size = usePhone() ? 48 : 40;
  const last = chat.lastMessage;
  const unread = chat.unread > 0;
  const sender =
    last &&
    (last.senderId === me.id
      ? "You: "
      : chat.kind === "group"
        ? `${nameOf(chat, last.senderId)}: `
        : "");

  return (
    <Link
      to="/c/$chatId"
      params={{ chatId: chat.id }}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-150 max-md:py-3 max-md:active:bg-hover",
        active ? "bg-inset" : "hover:bg-hover",
      )}
    >
      {peer ? (
        <Avatar seed={peer.avatarSeed} size={size} status={peer.presence} />
      ) : (
        <GroupAvatar chat={chat} meId={me.id} size={size} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className={cx(
              "min-w-0 flex-1 truncate text-sm max-md:text-base",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {chatTitle(chat, me.id)}
          </span>
          {last && (
            <span
              className={cx(
                "shrink-0 text-[11.5px] tabular-nums",
                unread ? "font-medium text-cyan-ink" : "text-ash",
              )}
            >
              {listTime(last.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cx(
              "min-w-0 flex-1 truncate text-[13px] max-md:text-sm",
              calling || typing.length ? "text-cyan-ink" : unread ? "text-ink-2" : "text-slate",
            )}
          >
            {calling
              ? "Call in progress"
              : typing.length
                ? "typing…"
                : last
                  ? sender + previewText(last)
                  : "Say hello"}
          </span>
          {unread && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan px-1.5 text-[11.5px] leading-none font-semibold text-white tabular-nums">
              {chat.unread > 99 ? "99+" : chat.unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** What a message looks like in one line of the chat list. */
export function previewText(m: Message) {
  if (m.deletedAt) return "Message deleted";
  if (m.body) return m.body;
  const images = m.attachments.filter((a) => a.mime.startsWith("image/")).length;
  if (images === m.attachments.length) return images === 1 ? "Photo" : `${images} photos`;
  return m.attachments.length === 1
    ? (m.attachments[0]?.name ?? "File")
    : `${m.attachments.length} files`;
}

const nameOf = (chat: ChatSummary, id: string) =>
  chat.members.find((u) => u.id === id)?.username ?? "someone";

export function GroupAvatar({
  chat,
  meId,
  size = 40,
}: {
  chat: ChatSummary;
  meId: string;
  size?: number;
}) {
  const [a, b] = chat.members.filter((u) => u.id !== meId);
  const s = Math.round(size * 0.68);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {a && (
        <span className="absolute top-0 left-0">
          <Avatar seed={a.avatarSeed} size={s} />
        </span>
      )}
      {b && (
        <span className="absolute right-0 bottom-0 rounded-full ring-2 ring-panel">
          <Avatar seed={b.avatarSeed} size={s} />
        </span>
      )}
    </span>
  );
}

export function RowSkeletons({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden className="grid gap-0.5">
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <div key={i} className="flex items-center gap-3 px-2.5 py-2">
          <span className="skeleton size-10 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-2">
            <span className="skeleton h-[11px]" style={{ width: `${55 + ((i * 37) % 35)}%` }} />
            <span className="skeleton h-2.5" style={{ width: `${70 + ((i * 23) % 25)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
