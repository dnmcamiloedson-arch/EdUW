"""Pista de suspenso para el debate de ofrendas (sin derechos).
Dron grave que crece + tic-tac que acelera durante la lluvia, golpe en el collage, ritmo durante la gráfica
y golpe final en la pregunta.
Uso: python3 generar_suspenso.py <salida.wav> <dur> <lluvia> <collage> <grafica> <cierre>"""
import sys, wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
OUT = sys.argv[1]
DUR, LL, CO, GR, CI = map(float, sys.argv[2:7])
N = int(SR * DUR); rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
tt = lambda d: np.arange(int(SR * d)) / SR
def filt(x, f, kind='low'):
    b, a = butter(2, np.clip(f / (SR / 2), 1e-4, 0.99), kind); return lfilter(b, a, x)
def add(x, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i]; l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    L[i:i + len(x)] += x * g * l; R[i:i + len(x)] += x * g * r
def kick():
    t = tt(0.45); return np.sin(2 * np.pi * np.cumsum(42 + 110 * np.exp(-t * 32)) / SR) * np.exp(-t * 7)
def boom(d=3.0):
    t = tt(d); return np.sin(2 * np.pi * np.cumsum(34 + 50 * np.exp(-t * 5)) / SR) * np.exp(-t * 1.3) + filt(rng.standard_normal(len(t)), 400) * np.exp(-t * 3) * 0.4
def tick(f=2400):
    t = tt(0.05); return np.sin(2 * np.pi * f * t) * np.exp(-t * 120)
def hat():
    t = tt(0.06); return filt(rng.standard_normal(len(t)), 7000, 'high') * np.exp(-t * 70)
def riser(d):
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = int(SR * 0.04)
    for i in range(0, len(t), seg): out[i:i + seg] = filt(n[i:i + seg], 300 + 8000 * (i / len(t)) ** 2)
    return out * (t / d) ** 2
# dron: dos sierras graves desafinadas, se abre el filtro hasta el collage
t = tt(CO + 0.3)
dr = sum(((t * f * (1 + dt)) % 1 * 2 - 1) for f in (55, 82.4) for dt in (-0.004, 0.004))
env = np.minimum(1, t / 2.0) * (0.35 + 0.65 * np.clip((t - LL) / max(0.1, CO - LL), 0, 1))
cut = np.cumsum(np.ones(len(t))) / SR
dr = filt(dr / 4, 300) * 0.6 + filt(dr / 4, 1400) * 0.25 * np.clip((t - LL) / (CO - LL), 0, 1)
add(dr * env, 0, 0.5)
# tic-tac: lento en la intro, acelera en la lluvia
tk = 0.0; k = 0
while tk < CO - 0.1:
    per = 0.5 if tk < LL else 0.5 - 0.32 * ((tk - LL) / (CO - LL)) ** 1.3
    add(tick(2400 if k % 2 else 1800), tk, 0.18, -0.3 if k % 2 else 0.3); tk += per; k += 1
add(riser(2.5), CO - 2.5, 0.35)
add(boom(), CO, 0.9)
# gráfica: pulso a 120 bpm con dron más claro y subida al final
B = 0.5
for i in range(int((CI - GR) / B)):
    t0 = GR + 0.8 + i * B
    if t0 >= CI - 0.2: break
    add(kick(), t0, 0.55)
    add(hat(), t0 + B / 2, 0.22, 0.2)
t = tt(CI - GR)
pad = sum(((t * f * (1 + dt)) % 1 * 2 - 1) for f in (110, 164.8, 220) for dt in (-0.003, 0.003))
add(filt(pad / 6, 1800) * np.minimum(1, t / 1.5), GR, 0.35)
add(riser(2.0), CI - 2.0, 0.4)
add(boom(3.5), CI, 1.0)
fade = int(SR * 1.5); envf = np.ones(N); envf[-fade:] = np.linspace(1, 0, fade)
mix = np.stack([L * envf, R * envf], 1)
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.4); mix = mix / np.abs(mix).max() * 10 ** (-1 / 20)
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close(); print('ok', OUT)
