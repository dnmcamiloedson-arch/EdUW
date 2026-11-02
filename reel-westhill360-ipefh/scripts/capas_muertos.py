"""Separa en capas el póster de Día de Muertos (imagen plana, sin capas) para animarlo.
Cada pieza es un recorte del original con alfa por diferencia contra el fondo crema (o por saturación),
la calavera se recorta con rembg (isnet) y el fondo se reconstruye con inpainting debajo de las piezas.
Uso: python3 capas_muertos.py <original.png> <calavera_rembg.png (recorte desde y=880)> <salida>"""
import json, sys
import cv2, numpy as np
from PIL import Image

SRC, CAL, OUT = sys.argv[1:4]
o = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
H, W = o.shape[:2]
crema = np.median(o[300:340, 380:560].reshape(-1, 3), axis=0)
dif = np.sqrt(((o - crema) ** 2).sum(2))
hsv = cv2.cvtColor(o.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
sat, val = hsv[..., 1], hsv[..., 2]

def suave(m, r=2):
    m = cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=r)
    return cv2.GaussianBlur(m.astype(np.float32), (5, 5), 0)

# (caja x0,y0,x1,y1, criterio)
PIEZAS = {
    'papel_izq': ((0, 0, 290, 280), 'sat'),
    'papel_der': ((560, 0, 941, 330), 'sat'),
    'logo': ((280, 105, 665, 268), 'dif'),
    'fecha': ((200, 270, 745, 332), 'dif'),
    'rayos_izq': ((40, 385, 185, 555), 'dif'),
    'rayos_der': ((790, 385, 925, 565), 'dif'),
    'dia_de': ((185, 365, 792, 548), 'dif'),
    'cinta': ((75, 545, 895, 775), 'dif'),
    'frase': ((115, 795, 535, 1055), 'dif'),
    'subraya': ((160, 1055, 480, 1110), 'dif'),
    'corazon1': ((755, 268, 885, 400), 'dif'),
    'corazon2': ((775, 790, 890, 905), 'dif'),
    'flor': ((135, 1145, 305, 1310), 'dif'),
    'brillo1': ((862, 330, 930, 405), 'dif'),
    'brillo2': ((660, 812, 745, 895), 'dif'),
    'brillo3': ((70, 1175, 145, 1250), 'dif'),
    'ola_izq': ((0, 550, 160, 1185), 'sat'),
    'altar': ((0, 880, 941, 1672), 'dif'),
}
masks = {}
for k, ((x0, y0, x1, y1), c) in PIEZAS.items():
    m = np.zeros((H, W), np.float32)
    reg = (dif > 42) if c == 'dif' else ((sat > 70) & (val > 60))
    m[y0:y1, x0:x1] = reg[y0:y1, x0:x1]
    masks[k] = m
# el altar no incluye lo que ya es de otras piezas de abajo
def sin(k, otros):
    for q in otros:
        masks[k] = np.where(cv2.dilate((masks[q] > 0).astype(np.uint8), np.ones((5, 5), np.uint8), iterations=2) > 0, 0, masks[k])
sin('altar', ('flor', 'brillo3', 'ola_izq', 'subraya', 'frase', 'corazon2', 'brillo2'))
sin('ola_izq', ('frase', 'subraya', 'flor', 'brillo3'))
sin('papel_der', ('fecha', 'corazon1', 'brillo1', 'logo'))
sin('papel_izq', ('fecha', 'logo'))
# calavera (rembg) en coordenadas completas
cal = np.zeros((H, W, 4), np.uint8)
c = np.array(Image.open(CAL).convert('RGBA'))
cal[880:880 + c.shape[0], :c.shape[1]] = c[:H - 880]
masks['calavera'] = cal[..., 3].astype(np.float32) / 255

info = {}
for k, m in masks.items():
    a = np.clip(suave(m > 0.5) if k != 'calavera' else m, 0, 1)
    ys, xs = np.where(a > 0.02)
    if len(xs) == 0: continue
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.dstack([o[y0:y1, x0:x1], a[y0:y1, x0:x1] * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(f'{OUT}/{k}.png', optimize=True)
    info[k] = {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}
# fondo: se quitan todas las piezas y se rellena (inpainting)
todo = np.zeros((H, W), np.uint8)
for k, m in masks.items():
    todo |= (cv2.dilate((m > 0.3).astype(np.uint8), np.ones((7, 7), np.uint8), iterations=2) > 0).astype(np.uint8)
# los textos se quitan por bloque completo (si no, quedan fantasmas de las letras blancas o delgadas)
for k in ('logo', 'fecha', 'dia_de', 'cinta', 'frase', 'subraya'):
    ys, xs = np.where(masks[k] > 0.3)
    if len(xs): todo[max(0, ys.min() - 8):ys.max() + 9, max(0, xs.min() - 8):xs.max() + 9] = 1
fondo = cv2.inpaint(o.astype(np.uint8), todo * 255, 9, cv2.INPAINT_TELEA).astype(np.float32)
# lo rellenado tiende a crema para que no queden manchas
blend = cv2.GaussianBlur(todo.astype(np.float32), (31, 31), 0)[..., None] * 0.75
fondo = (fondo * (1 - blend) + crema * blend).astype(np.uint8)
Image.fromarray(fondo).save(f'{OUT}/fondo.png', optimize=True)
Image.fromarray(o.astype(np.uint8)).save(f'{OUT}/original.png', optimize=True)
json.dump(info, open(f'{OUT}/piezas.json', 'w'), indent=1)
print(json.dumps(info))
