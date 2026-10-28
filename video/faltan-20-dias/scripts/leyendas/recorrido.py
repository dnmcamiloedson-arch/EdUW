"""Audio del anuncio del recorrido de altares (12:00 PM). Uso: python3 scripts/leyendas/recorrido.py <salida.wav>"""
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
LEN = 240
OUTRO = 135
NOON = 62


def fr(f):
    return f / FPS


def score(bus):
    # tic-tac que acelera mientras giran las manecillas y frena al llegar
    t, k = 0.1, 0
    while t < fr(NOON) - 0.05:
        u = t / fr(NOON)
        bus.place(sfx.wood(1500 if k % 2 else 1200), t, 0.16, (-0.2, 0.2)[k % 2], wet=0.2)
        t += 0.05 + 0.12 * u * u
        k += 1
    bus.place(L.riser(fr(NOON) - 0.3, seed=3, root=52), 0.2, 0.18, wet=0.4)
    # campanada de mediodía con pétalos
    bus.place(sfx.bell(midi(67), 3.5), fr(NOON), 0.35, 0, wet=0.7)
    bus.place(sfx.bell(midi(79), 3.0), fr(NOON), 0.18, 0, wet=0.7)
    bus.place(sfx.boom(5), fr(NOON), 0.35, wet=0.4)
    bus.place(L.fire_whoosh(1.0, 6), fr(NOON) - 0.05, 0.25, wet=0.4)
    # golpes para los textos que entran de golpe
    for f0 in (NOON + 14, NOON + 100):
        bus.place(M.teponaztli(440, 0.8, seed=f0), fr(f0), 0.35, 0, wet=0.3)
    # son alegre en sol mayor bajo la información
    beat = 60 / 132
    t, k = fr(NOON) + 0.4, 0
    prog = [[67, 71, 74], [67, 72, 76], [66, 69, 74], [67, 71, 74]]
    while t < fr(LEN):
        ch = prog[(k // 6) % 4]
        bus.place(M.strum([midi(m) for m in ch], 0.5, bright=0.6, vel=0.55, down=k % 2 == 0, seed=k), t, 0.13, 0.1, wet=0.3)
        if k % 3 == 0:
            bus.place(sfx.marimba(midi(ch[(k // 3) % 3] + 12), 0.9, seed=k), t, 0.12, -0.2, wet=0.4)
        if k % 6 == 0:
            bus.place(M.tarima(0.8, seed=k), t, 0.22, 0, wet=0.2)
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
