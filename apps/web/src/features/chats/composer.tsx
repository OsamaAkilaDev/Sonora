import {
  ArrowBendUpLeft,
  File,
  PaperPlaneRight,
  PencilSimple,
  Plus,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { type Attachment, type ChatSummary, MAX_ATTACHMENTS, type Me } from "@sonora/shared";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../lib/cx";
import { play } from "../../lib/sound";
import { toast } from "../../ui/toast";
import { announceTyping } from "../realtime/typing";
import { peerOf } from "./chat-list";
import { setComposeMode, useComposeMode } from "./compose-store";
import { cache, draftMessage, type LocalMessage, useEditMessage, useSendMessage } from "./queries";
import { checkFile, uploadFile } from "./upload";

type Pending = {
  key: string;
  file: File;
  preview: string | null;
  progress: number;
  attachment?: Attachment;
  error?: string;
  abort: AbortController;
};

const DRAFT = (chatId: string) => `sonora-draft:${chatId}`;
const readDraft = (chatId: string) => {
  try {
    return localStorage.getItem(DRAFT(chatId)) ?? "";
  } catch {
    return "";
  }
};

export function Composer({
  chat,
  me,
  messages,
}: {
  chat: ChatSummary;
  me: Me;
  messages: LocalMessage[];
}) {
  const qc = useQueryClient();
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const send = useSendMessage(chat.id, me.id);
  const edit = useEditMessage(chat.id);
  const mode = useComposeMode(chat.id);
  const target = mode ? cache.getMessage(qc, chat.id, mode.messageId) : undefined;
  const [text, setText] = useState(() => readDraft(chat.id));
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const draftBeforeEdit = useRef("");

  // Grow with content up to a cap; persist the draft (not while editing another message).
  useEffect(() => {
    const el = ta.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }
    if (mode?.kind === "edit") return;
    try {
      if (text) localStorage.setItem(DRAFT(chat.id), text);
      else localStorage.removeItem(DRAFT(chat.id));
    } catch {}
  }, [text, chat.id, mode?.kind]);

  // Entering edit: load the message text (and remember the draft to restore after).
  const editingId = mode?.kind === "edit" ? mode.messageId : null;
  useEffect(() => {
    if (!editingId) return;
    const msg = cache.getMessage(qc, chat.id, editingId);
    if (!msg) return;
    draftBeforeEdit.current = readDraft(chat.id);
    setText(msg.body);
    requestAnimationFrame(() => {
      const el = ta.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    });
  }, [editingId, chat.id, qc]);

  // Replying focuses the box so you can just type.
  useEffect(() => {
    if (mode?.kind === "reply") ta.current?.focus();
  }, [mode]);

  useEffect(() => {
    // Phones: don't pop the keyboard on open. Desktop: ready to type.
    if (matchMedia("(pointer: fine)").matches) ta.current?.focus({ preventScroll: true });
  }, []);

  // Free image previews when the chat closes (removal and send free their own).
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  useEffect(
    () => () => {
      for (const p of pendingRef.current) if (p.preview) URL.revokeObjectURL(p.preview);
    },
    [],
  );

  function cancelMode() {
    if (mode?.kind === "edit") setText(draftBeforeEdit.current);
    setComposeMode(chat.id, null);
  }

  function addFiles(files: FileList | File[]) {
    const list = [...files];
    const room = MAX_ATTACHMENTS - pending.length;
    if (list.length > room) toast.add({ title: `Up to ${MAX_ATTACHMENTS} files per message` });
    for (const file of list.slice(0, Math.max(0, room))) {
      const problem = checkFile(file);
      if (problem) {
        toast.add({ title: "Can't attach that", description: problem });
        play("error");
        continue;
      }
      const item: Pending = {
        key: crypto.randomUUID(),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        progress: 0,
        abort: new AbortController(),
      };
      setPending((p) => [...p, item]);
      play("pop");
      const patch = (u: Partial<Pending>) =>
        setPending((p) => p.map((x) => (x.key === item.key ? { ...x, ...u } : x)));
      uploadFile(chat.id, file, (progress) => patch({ progress }), item.abort.signal)
        .then((attachment) => patch({ attachment, progress: 1 }))
        .catch((e: Error) => patch({ error: e.message }));
    }
  }

  function removePending(key: string) {
    play("unpop");
    const item = pending.find((x) => x.key === key);
    item?.abort.abort();
    if (item?.preview) URL.revokeObjectURL(item.preview);
    setPending((p) => p.filter((x) => x.key !== key));
  }

  const uploading = pending.some((p) => !p.attachment && !p.error);
  const ready = !uploading && (!!text.trim() || pending.some((p) => p.attachment));

  function submit() {
    const body = text.trim();
    if (mode?.kind === "edit") {
      if (body && target && body !== target.body) edit.mutate({ id: target.id, body });
      setText(draftBeforeEdit.current);
      setComposeMode(chat.id, null);
      return;
    }
    if (!ready) return;
    const attachments = pending.flatMap((p) => (p.attachment ? [p.attachment] : []));
    send.mutate(
      draftMessage(chat.id, me.id, body, {
        replyToId: mode?.kind === "reply" ? mode.messageId : null,
        attachments,
      }),
    );
    setText("");
    // The sent message shows server URLs; local previews can go.
    for (const p of pending) if (p.preview) URL.revokeObjectURL(p.preview);
    setPending([]);
    setComposeMode(chat.id, null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape" && mode) {
      e.preventDefault();
      cancelMode();
    } else if (e.key === "ArrowUp" && !text && !mode) {
      // ↑ in an empty box edits your last message, like most chat apps.
      const last = [...messages]
        .reverse()
        .find((x) => x.senderId === me.id && !x.local && !x.deletedAt && x.body);
      if (last) {
        e.preventDefault();
        setComposeMode(chat.id, { kind: "edit", messageId: last.id });
      }
    }
  }

  function onPaste(e: ClipboardEvent) {
    if (mode?.kind === "edit") return;
    const files = [...e.clipboardData.files];
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (mode?.kind !== "edit" && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  const peer = peerOf(chat, me.id);
  const targetAuthor = target && chat.members.find((u) => u.id === target.senderId)?.username;

  return (
    <section
      aria-label="Write a message"
      className="px-3 pt-1 pb-[max(12px,env(safe-area-inset-bottom))]"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDragging(false)}
      onDrop={onDrop}
    >
      <AnimatePresence initial={false}>
        {mode && target && (
          <m.div
            key={`${mode.kind}-${target.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 pb-1.5 text-[12.5px] text-slate">
              {mode.kind === "reply" ? (
                <ArrowBendUpLeft className="shrink-0" />
              ) : (
                <PencilSimple className="shrink-0" />
              )}
              <span className="shrink-0">{mode.kind === "reply" ? "Replying to" : "Editing"}</span>
              {mode.kind === "reply" && (
                <span className="shrink-0 font-medium text-ink-2">{targetAuthor}</span>
              )}
              <span className="min-w-0 truncate text-ash">
                {mode.kind === "reply" ? target.body || "Attachment" : "Esc to cancel"}
              </span>
              <button
                type="button"
                onClick={cancelMode}
                aria-label={mode.kind === "reply" ? "Cancel reply" : "Cancel edit"}
                className="ml-auto grid size-6 shrink-0 place-items-center rounded-full hover:bg-hover hover:text-ink"
              >
                <X />
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <div
        className={cx(
          "rounded-[20px] bg-panel p-1.5 transition-shadow duration-150",
          dragging
            ? "shadow-[inset_0_0_0_2px_var(--cyan)]"
            : "shadow-[inset_0_0_0_1px_var(--line)] focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--cyan)_60%,var(--line)),0_0_0_3px_color-mix(in_oklab,var(--cyan)_12%,transparent)]",
        )}
      >
        {pending.length > 0 && (
          <ul className="flex gap-2 overflow-x-auto px-1 pt-1 pb-2">
            {pending.map((p) => (
              <PendingChip key={p.key} item={p} onRemove={() => removePending(p.key)} />
            ))}
          </ul>
        )}
        <div className="flex items-end gap-1">
          <button
            type="button"
            aria-label="Attach files"
            disabled={mode?.kind === "edit"}
            onClick={() => fileInput.current?.click()}
            className="grid size-8 shrink-0 place-items-center rounded-full text-lg text-slate transition-colors duration-150 hover:bg-hover hover:text-ink disabled:opacity-40"
          >
            <Plus />
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <textarea
            ref={ta}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value && mode?.kind !== "edit") announceTyping(chat.id);
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            maxLength={4000}
            placeholder={
              mode?.kind === "edit"
                ? "Edit your message"
                : `Message ${peer ? peer.username : (chat.name ?? "the group")}`
            }
            aria-label="Message"
            className="max-h-[180px] min-h-8 flex-1 resize-none bg-transparent px-1.5 py-[5px] leading-[1.45] outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={mode?.kind === "edit" ? !text.trim() : !ready}
            aria-label={mode?.kind === "edit" ? "Save edit" : "Send message"}
            className={cx(
              "grid size-8 shrink-0 place-items-center rounded-full text-base transition-[background-color,color,scale] duration-150 enabled:active:scale-[0.96]",
              (mode?.kind === "edit" ? !!text.trim() : ready)
                ? "bg-ink text-on-ink"
                : "bg-inset text-ash",
            )}
          >
            <PaperPlaneRight weight="fill" />
          </button>
        </div>
      </div>
    </section>
  );
}

/** Upload chip: image thumb or file glyph, with a progress ring until stored. */
function PendingChip({ item, onRemove }: { item: Pending; onRemove: () => void }) {
  const done = !!item.attachment;
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <li className="relative shrink-0">
      <div
        title={item.error ?? item.file.name}
        className={cx(
          "relative grid size-16 place-items-center overflow-hidden rounded-xl bg-inset",
          item.error && "shadow-[inset_0_0_0_1.5px_var(--red)]",
        )}
      >
        {item.preview ? (
          <img src={item.preview} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid justify-items-center gap-0.5 px-1 text-center">
            <File className="text-xl text-ink-2" />
            <span className="w-14 truncate text-[10px] text-slate">{item.file.name}</span>
          </span>
        )}
        {!done && !item.error && (
          <span className="absolute inset-0 grid place-items-center bg-black/35">
            <svg viewBox="0 0 32 32" className="size-8 -rotate-90" aria-label="Uploading">
              <circle
                cx="16"
                cy="16"
                r={r}
                fill="none"
                stroke="rgb(255 255 255 / 0.3)"
                strokeWidth="3"
              />
              <circle
                cx="16"
                cy="16"
                r={r}
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - item.progress)}
                className="transition-[stroke-dashoffset] duration-150"
              />
            </svg>
          </span>
        )}
        {item.error && (
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-xl text-white">
            <WarningCircle />
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.file.name}`}
        className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink text-[11px] text-on-ink shadow-btn"
      >
        <X weight="bold" />
      </button>
    </li>
  );
}
