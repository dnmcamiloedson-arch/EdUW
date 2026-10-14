"""Sube la luz SOLO a una persona (la que habla) usando una máscara que la sigue cuadro a cuadro.

Uso: python3 luz_por_mascara.py <entrada.mp4> <salida.mp4> <x_inicial> <y_inicial> [ganancia=1.45] [fondo=0.9]
  x/y: punto aproximado de la CABEZA de la persona en el primer cuadro (en px de 1080x1920).

Cómo funciona:
  1. Segmenta personas (u2net_human_seg) en una ventana alrededor de la persona.
  2. Se queda con la figura que contiene/está más cerca del punto seguido y actualiza el punto
     con su centroide (seguimiento simple).
  3. Difumina la máscara y la suaviza en el tiempo para que no "tiemble".
  4. Dentro de la máscara: +exposición, sombras levantadas y un toque cálido.
     Fuera: un poco más oscuro para que ella resalte.
"""
import subprocess, sys
import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage as ndi
import cv2

src, dst, hx, hy = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
GAIN = float(sys.argv[5]) if len(sys.argv) > 5 else 1.45
BG = float(sys.argv[6]) if len(sys.argv) > 6 else 0.9
W, H = 1080, 1920
WIN_W, WIN_H = 520, 900  # ventana de búsqueda alrededor de la persona
BODY = 380    # px desde la cabeza hacia abajo que se iluminan (cara + torso)
HALF_W = 170  # media anchura de la caja de la persona

session = new_session('u2net_human_seg')
dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '30',
                        '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', dst],
                       stdin=subprocess.PIPE)

import os
DEBUG = os.environ.get('DEBUG_MASK')  # carpeta para guardar la máscara cada 30 cuadros
cx, cy = hx, hy + 170
prev_mask = None
n = 0
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    img = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.float32) / 255

    # 1) segmentación en la ventana
    x0 = int(np.clip(cx - WIN_W / 2, 0, W - WIN_W)); y0 = int(np.clip(cy - WIN_H * 0.45, 0, H - WIN_H))
    crop = Image.fromarray((img[y0:y0 + WIN_H, x0:x0 + WIN_W] * 255).astype(np.uint8))
    m = np.asarray(remove(crop, session=session, only_mask=True).convert('L')).astype(np.float32) / 255

    # 2) quedarse con la figura seguida: se sigue la CABEZA (punto más alto de la figura),
    #    porque el centroide se "jala" hacia las cabezas del público en primer plano
    lab, k = ndi.label(m > 0.5)
    found = False
    if k:
        best, bd = None, 1e9
        for i, sl in enumerate(ndi.find_objects(lab), 1):
            ys, xs = np.nonzero(lab[sl] == i)
            if len(ys) < 400:
                continue
            ty = ys.min() + sl[0].start
            tx = xs[ys == ys.min()].mean() + sl[1].start
            d = np.hypot(x0 + tx - hx, y0 + ty - hy)
            if d < bd:
                best, bd, bt = i, d, (x0 + tx, y0 + ty)
        if best is not None and bd < 160:
            found = True
            m = m * (lab == best)
            hx = 0.6 * hx + 0.4 * bt[0]; hy = 0.6 * hy + 0.4 * bt[1]
            cx, cy = hx, hy + BODY * 0.45
    full = np.zeros((H, W), np.float32)
    if found:
        full[y0:y0 + WIN_H, x0:x0 + WIN_W] = m
        # caja de la persona a partir de la cabeza (excluye al público de abajo), con borde suave
        yy = np.arange(H)[:, None]; xx = np.arange(W)[None, :]
        vert = np.clip((hy + BODY - yy) / 90, 0, 1) * np.clip((yy - (hy - 40)) / 20, 0, 1)
        horz = np.clip((HALF_W - np.abs(xx - hx)) / 40, 0, 1)
        full *= vert * horz
    elif prev_mask is not None:
        full = prev_mask * 0.92
    full = cv2.GaussianBlur(full, (0, 0), 9)
    if prev_mask is not None:
        full = 0.6 * full + 0.4 * prev_mask
    prev_mask = full
    a = full[..., None]
    if DEBUG and n % 30 == 0:
        os.makedirs(DEBUG, exist_ok=True)
        dbg = (img * 0.5 + np.stack([full, full * 0.2, full * 0.2], -1) * 0.5)
        Image.fromarray((np.clip(dbg, 0, 1) * 255).astype(np.uint8)).resize((270, 480)).save(f'{DEBUG}/m_{n:04d}.jpg')

    # 3) gradación
    lit = img * GAIN                                   # 1.45 ≈ +0.55 stops
    lit = lit + (1 - lit) * 0.10 * (1 - lit)          # levanta sombras
    lit = lit * np.array([1.04, 1.0, 0.95])           # cálido sutil
    lit = 1 - (1 - np.clip(lit, 0, 1.4)) ** 1.0
    lit = np.clip(lit / (1 + 0.12 * np.maximum(lit - 0.85, 0)), 0, 1)  # protege altas luces
    rest = img * BG                                     # resto un poco más oscuro
    out = rest * (1 - a) + lit * a
    # pequeño realce general de contraste
    out = np.clip((out - 0.5) * 1.05 + 0.5, 0, 1)
    enc.stdin.write((out * 255).astype(np.uint8).tobytes())
    n += 1

enc.stdin.close(); enc.wait(); dec.wait()
print(n, 'cuadros ->', dst)
