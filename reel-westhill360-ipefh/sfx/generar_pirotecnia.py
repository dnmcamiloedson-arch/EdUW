"""Sonidos de pirotecnia sintetizados (libres de derechos) para el final del video de graduación.

Escribe en remotion/public/sfx: fw_boom.wav (estallido lejano), fw_boom_grande.wav (estallido grande con cola),
fw_crackle.wav (chisporroteo), fw_silbido.wav (cohete subiendo).
Uso: python3 sfx/generar_pirotecnia.py
"""
import os
import wave

import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'remotion', 'public', 'sfx')
rng = np.random.default_rng(11)


def filt(x, f, kind='low', order=2):
    b, a = butter(order, f / (SR / 2), kind)
    return lfilter(b, a, x)


def guardar(nombre, x, pico=0.9):
    x = x / (np.abs(x).max() + 1e-9) * pico
    st = np.stack([x, x], axis=1)
    with wave.open(os.path.join(OUT, nombre), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    print('ok', nombre, round(len(x) / SR, 2), 's')


def boom(dur=1.6, grave=70, cola=0.5):
    n = int(SR * dur)
    t = np.arange(n) / SR
    golpe = np.sin(2 * np.pi * (grave * np.exp(-t * 9) + 38) * t) * np.exp(-t * 7)
    ruido = filt(rng.standard_normal(n), 900) * np.exp(-t * 5.5)
    aire = filt(rng.standard_normal(n), 320) * np.exp(-t * (2.2 / cola)) * 0.6
    chasq = filt(rng.standard_normal(n), 2500, 'high') * np.exp(-t * 60) * 0.5
    return golpe * 1.1 + ruido * 0.9 + aire + chasq


def crackle(dur=2.2, densidad=900):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = np.zeros(n)
    env = np.clip(t / 0.25, 0, 1) * np.exp(-t * 1.6)
    for _ in range(int(densidad * dur)):
        i = rng.integers(0, n - 200)
        if rng.random() > env[i] * 1.4:
            continue
        m = rng.integers(20, 120)
        x[i:i + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / (m / 4)) * rng.uniform(0.3, 1)
    return filt(x, 1800, 'high')


def silbido(dur=1.3):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 900 + 1700 * (t / dur) ** 1.6
    fase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(fase + 0.6 * np.sin(2 * np.pi * 28 * t)) * (0.25 + 0.75 * t / dur) * np.clip((dur - t) / 0.08, 0, 1)
    aire = filt(rng.standard_normal(n), 3000, 'high') * 0.25 * (t / dur)
    return x * 0.5 + aire


guardar('fw_boom.wav', boom(1.4, 64, 0.4), 0.8)
guardar('fw_boom_grande.wav', np.concatenate([boom(2.8, 80, 1.1)[: int(SR * 2.8)]]) + np.pad(crackle(2.4, 700) * 0.25, (int(SR * 0.25), int(SR * 0.15)))[: int(SR * 2.8)], 0.95)
guardar('fw_crackle.wav', crackle(2.2, 900), 0.7)
guardar('fw_silbido.wav', silbido(1.3), 0.6)
