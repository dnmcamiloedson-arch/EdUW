"""Extrae un tramo de un clip (proxy 1080x1920 @30fps) como secuencia de cuadros
y genera el recorte de personas (PNG con alfa) para poner texto DETRÁS de la gente.

Uso: python3 recortar_personas.py <proxy.mp4> <inicio_seg> <duracion_seg> <carpeta_salida> [--photo]
Salida: <carpeta>/bg_0000.jpg (cuadro completo) y <carpeta>/fg_0000.png (solo personas).
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

src, start, dur, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
os.makedirs(out, exist_ok=True)

if src.lower().endswith(('.jpg', '.jpeg', '.png')):
    Image.open(src).convert('RGB').save(f'{out}/bg_0000.jpg', quality=95)
else:
    n = round(dur * 30)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{start:.3f}', '-i', src, '-frames:v', str(n),
                    '-q:v', '2', '-start_number', '0', f'{out}/bg_%04d.jpg'], check=True)

session = new_session('u2net_human_seg')
frames = sorted(f for f in os.listdir(out) if f.startswith('bg_'))
prev = None
for f in frames:
    im = Image.open(f'{out}/{f}').convert('RGB')
    m = np.asarray(remove(im, session=session, only_mask=True).convert('L')).astype(np.float32)
    if prev is not None:  # suavizado temporal para que el borde no "tiemble"
        m = 0.65 * m + 0.35 * prev
    prev = m
    mask = Image.fromarray(np.clip((m - 20) * 1.15, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    rgba = im.copy(); rgba.putalpha(mask)
    rgba.save(f'{out}/fg_{f[3:7]}.png', compress_level=3)
print(len(frames), 'cuadros en', out)
