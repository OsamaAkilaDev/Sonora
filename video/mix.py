# Music + SFX premix for the film, on the beat grid. Run from video/: python -I mix.py
# Marimba: University of Iowa MIS (yarn mallets, mf), on the app's own pitches (apps/web/src/lib/sound.ts).
# Whooshes: Pixabay. Output: assets/audio/mix.wav at -16 LUFS, true peak < -1 dBTP.
import os, subprocess, wave
import numpy as np

SR, FPS, BEAT = 48000, 30, 60 / 129
b = lambda n: round(n * BEAT * FPS) / FPS
bar = lambda n: b(n * 4)
LEN = bar(21)
MUSIC_AT, FADE = 59.52, 1.5


def load(path, start=None, dur=None, ch=1):
    a = ["ffmpeg", "-nostdin", "-v", "error"] + (["-ss", str(start), "-t", str(dur)] if start is not None else [])
    a += ["-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(a, capture_output=True, check=True).stdout, np.float32).copy()
    return x.reshape(-1, ch) if ch > 1 else x


def tuning(x):
    """Cents off A440, from the strongest spectral peaks (circular mean, so ±50 wraps)."""
    s = np.abs(np.fft.rfft(x * np.hanning(len(x))))
    f = np.fft.rfftfreq(len(x), 1 / SR)
    band = np.flatnonzero((f > 150) & (f < 2000))
    top = band[np.argsort(s[band])[-60:]]
    c = 1200 * np.log2(f[top] / 440) % 100
    ang = np.angle(np.sum(s[top] * np.exp(2j * np.pi * c / 100)))
    return (ang / (2 * np.pi) * 100 + 50) % 100 - 50


music = load("assets/music/night-owl.mp3", MUSIC_AT, LEN, ch=2)[: int(LEN * SR)]
n = len(music)
music[-int(FADE * SR):] *= np.linspace(1, 0, int(FADE * SR))[:, None] ** 2

notes = {}
def note(name):
    if name not in notes:
        notes[name] = load(f"assets/sfx/notes/{name}.wav")
    return notes[name]

# Retune the marimba to the track: resample every note by the same ratio.
ratio = 2 ** ((tuning(note("D5")[: SR // 2]) - tuning(music[: SR * 8].mean(1))) / 1200)
print(f"marimba vs track: {1200 * np.log2(ratio):+.0f} cents")
retuned = {}
def mallet(name):
    if name not in retuned:
        x = note(name)
        t = np.arange(0, len(x) - 1, ratio)
        retuned[name] = np.interp(t, np.arange(len(x)), x)
    return retuned[name]


sfx = np.zeros(n)
def put(x, at, gain):
    i = int(round(at * SR))
    j = min(n, i + len(x))
    sfx[i:j] += x[: j - i] * gain

def play(at, figure, gain):
    """figure: (note, offset s, relative gain) as in sound.ts."""
    for name, off, g in figure:
        put(mallet(name), at + off, gain * g)


T = BEAT / 3  # triplet, ≈ the app's 0.15 s ring spacing
SEND = [("A5", 0, 1), ("E6", 0.06, 0.55)]
RECEIVE = [("Fs5", 0, 1), ("B5", 0.1, 0.9)]
POP = [("A5", 0, 0.5), ("D6", 0.03, 1)]
TICK = [("D6", 0, 1)]
ADD = [("D5", 0, 1), ("Fs5", 0.06, 1), ("A5", 0.12, 1)]
JOIN = [("A4", 0, 1), ("D5", 0.07, 1), ("Fs5", 0.14, 0.92)]
RING = [("D5", 0, 1), ("Fs5", T, 1), ("A5", 2 * T, 1), ("D6", 3 * T, 1.1),
        ("B5", 6 * T, 0.9), ("A5", 7 * T, 0.9), ("Fs5", 8 * T, 0.9)]
CONNECT = [("A4", -2 * T, 1), ("D5", -T, 1), ("Fs5", 0, 1), ("A5", 0, 0.6)]
SUCCESS = [("D5", 0, 1), ("Fs5", BEAT / 4, 1), ("A5", BEAT / 2, 1), ("D6", 3 * BEAT / 4, 1.1)]

G = 0.65
cues = [
    (b(4), RECEIVE, G), (b(7), RECEIVE, G),          # thread: karim's message, jonas's reply
    (b(13), POP, G), (b(14), TICK, G * 0.7),         # reaction chip, count 1 → 2
    (b(17), SEND, G), (b(18), TICK, G * 0.6),        # DM sent → Seen
    (b(21), ADD, G * 0.8), (bar(6), SEND, G),        # photo chip, then it sends
    (b(32), RECEIVE, G),                             # list re-sorts on a new message
    (b(45), RING, G * 0.9),                          # incoming call
    (bar(12), CONNECT, G),                           # answered: connect chime into the downbeat
    (bar(14), JOIN, G * 0.8), (bar(15), JOIN, G * 0.8),  # sami joins, then three more
    (bar(19), SUCCESS, G * 0.8),                     # end card mark
]
for at, fig, g in cues:
    play(at, fig, g)

# Whooshes rotate on the seams; each one's loudest point lands on the downbeat, when the disc fills.
whooshes = [load(f"assets/sfx/src/{w}.mp3") for w in
            ("air-whoosh-5-592509", "thin-swoosh-352756", "air-whoosh-8-592506")]
seams = [3, 4, 5, 7, 9, 11, 13, 16, 17, 19]
for i, s in enumerate(seams):
    w = whooshes[i % len(whooshes)]
    env = np.convolve(np.abs(w), np.ones(960) / 960, "same")
    w = w / np.abs(w).max()
    put(w, bar(s) - env.argmax() / SR, 0.26)

def write(path, x):
    with wave.open(path, "wb") as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())

def r128(path):
    o = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr.split("Summary:")[-1].split()
    return float(o[o.index("I:") + 1]), float(o[o.index("Peak:") + 1])

# Master: gain to -16 LUFS integrated, a limiter catches the mallet transients under -1 dBTP.
OUT, TMP = "assets/audio/mix.wav", "assets/audio/mix-pre.wav"
MUSIC_DB = -3  # music under the cues
mix = (music * 10 ** (MUSIC_DB / 20) + sfx[:, None]) * 0.5
write(TMP, mix)
write(TMP, mix * 10 ** ((-16 - r128(TMP)[0]) / 20))
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", TMP, "-af",
                "alimiter=limit=0.75:attack=1:release=60:level=false", "-c:a", "pcm_s16le", OUT], check=True)
os.remove(TMP)
i, tp = r128(OUT)
assert abs(i + 16) < 0.3 and tp < -1, (i, tp)
print(f"{OUT}: {i} LUFS, {tp} dBTP, {len(cues)} cues, {len(seams)} whooshes, {n / SR:.3f} s")
