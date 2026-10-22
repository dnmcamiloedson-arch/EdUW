"""Partitura y diseño sonoro del día 6 · «Lo que vio el espejo» · Las Brujas de Fuego (en producción).

Sincronía: los frames de EV son copia de src/leyendas/d06/timeline.ts (30 fps). Cues completos en el plan de la etapa SCORE.
"""
import numpy as np

import leyendas_sfx as L  # noqa: F401
import music as M  # noqa: F401
import sfx  # noqa: F401
from sfx import SR, midi  # noqa: F401

FPS = 30
LEN = 1350  # frames del episodio (igual que EP06_LEN en src/leyendas/d06_brujas.tsx)
STANDARD_OUTRO = True  # el día 0 trae su propio outro

# momentos clave (frames) — copia de d06/timeline.ts
EV = dict(
    breathHook=3, wipe1=(18, 38), star=(40, 60), blink=51, touch=69, walk=(84, 132), push=138,
    scissorsLift=192, scissorsOpen=207, tock=228, sit=(236, 262), rockStart=270,
    shadowArms=(288, 324), fray=(324, 357), collapse=360, ignite=366,
    orb2=438, orb3=453, windowsDark=(444, 504), dip=507, nods=(528, 552, 570), handSlide=(570, 594),
    humBreak=582, cricketsStop=609, owlLand=660, owlSnap=676, underlight=687, owlLaunch=690,
    orbRise=(702, 732), crossFull=(714, 722), flinch=747, orbDrop=(762, 777), knocks=(798, 816),
    selfSwing=810, whimper=849, feed=(864, 930), whimper2=912, gasp=936, fill=(942, 954), tearOff=952,
    whip=(958, 968), faceOpen=(978, 990), morph=(990, 1011), freeze=1014, zero=(1014, 1023),
    lunge=(1021, 1026), slam=1026, drag=(1032, 1050), exit=(1050, 1077), rehang=1086,
    fingersOut=(1089, 1098), grasp=1110, lapse=(1122, 1152), straighten=(1155, 1167), wipe2=(1155, 1170),
    breath2=1173, ember6=1206, fogGone=(1244, 1259), night=(1244, 1268), lockup=1246, sixOn=1281,
    sixOff=1319, endDip=LEN - 8,
)


def fr(f):
    return f / FPS


def score(bus):
    """Coloca música y efectos en el bus. Regresa el segundo donde empieza el outro estándar."""
    return fr(LEN)
