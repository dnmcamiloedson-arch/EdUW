"""Partitura y diseño sonoro del día 1 · Las siete leyendas (en producción)."""
import numpy as np

import leyendas_sfx as L  # noqa: F401
import music as M  # noqa: F401
import sfx  # noqa: F401
from sfx import SR, midi  # noqa: F401

FPS = 30
LEN = 230  # frames del episodio (igual que EP01_LEN en src/leyendas/d01_altares.tsx)
STANDARD_OUTRO = True  # el día 0 trae su propio outro


def fr(f):
    return f / FPS


def score(bus):
    """Historia del día 1: siete veladoras, cada una con una nota (re frigio, sin octava), y el fuego que corre por el 1."""
    T = fr(LEN)
    bus.place2(sfx.wind_bed(int(T * SR), 21), 0, 0.08, wet=0.3)
    bus.place(L.drone_dark(T, root=38, seed=1), 0, 0.10, wet=0.5)
    notas = [62, 63, 65, 67, 69, 70, 72]
    ats = [max(8, (-90 + 180 / 7 + i * 360 / 7 + 88) / 332 * 84 - 17) for i in range(7)]
    for k, (at, m) in enumerate(zip(ats, notas)):
        bus.place(sfx.strike(k), fr(at) - 0.05, 0.10, (-0.4, 0, 0.4, -0.6, -0.2, 0.2, 0.6)[k])
        bus.place(sfx.ignite(k + 10), fr(at), 0.14, (-0.4, 0, 0.4, -0.6, -0.2, 0.2, 0.6)[k], wet=0.3)
        bus.place(sfx.marimba(midi(m), 1.8, seed=k), fr(at), 0.20, (-0.4, 0, 0.4, -0.6, -0.2, 0.2, 0.6)[k], wet=0.6)
    # inhalan las llamas y el fuego corre por el camino de pétalos
    bus.place(L.reverse_swell(L.fire_whoosh(1.0, 3), 1.0), fr(96) - 1.0, 0.25, wet=0.3)
    run = sfx.fire(fr(132) - fr(96) + 1.5, 4)
    run *= np.linspace(0.4, 1, len(run))
    bus.place(run, fr(96), 0.45, 0, wet=0.4)
    bus.place(L.fire_whoosh(1.4, 5), fr(96), 0.40, wet=0.4)
    # la cámara sube: aire que se abre
    bus.place(sfx.air(7, 1.6, (300, 900), (900, 3000)), fr(132), 0.25, 0, wet=0.5)
    # la octava llega con el rótulo: el re grave resuelve
    bus.place(sfx.boom(6), fr(172), 0.35, wet=0.4)
    bus.place(M.choir([50, 57, 62, 74], T - fr(150), 'a', 0.7, seed=4, attack=0.6), fr(150), 0.10, wet=0.8)
    bus.place(sfx.marimba(midi(74), 2.4, seed=9), fr(172), 0.24, 0, wet=0.7)
    bus.place(sfx.bell(midi(86), 2.6), fr(174), 0.08, 0, wet=0.8)
    return T
