"""Pista original (libre de derechos) cinematográfica/inspiradora, 120 BPM con batería a medio tiempo, sin voz.

Piano (parciales inarmónicos y martillo), colchón de cuerdas (sierras desafinadas filtradas, ataque lento),
sub-bajo, batería a medio tiempo (bombo grande, palmas con mucha reverberación, hats suaves), platillos
invertidos antes de cada sección y una reverberación por convolución. Progresión emotiva en La menor:
Am – F – C – G (un acorde por compás). Todo compuesto aquí; no copia ninguna canción.

Estructura en compases: 0–A (piano y cuerdas suaves con un latido), A–B (arpegios de piano, bajo, pulso),
B–C (completa: batería, melodía, cuerdas arriba; a partir de la mitad sube una octava), C–FIN (clímax con
toms) y acorde final en FIN con cola larga.
Uso: python3 generar_musica_emotiva.py <salida.wav> <A> <B> <C> <FIN>
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
OUT = sys.argv[1]
A = int(sys.argv[2]) if len(sys.argv) > 2 else 2
B = int(sys.argv[3]) if len(sys.argv) > 3 else 7
C = int(sys.argv[4]) if len(sys.argv) > 4 else 21
FIN = int(sys.argv[5]) if len(sys.argv) > 5 else 23
DUR = FIN * BAR + 5.0
N = int(SR * DUR)
rng = np.random.default_rng(3)
# dos buses: seco y envío a reverberación
L = np.zeros(N)
R = np.zeros(N)
RL = np.zeros(N)
RR = np.zeros(N)


def add(x, t0, gain=1.0, pan=0.0, rev=0.25):
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


def piano(n, d=3.0, vel=1.0):
    t = tt(d)
    f = hz(n)
    Bk = 0.0004
    x = np.zeros_like(t)
    for k in range(1, 11):
        fk = f * k * np.sqrt(1 + Bk * k * k)
        if fk > 12000:
            break
        amp = (1 / k ** 1.25) * (0.6 + 0.4 * vel) ** (k / 3)
        dec = 0.9 + 0.55 * k + f / 900
        x += amp * (np.sin(2 * np.pi * fk * t) + 0.5 * np.sin(2 * np.pi * fk * 1.0008 * t)) * np.exp(-t * dec)
    martillo = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 90) * 0.04
    env = np.minimum(1, t / 0.003) * np.minimum(1, (d - t) / 0.15)
    return (x * 0.5 + martillo) * env * vel


def cuerdas(notas, d, ataque=0.9):
    t = tt(d)
    x = np.zeros_like(t)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 1.2)
    for n in notas:
        for c in (-9, -4, 0, 4, 9):
            f = hz(n) * 2 ** (c / 1200)
            fase = np.cumsum(f * vib) / SR + rng.random()
            x += 2 * (fase % 1) - 1
    x = lp(x, 1700, 2) / (5 * len(notas))
    env = np.minimum(1, t / ataque) * np.minimum(1, (d - t) / 0.7)
    return x * env


def sub(n, d):
    t = tt(d)
    x = np.sin(2 * np.pi * hz(n) * t) + 0.25 * np.sin(4 * np.pi * hz(n) * t)
    return np.tanh(1.3 * x) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.1)


def bombo(grande=False):
    t = tt(0.9 if grande else 0.5)
    f = 42 + (130 if grande else 100) * np.exp(-t * 22)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (3.5 if grande else 6))
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300) * 0.3
    return np.tanh(1.6 * x) + click


def palmas():
    t = tt(0.4)
    x = sum(hp(rng.standard_normal(len(t)), 1000) * np.exp(-np.maximum(0, t - d) * 22) * (t >= d) for d in (0, 0.01, 0.021, 0.03))
    return lp(x, 7000) * 0.45 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.3


def hat():
    t = tt(0.06)
    return hp(rng.standard_normal(len(t)), 8000) * np.exp(-t * 80)


def tom(n):
    t = tt(0.7)
    f = hz(n) * (1 + 0.4 * np.exp(-t * 18))
    return np.tanh(1.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6))


def platillo_inv(d=1.6):
    t = tt(d)
    x = hp(rng.standard_normal(len(t)), 5000) * (t / d) ** 3
    return x


def crash(d=3.0):
    t = tt(d)
    return hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 1.6) * np.minimum(1, t / 0.003)


# Am – F – C – G: (raíz del bajo, acorde para cuerdas/piano)
ACORDES = [(33, [57, 60, 64]), (29, [57, 60, 65]), (36, [55, 60, 64]), (31, [55, 59, 62])]
# arpegio por acorde (8 corcheas): intervalos sobre la raíz +24
ARP = [0, 7, 12, 15, 19, 15, 12, 7]
ARP_MAYOR = [0, 7, 12, 16, 19, 16, 12, 7]
# melodía (tiempo en tiempos dentro de 4 compases, nota, duración en tiempos)
MEL1 = [(0, 76, 2), (2, 74, 1), (3, 72, 1), (4, 72, 3), (7, 69, 1), (8, 67, 2), (10, 72, 1), (11, 74, 1), (12, 74, 3), (15, 71, 1)]
MEL2 = [(0, 76, 2), (2, 79, 1), (3, 76, 1), (4, 77, 3), (7, 76, 0.5), (7.5, 72, 0.5), (8, 76, 2), (10, 74, 1), (11, 72, 1), (12, 74, 4)]
MAYOR = {1, 2}  # F y C son mayores

for b in range(FIN):
    t0 = b * BAR
    k = b % 4
    raiz, acorde = ACORDES[k]
    # cuerdas siempre (más fuertes y una octava arriba en la parte completa)
    if b < B:
        add(cuerdas(acorde, BAR + 0.6), t0, 0.22 if b >= A else 0.18, 0, 0.5)
    else:
        add(cuerdas(acorde, BAR + 0.6, 0.5), t0, 0.26, -0.2, 0.5)
        add(cuerdas([n + 12 for n in acorde], BAR + 0.6, 0.5), t0, 0.14 if b < (B + C) // 2 else 0.2, 0.2, 0.5)
    if b < A:
        # gancho: acorde de piano por compás y un latido suave
        for j, n in enumerate([raiz + 24] + acorde + [acorde[-1] + 12]):
            add(piano(n, 3.0, 0.7), t0 + j * 0.05, 0.22, -0.3 + 0.12 * j, 0.45)
        for x in (0, 2):
            add(lp(bombo(), 400), t0 + x * BEAT, 0.5, 0, 0.1)
        continue
    # arpegio de piano en corcheas
    arp = ARP_MAYOR if k in MAYOR else ARP
    for j, iv in enumerate(arp):
        add(piano(raiz + 24 + iv, 1.6, 0.55 if j % 2 else 0.7), t0 + j * BEAT / 2, 0.1 if b < B else 0.13, 0.25 * np.sin(j), 0.35)
    # sub-bajo
    add(sub(raiz, BAR), t0, 0.42, 0, 0.05)
    if b < B:
        # pulso: bombo en 1 y 3
        for x in (0, 2):
            add(bombo(), t0 + x * BEAT, 0.42, 0, 0.1)
        continue
    # batería a medio tiempo
    add(bombo(True), t0, 0.85, 0, 0.12)
    add(bombo(), t0 + 2.5 * BEAT, 0.6, 0, 0.1)
    add(palmas(), t0 + 2 * BEAT, 0.5, 0.05, 0.7)
    for s in range(8):
        add(hat(), t0 + s * BEAT / 2, 0.06 if s % 2 else 0.09, 0.4, 0.1)
    # melodía cada 4 compases (piano + una octava abajo suave)
    if (b - B) % 4 == 0 and b + 3 < FIN:
        mel = MEL1 if ((b - B) // 4) % 2 == 0 else MEL2
        for x, n, d in mel:
            add(piano(n, max(1.2, d * BEAT + 0.8), 0.95), t0 + x * BEAT, 0.3, 0.1, 0.45)
            add(piano(n - 12, max(1.2, d * BEAT + 0.8), 0.6), t0 + x * BEAT, 0.12, -0.1, 0.45)
    # clímax: toms en el último tiempo de cada compás
    if b >= C:
        for x, n in [(3, 50), (3.25, 47), (3.5, 45), (3.75, 43)]:
            add(tom(n), t0 + x * BEAT, 0.35, -0.3 + 0.2 * (x - 3) * 4, 0.3)

# platillos invertidos y crash al entrar a cada sección
for sec in (A, B, C):
    add(platillo_inv(), sec * BAR - 1.6, 0.18, 0, 0.4)
    add(crash(), sec * BAR, 0.12, 0, 0.5)
# subida de ruido antes de la parte completa
d = BAR
add(hp(rng.standard_normal(int(SR * d)), 2500) * np.linspace(0, 1, int(SR * d)) ** 3, (B - 1) * BAR, 0.12, 0, 0.5)

# acorde final: C mayor con novena, cuerdas largas, piano, bombo grande, crash y cola
T = FIN * BAR
add(platillo_inv(2.0), T - 2.0, 0.22, 0, 0.4)
add(bombo(True), T, 1.0, 0, 0.2)
add(crash(4.5), T, 0.16, 0, 0.6)
add(sub(36, 4.5), T, 0.45, 0, 0.05)
add(cuerdas([48, 55, 60, 64, 67, 74], 4.8, 0.05), T, 0.3, 0, 0.6)
for j, n in enumerate([48, 55, 60, 64, 67, 72, 74, 79]):
    add(piano(n, 4.8, 0.9), T + j * 0.035, 0.2, -0.35 + 0.1 * j, 0.6)

# reverberación por convolución (respuesta de ruido que decae, distinta por canal)
dr = 2.8
ti = tt(dr)
ir_l = lp(rng.standard_normal(len(ti)), 5000) * np.exp(-ti * 2.4) * np.minimum(1, ti / 0.01)
ir_r = lp(rng.standard_normal(len(ti)), 5000) * np.exp(-ti * 2.4) * np.minimum(1, ti / 0.01)
ir_l /= np.sqrt((ir_l ** 2).sum())
ir_r /= np.sqrt((ir_r ** 2).sum())
pre = int(0.02 * SR)
wl = fftconvolve(RL, ir_l)[:N]
wr = fftconvolve(RR, ir_r)[:N]
L[pre:] += wl[:-pre] * 0.9
R[pre:] += wr[:-pre] * 0.9

# limpia graves sobrantes y mezcla
L = hp(L, 28)
R = hp(R, 28)
fade = int(SR * 2.0)
env = np.ones(N)
env[-fade:] = np.linspace(1, 0, fade) ** 2
st = np.stack([L * env, R * env], 1)
st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.4)
st = st / np.abs(st).max() * 10 ** (-1.0 / 20)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', OUT, f'{DUR:.2f}s', 'acorde final en', f'{T:.2f}s')
