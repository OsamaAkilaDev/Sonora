import { Check, X } from "@phosphor-icons/react";
import type { FriendRequest } from "@sonora/shared";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "../../ui/avatar";
import { Button, IconButton } from "../../ui/button";
import { RowSkeletons } from "../chats/chat-list";
import { EmptyState } from "../shell/empty-state";
import { socialQuery, useAcceptRequest, useDeclineRequest } from "./queries";

export function RequestList() {
  const { data, isPending } = useQuery(socialQuery);
  if (isPending) return <RowSkeletons rows={3} />;
  const incoming = data?.requests.filter((r) => r.direction === "incoming") ?? [];
  const outgoing = data?.requests.filter((r) => r.direction === "outgoing") ?? [];
  if (!incoming.length && !outgoing.length)
    return (
      <EmptyState
        title="All caught up"
        body="Friend requests you send or receive will show up here."
      />
    );

  return (
    <div className="flex flex-col gap-1">
      <Group label="Received" requests={incoming} />
      <Group label="Sent" requests={outgoing} />
    </div>
  );
}

function Group({ label, requests }: { label: string; requests: FriendRequest[] }) {
  if (!requests.length) return null;
  return (
    <section>
      <h3 className="flex justify-between px-2.5 pt-2 pb-1.5 text-xs font-medium tracking-[0.25px] text-ash">
        {label}
        <span className="tabular-nums">{requests.length}</span>
      </h3>
      <ul className="flex flex-col gap-0.5">
        {requests.map((r) => (
          <Row key={r.user.id} request={r} />
        ))}
      </ul>
    </section>
  );
}

function Row({ request: { user, direction } }: { request: FriendRequest }) {
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();
  return (
    <li className="flex items-center gap-3 rounded-xl px-2.5 py-2">
      <Avatar seed={user.avatarSeed} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.username}</p>
        <p className="truncate text-[12.5px] text-slate">
          {direction === "incoming" ? "Wants to be friends" : "Request sent"}
        </p>
      </div>
      {direction === "incoming" ? (
        <>
          <IconButton
            label={`Decline ${user.username}`}
            onClick={() => decline.mutate(user.id)}
            className="shadow-[inset_0_0_0_1px_var(--line)]"
          >
            <X />
          </IconButton>
          <IconButton
            label={`Accept ${user.username}`}
            onClick={() => accept.mutate(user.id)}
            className="bg-ink text-on-ink hover:bg-ink/86 hover:text-on-ink"
          >
            <Check weight="bold" />
          </IconButton>
        </>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => decline.mutate(user.id)}>
          Cancel
        </Button>
      )}
    </li>
  );
}
