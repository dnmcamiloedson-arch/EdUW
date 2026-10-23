"""Prepara las capas del banner Día del Médico: las escala a 1080x1920 y separa en piezas
(componentes conectados) los destellos, dibujos y ondas para animarlas por separado.
Uso: python3 capas_medico.py <carpeta_imagenes> <salida>  -> escribe PNGs y piezas.json"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
W, H = 1080, 1920
CAPAS = {'fondo': '14.webp', 'titulo': '9.png', 'frase': '10.png', 'destellos': '11.png', 'cinta': '12.png',
         'lince': '13.webp', 'dibujos': '15.png', 'ondas': '16.png', 'trama': '17.webp'}
SEPARAR = {'destellos': 18, 'dibujos': 25, 'ondas': 4}  # radio de unión (px) para agrupar trazos cercanos
piezas = {}
for name, f in CAPAS.items():
    im = Image.open(f'{SRC}/{f}').convert('RGBA').resize((W, H), Image.LANCZOS)
    im.save(f'{OUT}/{name}.png')
    a = np.array(im)[..., 3]
    if name in SEPARAR:
        lab, n = ndimage.label(ndimage.binary_dilation(a > 20, iterations=SEPARAR[name]))
        lst = []
        for i, sl in enumerate(ndimage.find_objects(lab)):
            y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
            m = (lab[y0:y1, x0:x1] == i + 1)
            if (a[y0:y1, x0:x1][m] > 20).sum() < 150: continue
            crop = np.array(im)[y0:y1, x0:x1].copy(); crop[..., 3] = crop[..., 3] * m
            Image.fromarray(crop).save(f'{OUT}/{name}_{len(lst)}.png')
            lst.append({'src': f'{name}_{len(lst)}', 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)})
        piezas[name] = lst
    bb = Image.fromarray(a).point(lambda v: 255 if v > 20 else 0).getbbox()
    piezas.setdefault('bbox', {})[name] = bb
json.dump(piezas, open(f'{OUT}/piezas.json', 'w'), indent=1)
print(json.dumps(piezas, indent=0))
