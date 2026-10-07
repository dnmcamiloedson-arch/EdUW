"""Original calm lo-fi track for the Huerto / inclusion video (pure stdlib).

96 BPM, so every 5 s scene is exactly two bars. Electric piano + marimba arp,
soft drums enter at 5 s, final chord rings out from 30 s.
Usage: python3 -I music-huerto.py OUT_DIR
"""
import math
import os
import sys

OUT = sys.argv[1]
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../westhill-feria-recap/assets/audio"))
sys.argv = [sys.argv[0], OUT]
import synth as S  # noqa: E402

SR = S.SR
BEAT = 60 / 96
BAR = 4 * BEAT
DRUMS_IN = 5.0
OUTRO = 30.0
DUR = 35.5

# Dmaj7 - Bm7 - Gmaj7 - A6, one chord per bar
CHORDS = [
    (73.42, (293.66, 369.99, 440.0, 554.37)),
    (61.74, (246.94, 293.66, 369.99, 440.0)),
    (98.0, (392.0, 493.88, 587.33, 739.99)),
    (55.0, (277.18, 329.63, 369.99, 440.0)),
]
ARP = [0, 2, 1, 3, None, 2, 1, None]


def epiano(freqs, sec):
    out = S.buf(sec)
    for f in freqs:
        for i in range(len(out)):
            t = i / SR
            trem = 1 + 0.12 * math.sin(2 * math.pi * 4.5 * t)
            out[i] += (math.sin(2 * math.pi * f * t) + 0.22 * math.sin(4 * math.pi * f * t)) * math.exp(-t * 1.4) * trem * min(1, i / 300)
    return out


def marimba(f, sec=0.6):
    out = S.buf(sec)
    for i in range(len(out)):
        t = i / SR
        out[i] = (math.sin(2 * math.pi * f * t) + 0.25 * math.sin(8 * math.pi * f * t) * math.exp(-t * 30)) * math.exp(-t * 6)
    return out


def bass(f, sec):
    out = S.buf(sec)
    for i in range(len(out)):
        t = i / len(out)
        p = 2 * math.pi * f * i / SR
        out[i] = (math.sin(p) + 0.35 * math.sin(2 * p)) * min(1, i / 400) * (1 - t) ** 0.7
    return out


def main():
    mix = S.buf(DUR)
    K, C, H = S.kick(), S.clap(), S.hat()
    keys = [epiano(c[1], BAR * 1.2) for c in CHORDS]
    mar = {f: marimba(f * 2) for c in CHORDS for f in c[1]}
    pads = [S.saw_chord(c[1], BAR, 900) for c in CHORDS]

    n = 0
    while n * BAR < OUTRO - 0.01:
        t0 = n * BAR
        ci = n % 4
        root, tones = CHORDS[ci]
        S.add(mix, keys[ci], t0, 0.5)
        S.add(mix, pads[ci], t0, 0.07)
        for k, a in enumerate(ARP):
            if a is not None and (n > 0 or k >= 4):
                S.add(mix, mar[tones[a]], t0 + k * BEAT / 2, 0.22)
        if t0 >= DRUMS_IN - 0.01:
            S.add(mix, bass(root, BAR * 0.48), t0, 0.5)
            S.add(mix, bass(root, BAR * 0.45), t0 + 2 * BEAT, 0.4)
            for b in (0, 2.5):
                S.add(mix, K, t0 + b * BEAT, 0.45)
            for b in (1, 3):
                S.add(mix, C, t0 + b * BEAT, 0.16)
            for k in range(16):
                S.add(mix, H, t0 + k * BEAT / 4, 0.09 if k % 2 else 0.05)
        n += 1

    # outro: last chord rings out with a slow descending arp
    S.add(mix, epiano(CHORDS[0][1], 5.0), OUTRO, 0.6)
    S.add(mix, S.saw_chord(CHORDS[0][1], 5.0, 1200), OUTRO, 0.12)
    S.add(mix, bass(CHORDS[0][0], 3.5), OUTRO, 0.45)
    for k, a in enumerate((3, 2, 1, 0, 2, 1)):
        S.add(mix, mar[CHORDS[0][1][a]], OUTRO + k * BEAT, 0.25 * (1 - k / 8))

    for i in range(len(mix)):
        t = i / SR
        if t < 0.4:
            mix[i] *= t / 0.4
        if t > DUR - 3:
            mix[i] *= max(0, (DUR - t) / 3)
    S.write("music-huerto", mix, 0.85)


if __name__ == "__main__":
    main()
    print("ok")
