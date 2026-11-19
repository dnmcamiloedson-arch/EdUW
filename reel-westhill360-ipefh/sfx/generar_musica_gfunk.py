"""Pista original (libre de derechos) con sabor a hip-hop de la costa oeste de los 90 (G-funk), 92 BPM, sin voz.

Batería boom-bap con swing (bombo, caja con palmada, hats en corcheas), bajo grueso con deslizamientos, acordes
de piano eléctrico y la melodía aguda "silbada" con portamento y vibrato típica del género. Al final, un remate
propio de "misión cumplida": el ritmo se corta, sube un arpegio de metales en mayor y cae un golpe grande con
campanita y cola larga. Todo compuesto aquí; no copia ninguna canción ni jingle existente.

Uso: python3 generar_musica_gfunk.py <salida.wav> <compases_de_groove>
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
BPM = 92
BEAT = 60 / BPM
BAR = 4 * BEAT
OUT = sys.argv[1]
GROOVE = int(sys.argv[2]) if len(sys.argv) > 2 else 6
INTRO = 1  # compases de entrada
REMATE = INTRO + GROOVE  # compás donde entra el remate
DUR = REMATE * BAR + 4.2
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)
SW = 0.14 * BEAT  # swing de las corcheas


def add(x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    x = x[: N - i]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * gain * l * 1.414
    R[i:i + len(x)] += x * gain * r * 1.414


def tt(d):
    return np.arange(int(SR * d)) / SR


def hz(n):
    return 440 * 2 ** ((n - 69) / 12)


def lp(x, f, order=2):
    b, a = butter(order, min(f, SR / 2 - 100) / (SR / 2), 'low')
    return lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = butter(order, f / (SR / 2), 'high')
    return lfilter(b, a, x)


def bombo():
    t = tt(0.4)
    f = 45 + 110 * np.exp(-t * 28)
    return np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)) + 0.2 * rng.standard_normal(len(t)) * np.exp(-t * 250)


def caja():
    t = tt(0.3)
    ruido = hp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 14)
    cuerpo = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 22)
    palma = sum(hp(rng.standard_normal(len(t)), 1200) * np.exp(-np.maximum(0, t - d) * 40) * (t >= d) for d in (0, 0.009, 0.018))
    return 0.6 * ruido + 0.5 * cuerpo + 0.35 * palma


def hat(abierto=False):
    t = tt(0.22 if abierto else 0.05)
    return hp(rng.standard_normal(len(t)), 8000) * np.exp(-t * (16 if abierto else 85))


def bajo(notas, d):
    """notas: lista de (inicio relativo, midi); se desliza entre una y otra"""
    t = tt(d)
    f = np.zeros_like(t)
    for k, (t0, n) in enumerate(notas):
        f[t >= t0] = hz(n)
    # portamento: suaviza los saltos de frecuencia
    b, a = butter(1, 18 / (SR / 2))
    f = lfilter(b, a, f) + (f[0] - lfilter(b, a, f)[0]) * np.exp(-t * 40)
    fase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(fase) + 0.45 * np.sin(2 * fase) + 0.2 * np.sign(np.sin(fase))
    return lp(np.tanh(1.8 * x), 900) * np.minimum(1, t / 0.005) * np.minimum(1, (d - t) / 0.05)


def ep(notas, d):
    t = tt(d)
    out = sum(np.sin(2 * np.pi * hz(n) * t) * (np.exp(-t * 1.2) * 0.7 + 0.3) + 0.3 * np.sin(4 * np.pi * hz(n) * t) * np.exp(-t * 4) for n in notas)
    return out * (1 + 0.15 * np.sin(2 * np.pi * 5 * t)) * np.minimum(1, t / 0.006) * np.minimum(1, (d - t) / 0.08) / len(notas)


def silbido(frase, d):
    """melodía aguda con portamento y vibrato: frase = [(inicio, midi o None)]"""
    t = tt(d)
    f = np.full_like(t, np.nan)
    for t0, n in frase:
        f[t >= t0] = np.nan if n is None else hz(n)
    activo = ~np.isnan(f)
    f = np.where(activo, f, hz(frase[0][1] or 72))
    b, a = butter(1, 9 / (SR / 2))
    f = lfilter(b, a, f) * (1 + 0.012 * np.sin(2 * np.pi * 5.6 * t) * np.minimum(1, t / 0.4))
    fase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(fase) + 0.12 * np.sin(2 * fase) + 0.05 * np.sin(3 * fase)
    env = lp(activo.astype(float), 25)
    return x * env


def metal(n, d=0.5):
    t = tt(d)
    out = sum(2 * ((t * hz(n + c / 100)) % 1) - 1 for c in (-8, 0, 8))
    brillo = lp(out, 4200) * np.exp(-t * 6) + lp(out, 2200) * (1 - np.exp(-t * 6))
    return np.tanh(brillo / 2) * np.minimum(1, t / 0.015) * np.exp(-t * 2.2)


def campana(n):
    t = tt(2.5)
    f = hz(n)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)) * np.exp(-t * 1.6)


# ---------- armonía: Gm9 – Cm9 (i – iv), un acorde por compás ----------
ACORDES = [(43, [58, 62, 65, 69]), (48, [58, 63, 67, 70])]
# línea de bajo por compás: (tiempo en tiempos, intervalo)
LINEA = [(0, 0), (1.5, 0), (2, 12), (2.5, 10), (3, 7), (3.5, 5)]
# melodía silbada (tiempos relativos a cada par de compases, midi o None = silencio)
MELODIA = [(0, 79), (1.5, 77), (2, 79), (3, 82), (3.75, None), (4.5, 81), (5, 79), (6, 77), (6.5, 74), (7.5, None)]

for b in range(REMATE):
    t0 = b * BAR
    raiz, acorde = ACORDES[b % 2]
    add(ep(acorde, BAR), t0, 0.35, -0.2)
    if b < INTRO:
        # entrada: piano, bombo apagado y un hat suelto
        add(lp(bombo(), 300), t0, 0.5)
        add(lp(bombo(), 300), t0 + 2 * BEAT, 0.5)
        continue
    notas = [(k * BEAT, raiz + iv) for k, iv in LINEA]
    add(bajo(notas, BAR), t0, 0.62)
    for k in range(4):
        tb = t0 + k * BEAT
        if k in (0, 2):
            add(bombo(), tb, 0.95)
        if k == 1:
            add(bombo(), tb + BEAT / 2 + SW, 0.55)
        if k in (1, 3):
            add(caja(), tb, 0.55, 0.05)
        add(hat(), tb, 0.13, 0.3)
        add(hat(abierto=(k == 3)), tb + BEAT / 2 + SW, 0.09, 0.3)
    if (b - INTRO) % 2 == 0:
        add(silbido([(x * BEAT, n) for x, n in MELODIA], 2 * BAR), t0, 0.16, 0.25)

# ---------- remate de "misión cumplida" (original) ----------
T = REMATE * BAR
add(hp(rng.standard_normal(int(SR * 0.6)), 2000) * np.linspace(0, 1, int(SR * 0.6)) ** 2, T - 0.6, 0.25)  # subida corta
for i, n in enumerate([58, 62, 65, 70]):  # arpegio de Si bemol mayor que sube
    add(metal(n, 0.35), T + i * BEAT / 2, 0.42, -0.3 + 0.2 * i)
GOLPE = T + 4 * BEAT / 2
for n in (58, 62, 65, 70, 74):
    add(metal(n, 2.6), GOLPE, 0.32)
add(bombo(), GOLPE, 1.0)
add(lp(rng.standard_normal(int(SR * 2.4)), 1500) * np.exp(-tt(2.4) * 1.8), GOLPE, 0.18)  # platillo apagado
add(campana(94), GOLPE + 0.05, 0.12, 0.3)
add(bajo([(0, 34)], 2.6), GOLPE, 0.7)

# eco corto
d = int(0.21 * SR)
mezcla = (L + R) / 2
eco = np.zeros(N)
eco[d:] = mezcla[:-d] * 0.16
L += lp(eco, 2500)
R += lp(np.roll(eco, int(0.013 * SR)), 2500)

fade = int(SR * 1.2)
env = np.ones(N)
env[-fade:] = np.linspace(1, 0, fade) ** 2
st = np.stack([L * env, R * env], 1)
st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.35)
st = st / np.abs(st).max() * 10 ** (-1.0 / 20)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', OUT, f'{DUR:.2f}s', 'remate en', f'{T:.3f}s', 'golpe en', f'{GOLPE:.3f}s')
