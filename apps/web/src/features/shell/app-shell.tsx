import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { type ReactNode, useState } from "react";
import { cx } from "../../lib/cx";
import { Logo } from "../../ui/logo";
import { SettingsDialog } from "../settings/settings-dialog";
import { Rail } from "./rail";
import { TopBar } from "./top-bar";

const ease = [0.2, 0, 0, 1] as const;

/** Floating-panel shell. First mount staggers panels in; right after sign-in a logo intro plays first. */
export function AppShell({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
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
      <div
        className={cx(
          "fixed inset-0 grid gap-2 p-2 pt-[max(8px,env(safe-area-inset-top))] pb-[max(8px,env(safe-area-inset-bottom))]",
          "grid-cols-1 grid-rows-[52px_minmax(0,1fr)] md:grid-cols-[300px_minmax(0,1fr)]",
        )}
      >
        <m.div {...panel(0)} className="md:col-span-2">
          <TopBar />
        </m.div>
        <m.aside {...panel(1)} aria-label="Conversations" className="panel min-h-0 overflow-hidden">
          <Rail />
        </m.aside>
        <m.main {...panel(2)} className="panel hidden min-h-0 overflow-hidden md:block">
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
