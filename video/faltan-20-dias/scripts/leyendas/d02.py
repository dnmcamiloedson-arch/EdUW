"""Partitura y diseño sonoro del día 2 · La Llorona (en producción)."""
import numpy as np

import leyendas_sfx as L  # noqa: F401
import music as M  # noqa: F401
import sfx  # noqa: F401
from sfx import SR, midi  # noqa: F401

FPS = 30
LEN = 195  # frames del episodio (igual que EP02_LEN en src/leyendas/d02_llorona.tsx)
STANDARD_OUTRO = True  # el día 0 trae su propio outro


def fr(f):
    return f / FPS


def score(bus):
    """Historia del día 2: río de noche, pétalos que llegan, dos velitas, lamento lejano, rótulo."""
    T = fr(LEN)
    bus.place(M.river(T + 0.5, seed=2), 0, 0.22, 0, wet=0.3)
    bus.place2(sfx.wind_bed(int(T * SR), 12), 0, 0.06, wet=0.3)
    # pétalos: roce de papel que crece mientras llegan
    r = sfx.rustle(3, 3.0)
    r *= np.linspace(0.3, 1, len(r))
    bus.place(r, fr(8), 0.18, -0.2, wet=0.4)
    # arpa en la menor, melodía original y lenta
    for k, (m, at) in enumerate([(57, 10), (60, 28), (64, 46), (62, 64), (60, 82), (59, 100), (57, 118)]):
        bus.place(M.pluck(midi(m), 2.6, 0.45, 0.997, 0.8, seed=k), fr(at), 0.22, 0.1, wet=0.7)
    # las dos velitas se encienden
    bus.place(sfx.ignite(4), fr(42), 0.18, -0.3, wet=0.4)
    bus.place(sfx.ignite(5), fr(54), 0.18, 0.3, wet=0.4)
    # lamento lejano, apagado por la distancia
    bus.place(L.muffle(L.wail(2.4, 480, seed=3), 0.6), fr(60), 0.07, 0.6, wet=0.9)
    # la lágrima y el rótulo
    bus.place(sfx.bell(midi(81), 2.4), fr(94), 0.12, 0, wet=0.8)
    bus.place(M.choir([57, 64, 69], T - fr(96), 'u', 0.6, seed=2, attack=0.8), fr(96), 0.06, wet=0.8)
    bus.place(L.muffle(L.sigh(5, 1.2), 0.4), fr(150), 0.08, 0.7, wet=0.8)
    return T
