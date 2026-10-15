"""Partitura y diseño sonoro del día 7 · El Nahual (en producción)."""
import numpy as np

import leyendas_sfx as L  # noqa: F401
import music as M  # noqa: F401
import sfx  # noqa: F401
from sfx import SR, midi  # noqa: F401

FPS = 30
LEN = 1200  # frames del episodio (igual que EP07_LEN en src/leyendas/d07_nahual.tsx)
STANDARD_OUTRO = True  # el día 0 trae su propio outro


def fr(f):
    return f / FPS


def score(bus):
    """Coloca música y efectos en el bus. Regresa el segundo donde empieza el outro estándar."""
    return fr(LEN)
