import { CaretDown, GearSix, SignOut } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Avatar } from "../../ui/avatar";
import { IconButton } from "../../ui/button";
import { Logo } from "../../ui/logo";
import { Menu, MenuItem, MenuSeparator } from "../../ui/menu";
import { meQuery, useLogout } from "../auth/queries";
import { useConnection } from "../realtime/socket";

const statusLabel = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  invisible: "Invisible",
};

export function TopBar() {
  const me = useQuery(meQuery).data;
  const logout = useLogout();
  const navigate = useNavigate();
  if (!me) return null;

  return (
    <header className="panel flex h-full items-center gap-3 pr-2.5 pl-2">
      <Menu
        trigger={
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full py-1 pr-2.5 pl-1 text-left transition-colors duration-150 hover:bg-hover"
          >
            <Avatar seed={me.avatarSeed} size={34} status={me.status} />
            <span className="leading-tight">
              <span className="block text-sm font-semibold">{me.username}</span>
              <span className="block text-xs text-slate">{statusLabel[me.status]}</span>
            </span>
            <CaretDown aria-hidden className="text-sm text-ash" />
          </button>
        }
      >
        <MenuItem
          onClick={() => navigate({ to: ".", search: (p) => ({ ...p, settings: "account" }) })}
        >
          <GearSix /> Settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          danger
          onClick={() => logout.mutate(undefined, { onSettled: () => navigate({ to: "/login" }) })}
        >
          <SignOut /> Sign out
        </MenuItem>
      </Menu>

      <ConnectionPill />
      <div className="ml-auto flex items-center gap-0.5">
        <IconButton
          label="Settings"
          onClick={() => navigate({ to: ".", search: (p) => ({ ...p, settings: "account" }) })}
        >
          <GearSix />
        </IconButton>
        <span className="mx-2 hidden h-[22px] w-px bg-line sm:block" />
        <Logo className="hidden h-[22px] text-cyan sm:block" />
      </div>
    </header>
  );
}

/** Shows only when live updates are down; quiet otherwise. */
function ConnectionPill() {
  const state = useConnection();
  if (state === "online") return null;
  return (
    <span
      role="status"
      className="ml-auto flex h-7 items-center gap-2 rounded-full bg-inset px-3 text-[12.5px] font-medium text-slate"
    >
      <span
        className={`size-1.5 rounded-full ${state === "offline" ? "bg-ash" : "animate-pulse bg-amber"}`}
      />
      {state === "offline" ? "Offline" : "Reconnecting…"}
    </span>
  );
}
