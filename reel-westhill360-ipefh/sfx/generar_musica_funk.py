"""Pista original (libre de derechos) estilo jazz-funk juguetón, 120 BPM (1 compás = 2 s), sin voz.

Piano eléctrico tipo Rhodes (acordes de novena con trémolo), bajo funky sincopado con octavas, batería con swing
(bombo, caja con notas fantasma, hi-hats en semicorcheas con shuffle), golpes de metales en los cambios de bloque
y campanitas de "moneda" sueltas. Progresión en Fa: Gm9 – C9 – Fmaj9 – Dm9.

Estructura (segundos): intro 0–DROP (Rhodes filtrado + subida), groove DROP–FIN_GROOVE con golpes de metales en
GOLPES, y cierre con el acorde final, campanitas y desvanecido.
Uso: python3 generar_musica_funk.py <salida.wav> <duracion> <fin_groove> <drop> [golpe1,golpe2,...]
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
DUR = float(sys.argv[2])
FIN = float(sys.argv[3])
DROP = float(sys.argv[4])
GOLPES = [float(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 else []
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)
SWING = 0.18 * BEAT / 2  # retraso de las semicorcheas "débiles"


def add(x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(x) <= 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
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


# ---------- instrumentos ----------
def rhodes(notes, d, brillo=1.0):
    t = tt(d)
    out = np.zeros_like(t)
    for n in notes:
        f = hz(n)
        env = np.exp(-t * 1.6) * 0.8 + 0.2 * np.exp(-t * 0.4)
        campana = np.sin(2 * np.pi * f * 2 * t + 1.2 * np.sin(2 * np.pi * f * 7 * t) * np.exp(-t * 9)) * np.exp(-t * 7)
        out += (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3) + 0.25 * brillo * campana) * env
    trem = 1 + 0.18 * np.sin(2 * np.pi * 4.5 * t)
    a = np.minimum(1, t / 0.004)
    rel = np.minimum(1, (d - t) / 0.05)
    return out * trem * a * rel / max(1, len(notes))


def bajo(n, d):
    t = tt(d)
    f = hz(n)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sign(np.sin(2 * np.pi * f * t)) * 0.4
    pluck = np.exp(-t * 7) * 0.7 + 0.3
    x = np.tanh(2.2 * x * pluck)
    return lp(x, 1400) * np.minimum(1, t / 0.003) * np.minimum(1, (d - t) / 0.02)


def bombo():
    t = tt(0.32)
    f = 48 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) + 0.25 * rng.standard_normal(len(t)) * np.exp(-t * 200)


def caja(fuerte=1.0):
    t = tt(0.22)
    ruido = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * (18 if fuerte > 0.5 else 30))
    cuerpo = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return (0.75 * ruido + 0.5 * cuerpo) * fuerte


def hat(abierto=False):
    t = tt(0.25 if abierto else 0.05)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * (14 if abierto else 80))


def metales(notes, d=0.32):
    t = tt(d)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-0.12, 0.0, 0.12):
            f = hz(n + det / 12)
            out += 2 * ((t * f) % 1) - 1
    env = np.minimum(1, t / 0.012) * np.exp(-t * 6)
    filtro = lp(out, 3200)
    return np.tanh(1.4 * filtro / len(notes) / 3) * env


def moneda(n=96):
    t = tt(0.9)
    f = hz(n)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.3 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)) * np.exp(-t * 4)


def subida(d):
    t = tt(d)
    x = hp(rng.standard_normal(len(t)), 900) * (t / d) ** 2
    return x * 0.6


# ---------- armonía en Fa: Gm9 – C9 – Fmaj9 – Dm9 ----------
PROG = [
    (43, [55, 58, 62, 65, 69]),  # Gm9
    (48, [52, 55, 58, 62, 64]),  # C9 (con trece)
    (41, [57, 60, 64, 67, 69]),  # Fmaj9
    (38, [53, 57, 60, 64, 65]),  # Dm9
]
# bajo funky: (tiempo en semicorcheas, intervalo desde la fundamental, duración en semicorcheas)
RIFF = [(0, 0, 2), (3, 0, 1), (4, 12, 1), (6, 0, 1), (8, 7, 2), (10, 10, 1), (11, 12, 1), (12, 0, 2), (14, 3, 1), (15, 4, 1)]
# piano: golpes sincopados por compás (en semicorcheas, duración)
COMP = [(0, 3), (6, 2), (10, 2), (14, 2)]
S16 = BEAT / 4

n_bars = int(np.ceil(DUR / BAR))
for b in range(n_bars):
    t0 = b * BAR
    raiz, acorde = PROG[b % 4]
    groove = DROP <= t0 < FIN
    if t0 < DROP:
        # intro: piano sostenido, cada vez más brillante
        add(lp(rhodes(acorde, BAR, 0.6), 900 + 2500 * t0 / max(DROP, 0.1)), t0, 0.5)
        for k in range(4):
            add(hat(), t0 + k * BEAT + BEAT / 2, 0.05, 0.3)
        continue
    if not groove:
        continue
    for s, dur in COMP:
        tb = t0 + s * S16 + (SWING if s % 2 else 0)
        add(rhodes(acorde, dur * S16 + 0.12), tb, 0.42, -0.25)
    for s, iv, dur in RIFF:
        tb = t0 + s * S16 + (SWING if s % 2 else 0)
        add(bajo(raiz + iv, dur * S16 * 0.9), tb, 0.5)
    for k in range(4):
        tb = t0 + k * BEAT
        if k in (0, 2):
            add(bombo(), tb, 0.95)
        if k == 1:
            add(bombo(), tb + BEAT / 2 + SWING, 0.6)
        if k in (1, 3):
            add(caja(), tb, 0.5, 0.05)
        for q in range(4):
            sw = SWING if q % 2 else 0
            add(hat(abierto=(q == 2 and k == 3)), tb + q * S16 + sw, 0.12 if q % 2 == 0 else 0.07, 0.3)
        # notas fantasma de la caja
        if k in (0, 2):
            add(caja(0.25), tb + 3 * S16 + SWING, 0.25, 0.05)
    # campanitas de moneda cada dos compases, en el contratiempo
    if b % 2 == 1:
        add(moneda(84 + (b % 4) * 2), t0 + 3 * BEAT + BEAT / 2, 0.08, 0.5)

# golpes de metales en el drop y en cada cambio de bloque
for g in [DROP] + GOLPES:
    raiz, acorde = PROG[int(g / BAR) % 4]
    add(metales([n + 12 for n in acorde[:4]]), g, 0.5)
    add(metales([n + 12 for n in acorde[:4]]), g + BEAT * 1.5 + SWING, 0.28)
    add(bombo(), g, 0.5)
add(subida(DROP), 0, 0.5)

# cierre: acorde final largo, campanitas y metales
fin_acorde = [53, 57, 60, 64, 67, 72]
add(rhodes(fin_acorde, DUR - FIN), FIN, 0.55)
add(metales([65, 69, 72, 76], 0.6), FIN, 0.5)
add(bombo(), FIN, 0.9)
for i, n in enumerate([84, 88, 91, 96]):
    add(moneda(n), FIN + 0.25 + i * 0.16, 0.1, -0.4 + 0.27 * i)

# eco ligero (sala) sobre todo
eco = np.zeros(N)
d = int(0.18 * SR)
mix = (L + R) / 2
eco[d:] = mix[:-d] * 0.18
L += lp(eco, 3000)
R += lp(np.roll(eco, int(0.011 * SR)), 3000)

fade = int(SR * 3)
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
print('ok', OUT, f'{DUR}s')
