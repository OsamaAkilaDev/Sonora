import { Dialog } from "@base-ui/react/dialog";
import { Check, X } from "@phosphor-icons/react";
import { MAX_GROUP_MEMBERS } from "@sonora/shared";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { ApiError } from "../../lib/api";
import { cx } from "../../lib/cx";
import { Avatar } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { socialQuery } from "../social/queries";
import { useCreateGroup } from "./queries";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function NewGroupDialog({ open, onOpenChange }: Props) {
  const friends = useQuery({ ...socialQuery, enabled: open }).data?.friends ?? [];
  const create = useCreateGroup();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const full = picked.size >= MAX_GROUP_MEMBERS - 1;

  const toggle = (id: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else if (!full) next.add(id);
      return next;
    });

  function close() {
    onOpenChange(false);
    setName("");
    setPicked(new Set());
    setError("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Name the group");
    if (!picked.size) return setError("Pick at least one friend");
    create.mutate(
      { name: name.trim(), memberIds: [...picked] },
      {
        onSuccess: ({ chat }) => {
          close();
          navigate({ to: "/c/$chatId", params: { chatId: chat.id } });
        },
        onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't create it"),
      },
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-(--scrim) transition-opacity duration-300 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cx(
            "fixed top-1/2 left-1/2 z-50 w-[min(440px,calc(100vw-24px))] -translate-1/2 rounded-[18px] bg-panel p-5 shadow-pop outline-none",
            "transition-[opacity,scale,filter] duration-350 ease-out-quint data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-starting-style:blur-[4px]",
            "data-ending-style:scale-[0.99] data-ending-style:opacity-0 data-ending-style:duration-150",
          )}
        >
          <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4">
            <header className="flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-lg font-semibold tracking-[-0.2px]">
                  New group
                </Dialog.Title>
                <Dialog.Description className="text-[13px] text-slate">
                  Up to {MAX_GROUP_MEMBERS} people, including you.
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-lg text-slate hover:bg-hover hover:text-ink"
              >
                <X />
              </Dialog.Close>
            </header>
            <Field
              label="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="desert crew"
              maxLength={50}
              autoFocus
            />
            <div className="grid grid-cols-1 gap-1.5">
              <p className="text-[13px] font-medium text-ink-2">
                Friends{" "}
                <span className="text-ash tabular-nums">
                  {picked.size}/{MAX_GROUP_MEMBERS - 1}
                </span>
              </p>
              {friends.length ? (
                <ul className="-mx-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto px-1">
                  {friends.map((f) => {
                    const on = picked.has(f.id);
                    return (
                      <li key={f.id}>
                        <label
                          className={cx(
                            "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-cyan",
                            on ? "bg-inset" : "hover:bg-hover",
                            !on && full ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={on}
                            disabled={!on && full}
                            onChange={() => toggle(f.id)}
                          />
                          <Avatar seed={f.avatarSeed} size={32} />
                          <span className="flex-1 truncate text-sm font-medium">{f.username}</span>
                          <span
                            aria-hidden
                            className={cx(
                              "grid size-5 place-items-center rounded-full text-xs transition-colors duration-150",
                              on ? "bg-ink text-on-ink" : "shadow-[inset_0_0_0_1.5px_var(--line)]",
                            )}
                          >
                            {on && <Check weight="bold" />}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-xl bg-inset px-3 py-4 text-center text-[13px] text-slate">
                  Add friends first; groups are made from them.
                </p>
              )}
            </div>
            {error && (
              <p role="alert" className="text-[12.5px] text-red">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={create.isPending}>
                Create group
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
