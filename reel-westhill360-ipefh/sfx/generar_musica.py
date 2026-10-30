"""Pista musical original (libre de derechos) para el reel: pop/house a 120 BPM, sin voz.

Estructura alineada al montaje (1 compás = 2 s):
  0–6 s   intro: pads filtrados + riser → DROP en 6 s (fin de la intro animada)
  6–58 s  groove completo (bombo 4/4, clap, hats, bajo, acordes con sidechain, arpegio)
          con un mini-break de 1 compás en 36–38 s (tarjeta de la dinámica del cornhole)
  58–72 s cierre: pads + arpegio suave, golpe final
Uso: python3 generar_musica.py <salida.wav> [duracion_seg] [fin_groove_seg] [inicio_break_seg] [drop_seg]
"""
import sys, wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
BPM = 120
BEAT = 60 / BPM
OUT = sys.argv[1]
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 72.0
N = int(SR * DUR)
rng = np.random.default_rng(3)

L = np.zeros(N); R = np.zeros(N)


def add(x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    x = x[: N - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * gain * l * 1.414
    R[i:i + len(x)] += x * gain * r * 1.414


def filt(x, f, kind='low', order=2):
    b, a = butter(order, np.clip(f / (SR / 2), 1e-4, 0.99), kind)
    return lfilter(b, a, x)


def tt(d):
    return np.arange(int(SR * d)) / SR


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def saw(f, d, detune=0.0):
    t = tt(d)
    ph = (t * f * (1 + detune)) % 1
    return 2 * ph - 1


# ---------- instrumentos ----------
def kick():
    t = tt(0.45)
    f = 50 + 110 * np.exp(-t * 35)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    click = filt(rng.standard_normal(len(t)), 3000, 'high') * np.exp(-t * 300) * 0.3
    return np.tanh((x + click) * 1.6)


def clap():
    t = tt(0.3)
    n = filt(filt(rng.standard_normal(len(t)), 900, 'high'), 4500, 'low')
    env = np.zeros(len(t))
    for k, o in enumerate((0, 0.011, 0.022)):
        i = int(o * SR); env[i:] += np.exp(-(t[: len(t) - i]) * (90 if k < 2 else 18))
    return n * env * 0.8


def hat(open_=False):
    t = tt(0.25 if open_ else 0.06)
    return filt(rng.standard_normal(len(t)), 8000, 'high') * np.exp(-t * (14 if open_ else 70))


def bass(note, d):
    t = tt(d)
    f = midi(note)
    x = 0.7 * np.sin(2 * np.pi * f * t) + 0.35 * filt(saw(f, d), 600)
    env = np.minimum(1, t * 200) * np.exp(-t * 3)
    return np.tanh(x * env * 1.5)


def pad(notes, d, cutoff=2200):
    t = tt(d)
    x = sum(saw(midi(n), d, dt) for n in notes for dt in (-0.004, 0.0, 0.0045))
    x = filt(x / (len(notes) * 3), cutoff, 'low', 2)
    env = np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.2)
    return x * env


def pluck(note, d=0.22):
    t = tt(d)
    x = saw(midi(note), d) * 0.6 + np.sin(2 * np.pi * midi(note) * t) * 0.4
    return filt(x, 3500) * np.exp(-t * 16)


def riser(d):
    t = tt(d)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t)); seg = int(SR * 0.05)
    for i in range(0, len(t), seg):  # filtro que se abre por tramos
        f = 400 + 9000 * (i / len(t)) ** 2
        out[i:i + seg] = filt(n[i:i + seg], f)
    return out * (t / d) ** 2


def crash():
    t = tt(2.5)
    return filt(rng.standard_normal(len(t)), 5000, 'high') * np.exp(-t * 1.8)


# ---------- armonía: Am – F – C – G (1 acorde por compás) ----------
PROG = [(57, [57, 60, 64, 69]), (53, [53, 57, 60, 65]), (48, [55, 60, 64, 67]), (55, [55, 59, 62, 67])]
BAR = 4 * BEAT
n_bars = int(np.ceil(DUR / BAR))
DROP = float(sys.argv[5]) if len(sys.argv) > 5 else 6.0  # segundo del drop (múltiplo de 2 s = 1 compás)
END_GROOVE = float(sys.argv[3]) if len(sys.argv) > 3 else 58.0
_b = float(sys.argv[4]) if len(sys.argv) > 4 else 36.0
BREAK = (_b, _b + 2.0)  # 1 compás de respiro

sidechain = np.ones(N)


def duck(tb):
    i = int(tb * SR); w = min(int(0.25 * SR), N - i)
    if w > 0:
        sidechain[i:i + w] = np.minimum(sidechain[i:i + w], 0.35 + 0.65 * np.linspace(0, 1, w) ** 0.6)


for b in range(n_bars):
    t0 = b * BAR
    root, chord = PROG[b % 4]
    in_break = BREAK[0] <= t0 < BREAK[1]
    groove = DROP <= t0 < END_GROOVE and not in_break
    # pads (se abren durante la intro)
    cutoff = 900 + 1500 * (t0 / DROP) if t0 < DROP else (2600 if groove else 1600)
    add(pad([n + 12 for n in chord], BAR, cutoff), t0, 0.26 if groove else 0.33)
    # arpegio en corcheas desde el compás 2
    if t0 >= 2 * BAR:
        for e in range(8):
            n = chord[[0, 2, 1, 3, 2, 1, 3, 2][e]] + 12
            add(pluck(n), t0 + e * BEAT / 2, 0.12 if groove else 0.08, -0.4 if e % 2 else 0.4)
    for k in range(4):
        tb = t0 + k * BEAT
        if groove:
            add(kick(), tb, 0.95); duck(tb)
            if k in (1, 3):
                add(clap(), tb, 0.55, 0.05)
            add(hat(), tb + BEAT / 2, 0.22, 0.25)
            add(hat(), tb + BEAT / 4, 0.08, -0.25)
            add(hat(), tb + 3 * BEAT / 4, 0.08, -0.25)
            add(bass(root - 12, BEAT / 2 - 0.02), tb + BEAT / 2, 0.55)
        else:
            add(hat(), tb + BEAT / 2, 0.06, 0.2)

# sidechain sobre pads/arpegio ya mezclados (aprox.: se aplica a todo menos bombo, suficiente para "bombeo")
L *= 0.75 + 0.25 * sidechain; R *= 0.75 + 0.25 * sidechain

# FX de estructura
add(riser(3.0), DROP - 3.0, 0.25)
add(crash(), DROP, 0.35)
add(riser(2.0), BREAK[1] - 2.0, 0.22)
add(crash(), BREAK[1], 0.3)
add(crash(), END_GROOVE, 0.3)
add(kick(), END_GROOVE, 0.9)

# fade final
fade = int(SR * 4)
env = np.ones(N); env[-fade:] = np.linspace(1, 0, fade) ** 2
mix = np.stack([L * env, R * env], 1)
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.4)  # pegamento suave
mix = mix / np.abs(mix).max() * 10 ** (-1.0 / 20)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', OUT, f'{DUR}s')
