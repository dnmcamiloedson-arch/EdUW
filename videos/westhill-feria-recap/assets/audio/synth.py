"""Original music bed + TikTok-style SFX for the Westhill job fair recap.

Pure-stdlib synthesis (no samples, no third-party audio). Writes 16-bit WAVs.
Usage: python3 -I synth.py OUT_DIR
"""
import math
import random
import struct
import sys
import wave
from array import array

SR = 44100
OUT = sys.argv[1]
rng = random.Random(7)


def buf(sec):
    return array("f", bytes(4 * int(sec * SR)))


def write(name, data, gain=1.0):
    peak = max(1e-9, max(abs(x) for x in data))
    g = gain / peak
    with wave.open(f"{OUT}/{name}.wav", "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x * g)) * 32000)) for x in data))


def add(dst, src, at, gain=1.0):
    o = int(at * SR)
    n = min(len(src), len(dst) - o)
    for i in range(max(0, -o), n):
        dst[o + i] += src[i] * gain


def onepole(data, cutoff_fn):
    """Low-pass with a per-sample cutoff (Hz) function of normalized time."""
    y = 0.0
    out = array("f", data)
    n = len(data)
    for i in range(n):
        c = cutoff_fn(i / n)
        a = 1 - math.exp(-2 * math.pi * c / SR)
        y += a * (data[i] - y)
        out[i] = y
    return out


def noise(sec):
    return array("f", (rng.uniform(-1, 1) for _ in range(int(sec * SR))))


def env(data, attack, decay_shape):
    n = len(data)
    a = max(1, int(attack * SR))
    for i in range(n):
        t = i / n
        e = min(1, i / a) * decay_shape(t)
        data[i] *= e
    return data


# ---------------------------------------------------------------- SFX
def whoosh(sec=0.55, lo=300, hi=6000):
    d = noise(sec)
    # band sweep: high-pass via difference of two low-passes
    a = onepole(d, lambda t: lo + (hi - lo) * math.sin(math.pi * t) ** 2)
    b = onepole(d, lambda t: lo * 0.5)
    out = array("f", (x - y for x, y in zip(a, b)))
    return env(out, sec * 0.45, lambda t: math.sin(math.pi * t) ** 1.5)


def swish(sec=0.28):
    d = noise(sec)
    a = onepole(d, lambda t: 9000 - 6000 * t)
    b = onepole(d, lambda t: 1500)
    out = array("f", (x - y for x, y in zip(a, b)))
    return env(out, 0.02, lambda t: (1 - t) ** 2)


def pop(f0=900, f1=180, sec=0.12):
    out = buf(sec)
    ph = 0
    for i in range(len(out)):
        t = i / len(out)
        f = f1 + (f0 - f1) * (1 - t) ** 3
        ph += 2 * math.pi * f / SR
        out[i] = math.sin(ph) * (1 - t) ** 2
    return out


def ding(freqs=(1318.5, 1975.5), sec=0.9, gap=0.11):
    out = buf(sec)
    for k, f in enumerate(freqs):
        st = int(k * gap * SR)
        for i in range(st, len(out)):
            t = (i - st) / SR
            e = math.exp(-t * 6)
            out[i] += e * (math.sin(2 * math.pi * f * t) + 0.35 * math.sin(2 * math.pi * f * 2.01 * t) + 0.12 * math.sin(2 * math.pi * f * 3.02 * t))
    return out


def shutter():
    out = buf(0.22)
    for at, g in ((0.0, 1.0), (0.085, 0.7)):
        c = noise(0.035)
        c = onepole(c, lambda t: 6000)
        env(c, 0.001, lambda t: (1 - t) ** 3)
        add(out, c, at, g)
    return out


def boom(sec=1.6):
    out = buf(sec)
    ph = 0
    for i in range(len(out)):
        t = i / SR
        f = 38 + 90 * math.exp(-t * 9)
        ph += 2 * math.pi * f / SR
        s = math.sin(ph)
        out[i] = math.tanh(2.2 * s) * math.exp(-t * 2.2)
    click = noise(0.02)
    env(click, 0.0005, lambda t: (1 - t) ** 4)
    add(out, click, 0, 0.5)
    return out


def riser(sec=1.9):
    d = noise(sec)
    a = onepole(d, lambda t: 400 + 9000 * t ** 2)
    out = buf(sec)
    ph = 0
    for i in range(len(out)):
        t = i / len(out)
        f = 180 * 2 ** (3 * t)
        ph += 2 * math.pi * f / SR
        out[i] = (0.6 * a[i] + 0.25 * math.sin(ph) + 0.15 * math.sin(ph * 1.5)) * t ** 2
    return out


def tick():
    c = noise(0.018)
    c = onepole(c, lambda t: 7000)
    return env(c, 0.0005, lambda t: (1 - t) ** 3)


# ---------------------------------------------------------------- MUSIC
BPM = 120
BEAT = 60 / BPM
DUR = 36.5
DROP = 2.0


def kick():
    out = buf(0.4)
    ph = 0
    for i in range(len(out)):
        t = i / SR
        f = 48 + 140 * math.exp(-t * 30)
        ph += 2 * math.pi * f / SR
        out[i] = math.tanh(1.8 * math.sin(ph)) * math.exp(-t * 7)
    return out


def clap():
    out = buf(0.3)
    for k in range(3):
        c = noise(0.25)
        a = onepole(c, lambda t: 5000)
        b = onepole(c, lambda t: 900)
        c = array("f", (x - y for x, y in zip(a, b)))
        env(c, 0.001, lambda t: math.exp(-t * (14 if k < 2 else 6)))
        add(out, c, k * 0.011, 0.8 if k < 2 else 1)
    return out


def hat(open_=False):
    sec = 0.18 if open_ else 0.05
    c = noise(sec)
    a = onepole(c, lambda t: 16000)
    b = onepole(c, lambda t: 7000)
    c = array("f", (x - y for x, y in zip(a, b)))
    return env(c, 0.001, lambda t: (1 - t) ** (2 if open_ else 4))


def saw_chord(freqs, sec, bright):
    out = buf(sec)
    for f in freqs:
        for det in (-0.12, 0, 0.12):
            ff = f * 2 ** (det / 12)
            ph = rng.random()
            inc = ff / SR
            for i in range(len(out)):
                ph += inc
                ph -= int(ph)
                out[i] += (2 * ph - 1) * 0.18
    out = onepole(out, lambda t: bright * (1 - 0.6 * t) + 300)
    return env(out, 0.004, lambda t: (1 - t) ** 1.6)


def bass_note(f, sec):
    out = buf(sec)
    ph = 0
    for i in range(len(out)):
        ph += 2 * math.pi * f / SR
        out[i] = math.tanh(1.6 * (math.sin(ph) + 0.3 * math.sin(2 * ph)))
    return env(out, 0.005, lambda t: (1 - t) ** 0.8)


# Progression: F#m - D - A - E (vi-IV-I-V in A), one chord per bar
CHORDS = [
    (185.0, (369.99, 440.0, 554.37)),
    (146.83, (293.66, 369.99, 440.0)),
    (110.0, (329.63, 440.0, 554.37)),
    (164.81, (329.63, 415.30, 493.88)),
]


def music():
    mix = buf(DUR)
    K, C, H, O = kick(), clap(), hat(), hat(True)
    stabs = [saw_chord(ch[1], BEAT * 0.45, 3800) for ch in CHORDS]
    pads = [saw_chord(ch[1], BEAT * 4, 1400) for ch in CHORDS]
    basses = [bass_note(ch[0] / 2, BEAT * 0.45) for ch in CHORDS]

    # intro (0-2 s): filtered pad only
    add(mix, pads[0], 0.0, 0.5)
    t = DROP
    beat = 0
    while t < DUR - 2.5:
        bar = beat // 4
        ci = bar % 4
        pos = beat % 4
        breakdown = 27.8 <= t < 30.8   # photo dump: lighter groove
        add(mix, K, t, 1.0)
        if pos in (1, 3):
            add(mix, C, t, 0.55)
        add(mix, H, t + BEAT / 2, 0.22)
        if pos == 3:
            add(mix, O, t + BEAT / 2, 0.18)
        add(mix, basses[ci], t + BEAT / 2, 0.25 if breakdown else 0.42)
        # stab pattern: off-beat 8ths with a syncopated push
        for off in ((0.5, 1.5, 2.75) if pos == 0 else (0.5,) if pos == 2 else ()):
            add(mix, stabs[ci], t + off * BEAT, 0.33)
        if pos == 0:
            add(mix, pads[ci], t, 0.16)
        beat += 1
        t = DROP + beat * BEAT
    # outro: final chord ring + soft pad
    add(mix, K, t, 1.0)
    add(mix, pads[0], t, 0.4)
    add(mix, stabs[0], t, 0.4)

    # sidechain pump from the kick grid
    for i in range(len(mix)):
        tt = i / SR
        if tt >= DROP:
            ph = ((tt - DROP) % BEAT) / BEAT
            mix[i] *= 0.45 + 0.55 * min(1, ph * 4) if ph < 0.25 else 1
    # gentle master fade-out
    for i in range(len(mix)):
        tt = i / SR
        if tt > DUR - 3:
            mix[i] *= max(0, (DUR - tt) / 3)
    return mix


if __name__ == "__main__":
    for name, fn in [
        ("whoosh", lambda: whoosh()),
        ("whoosh-long", lambda: whoosh(0.9, 200, 7000)),
        ("swish", swish),
        ("pop", lambda: pop()),
        ("pop-hi", lambda: pop(1500, 400, 0.09)),
        ("ding", lambda: ding()),
        ("notif", lambda: ding((1567.98, 2093.0), 0.7, 0.09)),
        ("shutter", shutter),
        ("boom", boom),
        ("riser", riser),
        ("tick", tick),
    ]:
        write(name, fn(), 0.9)
        print("sfx", name)
    write("music", music(), 0.9)
    print("music done")
