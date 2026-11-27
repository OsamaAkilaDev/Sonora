import { Dialog } from "@base-ui/react/dialog";
import { ChatsCircle, GearSix, type Icon, MagnifyingGlass } from "@phosphor-icons/react";
import type { SearchHit } from "@sonora/shared";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { create } from "zustand";
import { api, unwrap } from "../../lib/api";
import { cx } from "../../lib/cx";
import { listTime } from "../../lib/format";
import { Avatar } from "../../ui/avatar";
import { meQuery } from "../auth/queries";
import { chatTitle, GroupAvatar, peerOf, previewText } from "../chats/chat-list";
import { messageDomId } from "../chats/message-line";
import { chatsQuery, useOpenDm } from "../chats/queries";
import { socialQuery } from "../social/queries";

export const useSwitcher = create<{ open: boolean; set: (open: boolean) => void }>((set) => ({
  open: false,
  set: (open) => set({ open }),
}));

type Item = {
  key: string;
  section: string;
  icon: ReactNode;
  title: string;
  meta?: string;
  run: () => void;
};

/** Ctrl/⌘+K: jump to any chat or friend, run an action, or search messages. */
export function Switcher() {
  const { open, set } = useSwitcher();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        set(!useSwitcher.getState().open);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [set]);

  return (
    <Dialog.Root open={open} onOpenChange={set}>
      <Dialog.Portal>
        {/* Frequent surface: opens instantly, only the close animates. */}
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-(--scrim) transition-opacity duration-150 data-ending-style:opacity-0" />
        <Dialog.Popup
          initialFocus={input}
          className="fixed top-[12vh] left-1/2 z-50 w-[min(580px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[16px] bg-panel shadow-pop outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.99] data-ending-style:opacity-0"
        >
          <Dialog.Title className="sr-only">Jump to</Dialog.Title>
          {open && <Body close={() => set(false)} inputRef={input} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Body({
  close,
  inputRef,
}: {
  close: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const navigate = useNavigate();
  const openDm = useOpenDm();
  const me = useQuery(meQuery).data;
  const chats = useQuery(chatsQuery).data ?? [];
  const friends = useQuery(socialQuery).data?.friends ?? [];
  const [q, setQ] = useState("");
  // Focus synchronously on open, so keys typed right after Ctrl+K aren't lost.
  useLayoutEffect(() => inputRef.current?.focus(), [inputRef]);
  const [sel, setSel] = useState(0);
  const term = q.trim().toLowerCase();
  const searchTerm = useDeferredValue(term);

  const search = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: () => unwrap(api.search.$get({ query: { q: searchTerm } })),
    enabled: searchTerm.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const go = (chatId: string, messageId?: string) => {
    close();
    navigate({ to: "/c/$chatId", params: { chatId } });
    if (messageId)
      // Give the chat a moment to render its latest page, then jump if the message is there.
      setTimeout(
        () => document.getElementById(messageDomId(messageId))?.scrollIntoView({ block: "center" }),
        450,
      );
  };

  // Rebuilt each render: a few dozen items, cheaper than memo bookkeeping.
  const items: Item[] = (() => {
    if (!me) return [];
    const match = (s: string) => !term || s.toLowerCase().includes(term);
    const out: Item[] = [];
    for (const c of chats) {
      const title = chatTitle(c, me.id);
      if (!match(title)) continue;
      const peer = peerOf(c, me.id);
      out.push({
        key: `c-${c.id}`,
        section: "Chats",
        icon: peer ? (
          <Avatar seed={peer.avatarSeed} size={28} status={peer.presence} />
        ) : (
          <GroupAvatar chat={c} meId={me.id} size={28} />
        ),
        title,
        meta: c.lastMessage ? listTime(c.lastMessage.createdAt) : undefined,
        run: () => go(c.id),
      });
    }
    const dmWith = new Set(
      chats.filter((c) => c.kind === "dm").flatMap((c) => c.members.map((u) => u.id)),
    );
    for (const f of friends) {
      if (dmWith.has(f.id) || !match(f.username)) continue;
      out.push({
        key: `f-${f.id}`,
        section: "People",
        icon: <Avatar seed={f.avatarSeed} size={28} status={f.presence} />,
        title: f.username,
        meta: "Start a chat",
        run: () => openDm.mutate(f.id, { onSuccess: ({ chat }) => go(chat.id) }),
      });
    }
    const settings = (section: "account" | "appearance") => () => {
      close();
      navigate({ to: ".", search: (p) => ({ ...p, settings: section }) });
    };
    const actions: [string, Icon, () => void][] = [
      ["Open settings", GearSix, settings("account")],
      ["Appearance", GearSix, settings("appearance")],
      [
        "All chats",
        ChatsCircle,
        () => {
          close();
          navigate({ to: "/" });
        },
      ],
    ];
    for (const [title, I, run] of actions)
      if (match(title))
        out.push({
          key: `a-${title}`,
          section: "Actions",
          icon: (
            <Glyph>
              <I />
            </Glyph>
          ),
          title,
          run,
        });
    if (term.length >= 2)
      for (const hit of (search.data?.results ?? []) as SearchHit[]) {
        const chat = chats.find((c) => c.id === hit.chatId);
        const author = chat?.members.find((u) => u.id === hit.message.senderId)?.username;
        out.push({
          key: `m-${hit.message.id}`,
          section: "Messages",
          icon: (
            <Glyph>
              <MagnifyingGlass />
            </Glyph>
          ),
          title: previewText(hit.message),
          meta: [author, chat && chatTitle(chat, me.id)].filter(Boolean).join(" · "),
          run: () => go(hit.chatId, hit.message.id),
        });
      }
    return out;
  })();

  const current = Math.min(sel, Math.max(0, items.length - 1));

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const d = e.key === "ArrowDown" ? 1 : -1;
      setSel((s) => (s + d + items.length) % Math.max(1, items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[current]?.run();
    }
  }

  useEffect(() => {
    document.getElementById(`sw-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  let lastSection = "";
  return (
    <div>
      <div className="flex h-[54px] items-center gap-2.5 border-b border-line px-4">
        <MagnifyingGlass aria-hidden className="text-lg text-ash" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Jump to a chat, person, or search messages"
          aria-label="Search"
          role="combobox"
          aria-expanded
          aria-controls="switcher-list"
          aria-activedescendant={items.length ? `sw-${current}` : undefined}
          className="flex-1 bg-transparent text-base outline-none"
        />
        <kbd className="rounded-md bg-inset px-1.5 py-0.5 font-mono text-[11px] text-slate">
          Esc
        </kbd>
      </div>
      <div
        id="switcher-list"
        role="listbox"
        aria-label="Results"
        className="max-h-[min(420px,58vh)] overflow-y-auto p-1.5"
      >
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate">
            {term.length >= 2 && search.isFetching
              ? "Searching messages…"
              : "Nothing matches. Try a name or a word from a message."}
          </p>
        ) : (
          items.map((it, i) => {
            const header = it.section !== lastSection ? it.section : null;
            lastSection = it.section;
            return (
              <div key={it.key}>
                {header && (
                  <p className="px-2.5 pt-2.5 pb-1 text-[11.5px] font-medium tracking-[0.25px] text-ash">
                    {header}
                  </p>
                )}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: keys are handled by the combobox input (aria-activedescendant) */}
                <div
                  id={`sw-${i}`}
                  role="option"
                  aria-selected={i === current}
                  tabIndex={-1}
                  onMouseMove={() => i !== current && setSel(i)}
                  onClick={it.run}
                  className={cx(
                    "flex cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2",
                    i === current && "bg-inset",
                  )}
                >
                  {it.icon}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.title}</span>
                  {it.meta && (
                    <span className="max-w-[45%] shrink-0 truncate text-[12.5px] text-ash">
                      {it.meta}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex gap-4 border-t border-line px-4 py-2 text-[12px] text-ash max-sm:hidden">
        <span>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move
        </span>
        <span>
          <Kbd>Enter</Kbd> to open
        </span>
      </div>
    </div>
  );
}

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded-md bg-inset px-1.5 py-0.5 font-mono text-[11px] text-slate">
    {children}
  </kbd>
);

const Glyph = ({ children }: { children: ReactNode }) => (
  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-inset text-[15px] text-slate">
    {children}
  </span>
);
