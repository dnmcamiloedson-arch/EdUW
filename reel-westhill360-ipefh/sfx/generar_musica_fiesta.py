"""Pista original (libre de derechos) festiva con sabor internacional/latino, 120 BPM (1 compás = 2 s), sin voz.

Percusión (bombo, palmas en 2 y 4, shaker en semicorcheas, congas), bajo sincopado tipo tumbao, guitarra
punteada en contratiempos, marimba con una melodía alegre y metales en los cambios de sección.
Progresión en Do: C – G – Am – F (un acorde por compás). Todo compuesto aquí; no copia ninguna canción.

Estructura en compases: 0–GANCHO (groove ligero), GANCHO–VIAJE (groove con guitarra), VIAJE–FINAL (completo con
marimba), golpe final en FINAL y cola.
Uso: python3 generar_musica_fiesta.py <salida.wav> <gancho> <viaje> <final>
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
OUT = sys.argv[1]
GANCHO = int(sys.argv[2]) if len(sys.argv) > 2 else 2
VIAJE = int(sys.argv[3]) if len(sys.argv) > 3 else 6
FINAL = int(sys.argv[4]) if len(sys.argv) > 4 else 22
DUR = FINAL * BAR + 4.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def add(x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(x) <= 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: N - i]
    L[i:i + len(x)] += x * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
    R[i:i + len(x)] += x * gain * np.sin((pan + 1) * np.pi / 4) * 1.414


def tt(d):
    return np.arange(int(SR * d)) / SR


def hz(n):
    return 440 * 2 ** ((n - 69) / 12)


def lp(x, f):
    b, a = butter(2, min(f, SR / 2 - 100) / (SR / 2), 'low')
    return lfilter(b, a, x)


def hp(x, f):
    b, a = butter(2, f / (SR / 2), 'high')
    return lfilter(b, a, x)


def bombo():
    t = tt(0.35)
    f = 48 + 120 * np.exp(-t * 30)
    return np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9))


def palmas():
    t = tt(0.25)
    return sum(hp(rng.standard_normal(len(t)), 1100) * np.exp(-np.maximum(0, t - d) * 32) * (t >= d) for d in (0, 0.008, 0.017, 0.026)) * 0.5


def shaker(fuerte=False):
    t = tt(0.07)
    return hp(rng.standard_normal(len(t)), 6000) * np.exp(-t * (45 if fuerte else 70)) * np.minimum(1, t / 0.006)


def conga(n, abierta=True):
    t = tt(0.3)
    f = hz(n) * (1 + 0.25 * np.exp(-t * 60))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (11 if abierta else 30))
    return x + 0.25 * hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 120)


def bajo(n, d):
    t = tt(d)
    x = np.sin(2 * np.pi * hz(n) * t) + 0.3 * np.sin(4 * np.pi * hz(n) * t) * np.exp(-t * 6)
    return lp(np.tanh(1.4 * x), 700) * np.minimum(1, t / 0.004) * np.exp(-t * 2.2) * np.minimum(1, (d - t) / 0.03)


def pulso(n, d=0.45):
    """cuerda punteada (aditiva): los armónicos altos se apagan antes"""
    t = tt(d)
    f = hz(n)
    x = sum((1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (5 + 7 * k)) for k in range(1, 9))
    return x * np.minimum(1, t / 0.002)


def marimba(n, d=0.6):
    t = tt(d)
    f = hz(n)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 5) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 22) + 0.1 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40)
    return x * np.minimum(1, t / 0.002)


def metal(n, d=0.4):
    t = tt(d)
    x = sum(2 * ((t * hz(n + c / 100)) % 1) - 1 for c in (-7, 0, 7))
    return np.tanh(lp(x, 3200) / 2) * np.minimum(1, t / 0.012) * np.exp(-t * 3.5)


# Do – Sol – Lam – Fa: (raíz del bajo, notas del acorde para la guitarra)
ACORDES = [(36, [60, 64, 67, 72]), (43, [59, 62, 67, 71]), (45, [60, 64, 69, 72]), (41, [60, 65, 69, 72])]
# melodía de marimba (tiempo en tiempos dentro de 2 compases, nota)
MEL = [(0, 76), (0.5, 79), (1, 81), (1.75, 79), (2.5, 76), (3, 74), (4, 76), (4.5, 72), (5, 74), (5.75, 76), (6.5, 79), (7, 77)]
MEL2 = [(0, 76), (0.5, 79), (1, 84), (1.75, 83), (2.5, 81), (3, 79), (4, 81), (4.5, 79), (5, 77), (5.75, 76), (6.5, 74), (7, 72)]

for b in range(FINAL):
    t0 = b * BAR
    raiz, acorde = ACORDES[b % 4]
    lleno = b >= VIAJE
    # bombo en 1 y 3 (+ un empujón antes del 3 en la parte completa)
    for k in (0, 2):
        add(bombo(), t0 + k * BEAT, 0.9)
    if lleno or b >= GANCHO:
        add(bombo(), t0 + 1.75 * BEAT, 0.45)
    for k in (1, 3):
        add(palmas(), t0 + k * BEAT, 0.42, 0.1)
    for s in range(16):
        add(shaker(s % 4 == 2), t0 + s * BEAT / 4, 0.07 if s % 2 else 0.1, 0.45)
    # congas: patrón tipo tumbao
    for x, n, ab in [(0.5, 62, False), (1.5, 57, True), (2, 62, False), (2.5, 62, False), (3.5, 57, True), (3.75, 57, True)]:
        add(conga(n, ab), t0 + x * BEAT, 0.3, -0.35)
    # bajo sincopado
    for x, iv, d in [(0, 0, 0.7), (1.5, 7, 0.4), (2, 12, 0.35), (3, 7, 0.3), (3.5, 0, 0.5)]:
        add(bajo(raiz + iv, d), t0 + x * BEAT, 0.6)
    # guitarra en contratiempos
    if b >= GANCHO:
        for k in range(4):
            for j, n in enumerate(acorde):
                add(pulso(n), t0 + (k + 0.5) * BEAT + j * 0.012, 0.09, -0.25 + 0.15 * j)
    else:
        for j, n in enumerate(acorde):
            add(pulso(n, 1.2), t0 + j * 0.02, 0.12, -0.2 + 0.12 * j)
    # marimba (cada 2 compases)
    if lleno and (b - VIAJE) % 2 == 0 and b + 1 < FINAL:
        frase = MEL if ((b - VIAJE) // 2) % 2 == 0 else MEL2
        for x, n in frase:
            add(marimba(n), t0 + x * BEAT, 0.22, 0.25)
            add(marimba(n - 12), t0 + x * BEAT, 0.06, 0.25)
    # metales en los cambios de sección
    if b in (GANCHO, VIAJE) or (lleno and (b - VIAJE) % 4 == 0):
        for n in acorde[:3]:
            add(metal(n), t0, 0.16)

# subida antes del viaje
sub = int(SR * BAR)
add(hp(rng.standard_normal(sub), 3000) * np.linspace(0, 1, sub) ** 3, (VIAJE - 1) * BAR, 0.2)

# golpe final: acorde de Do con metales, bombo, marimba arriba y cola
T = FINAL * BAR
for n in (60, 64, 67, 72, 76):
    add(metal(n, 2.4), T, 0.18)
add(bombo(), T, 1.0)
add(bajo(36, 2.5), T, 0.7)
for i, n in enumerate([72, 76, 79, 84]):
    add(marimba(n, 1.5), T + i * 0.06, 0.2, -0.3 + 0.2 * i)
add(lp(rng.standard_normal(int(SR * 2.5)), 6000) * np.exp(-tt(2.5) * 2), T, 0.08)

# reverb corta (ecos)
mezcla = (L + R) / 2
for d, g in [(0.11, 0.18), (0.23, 0.11), (0.37, 0.06)]:
    k = int(d * SR)
    eco = np.zeros(N)
    eco[k:] = lp(mezcla[:-k], 3500) * g
    L += eco
    R += np.roll(eco, int(0.011 * SR))

fade = int(SR * 1.5)
env = np.ones(N)
env[-fade:] = np.linspace(1, 0, fade) ** 2
st = np.stack([L * env, R * env], 1)
st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.3)
st = st / np.abs(st).max() * 10 ** (-1.0 / 20)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', OUT, f'{DUR:.2f}s', 'golpe final en', f'{T:.2f}s')
