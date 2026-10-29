"""Pista de suspenso para el debate de ofrendas (sin derechos).
Intro suave -> silencio total en el apagón -> tensión que crece mientras caen las respuestas -> golpe al
llenarse la pantalla -> ritmo durante el duelo de la gráfica -> golpe al ganar -> golpe final en la pregunta.
Uso: python3 generar_suspenso.py <salida.wav> <dur> <apagon> <primera> <lleno> <grafica> <golpe> <cierre>"""
import sys, wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
OUT = sys.argv[1]
DUR, AP, PR, LL, GR, GO, CI = map(float, sys.argv[2:9])
N = int(SR * DUR); rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
tt = lambda d: np.arange(int(SR * max(d, 0.01))) / SR
def filt(x, f, kind='low'):
    b, a = butter(2, np.clip(f / (SR / 2), 1e-4, 0.99), kind); return lfilter(b, a, x)
def add(x, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i]; l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    L[i:i + len(x)] += x * g * l; R[i:i + len(x)] += x * g * r
def barrido(x, f0, f1, curva=2.0):
    """pasa-bajos cuyo corte sube de f0 a f1 (por tramos de 50 ms)"""
    out = np.zeros(len(x)); seg = int(SR * 0.05)
    for i in range(0, len(x), seg): out[i:i + seg] = filt(x[i:i + seg], f0 + (f1 - f0) * (i / len(x)) ** curva)
    return out
def saw(t, fs, det=0.004): return sum(((t * f * (1 + d)) % 1 * 2 - 1) for f in fs for d in (-det, det)) / (2 * len(fs))
def kick():
    t = tt(0.45); return np.sin(2 * np.pi * np.cumsum(42 + 110 * np.exp(-t * 32)) / SR) * np.exp(-t * 7)
def boom(d=3.0):
    t = tt(d); return np.sin(2 * np.pi * np.cumsum(34 + 50 * np.exp(-t * 5)) / SR) * np.exp(-t * 1.3) + filt(rng.standard_normal(len(t)), 400) * np.exp(-t * 3) * 0.4
def tick(f=2400):
    t = tt(0.05); return np.sin(2 * np.pi * f * t) * np.exp(-t * 120)
def hat():
    t = tt(0.06); return filt(rng.standard_normal(len(t)), 7000, 'high') * np.exp(-t * 70)
def clap():
    t = tt(0.18); return filt(rng.standard_normal(len(t)), 1800, 'high') * np.exp(-t * 25)
def riser(d):
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = int(SR * 0.04)
    for i in range(0, len(t), seg): out[i:i + seg] = filt(n[i:i + seg], 300 + 8000 * (i / len(t)) ** 2)
    return out * (t / d) ** 2
# 1. intro: pulso suave y tic-tac lento
t = tt(AP)
add(filt(saw(t, (55, 82.4)), 380) * np.minimum(1, t / 1.2) * 0.5, 0, 0.5)
k = 0; tk = 0.3
while tk < AP - 0.2:
    add(tick(1800 if k % 2 else 2400), tk, 0.14, 0.3 if k % 2 else -0.3); tk += 0.5; k += 1
# 2. apagón: silencio. 3. caída: dron que se abre y tic-tac que acelera
d = LL - PR; t = tt(d); x = np.clip(t / d, 0, 1)
dr = barrido(saw(t, (55, 82.4, 110)), 250, 2450) * (0.25 + 0.75 * x)
add(dr, PR, 0.7)
tk = PR + 0.9; k = 0
while tk < LL - 0.1:
    q = (tk - PR) / d
    add(tick(2400 if k % 2 else 1800), tk, 0.16 + 0.1 * q, -0.3 if k % 2 else 0.3); tk += 0.45 - 0.36 * q ** 1.2; k += 1
add(riser(2.2), LL - 2.2, 0.35)
add(boom(), LL, 0.9)
# 4. gráfica: entra el ritmo, sube hasta el golpe y sigue más brillante hasta el cierre
B = 0.5
i = 0
while True:
    t0 = GR + 0.6 + i * B
    if t0 >= CI - 0.25: break
    fuerte = t0 >= GO
    add(kick(), t0, 0.6 if fuerte else 0.45)
    add(hat(), t0 + B / 2, 0.24 if fuerte else 0.16, 0.2)
    if fuerte and i % 2 == 1: add(clap(), t0, 0.25, -0.1)
    i += 1
t = tt(GO - GR); x = t / (GO - GR)
add(barrido(saw(t, (110, 164.8)), 400, 2900, 1.0) * x * 0.8, GR, 0.4)
t = tt(CI - GO)
add(filt(saw(t, (130.8, 196, 261.6)), 2400) * np.minimum(1, t / 0.3), GO, 0.35)
add(riser(2.0), GO - 2.0, 0.45)
add(boom(), GO, 0.9)
add(riser(1.6), CI - 1.6, 0.4)
add(boom(3.5), CI, 1.0)
# silencio total en el apagón
a, b = int(AP * SR), int(PR * SR)
L[a:b] = 0; R[a:b] = 0
fade = int(SR * 1.5); env = np.ones(N); env[-fade:] = np.linspace(1, 0, fade)
mix = np.stack([L * env, R * env], 1)
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.4); mix = mix / np.abs(mix).max() * 10 ** (-1 / 20)
mix[a:b] = 0
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close(); print('ok', OUT)
