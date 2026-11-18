"""Copia las fotos HEIC subidas (IMG_*.heic) a media/grad_ceremonia/fuente y las convierte a JPG.
Solo procesa las que aún no están. Uso: python3 scripts/grad_importar.py <carpeta_de_subidas> [hoja.png]"""
import glob
import os
import re
import shutil
import sys

import pillow_heif
from PIL import Image, ImageOps

pillow_heif.register_heif_opener()
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'media/grad_ceremonia/fuente')
os.makedirs(D, exist_ok=True)
nuevas = []
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*IMG_*.heic'))):
    n = re.search(r'(IMG_\d+)\.heic$', f).group(1)
    jpg = os.path.join(D, n + '.jpg')
    if os.path.exists(jpg):
        continue
    shutil.copy(f, os.path.join(D, n + '.heic'))
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    im.save(jpg, quality=93)
    nuevas.append(jpg)
    print(n, im.size)
if len(sys.argv) > 2 and nuevas:
    h = 500
    ims = [Image.open(j) for j in nuevas]
    ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
    o = Image.new('RGB', (sum(i.width for i in ims) + 10 * len(ims), h), 'white')
    x = 0
    for im in ims:
        o.paste(im, (x, 0))
        x += im.width + 10
    o.save(sys.argv[2])
print(len(glob.glob(os.path.join(D, '*.jpg'))), 'fotos en total')
