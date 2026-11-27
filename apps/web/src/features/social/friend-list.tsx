import { At, DotsThree, UserMinus } from "@phosphor-icons/react";
import { type PublicUser, username as usernameSchema } from "@sonora/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useState } from "react";
import { ApiError } from "../../lib/api";
import { cx } from "../../lib/cx";
import { timeAgo } from "../../lib/format";
import { Avatar } from "../../ui/avatar";
import { Button, IconButton } from "../../ui/button";
import { inputClass } from "../../ui/field";
import { Menu, MenuItem } from "../../ui/menu";
import { RowSkeletons } from "../chats/chat-list";
import { chatsQuery, useOpenDm } from "../chats/queries";
import { EmptyState } from "../shell/empty-state";
import { socialQuery, useRemoveFriend, useSendRequest } from "./queries";

export const presenceLabel = (u: PublicUser) =>
  u.presence === "online"
    ? "Online"
    : u.presence === "idle"
      ? "Idle"
      : u.presence === "dnd"
        ? "Do not disturb"
        : u.lastSeenAt
          ? `Last seen ${timeAgo(u.lastSeenAt)}`
          : "Offline";

/** `requests`: where phones, which have no Requests tab, show them. */
export function FriendList({ requests }: { requests?: ReactNode }) {
  const { data, isPending } = useQuery(socialQuery);
  const friends = data?.friends ?? [];
  const online = friends.filter((f) => f.presence !== "offline");
  const offline = friends.filter((f) => f.presence === "offline");

  return (
    <div className="flex flex-col gap-1">
      <AddFriend />
      {requests}
      {isPending ? (
        <RowSkeletons rows={4} />
      ) : !friends.length ? (
        <EmptyState
          title="No friends yet"
          body="Add someone by their username. They'll get your request right away."
        />
      ) : (
        <>
          <Section label="Online" users={online} />
          <Section label="Offline" users={offline} />
        </>
      )}
    </div>
  );
}

function Section({ label, users }: { label: string; users: PublicUser[] }) {
  if (!users.length) return null;
  return (
    <section>
      <h3 className="flex justify-between px-2.5 pt-3 pb-1.5 text-xs font-medium tracking-[0.25px] text-ash">
        {label}
        <span className="tabular-nums">{users.length}</span>
      </h3>
      <ul className="flex flex-col gap-0.5">
        {users.map((u) => (
          <FriendRow key={u.id} user={u} />
        ))}
      </ul>
    </section>
  );
}

function FriendRow({ user }: { user: PublicUser }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const openDm = useOpenDm();
  const remove = useRemoveFriend();
  const go = (chatId: string) => navigate({ to: "/c/$chatId", params: { chatId } });

  // Known DM: open instantly from cache. New one: create it, then open.
  function open() {
    const dm = qc
      .getQueryData(chatsQuery.queryKey)
      ?.find((c) => c.kind === "dm" && c.members.some((m) => m.id === user.id));
    if (dm) go(dm.id);
    else openDm.mutate(user.id, { onSuccess: ({ chat }) => go(chat.id) });
  }

  return (
    <li className="flex items-center gap-1 rounded-xl pr-1.5 transition-colors duration-150 hover:bg-hover">
      <button
        type="button"
        onClick={open}
        disabled={openDm.isPending}
        aria-label={`Message ${user.username}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2 pl-2.5 text-left"
      >
        <Avatar seed={user.avatarSeed} size={36} status={user.presence} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{user.username}</span>
          <span className="block truncate text-[12.5px] text-slate">{presenceLabel(user)}</span>
        </span>
      </button>
      <Menu
        align="end"
        trigger={
          <IconButton label={`More for ${user.username}`}>
            <DotsThree weight="bold" />
          </IconButton>
        }
      >
        <MenuItem danger onClick={() => remove.mutate(user.id)}>
          <UserMinus /> Remove friend
        </MenuItem>
      </Menu>
    </li>
  );
}

function AddFriend() {
  const send = useSendRequest();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = usernameSchema.safeParse(value.replace(/^@/, ""));
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the username");
    setError("");
    send.mutate(parsed.data, {
      onSuccess: () => setValue(""),
      onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't send that"),
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-1.5 px-0.5 pb-1">
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <At
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base text-ash"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add by username"
            aria-label="Add a friend by username"
            aria-invalid={error ? true : undefined}
            autoCapitalize="none"
            spellCheck={false}
            className={cx(inputClass, "h-[34px] rounded-full pl-8 pointer-coarse:h-11")}
          />
        </div>
        <Button type="submit" loading={send.isPending} disabled={!value.trim()}>
          Add
        </Button>
      </div>
      {error && (
        <p role="alert" className="px-2 text-[12.5px] text-red">
          {error}
        </p>
      )}
    </form>
  );
}
