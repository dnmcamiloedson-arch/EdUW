"""Audio de la historia del 2 de noviembre (veladoras · «Hoy vuelven a casa.»). Uso: python3 scripts/leyendas/dos_nov.py <salida.wav>"""
import json
import os
import sys

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import music as M  # noqa: E402
import sfx  # noqa: E402
from sfx import SR, Bus, midi  # noqa: E402

FPS = 30
LEN = 240
OUTRO = 135
# orden de encendido de las siete veladoras (ver VELAS en src/leyendas/dosNov.tsx)
ORDER = [3, 2, 4, 0, 5, 1, 6]


def fr(f):
    return f / FPS


def score(bus):
    # cada veladora: cerillo y una campanita que sube por la pentatónica de re
    notes = [74, 76, 78, 81, 83, 86, 88]
    for k in range(7):
        t = fr(16 + k * 9)
        i = ORDER.index(k)
        pan = (i - 3) / 4
        bus.place(sfx.ignite(k + 1), t - 0.05, 0.16, pan, wet=0.3)
        bus.place(sfx.bell(midi(notes[k]), 2.4), t, 0.07, pan, wet=0.7)
    # coro suave que abraza el texto
    bus.place(M.choir([midi(50), midi(57), midi(62), midi(66)], fr(LEN - 60) + 2.5, vowel='a', vel=0.55, seed=2, attack=1.2), fr(60), 0.16, 0, wet=0.6)
    # flauta: «Hoy vuel-ven a ca-sa»
    t0 = fr(78)
    for k, (m, d) in enumerate([(69, 0.45), (71, 0.45), (74, 0.9), (73, 0.45), (69, 1.4)]):
        bus.place(M.flute(midi(m), d + 0.3, vel=0.7, seed=k), t0, 0.12, -0.1, wet=0.55)
        t0 += d
    # caja musical para el cierre «Día de Muertos»
    for k, m in enumerate([74, 78, 81, 86]):
        bus.place(M.musicbox(midi(m), 1.8, vel=0.8), fr(176) + k * 0.16, 0.1, (-0.3, -0.1, 0.1, 0.3)[k], wet=0.6)
    return fr(LEN)


if __name__ == '__main__':
    out = sys.argv[1]
    total = LEN + OUTRO
    bus = Bus(total / FPS)
    M.outro(bus, score(bus))
    mix, lufs = sfx.master(bus, fade=(fr(total - 6), fr(total)))
    wavfile.write(out, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
    print(json.dumps({'segundos': total / FPS, 'lufs': round(lufs, 2)}))
