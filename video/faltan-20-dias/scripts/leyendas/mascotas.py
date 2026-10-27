"""Audio del video del 27 de octubre (las mascotas). Uso: python3 scripts/leyendas/mascotas.py <salida.wav>

Si existen public/audio/mascotas/maullido*.wav y ladrido*.wav (los audios que mande el cliente) se usan esos;
si no, se sintetizan un maullido y un ladrido de respaldo.
"""
import glob
import json
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import leyendas_sfx as L  # noqa: E402
import music as M  # noqa: E402
import sfx  # noqa: E402
from sfx import SR, Bus, midi  # noqa: E402

FPS = 30
LEN = 540
OUTRO = 135
AUD = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'public', 'audio', 'mascotas')


def fr(f):
    return f / FPS


def load(pattern):
    """Carga los audios del cliente (mono, 48 kHz, normalizados) que coincidan con el patrón."""
    out = []
    for p in sorted(glob.glob(os.path.join(AUD, pattern))):
        sr, x = wavfile.read(p)
        x = x.astype(np.float64)
        if x.ndim > 1:
            x = x.mean(axis=1)
        if sr != SR:
            g = np.gcd(sr, SR)
            x = resample_poly(x, SR // g, sr // g)
        x /= max(1e-9, np.max(np.abs(x)))
        out.append(x)
    return out


def meow(seed=0, dur=0.75, f0=520.0):
    """Maullido de respaldo: tono que sube y baja con formantes «i-a-u»."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    f = f0 * (1 + 0.55 * np.sin(np.pi * np.clip(u * 1.1, 0, 1)) ** 1.5) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
    ph = np.cumsum(f) / SR
    src = sum(np.sin(2 * np.pi * ph * k) / k ** 1.2 for k in range(1, 14))
    src += sfx.noise(n, seed) * 0.05
    v = L.vowel_glide(src, ['i', 'a', 'a', 'o', 'u'])
    env = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.18)
    return L.norm(v * env)


def score(bus):
    maull = load('maullido*.wav') or [meow(1), meow(2, 0.6, 600), meow(3, 0.9, 470)]
    ladri = load('ladrido*.wav') or [L.norm(L.dog_bark(4)), L.norm(L.dog_bark(5))]
    llanto = load('llanto*.wav') or [meow(6, 1.2, 700)]
    # intro en negro: solo ellos y un aire tenue
    bus.place2(sfx.wind_bed(int(fr(LEN) * SR), 9), 0, 0.03, wet=0.3)
    # 1) un cachorro que llora bajito; 2) los ladridos con que te recibía; 3) maullidos; 4) el llanto otra vez, lejos
    bus.place(llanto[0][: int(3.2 * SR)] * np.linspace(1, 0.4, int(3.2 * SR)), fr(4), 0.24, -0.15, wet=0.45)
    bus.place(ladri[0], fr(70), 0.24, 0.2, wet=0.4)
    bus.place(maull[0], fr(138), 0.24, -0.2, wet=0.45)
    bus.place(maull[min(1, len(maull) - 1)], fr(166), 0.24, 0.15, wet=0.5)
    bus.place(llanto[min(1, len(llanto) - 1)][: int(2.2 * SR)] * np.linspace(0.8, 0, int(2.2 * SR)), fr(200), 0.16, 0.1, wet=0.7)
    # la escena: caja de música y guitara suave en sol mayor, melodía original
    beat = 60 / 72
    prog = [(43, [59, 62, 67]), (40, [59, 64, 67]), (36, [60, 64, 67]), (38, [57, 62, 66])]
    t = fr(236)
    k = 0
    while t < fr(LEN):
        root, ch = prog[k % 4]
        bus.place(M.pluck(midi(root), 2.6, 0.4, 0.996, 0.6, seed=k), t, 0.18, -0.1, wet=0.5)
        bus.place(M.strum([midi(m) for m in ch], 2.0, bright=0.4, vel=0.45, seed=k + 9), t + 2 * beat, 0.1, 0.1, wet=0.6)
        t += 4 * beat
        k += 1
    mel = [(74, 1), (71, 1), (72, 0.5), (74, 0.5), (76, 2), (74, 1), (71, 1), (69, 2), (71, 1), (72, 1), (74, 1), (67, 3)]
    t = fr(262)
    for m, d in mel:
        bus.place(M.musicbox(midi(m), 1.8, 0.8), t, 0.12, 0.2, wet=0.7)
        t += d * beat
    # cada huellita aparece con un toque suave
    for j, f0 in enumerate([252 + 10 * i for i in range(11)] + [260 + 8 * i for i in range(14)]):
        bus.place(sfx.bell(midi(91 + (j % 3) * 2), 0.6), fr(f0), 0.018, (-0.3, 0.3)[j % 2], wet=0.8)
    # llegan: el cascabel del collar, beben agua, un maullido bajito
    for q in range(5):
        bus.place(sfx.bell(midi(96) * (1 + 0.03 * q), 0.4), fr(400) + q * 0.07, 0.07, 0.35, wet=0.5)
    for q in range(6):
        bus.place(sfx.bp(sfx.noise(int(0.08 * SR), 30 + q), 900, 3000) * sfx.env(int(0.08 * SR), 0.005, 0.03), fr(412) + q * 0.22, 0.1, 0.25, wet=0.4)
    bus.place(maull[min(2, len(maull) - 1)], fr(452), 0.12, -0.1, wet=0.8)
    # final: acorde que abre con el texto
    bus.place(M.choir([55, 62, 67, 71], fr(LEN) - fr(462), 'a', 0.6, seed=7, attack=1.2), fr(462), 0.1, wet=0.8)
    bus.place(sfx.bell(midi(91), 2.6), fr(470), 0.07, 0, wet=0.8)
    return fr(LEN)


if __name__ == '__main__':
    out = sys.argv[1]
    total = LEN + OUTRO
    bus = Bus(total / FPS)
    at = score(bus)
    M.outro(bus, at)
    mix, lufs = sfx.master(bus, fade=(fr(total - 6), fr(total)))
    wavfile.write(out, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
    print(json.dumps({'segundos': total / FPS, 'lufs': round(lufs, 2), 'clientes': bool(load('maullido*.wav') or load('ladrido*.wav') or load('llanto*.wav'))}))
