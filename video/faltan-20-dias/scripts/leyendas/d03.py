"""Partitura y diseño sonoro del día 3 · El Niño Fantasma del KM 31 (en producción)."""
import numpy as np

import leyendas_sfx as L  # noqa: F401
import music as M  # noqa: F401
import sfx  # noqa: F401
from sfx import SR, midi  # noqa: F401

FPS = 30
LEN = 1200  # frames del episodio (igual que EP03_LEN en src/leyendas/d03_km31.tsx)
STANDARD_OUTRO = True  # el día 0 trae su propio outro


def fr(f):
    return f / FPS


def score(bus):
    """Coloca música y efectos en el bus. Regresa el segundo donde empieza el outro estándar."""
    return fr(LEN)
