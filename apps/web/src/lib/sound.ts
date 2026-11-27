import { useSyncExternalStore } from "react";

/**
 * Sonora's sound kit, synthesized with Web Audio (nothing to download). One soft mallet voice
 * on one scale (D major pentatonic), so everything belongs together. Weight is heard: small
 * actions are short, high and quiet; destructive ones are low and long. Rising means added or
 * on, falling means removed or off.
 */

type Note = {
  f: number;
  at?: number;
  dur?: number;
  gain?: number;
  /** Glide to this pitch over the note. */
  to?: number;
  wave?: OscillatorType;
};

// biome-ignore format: a pitch table reads best on few lines
const P = {
  D3: 146.83, A3: 220, B3: 246.94, D4: 293.66, Fs4: 369.99, A4: 440, B4: 493.88, D5: 587.33,
  E5: 659.25, Fs5: 739.99, A5: 880, B5: 987.77, D6: 1174.66, E6: 1318.51, Fs6: 1479.98,
};

const sounds = {
  /* Light */
  tick: [{ f: P.D6, dur: 0.05, gain: 0.025 }],
  pop: [{ f: P.A5, to: P.D6, dur: 0.09, gain: 0.045 }],
  unpop: [{ f: P.D6, to: P.A5, dur: 0.09, gain: 0.035 }],
  on: [
    { f: P.A5, dur: 0.07, gain: 0.04 },
    { f: P.D6, at: 0.055, dur: 0.12, gain: 0.04 },
  ],
  off: [
    { f: P.D6, dur: 0.07, gain: 0.03 },
    { f: P.A5, at: 0.055, dur: 0.12, gain: 0.032 },
  ],
  /* Your microphone: rounder and fuller, so you're sure which way it went. */
  mute: [
    { f: P.B4, dur: 0.09, gain: 0.07, wave: "triangle" },
    { f: P.Fs4, at: 0.07, dur: 0.16, gain: 0.07, wave: "triangle" },
  ],
  unmute: [
    { f: P.Fs4, dur: 0.09, gain: 0.065, wave: "triangle" },
    { f: P.B4, at: 0.07, dur: 0.18, gain: 0.065, wave: "triangle" },
  ],
  /* Medium */
  send: [
    { f: P.E5, to: P.A5, dur: 0.1, gain: 0.045 },
    { f: P.E6, at: 0.06, dur: 0.12, gain: 0.025 },
  ],
  receive: [
    { f: P.Fs5, dur: 0.2, gain: 0.055 },
    { f: P.B5, at: 0.1, dur: 0.3, gain: 0.05 },
  ],
  add: [
    { f: P.D5, dur: 0.12, gain: 0.05 },
    { f: P.Fs5, at: 0.06, dur: 0.12, gain: 0.05 },
    { f: P.A5, at: 0.12, dur: 0.22, gain: 0.05 },
  ],
  remove: [
    { f: P.A5, dur: 0.1, gain: 0.045 },
    { f: P.E5, at: 0.08, dur: 0.2, gain: 0.045 },
  ],
  success: [
    { f: P.D5, dur: 0.16, gain: 0.05 },
    { f: P.Fs5, at: 0.07, dur: 0.18, gain: 0.05 },
    { f: P.A5, at: 0.14, dur: 0.2, gain: 0.05 },
    { f: P.D6, at: 0.21, dur: 0.36, gain: 0.045 },
  ],
  /* Heavy */
  delete: [
    { f: P.A4, to: P.D4, dur: 0.16, gain: 0.07, wave: "triangle" },
    { f: P.D3, to: 98, at: 0.08, dur: 0.34, gain: 0.14, wave: "sine" },
  ],
  error: [
    { f: P.B3, dur: 0.16, wave: "triangle", gain: 0.08 },
    { f: P.A3, at: 0.1, dur: 0.26, wave: "triangle", gain: 0.08 },
  ],
  /* Calls */
  join: [
    { f: P.A4, dur: 0.1, gain: 0.06 },
    { f: P.D5, at: 0.07, dur: 0.12, gain: 0.06 },
    { f: P.Fs5, at: 0.14, dur: 0.24, gain: 0.055 },
  ],
  leave: [
    { f: P.Fs5, dur: 0.1, gain: 0.05 },
    { f: P.D5, at: 0.07, dur: 0.12, gain: 0.05 },
    { f: P.A4, at: 0.14, dur: 0.24, gain: 0.05 },
  ],
  hangup: [
    { f: P.D5, dur: 0.14, gain: 0.07 },
    { f: P.A4, at: 0.11, dur: 0.16, gain: 0.07 },
    { f: P.D4, at: 0.22, dur: 0.4, gain: 0.09 },
  ],
  theme: [{ f: P.D6, dur: 0.35, gain: 0.03 }],
} satisfies Record<string, Note[]>;

/** Call tunes, looped while a call rings. */
const loops = {
  /** Incoming: a rising phrase and its answer over a warm low note. */
  ring: {
    seconds: 3.2,
    notes: [
      { f: P.D4, dur: 1.1, gain: 0.18, wave: "sine" },
      { f: P.D5, dur: 0.3, gain: 0.36 },
      { f: P.Fs5, at: 0.15, dur: 0.3, gain: 0.36 },
      { f: P.A5, at: 0.3, dur: 0.3, gain: 0.36 },
      { f: P.D6, at: 0.45, dur: 0.7, gain: 0.4 },
      { f: P.B3, at: 1.2, dur: 1.1, gain: 0.18, wave: "sine" },
      { f: P.B5, at: 1.2, dur: 0.3, gain: 0.32 },
      { f: P.A5, at: 1.35, dur: 0.3, gain: 0.32 },
      { f: P.Fs5, at: 1.5, dur: 0.3, gain: 0.32 },
      { f: P.A5, at: 1.65, dur: 0.8, gain: 0.36 },
    ] satisfies Note[],
  },
  /** Outgoing: two quiet swells, then room to hear them pick up. */
  ringback: {
    seconds: 3.4,
    notes: [
      { f: P.A4, dur: 0.7, gain: 0.045, wave: "sine" },
      { f: P.D5, dur: 0.7, gain: 0.035, wave: "sine" },
      { f: P.A4, at: 0.85, dur: 0.9, gain: 0.045, wave: "sine" },
      { f: P.D5, at: 0.85, dur: 0.9, gain: 0.035, wave: "sine" },
    ] satisfies Note[],
  },
};

export type SoundName = keyof typeof sounds;
export type LoopName = keyof typeof loops;

/** One mallet strike: the note, plus a quick overtone that gives it a wooden "knock". */
function strike(ctx: BaseAudioContext, out: AudioNode, start: number, n: Note) {
  const t = start + (n.at ?? 0);
  const dur = n.dur ?? 0.12;
  const gain = n.gain ?? 0.045;
  const partial = (ratio: number, level: number, length: number, wave: OscillatorType) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(n.f * ratio, t);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to * ratio, t + length);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(level, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(amp).connect(out);
    osc.start(t);
    osc.stop(t + length + 0.02);
  };
  partial(1, gain, dur, n.wave ?? "sine");
  if (!n.wave) partial(3.98, gain * 0.16, dur * 0.25, "sine");
}

/* ── Settings ── */

const listeners = new Set<() => void>();
function setting(key: string) {
  let value = true;
  try {
    value = localStorage.getItem(key) !== "off";
  } catch {}
  return {
    get: () => value,
    set(on: boolean) {
      value = on;
      try {
        localStorage.setItem(key, on ? "on" : "off");
      } catch {}
      for (const l of listeners) l();
    },
  };
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const interfaceSounds = setting("sonora-sounds");
const ringtone = setting("sonora-ringtone");
export const setSoundsEnabled = interfaceSounds.set;
export const useSoundsEnabled = () => useSyncExternalStore(subscribe, interfaceSounds.get);
/** Separate from interface sounds: silencing clicks shouldn't make you miss calls. */
export const setRingtoneEnabled = ringtone.set;
export const useRingtoneEnabled = () => useSyncExternalStore(subscribe, ringtone.get);

/* ── One-shots ── */

let ctx: AudioContext | undefined;
let out: AudioNode | undefined;

function output() {
  if (!ctx) {
    ctx = new AudioContext();
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 4200;
    lowpass.connect(ctx.destination);
    out = lowpass;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, out: out as AudioNode };
}

/** `background`: also sound when the tab is hidden (calls must be heard). */
export function play(name: SoundName, { background = false } = {}) {
  if (!interfaceSounds.get() || (!background && document.visibilityState === "hidden")) return;
  try {
    const { ctx, out } = output();
    const now = ctx.currentTime + 0.01;
    for (const n of sounds[name] as Note[]) strike(ctx, out, now, n);
  } catch {
    // Audio unavailable (no device, blocked): sounds are decoration, never an error.
  }
}

/* ── Loops ──
 * Played by an <audio> element rather than a timer: browsers throttle timers in hidden tabs,
 * but keep playing media.
 */

const players: Partial<Record<LoopName, HTMLAudioElement>> = {};
const playing = new Set<LoopName>();

async function renderLoop(name: LoopName) {
  const rate = 44_100;
  const { seconds, notes } = loops[name];
  const offline = new OfflineAudioContext(1, Math.ceil(seconds * rate), rate);
  // A short echo gives the tune some room.
  const echo = offline.createDelay();
  echo.delayTime.value = 0.19;
  const feedback = offline.createGain();
  feedback.gain.value = 0.24;
  const bus = offline.createGain();
  bus.connect(offline.destination);
  bus.connect(echo);
  echo.connect(feedback).connect(echo);
  echo.connect(offline.destination);
  for (const n of notes as Note[]) strike(offline, bus, 0, n);
  return wav(await offline.startRendering());
}

/** 16-bit mono WAV, so an <audio> element can loop a rendered buffer. */
function wav(buffer: AudioBuffer) {
  const samples = buffer.getChannelData(0);
  const view = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => {
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true);
  });
  return new Blob([view], { type: "audio/wav" });
}

const ready = Promise.all(
  (Object.keys(loops) as LoopName[]).map(async (name) => {
    try {
      const el = new Audio(URL.createObjectURL(await renderLoop(name)));
      el.loop = true;
      players[name] = el;
    } catch {}
  }),
);

/**
 * Browsers only let a page make noise after you've interacted with it, so the first tap or key
 * press warms up the audio. Without it, a ringing tab that was never touched stays silent
 * (the notification still sounds).
 */
function unlock() {
  removeEventListener("pointerdown", unlock, true);
  removeEventListener("keydown", unlock, true);
  try {
    output();
  } catch {}
  for (const [name, el] of Object.entries(players) as [LoopName, HTMLAudioElement][]) {
    if (playing.has(name)) continue;
    el.muted = true;
    el.play().then(
      () => {
        if (!playing.has(name)) el.pause();
        el.muted = false;
      },
      () => {
        el.muted = false;
      },
    );
  }
}
addEventListener("pointerdown", unlock, true);
addEventListener("keydown", unlock, true);

/** Starts a call tune; returns how to stop it. Respects the ringtone setting. */
export function startLoop(name: LoopName) {
  if (!ringtone.get()) return () => {};
  playing.add(name);
  void ready.then(() => {
    const el = players[name];
    if (!el || !playing.has(name)) return;
    el.muted = false;
    el.currentTime = 0;
    el.play().catch(() => {});
  });
  return () => {
    playing.delete(name);
    players[name]?.pause();
  };
}
