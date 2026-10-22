"""Partitura y diseño sonoro del día 5 · «No voltees» · El Charro Negro (en producción).

Sincronía: los frames de EV son copia de src/leyendas/d05/timeline.ts (30 fps). Sin «Cielito Lindo» (nota del crítico):
motivo silbado original en La menor armónica. Sin grillos ni tecolote.
"""
import numpy as np

import leyendas_sfx as L  # noqa: F401
import music as M  # noqa: F401
import sfx  # noqa: F401
from sfx import SR, midi  # noqa: F401

FPS = 30
LEN = 1305  # frames del episodio (igual que EP05_LEN en src/leyendas/d05_charro.tsx)
STANDARD_OUTRO = True  # el día 0 trae su propio outro


# momentos clave (frames) — copia de d05/timeline.ts
EV = dict(
    flareUp=6, hoof1=15, hoof2=39, walk=(72, 228), cross=102, quiote=117, lookDown=(150, 180), whistleCut=180,
    shadowEats=216, freeze=228, ear=252, exhale=258, blink1=(288, 300), horseBreath1=324, blink2=(369, 375),
    noParpSlam=377, scrape=390, fight=(411, 432), blink3=(432, 437), blink4=(474, 488), sub=(479, 482),
    silence=(477, 496), pans=(488, 504), flameRight=498, whipR=(510, 527), tilt=(537, 600), buttons=(545, 595),
    eyesOn=591, title=(606, 657), deal=654, palmUp=(672, 700), toss=726, slow=(726, 744), tiltDown=(744, 762),
    coinHit=759, coinFlat=777, flameBack=786, shadowOnCoin=810, holdBreath=816, touch=837, lift=(840, 868),
    grab=868, whip180=(868, 873), land=873, yank=(897, 905), gallop=(906, 1005), lidsClose=(1005, 1014),
    black=(1014, 1029), fadeIn=(1029, 1047), ridersCross=1068, fogSwallow=1086, coinDrop=1098, coinFace=1179,
    charcoal=1188, crumble=(1209, 1230), lockup=1212, sting=1266, endDip=LEN - 8,
)


def fr(f):
    return f / FPS


def score(bus):
    """Coloca música y efectos en el bus. Regresa el segundo donde empieza el outro estándar."""
    return fr(LEN)
