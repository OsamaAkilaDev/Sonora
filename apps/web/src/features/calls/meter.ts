/** Loudness of live audio tracks, from one shared AudioContext and one timer. */

let ctx: AudioContext | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
const meters = new Set<() => void>();
const buffer = new Float32Array(512);

/** Calls `onLevel` with the track's RMS level (0–1) about ten times a second. */
export function watchLevel(track: MediaStreamTrack, onLevel: (level: number) => void) {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const source = ctx.createMediaStreamSource(new MediaStream([track]));
  const analyser = ctx.createAnalyser();
  analyser.fftSize = buffer.length;
  source.connect(analyser);
  const read = () => {
    analyser.getFloatTimeDomainData(buffer);
    let sum = 0;
    for (const v of buffer) sum += v * v;
    onLevel(Math.sqrt(sum / buffer.length));
  };
  meters.add(read);
  timer ??= setInterval(() => {
    for (const m of meters) m();
  }, 100);
  return () => {
    meters.delete(read);
    source.disconnect();
    if (!meters.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Calls `onChange` when someone starts or stops talking; holds briefly across pauses. */
export function watchSpeaking(track: MediaStreamTrack, onChange: (speaking: boolean) => void) {
  let speaking = false;
  let lastLoud = 0;
  return watchLevel(track, (level) => {
    if (level > 0.035) lastLoud = Date.now();
    const next = Date.now() - lastLoud < 350;
    if (next !== speaking) {
      speaking = next;
      onChange(next);
    }
  });
}
