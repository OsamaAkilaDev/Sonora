import { useSyncExternalStore } from "react";

/**
 * Soft UI sounds, synthesized with Web Audio (no files to load). Quiet by design:
 * low gain, fast decay, a lowpass to round the edges. Used only for meaningful
 * moments (sent, received, success, error), never on every click.
 */

type Note = { f: number; at?: number; dur?: number; gain?: number; wave?: OscillatorType };

const sounds = {
  /** Message sent: quick upward pair. */
  send: [
    { f: 740, dur: 0.07 },
    { f: 988, at: 0.045, dur: 0.1 },
  ],
  /** Message or notification in: gentle two-note chime. */
  receive: [
    { f: 880, dur: 0.22, gain: 0.05 },
    { f: 1318.5, at: 0.09, dur: 0.28, gain: 0.04 },
  ],
  /** Signed in, saved: soft major arpeggio. */
  success: [
    { f: 523.25, dur: 0.16 },
    { f: 659.25, at: 0.07, dur: 0.18 },
    { f: 783.99, at: 0.14, dur: 0.24 },
  ],
  /** Something failed: low, round, short. */
  error: [
    { f: 233, dur: 0.16, wave: "triangle", gain: 0.07 },
    { f: 196, at: 0.08, dur: 0.22, wave: "triangle", gain: 0.06 },
  ],
  /** Theme change: one airy tone. */
  theme: [{ f: 1046.5, dur: 0.35, gain: 0.03 }],
  /** Small confirmations (signed out a session, toggles). */
  tick: [{ f: 1400, dur: 0.04, gain: 0.025 }],
} satisfies Record<string, Note[]>;

export type SoundName = keyof typeof sounds;

const KEY = "sonora-sounds";
const listeners = new Set<() => void>();
let enabled = (() => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
})();

let ctx: AudioContext | undefined;
let out: AudioNode | undefined;

function output() {
  if (!ctx) {
    ctx = new AudioContext();
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 3200;
    lowpass.connect(ctx.destination);
    out = lowpass;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, out: out as AudioNode };
}

export function play(name: SoundName) {
  if (!enabled || document.visibilityState === "hidden") return;
  try {
    const { ctx, out } = output();
    const now = ctx.currentTime + 0.01;
    for (const n of sounds[name] as Note[]) {
      const t = now + (n.at ?? 0);
      const dur = n.dur ?? 0.12;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = n.wave ?? "sine";
      osc.frequency.value = n.f;
      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(n.gain ?? 0.045, t + 0.008);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(amp).connect(out);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
  } catch {
    // Audio unavailable (no device, blocked): sounds are decoration, never an error.
  }
}

export function setSoundsEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  for (const l of listeners) l();
  if (on) play("tick");
}

export const useSoundsEnabled = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => enabled,
  );
