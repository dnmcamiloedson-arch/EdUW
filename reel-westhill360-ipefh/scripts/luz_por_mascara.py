"""Sube la luz SOLO a una persona (la que habla) usando una máscara que la sigue cuadro a cuadro.

Uso: python3 luz_por_mascara.py <entrada.mp4> <salida.mp4> <x_inicial> <y_inicial>
  x/y: punto aproximado sobre el torso de la persona en el primer cuadro (en px de 1080x1920).

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

src, dst, cx, cy = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
W, H = 1080, 1920
WIN_W, WIN_H = 520, 900  # ventana de búsqueda alrededor de la persona

session = new_session('u2net_human_seg')
dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '30',
                        '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', dst],
                       stdin=subprocess.PIPE)

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

    # 2) quedarse con la figura seguida
    lab, k = ndi.label(m > 0.5)
    if k:
        px, py = int(cx - x0), int(cy - y0)
        ids = range(1, k + 1)
        cents = ndi.center_of_mass(m > 0.5, lab, ids)
        hit = lab[np.clip(py, 0, WIN_H - 1), np.clip(px, 0, WIN_W - 1)]
        best = hit if hit else min(ids, key=lambda i: (cents[i - 1][0] - py) ** 2 + (cents[i - 1][1] - px) ** 2)
        keep = ndi.binary_dilation(lab == best, iterations=6)
        m = m * keep
        yy, xx = cents[best - 1]
        # seguimiento suave del centroide
        cx = 0.7 * cx + 0.3 * (x0 + xx); cy = 0.7 * cy + 0.3 * (y0 + yy)

    full = np.zeros((H, W), np.float32); full[y0:y0 + WIN_H, x0:x0 + WIN_W] = m
    full = cv2.GaussianBlur(full, (0, 0), 9)
    if prev_mask is not None:
        full = 0.6 * full + 0.4 * prev_mask
    prev_mask = full
    a = full[..., None]

    # 3) gradación
    lit = img * 1.45                                   # ~ +0.55 stops
    lit = lit + (1 - lit) * 0.10 * (1 - lit)          # levanta sombras
    lit = lit * np.array([1.04, 1.0, 0.95])           # cálido sutil
    lit = 1 - (1 - np.clip(lit, 0, 1.4)) ** 1.0
    lit = np.clip(lit / (1 + 0.12 * np.maximum(lit - 0.85, 0)), 0, 1)  # protege altas luces
    rest = img * 0.9                                   # resto un poco más oscuro
    out = rest * (1 - a) + lit * a
    # pequeño realce general de contraste
    out = np.clip((out - 0.5) * 1.05 + 0.5, 0, 1)
    enc.stdin.write((out * 255).astype(np.uint8).tobytes())
    n += 1

enc.stdin.close(); enc.wait(); dec.wait()
print(n, 'cuadros ->', dst)
