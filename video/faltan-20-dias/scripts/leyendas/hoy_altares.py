"""Audio de la historia del 28 de octubre (cuenta regresiva a HOY). Uso: python3 scripts/leyendas/hoy_altares.py <salida.wav>"""
import json
import os
import sys

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import leyendas_sfx as L  # noqa: E402
import music as M  # noqa: E402
import sfx  # noqa: E402
from sfx import SR, Bus, midi  # noqa: E402

FPS = 30
LEN = 216
OUTRO = 135


def fr(f):
    return f / FPS


def ticks():
    out, f = [], 4
    for n in range(20, 3, -1):
        d = 4 if n > 12 else 3
        out.append((n, f))
        f += d
    for n in (3, 2, 1):
        out.append((n, f))
        f += 8
    out.append((0, f))
    return out, f + 12


def score(bus):
    tk, hoy = ticks()
    # tic de madera por número (cada vez más agudo) y golpes con peso en 3-2-1
    for k, (n, f) in enumerate(tk):
        if n > 3:
            bus.place(sfx.wood(900 + k * 60), fr(f), 0.22, (-0.3, 0.3)[k % 2], wet=0.2)
        elif n > 0:
            bus.place(M.teponaztli(330 if n != 2 else 440, 0.9, seed=n), fr(f), 0.5, 0, wet=0.3)
            bus.place(sfx.thump(140, 60, 0.4, 0.15), fr(f), 0.4)
    bus.place(L.riser(fr(tk[-1][1]) - fr(30) + 0.1, seed=2, root=50), fr(30), 0.22, wet=0.4)
    # el 0 contiene la respiración: silencio de 4 cuadros y ¡HOY!
    bus.place(sfx.boom(3), fr(hoy), 0.6, wet=0.4)
    bus.place(L.fire_whoosh(1.2, 4), fr(hoy) - 0.05, 0.4, wet=0.4)
    for k, m in enumerate([62, 66, 69, 74, 78]):
        bus.place(sfx.marimba(midi(m), 1.8, seed=k), fr(hoy) + k * 0.06, 0.24, (-0.4, -0.2, 0, 0.2, 0.4)[k], wet=0.5)
    bus.place(sfx.bell(midi(86), 2.6), fr(hoy) + 0.3, 0.1, 0, wet=0.8)
    # fiesta breve: son en re mayor (jarana y marimba) bajo el copy
    beat = 60 / 132
    t = fr(hoy) + 0.6
    prog = [[62, 66, 69], [62, 67, 71], [61, 64, 69], [62, 66, 69]]
    k = 0
    while t < fr(LEN):
        ch = prog[(k // 6) % 4]
        bus.place(M.strum([midi(m) for m in ch], 0.5, bright=0.6, vel=0.6, down=k % 2 == 0, seed=k), t, 0.14, 0.1, wet=0.3)
        if k % 3 == 0:
            bus.place(sfx.marimba(midi(ch[(k // 3) % 3] + 12), 0.9, seed=k), t, 0.12, -0.2, wet=0.4)
        if k % 6 == 0:
            bus.place(M.tarima(0.8, seed=k), t, 0.25, 0, wet=0.2)
        t += beat
        k += 1
    return fr(LEN)


if __name__ == '__main__':
    out = sys.argv[1]
    total = LEN + OUTRO
    bus = Bus(total / FPS)
    M.outro(bus, score(bus))
    mix, lufs = sfx.master(bus, fade=(fr(total - 6), fr(total)))
    wavfile.write(out, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
    print(json.dumps({'segundos': total / FPS, 'lufs': round(lufs, 2)}))
