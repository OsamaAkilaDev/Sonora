import { Dialog } from "@base-ui/react/dialog";
import {
  Desktop,
  DeviceMobile,
  Headphones,
  type Icon,
  PaintBrush,
  ShieldCheck,
  SignOut,
  X,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { cx } from "../../lib/cx";
import { describeDevice, timeAgo } from "../../lib/format";
import { play, setSoundsEnabled, useSoundsEnabled } from "../../lib/sound";
import { setThemePref, type ThemePref, useThemePref } from "../../lib/theme";
import { Button } from "../../ui/button";
import { Segmented } from "../../ui/segmented";
import { Switch } from "../../ui/switch";
import { meQuery, useLogout } from "../auth/queries";
import { DevicesCards } from "./devices-section";
import { sessionsQuery, useRevokeOthers, useRevokeSession } from "./queries";

export const settingsSections = ["account", "sessions", "devices", "appearance"] as const;
export type SettingsSection = (typeof settingsSections)[number];

const nav: { id: SettingsSection; label: string; icon: Icon }[] = [
  { id: "account", label: "Account", icon: ShieldCheck },
  { id: "sessions", label: "Sessions", icon: Desktop },
  { id: "devices", label: "Voice & video", icon: Headphones },
  { id: "appearance", label: "Appearance", icon: PaintBrush },
];

/** Settings overlay, driven by `?settings=<section>`: linkable, and Back closes it. */
export function SettingsDialog() {
  const { settings } = useSearch({ from: "/_app" });
  const navigate = useNavigate();
  const go = (s?: SettingsSection) =>
    navigate({ to: ".", search: (p) => ({ ...p, settings: s }), replace: !!settings && !!s });

  return (
    <Dialog.Root open={!!settings} onOpenChange={(open) => !open && go(undefined)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-(--scrim) transition-opacity duration-300 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cx(
            "fixed z-50 grid overflow-hidden bg-panel shadow-pop outline-none",
            "inset-0 grid-rows-[auto_1fr] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[min(640px,calc(100dvh-32px))] sm:w-[min(880px,calc(100vw-32px))] sm:-translate-1/2 sm:grid-cols-[220px_1fr] sm:grid-rows-1 sm:rounded-[18px]",
            "transition-[opacity,scale,filter] duration-350 ease-out-quint data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-starting-style:blur-[4px]",
            "data-ending-style:scale-[0.99] data-ending-style:opacity-0 data-ending-style:duration-150",
          )}
        >
          <nav
            aria-label="Settings sections"
            className="flex gap-1 overflow-x-auto bg-inset p-2.5 pt-[max(10px,env(safe-area-inset-top))] sm:flex-col sm:p-4 sm:px-2.5"
          >
            <Dialog.Title className="mx-2.5 mb-2 hidden text-[13px] font-medium tracking-[0.25px] text-ash sm:block">
              Settings
            </Dialog.Title>
            {nav.map(({ id, label, icon: I }) => (
              <button
                key={id}
                type="button"
                aria-current={settings === id || undefined}
                onClick={() => go(id)}
                className={cx(
                  "flex h-9 shrink-0 items-center gap-2.5 rounded-full px-3 text-sm font-medium transition-colors duration-150",
                  settings === id
                    ? "bg-panel text-ink shadow-panel"
                    : "text-ink-2 hover:bg-hover hover:text-ink",
                )}
              >
                <I className="text-[17px]" weight={settings === id ? "fill" : "regular"} />
                {label}
              </button>
            ))}
          </nav>
          <div className="relative overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
            <Dialog.Close
              aria-label="Close settings"
              className="absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-full text-lg text-slate hover:bg-hover hover:text-ink"
            >
              <X />
            </Dialog.Close>
            {settings === "account" && <Account />}
            {settings === "sessions" && <Sessions />}
            {settings === "devices" && (
              <>
                <Heading
                  title="Voice & video"
                  lead="Pick your devices. Changes apply to a call in progress."
                />
                <DevicesCards />
              </>
            )}
            {settings === "appearance" && <Appearance />}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Heading({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="mb-6 pr-10">
      <h2 className="text-[22px] leading-tight font-semibold tracking-[-0.37px]">{title}</h2>
      <p className="mt-1 text-sm text-slate">{lead}</p>
    </header>
  );
}

const card = "mb-3.5 grid gap-3.5 rounded-[14px] p-4 shadow-[inset_0_0_0_1px_var(--line)]";

function Account() {
  const me = useQuery(meQuery).data;
  const logout = useLogout();
  const navigate = useNavigate();
  if (!me) return null;
  return (
    <>
      <Heading title="Account" lead="Your sign-in details." />
      <div className={card}>
        <Row label="Email" value={me.email} />
        <Row label="Username" value={`@${me.username}`} />
        <Row label="Member since" value={new Date(me.createdAt).toLocaleDateString()} />
      </div>
      <div className="mt-7 flex items-center justify-between gap-4 border-t border-line pt-5">
        <p className="text-[13px] text-slate">Signs you out on this device only.</p>
        <Button
          variant="danger"
          size="sm"
          loading={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSettled: () => navigate({ to: "/login" }) })}
        >
          <SignOut /> Sign out
        </Button>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <span className="truncate text-sm text-slate">{value}</span>
    </div>
  );
}

function Sessions() {
  const { data, isPending, isError, refetch } = useQuery(sessionsQuery);
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOthers();
  const others = data?.filter((s) => !s.current).length ?? 0;

  return (
    <>
      <Heading
        title="Sessions"
        lead="Everywhere you're signed in. Sign out anything you don't recognize."
      />
      <div className={card}>
        {isPending &&
          [0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="skeleton size-[38px] rounded-[10px]" />
              <div className="grid flex-1 gap-2">
                <span className="skeleton h-3 w-40" />
                <span className="skeleton h-2.5 w-24" />
              </div>
            </div>
          ))}
        {isError && (
          <div className="flex items-center justify-between gap-3 text-sm text-slate">
            Couldn't load your sessions.
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}
        {data?.map((s) => {
          const d = describeDevice(s.userAgent);
          const I = d.mobile ? DeviceMobile : Desktop;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-inset text-[19px] text-ink-2">
                <I />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{d.label}</span>
                  {s.current && (
                    <span className="h-[22px] shrink-0 rounded-full bg-cyan-wash px-2 text-xs leading-[22px] font-medium text-cyan-ink">
                      This device
                    </span>
                  )}
                </div>
                <p className="truncate text-[12.5px] text-slate">
                  {[s.city, s.current ? "Active now" : timeAgo(s.lastSeenAt)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {!s.current && (
                <Button variant="ghost" size="sm" onClick={() => revoke.mutate(s.id)}>
                  Sign out
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {others > 0 && (
        <div className="flex justify-end">
          <Button variant="danger" size="sm" onClick={() => revokeOthers.mutate(undefined)}>
            Sign out {others === 1 ? "the other session" : `all ${others} other sessions`}
          </Button>
        </div>
      )}
    </>
  );
}

function Appearance() {
  const pref = useThemePref();
  const sounds = useSoundsEnabled();
  const pick = (p: ThemePref) => {
    if (p !== pref) play("theme");
    setThemePref(p);
  };
  return (
    <>
      <Heading title="Appearance" lead="Make Sonora feel like yours." />
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-[13px] text-slate">Follows your system unless you pick one.</p>
          </div>
          <Segmented
            label="Theme"
            className="w-[260px]"
            value={pref}
            onChange={pick}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Sounds</p>
            <p className="text-[13px] text-slate">
              Quiet cues when messages arrive, send, or something needs your attention.
            </p>
          </div>
          <Switch label="Sounds" checked={sounds} onChange={setSoundsEnabled} />
        </div>
      </div>
    </>
  );
}
