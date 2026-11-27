import { AlertDialog } from "@base-ui/react/alert-dialog";
import { ContextMenu } from "@base-ui/react/context-menu";
import { Dialog } from "@base-ui/react/dialog";
import { Popover } from "@base-ui/react/popover";
import {
  ArrowBendUpLeft,
  Check,
  Checks,
  Copy,
  DownloadSimple,
  File,
  FilePdf,
  FileText,
  FileZip,
  PencilSimple,
  Smiley,
  Trash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type { Attachment, ChatSummary, Me } from "@sonora/shared";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { type ReactNode, useState } from "react";
import { cx } from "../../lib/cx";
import { clock, shortClock } from "../../lib/format";
import { Avatar } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { toast } from "../../ui/toast";
import { setComposeMode } from "./compose-store";
import { EMOJI_GROUPS, QUICK_REACTIONS } from "./emoji";
import { type LocalMessage, useDeleteMessage, useSendMessage, useToggleReaction } from "./queries";
import { formatBytes } from "./upload";

export type Receipt = "sent" | "seen";
export const messageDomId = (id: string) => `msg-${id}`;

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\s)+$/u;
const isBigEmoji = (s: string) => EMOJI_ONLY.test(s) && [...s.replace(/\s/g, "")].length <= 6;

type Props = {
  msg: LocalMessage;
  head: boolean;
  chat: ChatSummary;
  me: Me;
  receipt?: Receipt;
  /** The message this one replies to, when it's loaded. */
  replyTo?: LocalMessage;
};

export function MessageLine({ msg, head, chat, me, receipt, replyTo }: Props) {
  const sender = chat.members.find((u) => u.id === msg.senderId);
  const mine = msg.senderId === me.id;
  const deleted = !!msg.deletedAt;
  const actionable = !msg.local && !deleted;
  const fresh = Date.now() - msg.createdAt < 4000; // only brand-new lines animate in
  const [confirmDelete, setConfirmDelete] = useState(false);
  const react = useToggleReaction(chat.id, me.id);
  const remove = useDeleteMessage(chat.id);
  const send = useSendMessage(chat.id, me.id);

  const actions = {
    react: (emoji: string) => react.mutate({ id: msg.id, emoji }),
    reply: () => setComposeMode(chat.id, { kind: "reply", messageId: msg.id }),
    edit: () => setComposeMode(chat.id, { kind: "edit", messageId: msg.id }),
    copy: () =>
      navigator.clipboard
        .writeText(msg.body)
        .then(() =>
          toast.add({ title: "Copied", description: "Message text is on your clipboard." }),
        ),
    delete: () => setConfirmDelete(true),
  };

  return (
    <ContextMenu.Root disabled={!actionable}>
      <ContextMenu.Trigger
        render={
          <m.div
            id={messageDomId(msg.id)}
            initial={fresh ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cx(
              "group relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 rounded-lg px-2.5 transition-colors duration-100 hover:bg-hover",
              "data-popup-open:bg-hover data-[flash]:bg-cyan-wash",
              head ? "mt-2 pt-1.5 pb-0.5" : "py-0.5",
            )}
          />
        }
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
          {msg.replyToId && !deleted && <ReplyQuote chat={chat} target={replyTo} />}
          {deleted ? (
            <p className="text-[14px] text-ash italic">Message deleted</p>
          ) : (
            msg.body && (
              <p
                className={cx(
                  "max-w-[68ch] break-words whitespace-pre-wrap",
                  isBigEmoji(msg.body) ? "text-[34px] leading-tight" : "text-[15px]",
                  msg.local === "sending" && "text-ash",
                  msg.local === "failed" && "text-red",
                )}
              >
                {msg.body}
                {msg.editedAt && <span className="ml-1.5 text-[11.5px] text-ash">(edited)</span>}
              </p>
            )
          )}
          {msg.attachments.length > 0 && <Attachments items={msg.attachments} />}
          {msg.reactions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {msg.reactions.map((r) => {
                const on = r.userIds.includes(me.id);
                const names = r.userIds
                  .map((id) =>
                    id === me.id ? "you" : chat.members.find((u) => u.id === id)?.username,
                  )
                  .filter(Boolean)
                  .join(", ");
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    title={`${names} reacted with ${r.emoji}`}
                    aria-pressed={on}
                    onClick={() => actions.react(r.emoji)}
                    className={cx(
                      "inline-flex h-[26px] items-center gap-1.5 rounded-full px-2 text-[13px] transition-[background-color,box-shadow,scale] duration-150 active:scale-[0.96]",
                      on
                        ? "bg-cyan-wash shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--cyan)_45%,transparent)]"
                        : "bg-inset hover:shadow-[inset_0_0_0_1px_var(--line)]",
                    )}
                  >
                    <span className="leading-none">{r.emoji}</span>
                    <span
                      className={cx(
                        "text-[12px] leading-none font-medium tabular-nums",
                        on ? "text-cyan-ink" : "text-slate",
                      )}
                    >
                      {r.userIds.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
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
        {actionable && <Toolbar mine={mine} hasText={!!msg.body} actions={actions} />}
      </ContextMenu.Trigger>

      {/* Right-click on desktop, long-press on touch: the same actions as the toolbar. */}
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="z-50 outline-none">
          <ContextMenu.Popup className="min-w-[210px] origin-(--transform-origin) rounded-[14px] bg-panel p-[5px] shadow-pop outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.99] data-ending-style:opacity-0">
            <div className="flex justify-between gap-0.5 px-1 pt-0.5 pb-1.5">
              {QUICK_REACTIONS.map((e) => (
                <ContextMenu.Item
                  key={e}
                  onClick={() => actions.react(e)}
                  aria-label={`React with ${e}`}
                  className="grid size-8 cursor-pointer place-items-center rounded-full text-lg outline-none data-highlighted:bg-hover"
                >
                  {e}
                </ContextMenu.Item>
              ))}
            </div>
            <ContextMenu.Separator className="mx-2 mb-1 h-px bg-line" />
            <CtxItem onClick={actions.reply} icon={<ArrowBendUpLeft />}>
              Reply
            </CtxItem>
            {mine && msg.body && (
              <CtxItem onClick={actions.edit} icon={<PencilSimple />}>
                Edit
              </CtxItem>
            )}
            {msg.body && (
              <CtxItem onClick={actions.copy} icon={<Copy />}>
                Copy text
              </CtxItem>
            )}
            {mine && (
              <CtxItem onClick={actions.delete} icon={<Trash />} danger>
                Delete
              </CtxItem>
            )}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>

      <ConfirmDelete
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={() => remove.mutate({ id: msg.id })}
      />
    </ContextMenu.Root>
  );
}

function CtxItem({
  children,
  icon,
  onClick,
  danger,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <ContextMenu.Item
      onClick={onClick}
      className={cx(
        "flex h-[34px] cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px] outline-none select-none data-highlighted:bg-hover [&>svg]:text-base",
        danger ? "text-red" : "text-ink",
      )}
    >
      {icon}
      {children}
    </ContextMenu.Item>
  );
}

type Actions = {
  react: (e: string) => void;
  reply: () => void;
  edit: () => void;
  delete: () => void;
};

/** Hover toolbar (pointer devices). Touch uses long-press instead, so it's hidden there. */
function Toolbar({
  mine,
  hasText,
  actions,
}: {
  mine: boolean;
  hasText: boolean;
  actions: Actions;
}) {
  const btn =
    "grid size-7 place-items-center rounded-full text-base text-slate transition-colors duration-100 hover:bg-hover hover:text-ink";
  return (
    <div className="absolute -top-3.5 right-3 z-10 flex gap-px rounded-full bg-panel p-[3px] opacity-0 shadow-pop transition-opacity duration-100 group-hover:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 pointer-coarse:hidden">
      {QUICK_REACTIONS.slice(0, 3).map((e) => (
        <button
          key={e}
          type="button"
          aria-label={`React with ${e}`}
          onClick={() => actions.react(e)}
          className="grid size-7 place-items-center rounded-full text-[15px] hover:bg-hover"
        >
          {e}
        </button>
      ))}
      <EmojiPicker onPick={actions.react}>
        <Smiley />
      </EmojiPicker>
      <button
        type="button"
        aria-label="Reply"
        title="Reply"
        onClick={actions.reply}
        className={btn}
      >
        <ArrowBendUpLeft />
      </button>
      {mine && hasText && (
        <button type="button" aria-label="Edit" title="Edit" onClick={actions.edit} className={btn}>
          <PencilSimple />
        </button>
      )}
      {mine && (
        <button
          type="button"
          aria-label="Delete"
          title="Delete"
          onClick={actions.delete}
          className={cx(btn, "hover:text-red")}
        >
          <Trash />
        </button>
      )}
    </div>
  );
}

export function EmojiPicker({
  onPick,
  children,
}: {
  onPick: (e: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label="Add reaction"
        className="grid size-7 place-items-center rounded-full text-base text-slate hover:bg-hover hover:text-ink data-popup-open:bg-hover"
      >
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end" className="z-50">
          <Popover.Popup className="w-[284px] origin-(--transform-origin) rounded-[14px] bg-panel p-2 shadow-pop outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.99] data-ending-style:opacity-0">
            {EMOJI_GROUPS.map((g) => (
              <section key={g.label} className="pb-1">
                <h4 className="px-1.5 pt-1 pb-1 text-[11.5px] font-medium tracking-[0.25px] text-ash">
                  {g.label}
                </h4>
                <div className="grid grid-cols-8">
                  {g.emoji.map((e) => (
                    <button
                      key={e}
                      type="button"
                      aria-label={e}
                      onClick={() => {
                        onPick(e);
                        setOpen(false);
                      }}
                      className="grid size-8 place-items-center rounded-lg text-lg transition-[background-color,scale] duration-100 hover:bg-hover active:scale-[0.96]"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** "↱ layla: the original text" — click to jump to it. */
function ReplyQuote({ chat, target }: { chat: ChatSummary; target?: LocalMessage }) {
  const author = target && chat.members.find((u) => u.id === target.senderId)?.username;
  const text = !target
    ? "Original message"
    : target.deletedAt
      ? "Message deleted"
      : target.body || (target.attachments.length ? "Attachment" : "");
  return (
    <button
      type="button"
      disabled={!target}
      onClick={() => target && jumpTo(target.id)}
      className="mb-0.5 flex max-w-full items-center gap-1.5 text-left text-[12.5px] text-slate enabled:hover:text-ink"
    >
      <ArrowBendUpLeft className="shrink-0 -scale-x-100 text-ash" />
      {author && <span className="shrink-0 font-medium text-ink-2">{author}</span>}
      <span className="truncate">{text}</span>
    </button>
  );
}

function jumpTo(id: string) {
  const el = document.getElementById(messageDomId(id));
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.setAttribute("data-flash", "");
  setTimeout(() => el.removeAttribute("data-flash"), 1200);
}

const fileIcon = (mime: string) =>
  mime === "application/pdf"
    ? FilePdf
    : mime === "application/zip"
      ? FileZip
      : mime.startsWith("text/")
        ? FileText
        : File;

function Attachments({ items }: { items: Attachment[] }) {
  const images = items.filter((a) => a.mime.startsWith("image/"));
  const media = items.filter((a) => a.mime.startsWith("video/") || a.mime.startsWith("audio/"));
  const files = items.filter((a) => !images.includes(a) && !media.includes(a));
  const [viewing, setViewing] = useState<Attachment | null>(null);
  const single = images.length === 1 ? images[0] : undefined;

  return (
    <div className="mt-1 grid max-w-[min(420px,100%)] gap-1.5">
      {single ? (
        <button
          type="button"
          onClick={() => setViewing(single)}
          aria-label={`Open ${single.name}`}
          className="w-fit cursor-zoom-in overflow-hidden rounded-xl bg-inset"
        >
          <img
            src={single.url}
            alt={single.name}
            width={single.width ?? undefined}
            height={single.height ?? undefined}
            loading="lazy"
            style={{
              aspectRatio:
                single.width && single.height ? `${single.width} / ${single.height}` : undefined,
            }}
            className="max-h-[360px] w-auto max-w-full object-cover"
          />
        </button>
      ) : (
        images.length > 1 && (
          <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
            {images.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setViewing(a)}
                aria-label={`Open ${a.name}`}
                className="aspect-square cursor-zoom-in bg-inset"
              >
                <img src={a.url} alt={a.name} loading="lazy" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )
      )}
      {media.map((a) =>
        a.mime.startsWith("video/") ? (
          // biome-ignore lint/a11y/useMediaCaption: user-shared clips have no caption track
          <video
            key={a.id}
            src={a.url}
            controls
            preload="metadata"
            className="max-h-[360px] rounded-xl bg-inset"
          />
        ) : (
          // biome-ignore lint/a11y/useMediaCaption: user-shared audio has no caption track
          <audio key={a.id} src={a.url} controls preload="metadata" className="w-full" />
        ),
      )}
      {files.map((a) => {
        const I = fileIcon(a.mime);
        return (
          <a
            key={a.id}
            href={a.url}
            download={a.name}
            className="flex items-center gap-3 rounded-xl bg-inset p-2.5 pr-3 transition-colors duration-150 hover:bg-hover"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-panel text-lg text-ink-2">
              <I />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{a.name}</span>
              <span className="block text-[12px] text-slate">{formatBytes(a.size)}</span>
            </span>
            <DownloadSimple aria-hidden className="text-lg text-slate" />
          </a>
        );
      })}
      <Lightbox item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function Lightbox({ item, onClose }: { item: Attachment | null; onClose: () => void }) {
  return (
    <Dialog.Root open={!!item} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/85 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 grid place-items-center p-4 outline-none transition-[opacity,scale] duration-250 ease-out-quint data-ending-style:scale-[0.99] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
          <Dialog.Title className="sr-only">{item?.name}</Dialog.Title>
          {item && (
            <img
              src={item.url}
              alt={item.name}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          )}
          <div className="absolute top-[max(12px,env(safe-area-inset-top))] right-3 flex gap-1.5">
            {item && (
              <a
                href={item.url}
                download={item.name}
                aria-label="Download"
                className="grid size-9 place-items-center rounded-full bg-white/10 text-lg text-white hover:bg-white/20"
              >
                <DownloadSimple />
              </a>
            )}
            <Dialog.Close
              aria-label="Close"
              className="grid size-9 place-items-center rounded-full bg-white/10 text-lg text-white hover:bg-white/20"
            >
              <X />
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ConfirmDelete({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-(--scrim) transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 grid w-[min(380px,calc(100vw-24px))] -translate-1/2 gap-4 rounded-[18px] bg-panel p-5 shadow-pop outline-none transition-[opacity,scale] duration-300 ease-out-quint data-ending-style:scale-[0.99] data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
          <div>
            <AlertDialog.Title className="text-lg font-semibold tracking-[-0.2px]">
              Delete this message?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-1 text-sm text-slate">
              It's removed for everyone in the chat. This can't be undone.
            </AlertDialog.Description>
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="ghost" />}>Cancel</AlertDialog.Close>
            <Button
              variant="danger"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
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
