"""Puntos del logo de Westhill (logos/logo_westhill_blanco_total.png) para el fuego artificial que lo forma.

Divide el logo en celdas de CELDA px y toma un pixel opaco al azar de cada celda ocupada, así los puntos
quedan repartidos parejo. Escribe remotion/src/gradLogoPuntos.ts con [x, y] en pixeles del PNG.
"""
import os
import random

import numpy as np
from PIL import Image

BASE = os.path.join(os.path.dirname(__file__), '..')
CELDA = 6
random.seed(7)
a = np.array(Image.open(os.path.join(BASE, 'remotion/public/logos/logo_westhill_blanco_total.png')).convert('RGBA'))[..., 3]
h, w = a.shape
pts = []
for y0 in range(0, h, CELDA):
    for x0 in range(0, w, CELDA):
        ys, xs = np.where(a[y0:y0 + CELDA, x0:x0 + CELDA] > 128)
        if len(xs) >= 4:
            k = random.randrange(len(xs))
            pts.append((x0 + int(xs[k]), y0 + int(ys[k])))
random.shuffle(pts)
plano = ','.join(f'{x},{y}' for x, y in pts)
open(os.path.join(BASE, 'remotion/src/gradLogoPuntos.ts'), 'w').write(
    '// Generado por scripts/grad_logo_puntos.py: puntos [x, y] (pares seguidos) en pixeles del logo blanco de 779x312\n'
    f'export const LOGO_PNG = {{w: {w}, h: {h}}};\n'
    f'export const LOGO_PUNTOS: number[] = [{plano}];\n'
)
print(len(pts), 'puntos')
