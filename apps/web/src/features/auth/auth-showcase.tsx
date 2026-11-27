import { Microphone, PhoneDisconnect } from "@phosphor-icons/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { cx } from "../../lib/cx";
import { Avatar } from "../../ui/avatar";
import { Logo } from "../../ui/logo";

// Illustrative demo content: Sonora at work, looping. Not real users.
const people = {
  layla: { name: "layla", seed: "Layla" },
  yousef: { name: "yousef", seed: "Yousef" },
  noor: { name: "noor", seed: "Noor" },
  karim: { name: "karim", seed: "Karim" },
} as const;
type Who = keyof typeof people;

const script: { who: Who; text: string }[] = [
  { who: "layla", text: "desert trip friday, who's in? 🏜️" },
  { who: "yousef", text: "in. I'm bringing the speaker" },
  { who: "noor", text: "I'll sort the tent and the coffee" },
  { who: "layla", text: "perfect, calling you all now" },
];

const ease = [0.2, 0, 0, 1] as const;
const STEP = 1700; // per message: typing, then the message
const CALL = script.length; // step at which the call card appears
const END = CALL + 4; // hold, then loop

export function AuthShowcase() {
  const reduce = useReducedMotion();
  // One ever-increasing tick; step within a loop and loop count derive from it.
  const [tick, setTick] = useState(reduce ? END : 0);
  const step = tick % (END + 1);
  const loop = Math.floor(tick / (END + 1));

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setTick((t) => t + 1), STEP);
    return () => clearInterval(id);
  }, [reduce]);

  const shown = script.slice(0, Math.min(step, script.length));
  const typing = step < script.length ? script[step]?.who : undefined;

  return (
    <aside
      aria-hidden
      className="panel relative hidden overflow-hidden lg:grid lg:place-items-center"
    >
      <Logo className="pointer-events-none absolute -right-16 -bottom-24 h-[560px] text-ink opacity-[0.035]" />
      <div className="relative grid w-[min(480px,78%)] gap-3">
        <div className="rounded-[18px] bg-canvas p-2 shadow-panel">
          <div className="flex items-center gap-3 px-3 pt-2 pb-3">
            <span className="flex">
              {(["layla", "yousef", "noor"] as const).map((w, i) => (
                <Avatar
                  key={w}
                  seed={people[w].seed}
                  size={26}
                  className={cx("ring-2 ring-canvas", i > 0 && "-ml-2")}
                />
              ))}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">desert crew</p>
              <p className="text-xs text-slate">4 members · 3 online</p>
            </div>
          </div>
          <div className="flex min-h-[248px] flex-col justify-end gap-2.5 rounded-[12px] bg-panel p-3">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={loop}
                exit={{ opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-2.5"
              >
                {shown.map((msg) => (
                  <m.div
                    key={msg.text}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease }}
                    className="flex gap-2.5"
                  >
                    <Avatar seed={people[msg.who].seed} size={30} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{people[msg.who].name}</p>
                      <p className="text-[14px] text-ink-2">{msg.text}</p>
                    </div>
                  </m.div>
                ))}
              </m.div>
            </AnimatePresence>
            <p
              className={cx(
                "flex h-5 items-center gap-2 text-xs text-slate transition-opacity duration-200",
                typing ? "opacity-100" : "opacity-0",
              )}
            >
              <span className="flex gap-[3px]">
                {[0, 1, 2].map((d) => (
                  <i
                    key={d}
                    className="size-[5px] animate-bounce rounded-full bg-slate"
                    style={{ animationDelay: `${d * 120}ms` }}
                  />
                ))}
              </span>
              {typing && `${people[typing].name} is typing`}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {step >= CALL && (
            <m.div
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease }}
              className="flex items-center gap-3 rounded-[18px] bg-canvas p-3 pl-4 shadow-panel"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-cyan-ink">
                  <span className="size-[7px] rounded-full bg-cyan shadow-[0_0_0_3px_color-mix(in_oklab,var(--cyan)_25%,transparent)]" />
                  Voice call
                </p>
                <p className="text-xs text-slate tabular-nums">
                  desert crew · 0:{String((step - CALL) * 2 + 1).padStart(2, "0")}
                </p>
              </div>
              <span className="flex gap-1.5">
                {(Object.keys(people) as Who[]).map((w, i) => (
                  <span
                    key={w}
                    className={cx(
                      "rounded-full transition-shadow duration-300",
                      (step - CALL) % 4 === i &&
                        "shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--cyan)]",
                    )}
                  >
                    <Avatar seed={people[w].seed} size={30} />
                  </span>
                ))}
              </span>
              <span className="grid size-8 place-items-center rounded-full bg-panel text-ink-2">
                <Microphone />
              </span>
              <span className="grid size-8 place-items-center rounded-full bg-red text-white">
                <PhoneDisconnect weight="fill" />
              </span>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
