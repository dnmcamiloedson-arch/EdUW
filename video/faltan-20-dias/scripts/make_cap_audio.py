"""Música y diseño sonoro de cada capítulo (temporada 2).

Uso: python3 scripts/make_cap_audio.py <dias> <salida.wav>

Cada capítulo tiene su propia partitura (instrumentos, tonalidad y tempo distintos),
sincronizada con los tiempos de sus escenas (en segundos, iguales a src/cap/cXX.tsx).
"""
import json
import sys

import numpy as np
from scipy.io import wavfile

import music as M
import sfx
from sfx import SR, Bus, midi

FPS = 30
OUTRO = 135


def fr(f):
    return f / FPS


def bed(bus, dur, drone=0.1, wind=0.4, seed=1):
    n = bus.n
    t = np.arange(n) / SR
    e = np.clip(t / 1.5, 0, 1)
    d = sfx.drone_bed(n, seed) * drone * e
    bus.dry += np.stack([d, d]) + sfx.wind_bed(n, seed + 40) * wind * e


# ---------------------------------------------------------------- 16 · El sol hecho flor
def cap16(bus):
    S1, S2, S3, REV, HIT = 120, 108, 72, 120, 50
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.07, wind=0.35, seed=16)
    # amanecer: pájaros
    for k, (tt, pan) in enumerate([(0.7, -0.5), (1.8, 0.4), (2.6, -0.2), (3.3, 0.6), (5.0, -0.6)]):
        bus.place(M.chirp(160 + k, 2 + k % 3), tt, 0.06, pan, wet=0.6)
    # flauta de carrizo, Re dórico
    phrase = [(0.5, 62, 0.95), (1.45, 65, 0.5), (1.95, 67, 0.5), (2.45, 69, 1.4), (a + 0.15, 72, 0.6), (a + 0.75, 71, 0.4), (a + 1.15, 69, 0.6), (a + 1.75, 67, 0.4), (a + 2.15, 69, 1.3)]
    for k, (tt, m, d) in enumerate(phrase):
        bus.place(M.flute(midi(m), d, 0.9, seed=k), tt, 0.19, -0.1, wet=0.9)
    # latido de huéhuetl
    for tt in [a, a + 0.9, a + 1.8, a + 2.7, b, b + 0.7, b + 1.4, b + 2.0]:
        bus.place(M.huehuetl(0.8, seed=int(tt * 10)), tt, 0.55, wet=0.2)
    # teponaztli y sonaja con el colibrí
    for k in range(8):
        tt = b + 0.35 + k * 0.25
        bus.place(M.teponaztli(330 if k % 2 == 0 else 440, 0.6, seed=k), tt, 0.18, (-0.3, 0.3)[k % 2], wet=0.3)
        bus.place(M.sonaja(0.7, seed=k), tt + 0.125, 0.1, 0.4)
    bus.place(M.buzz(fr(S3) + 0.2, 7), b, 0.16, 0.3)
    bus.place(M.buzz(fr(HIT) + 0.2, 8), c, 0.16, 0.0)
    # vuelo que escribe el número: escala ascendente
    run = [62, 64, 65, 67, 69, 72, 74, 76, 77]
    for k, m in enumerate(run):
        bus.place(M.flute(midi(m), 0.22, 0.8, seed=30 + k), c + 0.05 + k * fr(HIT) / len(run) * 0.95, 0.24, -0.4 + k * 0.1, wet=0.8)
    # llegada
    bus.place(M.huehuetl(1.2, 0.9, seed=99), hit, 0.9, wet=0.3)
    bus.place(sfx.boom(16), hit, 0.85, wet=0.35)
    for k, m in enumerate([62, 69, 74, 77, 81]):
        bus.place(sfx.marimba(midi(m), 2.0), hit + k * 0.045, 0.3, -0.4 + k * 0.2, wet=0.6)
    bus.place2(np.stack([M.choir([50, 57, 62, 65, 69], fr(REV - HIT) + 0.6, 'a', seed=16)] * 2), hit, 0.16, wet=0.8)
    bus.reverb_only(sfx.bell(1174.66, 2.6), hit + 0.05, 0.1)
    return c + fr(REV)


SCORES = {16: cap16}


def build(dias):
    # duración: capítulo + outro
    lens = {16: 120 + 108 + 72 + 120}
    total = lens[dias] + OUTRO
    bus = Bus(total / FPS)
    out_at = SCORES[dias](bus)
    M.outro(bus, out_at)
    mix, lufs = sfx.master(bus, fade=(fr(total - 6), fr(total)))
    return mix, lufs, total


if __name__ == '__main__':
    dias = int(sys.argv[1])
    out = sys.argv[2]
    mix, lufs, total = build(dias)
    wavfile.write(out, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
    print(json.dumps({'dias': dias, 'frames': total, 'segundos': round(total / FPS, 3), 'lufs': round(lufs, 2), 'out': out}))
