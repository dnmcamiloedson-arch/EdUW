"""Pista cinematográfica tranquila (sin voz, sin derechos) para storytelling, 84 BPM.
Pads cálidos + piano suave; crece hacia un clímax con percusión y vuelve a la calma.
Uso: python3 generar_musica_calma.py <salida.wav> <duracion> <inicio_clímax> <fin_clímax>"""
import sys, wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
OUT, DUR, C0, C1 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
N = int(SR * DUR); rng = np.random.default_rng(5)
L = np.zeros(N); R = np.zeros(N)
BEAT = 60 / 84; BAR = 4 * BEAT


def add(x, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    x = x[:N - i]; l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    L[i:i + len(x)] += x * g * l; R[i:i + len(x)] += x * g * r


def filt(x, f, kind='low'):
    b, a = butter(2, np.clip(f / (SR / 2), 1e-4, 0.99), kind); return lfilter(b, a, x)


def tt(d): return np.arange(int(SR * d)) / SR
def midi(n): return 440 * 2 ** ((n - 69) / 12)


def pad(notes, d, cut):
    t = tt(d)
    x = sum(((t * midi(n) * (1 + dt)) % 1 * 2 - 1) for n in notes for dt in (-0.003, 0.003))
    x = filt(x / (2 * len(notes)), cut)
    return x * np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8)


def piano(n, d=2.0):
    t = tt(d); f = midi(n)
    x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.2 + k)) for k, a in ((1, 1), (2, 0.35), (3, 0.12)))
    return x * np.minimum(1, t / 0.004)


def kick():
    t = tt(0.5); return np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 30)) / SR) * np.exp(-t * 6)


def boom():
    t = tt(3.0); return np.sin(2 * np.pi * np.cumsum(36 + 40 * np.exp(-t * 4)) / SR) * np.exp(-t * 1.4) + filt(rng.standard_normal(len(t)), 300) * np.exp(-t * 3) * 0.3


def riser(d):
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = int(SR * 0.05)
    for i in range(0, len(t), seg): out[i:i + seg] = filt(n[i:i + seg], 300 + 7000 * (i / len(t)) ** 2)
    return out * (t / d) ** 2


# Do mayor emotivo: C – Am – F – G
PROG = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
ARP = [0, 1, 2, 1]
OFF = (C0 % BAR) - BAR  # la rejilla de compases cae justo en el clímax
nb = int(np.ceil((DUR - OFF) / BAR))
for b in range(nb):
    t0 = OFF + b * BAR; ch = PROG[b % 4]
    if t0 + BAR <= 0: continue
    inten = 0.35 + 0.65 * min(1, t0 / C0) if t0 < C0 else (1.0 if t0 < C1 else 0.55)
    if t0 < 0:  # primer compás incompleto
        continue
    add(pad([n + 12 for n in ch] + [ch[0]], BAR, 900 + 2200 * inten), t0, 0.22 + 0.12 * inten)
    for k in range(8):  # piano en corcheas
        n = ch[ARP[k % 4]] + 24 + (12 if (k == 7 and t0 >= C0) else 0)
        add(piano(n), t0 + k * BEAT / 2, 0.10 + 0.06 * inten, -0.3 if k % 2 else 0.3)
    add(piano(ch[0] + 12, 3.0), t0, 0.12)
    if C0 <= t0 < C1:
        for k in range(4):
            add(kick(), t0 + k * BEAT, 0.5 if k % 2 == 0 else 0.3)
add(riser(3.0), C0 - 3.0, 0.18)
add(boom(), C0, 0.7)
fade = int(SR * 3); env = np.ones(N); env[-fade:] = np.linspace(1, 0, fade) ** 2
mix = np.stack([L * env, R * env], 1)
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.3); mix = mix / np.abs(mix).max() * 10 ** (-1 / 20)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', OUT)
