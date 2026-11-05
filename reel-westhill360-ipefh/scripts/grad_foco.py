"""Punto de enfoque vertical de cada foto de graduación (dónde están las caras), para que el rollo de película
no corte cabezas al recortar fotos verticales en cuadros horizontales.

Uso: python3 scripts/grad_foco.py <modelo YuNet face_detection_yunet_2023mar.onnx>
Escribe remotion/src/gradFoco.ts: {'Facultad/NN.jpg': y} con y = altura (0 a 1) del centro de las caras.
Solo se guardan las fotos con caras detectadas.
"""
import json
import os
import sys

import cv2

BASE = os.path.join(os.path.dirname(__file__), '..')
PUB = os.path.join(BASE, 'remotion/public/photos/grad')
det = cv2.FaceDetectorYN.create(sys.argv[1], '', (320, 320), 0.7, 0.3, 5000)
fotos = json.load(open(os.path.join(PUB, 'fotos.json')))
foco = {}
for fac, lista in fotos.items():
    for x in lista:
        img = cv2.imread(os.path.join(PUB, fac, x['n']))
        h, w = img.shape[:2]
        s = 900 / max(h, w)
        im = cv2.resize(img, (int(w * s), int(h * s)))
        det.setInputSize((im.shape[1], im.shape[0]))
        _, F = det.detect(im)
        if F is None or not len(F):
            continue
        # caras grandes pesan más; se toma el rango entre la cara más alta y la más baja
        tops = [float(f[1]) / im.shape[0] for f in F]
        bots = [float(f[1] + f[3]) / im.shape[0] for f in F]
        foco[f'{fac}/{x["n"]}'] = round((min(tops) + max(bots)) / 2, 3)
lineas = ',\n'.join(f"  '{k}': {v}" for k, v in sorted(foco.items()))
open(os.path.join(BASE, 'remotion/src/gradFoco.ts'), 'w').write(
    '// Generado por scripts/grad_foco.py: altura (0 a 1) del centro de las caras en cada foto\n'
    'export const FOCO: Record<string, number> = {\n' + lineas + ',\n};\n'
)
print(len(foco), 'fotos con caras')
