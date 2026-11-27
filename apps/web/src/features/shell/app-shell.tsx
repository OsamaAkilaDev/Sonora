import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { type ReactNode, useState } from "react";
import { cx } from "../../lib/cx";
import { usePhone } from "../../lib/phone";
import { Logo } from "../../ui/logo";
import { meQuery } from "../auth/queries";
import { CallDock, useCallElsewhere } from "../calls/call-dock";
import { CallLayer } from "../calls/call-layer";
import { usePush } from "../notifications/push";
import { useRealtime } from "../realtime/use-realtime";
import { SettingsDialog } from "../settings/settings-dialog";
import { Switcher } from "../switcher/switcher";
import { PhoneHome } from "./phone-home";
import { Rail } from "./rail";
import { TopBar } from "./top-bar";

const ease = [0.2, 0, 0, 1] as const;

/**
 * Floating panels on desktop, full-bleed screens on phones. One tree for both, so the open chat
 * survives a resize. First mount staggers panels in; right after sign-in a logo intro plays first.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const me = useQuery(meQuery).data;
  useRealtime(me?.id ?? "");
  usePush();
  const call = useCallElsewhere();
  const phone = usePhone();
  // Phones show one screen at a time: home, or the open chat on top of it.
  const inChat = useRouterState({ select: (s) => s.location.pathname.startsWith("/c/") });
  const [intro] = useState(() => {
    const v = sessionStorage.getItem("sonora-intro") === "1";
    sessionStorage.removeItem("sonora-intro");
    return v && !reduce;
  });
  const base = intro ? 1.05 : 0;

  const panel = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.5, ease, delay: base + i * 0.09 },
  });

  return (
    <>
      {intro && <Intro />}
      <SettingsDialog />
      <Switcher />
      <CallLayer />
      <div
        className={cx(
          "fixed inset-0 grid grid-cols-1",
          "max-md:grid-rows-[auto_minmax(0,1fr)] max-md:bg-panel max-md:pt-[env(safe-area-inset-top)]",
          "md:grid-cols-[300px_minmax(0,1fr)] md:grid-rows-[52px_minmax(0,1fr)] md:gap-2 md:p-2",
          "md:pt-[max(8px,env(safe-area-inset-top))] md:pb-[max(8px,env(safe-area-inset-bottom))]",
        )}
      >
        {/* Hidden by CSS, not unmounted, so a resize doesn't replay its entrance. */}
        <m.div {...panel(0)} className="max-md:hidden md:col-span-2">
          <TopBar />
        </m.div>
        {phone && call.phone && (
          <div className="row-start-1 h-16 p-1.5">
            <CallDock variant="bar" />
          </div>
        )}
        <m.aside
          {...panel(1)}
          aria-label="Conversations"
          className={cx(
            "min-h-0 overflow-hidden md:panel max-md:col-start-1 max-md:row-start-2",
            // Covered, not removed: scroll positions are still there on the way back.
            inChat && "max-md:invisible",
          )}
        >
          {phone ? <PhoneHome /> : <Rail />}
        </m.aside>
        <m.main
          {...panel(2)}
          className={cx(
            "min-h-0 overflow-hidden md:panel max-md:col-start-1 max-md:row-start-2 max-md:bg-panel",
            !inChat && "max-md:hidden",
          )}
        >
          {children}
        </m.main>
      </div>
    </>
  );
}

function Intro() {
  return (
    <m.div
      aria-hidden
      className="fixed inset-0 z-50 grid place-items-center bg-canvas"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0, transitionEnd: { display: "none" } }}
      transition={{ delay: 1.05, duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3.5">
        <m.span
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
        >
          <Logo className="h-14 text-cyan" />
        </m.span>
        <m.span
          className="text-[30px] font-semibold tracking-[-0.6px]"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, ease, delay: 0.45 }}
        >
          Sonora
        </m.span>
      </div>
    </m.div>
  );
}
