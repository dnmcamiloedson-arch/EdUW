"""Original future-bass track for the Westhill thank-you video (pure stdlib).

Half-time feel at 960/7 BPM so each company block (3.5 s) is exactly two bars.
Reuses the instruments from the recap synth. Usage: python3 -I music-gracias.py OUT_DIR
"""
import math
import os
import sys
from array import array

OUT = sys.argv[1]
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../westhill-feria-recap/assets/audio"))
sys.argv = [sys.argv[0], OUT]
import synth as S  # noqa: E402

SR = S.SR
BEAT = 60 / (960 / 7)
BAR = 4 * BEAT
STEP = BEAT / 4
DROP = 3.0    # end of the intro
END = 31.0    # end card starts
LOGO = 34.5   # logo reveal
DUR = 38.6

# Royal-road progression in C: Fmaj7 - G - Em7 - Am7, one chord per bar
CHORDS = [
    (87.31, (349.23, 440.0, 523.25, 659.25)),
    (98.0, (392.0, 493.88, 587.33, 783.99)),
    (82.41, (329.63, 392.0, 493.88, 587.33)),
    (110.0, (440.0, 523.25, 659.25, 783.99)),
]
ARP = [0, 2, 1, 3, 2, 1, 3, 2]


def pluck(f, sec=0.45):
    out = S.buf(sec)
    for i in range(len(out)):
        t = i / SR
        out[i] = (math.sin(2 * math.pi * f * t) + 0.4 * math.sin(4 * math.pi * f * t) + 0.12 * math.sin(6 * math.pi * f * t)) * math.exp(-t * 9)
    return out


def sub(f, sec):
    out = S.buf(sec)
    for i in range(len(out)):
        t = i / len(out)
        out[i] = math.sin(2 * math.pi * f * i / SR) * min(1, i / 200) * (1 - t) ** 0.6
    return out


def bar_time(n):
    return DROP + n * BAR


def main():
    music, drums = S.buf(DUR), S.buf(DUR)
    K, C, H = S.kick(), S.clap(), S.hat()
    pads = [S.saw_chord(c[1], BAR, 1600) for c in CHORDS]
    stabs = [S.saw_chord(c[1], STEP * 2.2, 5200) for c in CHORDS]
    plucks = {f: pluck(f * 2) for c in CHORDS for f in c[1]}
    kicks = []

    # intro: two bars of soft pad + arp, then the drop
    for n in (-2, -1):
        t0 = bar_time(n)
        ci = n % 4
        if t0 >= 0:
            S.add(music, pads[ci], t0, 0.35)
        for k, a in enumerate(ARP):
            tt = t0 + k * BEAT / 2
            if tt >= 0:
                S.add(music, plucks[CHORDS[ci][1][a]], tt, 0.35 + 0.05 * k)

    n = 0
    while bar_time(n) < LOGO - 0.01:
        t0 = bar_time(n)
        ci = n % 4
        root, tones = CHORDS[ci]
        light = t0 >= END   # end card: drop the stabs, keep the groove
        # drums: half-time kick/snare, 8th hats, 16th hat roll every 4th bar
        for b in (0, 2.5):
            S.add(drums, K, t0 + b * BEAT, 1.0)
            kicks.append(t0 + b * BEAT)
        S.add(drums, C, t0 + 2 * BEAT, 0.7)
        for k in range(8):
            S.add(drums, H, t0 + k * BEAT / 2 + BEAT / 4, 0.2)
        if n % 4 == 3:
            for k in range(8):
                S.add(drums, H, t0 + 2 * BEAT + k * STEP, 0.12 + 0.02 * k)
        # sub bass
        S.add(music, sub(root, BAR * 0.95), t0, 0.55)
        # supersaw stabs in a syncopated future-bass rhythm
        if not light:
            for s in (0, 3, 6, 10, 12, 14):
                S.add(music, stabs[ci], t0 + s * STEP, 0.32)
        S.add(music, pads[ci], t0, 0.12)
        # arp melody
        for k, a in enumerate(ARP):
            S.add(music, plucks[tones[a]], t0 + k * BEAT / 2, 0.22 if not light else 0.3)
        n += 1

    # logo hit: big chord ring-out
    S.add(drums, K, LOGO, 1.0)
    ring = S.saw_chord(CHORDS[0][1], 3.6, 2400)
    S.add(music, ring, LOGO, 0.6)
    S.add(music, sub(CHORDS[0][0], 3.0), LOGO, 0.6)
    for k, a in enumerate(ARP):
        S.add(music, plucks[CHORDS[0][1][a]], LOGO + k * BEAT, 0.3 * (1 - k / 9))

    # sidechain the melodic bus to the kicks
    gain = array("f", [1.0]) * len(music)
    span = int(0.2 * SR)
    for kt in kicks:
        o = int(kt * SR)
        for j in range(min(span, len(gain) - o)):
            gain[o + j] = 0.3 + 0.7 * j / span
    for i in range(len(music)):
        music[i] = music[i] * gain[i] + drums[i]
    for i in range(len(music)):
        t = i / SR
        if t > DUR - 2.5:
            music[i] *= max(0, (DUR - t) / 2.5)
    S.write("music-gracias", music, 0.9)


if __name__ == "__main__":
    main()
    print("ok")
