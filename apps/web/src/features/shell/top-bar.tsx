import { CaretDown, GearSix, MagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Avatar } from "../../ui/avatar";
import { IconButton } from "../../ui/button";
import { Logo } from "../../ui/logo";
import { Menu, MenuItem, MenuSeparator } from "../../ui/menu";
import { meQuery, useLogout } from "../auth/queries";
import { connectionLabel, useConnection } from "../realtime/socket";
import { useSwitcher } from "../switcher/switcher";

export const statusLabel = {
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

      <button
        type="button"
        onClick={() => useSwitcher.getState().set(true)}
        aria-label="Search or jump to (Ctrl K)"
        className="mx-auto flex h-[34px] w-[min(440px,40vw)] items-center gap-2 rounded-full bg-inset pr-1.5 pl-3.5 text-sm text-ash transition-[background-color,box-shadow] duration-150 hover:bg-panel hover:shadow-[inset_0_0_0_1px_var(--line)]"
      >
        <MagnifyingGlass aria-hidden className="text-base" />
        <span>Search or jump to…</span>
        <kbd className="ml-auto rounded-md bg-panel px-1.5 py-0.5 font-mono text-[11px] text-slate shadow-[0_0_0_1px_var(--line)]">
          Ctrl K
        </kbd>
      </button>
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
  const label = connectionLabel(state);
  if (!label) return null;
  return (
    <span
      role="status"
      className="flex h-7 shrink-0 items-center gap-2 rounded-full bg-inset px-3 text-[12.5px] font-medium text-slate"
    >
      <span
        className={`size-1.5 rounded-full ${state === "offline" ? "bg-ash" : "animate-pulse bg-amber"}`}
      />
      {label}
    </span>
  );
}
