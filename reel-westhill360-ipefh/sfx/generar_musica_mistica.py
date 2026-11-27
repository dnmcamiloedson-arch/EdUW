"""Pista original (libre de derechos) mística y ambiental, 80 BPM (1 compás = 3 s = 90 cuadros), sin voz.

Dron grave con viento, colchón de cuerdas suave, campanitas de cristal, un "handpan" (tambor de acero) en
corcheas, latido de tambor grave, flauta con vibrato y una reverberación larga por convolución.
Re menor: Dm – B♭maj7 – Gm9 – A(sus4→A), dos compases por acorde. Todo compuesto aquí; no copia ninguna canción.

Estructura en compases: 0–A dron y campanas; A–B entra el handpan y el colchón; B–C completa (latido, flauta);
C–D se calma; en D un acorde final que brilla y una cola larga.
Uso: python3 generar_musica_mistica.py <salida.wav> <A> <B> <C> <D> <duración total en s>
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter

SR = 44100
BPM = 80
BEAT = 60 / BPM
BAR = 4 * BEAT
OUT = sys.argv[1]
A = int(sys.argv[2]) if len(sys.argv) > 2 else 2
B = int(sys.argv[3]) if len(sys.argv) > 3 else 6
C = int(sys.argv[4]) if len(sys.argv) > 4 else 10
D = int(sys.argv[5]) if len(sys.argv) > 5 else 12
DUR = float(sys.argv[6]) if len(sys.argv) > 6 else D * BAR + 8
N = int(SR * DUR)
rng = np.random.default_rng(21)
L = np.zeros(N)
R = np.zeros(N)
RL = np.zeros(N)
RR = np.zeros(N)


def add(x, t0, gain=1.0, pan=0.0, rev=0.3):
    i = int(t0 * SR)
    if i >= N or i + len(x) <= 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: N - i] * gain
    gl = np.cos((pan + 1) * np.pi / 4) * 1.414
    gr = np.sin((pan + 1) * np.pi / 4) * 1.414
    L[i:i + len(x)] += x * gl
    R[i:i + len(x)] += x * gr
    RL[i:i + len(x)] += x * gl * rev
    RR[i:i + len(x)] += x * gr * rev


def tt(d):
    return np.arange(int(SR * d)) / SR


def hz(n):
    return 440 * 2 ** ((n - 69) / 12)


def lp(x, f, o=2):
    b, a = butter(o, min(f, SR / 2 - 100) / (SR / 2), 'low')
    return lfilter(b, a, x)


def hp(x, f, o=2):
    b, a = butter(o, f / (SR / 2), 'high')
    return lfilter(b, a, x)


def colchon(notas, d, ataque=2.0, brillo=1100):
    t = tt(d)
    x = np.zeros_like(t)
    for n in notas:
        for c in (-8, -3, 3, 8):
            f = hz(n) * 2 ** (c / 1200) * (1 + 0.002 * np.sin(2 * np.pi * 0.3 * t + rng.random() * 6))
            fase = np.cumsum(f) / SR + rng.random()
            x += 2 * (fase % 1) - 1
    x = lp(x, brillo, 2) / (4 * len(notas))
    return x * np.minimum(1, t / ataque) * np.minimum(1, (d - t) / 1.5)


def campana(n, d=4.0):
    t = tt(d)
    f = hz(n)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.1) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)
    return x * np.minimum(1, t / 0.002)


def handpan(n, d=2.2, vel=1.0):
    t = tt(d)
    f = hz(n)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.8) + 0.4 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 5)
    golpe = lp(rng.standard_normal(len(t)), 1200) * np.exp(-t * 60) * 0.15
    return (x + golpe) * np.minimum(1, t / 0.006) * vel


def tambor():
    t = tt(1.0)
    f = 55 + 40 * np.exp(-t * 12)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4)
    return np.tanh(1.3 * x) + lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 25) * 0.2


def shaker():
    t = tt(0.12)
    return hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 40) * np.minimum(1, t / 0.02)


def flauta(frase, d):
    """frase = [(inicio s, midi o None)] con deslizamiento entre notas y vibrato"""
    t = tt(d)
    f = np.full_like(t, np.nan)
    for t0, n in frase:
        f[t >= t0] = np.nan if n is None else hz(n)
    activo = ~np.isnan(f)
    f = np.where(activo, f, hz(next(n for _, n in frase if n)))
    b, a = butter(1, 12 / (SR / 2))
    f = lfilter(b, a, f) * (1 + 0.006 * np.sin(2 * np.pi * 5.0 * t))
    fase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(fase) + 0.18 * np.sin(2 * fase) + 0.05 * np.sin(3 * fase)
    aire = lp(hp(rng.standard_normal(len(t)), 1500), 6000) * 0.12
    env = lp(activo.astype(float), 6)
    return (x + aire) * env


def viento(d):
    t = tt(d)
    x = lp(rng.standard_normal(len(t)), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t))
    return x


# Dm – B♭maj7 – Gm9 – A: (raíz, notas del colchón)
ACORDES = [(38, [62, 65, 69, 72]), (34, [62, 65, 69, 70]), (31, [62, 65, 67, 70]), (33, [61, 64, 69, 74])]
PENTA = [62, 65, 67, 69, 72, 74, 77, 79, 81]
# handpan: una figura de corcheas por acorde (solo notas del acorde y de la escala)
HANDPAN = [
  [50, 57, 62, 65, 64, 62, 57, 60],  # Dm
  [46, 53, 58, 62, 65, 62, 57, 53],  # B♭maj7
  [43, 50, 55, 58, 57, 55, 50, 53],  # Gm9
  [45, 52, 57, 61, 64, 61, 57, 52],  # A
]

# dron y viento de fondo todo el tiempo
add(viento(DUR) * 0.5, 0, 0.12, 0, 0.6)
for b in range(0, D, 2):
    raiz, notas = ACORDES[(b // 2) % 4]
    t0 = b * BAR
    d = 2 * BAR + 1.5
    tt_ = tt(d)
    dron = (np.sin(2 * np.pi * hz(raiz) * tt_) + 0.5 * np.sin(2 * np.pi * hz(raiz + 7) * tt_)) * np.minimum(1, tt_ / 1.5) * np.minimum(1, (d - tt_) / 1.5)
    add(dron, t0, 0.2, 0, 0.2)
    if b >= A:
        add(colchon(notas, d, 2.0, 1000 if b < B else 1500), t0, 0.32 if b < B else 0.4, 0, 0.6)
    if b >= B and b < C:
        add(colchon([n + 12 for n in notas[:3]], d, 2.5, 1800), t0, 0.16, 0.2, 0.7)

# campanitas de cristal (más espaciadas al inicio y en la calma)
for b in range(D):
    densidad = 2 if (b < A or b >= C) else 4
    for k in range(densidad):
        n = PENTA[rng.integers(3, len(PENTA))] + 12
        add(campana(n), b * BAR + k * BAR / densidad + rng.random() * 0.15, 0.06, rng.uniform(-0.7, 0.7), 0.8)

# handpan en corcheas desde A
for b in range(A, D):
    figura = HANDPAN[(b // 2) % 4]
    for j, n in enumerate(figura):
        x = j * 0.5
        vel = 0.9 if x in (0, 2) else 0.6
        add(handpan(n + 12, 2.0, vel), b * BAR + x * BEAT, 0.12 if b < B else 0.15, -0.3 + 0.15 * (x % 4), 0.4)

# latido y shaker en la parte completa
for b in range(B, C):
    for x in (0, 0.5, 2, 2.5):
        add(tambor(), b * BAR + x * BEAT, 0.42 if x in (0, 2) else 0.25, 0, 0.25)
    for s in range(8):
        add(shaker(), b * BAR + s * BEAT / 2, 0.05, 0.4, 0.3)

# flauta: dos frases en la parte completa
FRASE = [(0, 69), (1.5, 72), (2.25, 74), (3, 72), (4.5, 69), (6, 67), (7.5, 69), (9, None)]
FRASE2 = [(0, 74), (1.5, 77), (2.25, 76), (3, 74), (4.5, 72), (6, 69), (7.5, 70), (8.25, 69), (10.5, None)]
add(flauta([(x * BEAT, n) for x, n in FRASE], 9 * BEAT + 0.5), B * BAR + BEAT, 0.14, 0.15, 0.6)
add(flauta([(x * BEAT, n) for x, n in FRASE2], 10.5 * BEAT + 0.5), (B + 2) * BAR + BEAT, 0.14, 0.15, 0.6)

# platillo suave invertido antes de B y del acorde final
for sec in (B, D):
    d = 2.5
    t = tt(d)
    add(hp(rng.standard_normal(len(t)), 4000) * (t / d) ** 3, sec * BAR - d, 0.12, 0, 0.5)

# acorde final que brilla: Re mayor (picardía) con campanas y colchón amplio
T = D * BAR
fin = DUR - T
add(tambor(), T, 0.6, 0, 0.4)
add(colchon([50, 57, 62, 66, 69, 74], fin, 0.3, 1600), T, 0.5, 0, 0.7)
for j, n in enumerate([74, 78, 81, 86, 90]):
    add(campana(n, 5.0), T + j * 0.12, 0.08, -0.6 + 0.3 * j, 0.9)
for j, n in enumerate([50, 57, 62, 66]):
    add(handpan(n + 12, 3.5), T + j * 0.08, 0.14, -0.3 + 0.2 * j, 0.5)

# reverberación larga por convolución
dr = 4.5
ti = tt(dr)
irs = []
for _ in range(2):
    ir = lp(rng.standard_normal(len(ti)), 4500) * np.exp(-ti * 1.4) * np.minimum(1, ti / 0.02)
    irs.append(ir / np.sqrt((ir ** 2).sum()))
pre = int(0.03 * SR)
wl = fftconvolve(RL, irs[0])[:N]
wr = fftconvolve(RR, irs[1])[:N]
L[pre:] += wl[:-pre]
R[pre:] += wr[:-pre]

L = hp(L, 30)
R = hp(R, 30)
fi = int(SR * 1.5)
fo = int(SR * 3.0)
env = np.ones(N)
env[:fi] = np.linspace(0, 1, fi)
env[-fo:] = np.linspace(1, 0, fo) ** 2
st = np.stack([L * env, R * env], 1)
st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.25)
st = st / np.abs(st).max() * 10 ** (-1.0 / 20)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', OUT, f'{DUR:.2f}s', 'acorde final en', f'{T:.2f}s')
