"""Partitura y diseño sonoro del día 0 · Hoy (en producción)."""
import numpy as np

import leyendas_sfx as L  # noqa: F401
import music as M  # noqa: F401
import sfx  # noqa: F401
from sfx import SR, midi  # noqa: F401

FPS = 30
LEN = 450  # frames del episodio (igual que EP00_LEN en src/leyendas/d00_hoy.tsx)
STANDARD_OUTRO = True  # el cierre emotivo va en el episodio; luego, el logo


def fr(f):
    return f / FPS


def score(bus):
    """Día 0 · «Ya llegaron»: vals tierno en re mayor (guitarra y caja de música), grillos, pétalos que se levantan,
    las velas del altar que despiertan, el café soplado dos veces y el acorde que abre al subir la toma."""
    T = fr(LEN)
    bus.place(L.crickets(T, density=0.6), 0, 0.05, 0.1, wet=0.4)
    bus.place2(sfx.wind_bed(int(T * SR), 30), 0, 0.05, wet=0.3)
    # vals: bajo y acordes de guitarra (3/4 a ~66 bpm), melodía original en caja de música
    beat = 60 / 66
    prog = [(50, [62, 66, 69]), (45, [61, 64, 69]), (47, [62, 66, 71]), (43, [62, 67, 71]), (50, [62, 66, 69]), (45, [61, 64, 67]), (43, [59, 62, 67]), (45, [61, 64, 69])]
    mel = [(74, 1), (73, 0.5), (71, 0.5), (69, 1), (66, 2), (67, 1), (69, 1), (71, 1), (69, 3), (74, 1), (76, 0.5), (74, 0.5), (71, 1), (69, 2), (67, 1), (66, 1), (64, 1), (62, 3)]
    t0 = fr(10)
    bar = 0
    t = t0
    while t < fr(372):
        root, ch = prog[bar % len(prog)]
        bus.place(M.pluck(midi(root), 2.4, 0.4, 0.996, 0.7, seed=bar), t, 0.20, -0.1, wet=0.5)
        for b in (1, 2):
            bus.place(M.strum([midi(m) for m in ch], 1.4, bright=0.45, vel=0.5, seed=bar * 3 + b), t + b * beat, 0.11, 0.1, wet=0.5)
        bar += 1
        t += 3 * beat
    tm = fr(60)
    for k, (m, d) in enumerate(mel):
        if tm > fr(372):
            break
        bus.place(M.musicbox(midi(m), 1.6, 0.8), tm, 0.12, 0.2, wet=0.7)
        tm += d * beat
    # sus pasos sobre los pétalos
    for k in range(9):
        bus.place(sfx.rustle(k + 3, 0.6), fr(12) + k * 0.8, 0.07, (-0.2, 0.2)[k % 2], wet=0.3)
    # las velas del altar despiertan cuando ella llega
    for k, f0 in enumerate((140, 150, 172, 182)):
        bus.place(sfx.ignite(20 + k), fr(f0), 0.12, (-0.4, 0.4, -0.2, 0.2)[k], wet=0.4)
    # ella sopla su café, dos veces
    for k, f0 in enumerate((222, 246)):
        bus.place(sfx.air(40 + k, 0.7, (400, 1200), (1200, 3500)), fr(f0), 0.22, 0.15, wet=0.3)
    # la toma sube: se abre un acorde con coro
    bus.place(M.choir([50, 57, 62, 66, 69], fr(LEN) - fr(296), 'a', 0.7, seed=5, attack=1.4), fr(296), 0.11, wet=0.8)
    bus.place(sfx.bell(midi(86), 3.0), fr(378), 0.09, 0, wet=0.8)
    bus.place(M.pluck(midi(50), 4.0, 0.35, 0.998, 0.8, seed=99), fr(378), 0.24, 0, wet=0.6)
    return T
