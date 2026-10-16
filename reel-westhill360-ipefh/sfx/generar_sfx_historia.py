"""Efectos para videos de storytelling: teclas de máquina de escribir, campanita de retorno,
sello de goma, hoja de papel. Uso: python3 generar_sfx_historia.py <carpeta_salida>"""
import sys, wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
rng = np.random.default_rng(11)
OUT = sys.argv[1]


def save(name, x, gain_db=-3.0):
    x = np.asarray(x, float); x = x / (np.abs(x).max() or 1) * 10 ** (gain_db / 20)
    st = np.stack([x, x], 1)
    with wave.open(f'{OUT}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())


def filt(x, f, kind='low'):
    b, a = butter(2, np.clip(f / (SR / 2), 1e-4, 0.99), kind); return lfilter(b, a, x)


def t(d): return np.arange(int(SR * d)) / SR


def key():
    tt = t(0.06)
    hit = filt(rng.standard_normal(len(tt)), 2500, 'high') * np.exp(-tt * 260)
    body = np.sin(2 * np.pi * (900 + rng.uniform(-120, 120)) * tt) * np.exp(-tt * 140) * 0.5
    return hit + body


def typing(n=6, gap=0.075):
    x = np.zeros(int(SR * (n * gap + 0.1)))
    for i in range(n):
        k = key() * rng.uniform(0.6, 1.0); s = int(SR * (i * gap + rng.uniform(-0.01, 0.01)))
        x[s:s + len(k)] += k
    return x


def ding():
    tt = t(1.2)
    return sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in ((2093, 1, 4), (4186, 0.3, 7), (3136, 0.2, 6)))


def stamp():
    tt = t(0.5)
    thud = np.sin(2 * np.pi * np.cumsum(120 * np.exp(-tt * 20) + 55) / SR) * np.exp(-tt * 14)
    slap = filt(rng.standard_normal(len(tt)), 1800) * np.exp(-tt * 45) * 0.8
    return np.tanh((thud + slap) * 1.5)


def paper():
    tt = t(0.45); n = rng.standard_normal(len(tt))
    env = np.sin(np.pi * tt / tt[-1]) ** 2 * (1 + 0.5 * np.sin(2 * np.pi * 23 * tt))
    return filt(filt(n, 600, 'high'), 7000) * env


save('hist_typing', typing(6), -6)
save('hist_typing_largo', typing(14, 0.07), -6)
save('hist_ding', ding(), -9)
save('hist_stamp', stamp(), -2)
save('hist_paper', paper(), -6)
print('ok')
