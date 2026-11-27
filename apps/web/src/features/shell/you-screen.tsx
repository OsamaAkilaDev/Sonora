import { CaretRight, SignOut } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Avatar } from "../../ui/avatar";
import { meQuery, useLogout } from "../auth/queries";
import { settingsNav } from "../settings/settings-dialog";
import { statusLabel } from "./top-bar";

const row =
  "flex h-13 w-full items-center gap-3.5 rounded-xl px-3 text-left text-base font-medium transition-colors duration-150 active:bg-hover";

/** Profile and settings: what the desktop keeps in its top bar. */
export function YouScreen() {
  const me = useQuery(meQuery).data;
  const logout = useLogout();
  const navigate = useNavigate();
  if (!me) return null;

  return (
    <>
      <div className="flex items-center gap-4 px-3 pt-1 pb-5">
        <Avatar seed={me.avatarSeed} size={64} status={me.status} />
        <div className="min-w-0">
          <p className="truncate text-lg leading-tight font-semibold">{me.username}</p>
          <p className="text-sm text-slate">{statusLabel[me.status]}</p>
        </div>
      </div>
      <ul>
        {settingsNav.map(({ id, label, icon: I }) => (
          <li key={id}>
            <button
              type="button"
              className={row}
              onClick={() => navigate({ to: ".", search: (p) => ({ ...p, settings: id }) })}
            >
              <I aria-hidden className="text-[22px] text-slate" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <CaretRight aria-hidden className="text-base text-ash" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 border-t border-line pt-2">
        <button
          type="button"
          className={`${row} text-red`}
          onClick={() => logout.mutate(undefined, { onSettled: () => navigate({ to: "/login" }) })}
        >
          <SignOut aria-hidden className="text-[22px]" /> Sign out
        </button>
      </div>
    </>
  );
}
