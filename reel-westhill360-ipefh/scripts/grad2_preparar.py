"""Prepara el material del video vertical de la graduación de varias facultades (Generación 2026).

- Videos (media/grad_ceremonia/fuente/*.MOV y el clip de saludos): a 30 fps H.264 sin audio en
  remotion/public/proxies/grad2/<nombre>.mp4. Los verticales quedan a 1080 de ancho; los horizontales a 1920 de alto
  (para poder recortarlos a vertical sin perder nitidez). Si alguno viene en HDR (HLG) se pasa a color normal.
- Fotos elegidas (FOTOS): a remotion/public/grad2/<nombre>.jpg con el lado largo a 2400 px.
Uso: python3 scripts/grad2_preparar.py [videos|fotos]
"""
import glob
import json
import os
import subprocess
import sys

from PIL import Image, ImageOps

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(BASE, 'media/grad_ceremonia/fuente')
PROXY = os.path.join(BASE, 'remotion/public/proxies/grad2')
FOT = os.path.join(BASE, 'remotion/public/grad2')
HDR = 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,'
FOTOS = ['IMG_4209', 'IMG_4224', 'IMG_4322', 'IMG_4223', 'IMG_4239', 'IMG_4263', 'IMG_4229', 'IMG_4233', 'IMG_4258', 'IMG_4240',
         'IMG_4242', 'IMG_4245', 'IMG_4246', 'IMG_4327', 'IMG_4338', 'IMG_4193', 'IMG_4201', 'IMG_4198', 'birretes',
         'diploma_psicologia', 'diploma_estola_azul', 'diploma_pedagogia_k2']


def videos():
    os.makedirs(PROXY, exist_ok=True)
    fuentes = sorted(glob.glob(os.path.join(SRC, '*.MOV')) + glob.glob(os.path.join(SRC, '*.mov'))) + [os.path.join(SRC, 'fila_saludos_1118_2.mp4')]
    info = {}
    for src in fuentes:
        nombre = os.path.basename(src).rsplit('.', 1)[0]
        out = os.path.join(PROXY, nombre + '.mp4')
        pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,color_transfer:stream_side_data=rotation',
                                        '-show_entries', 'format=duration', '-of', 'json', src], capture_output=True, text=True).stdout)
        st = pr['streams'][0]
        rot = abs(int(next((d.get('rotation', 0) for d in st.get('side_data_list', [])), 0)))
        w, h = (st['height'], st['width']) if rot in (90, 270) else (st['width'], st['height'])
        vertical = h >= w
        vf = (HDR if st.get('color_transfer') == 'arib-std-b67' else '') + ('scale=1080:-2' if vertical else 'scale=-2:1920') + ':flags=lanczos,fps=30,format=yuv420p'
        if not os.path.exists(out):
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-g', '15', out], check=True)
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout)
        info[nombre] = {'dur': round(d, 3), 'vertical': vertical}
        print(nombre, info[nombre], flush=True)
    json.dump(info, open(os.path.join(PROXY, 'info.json'), 'w'), indent=0)


def fotos():
    os.makedirs(FOT, exist_ok=True)
    for n in FOTOS:
        im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, n + '.jpg'))).convert('RGB')
        im.thumbnail((2400, 2400), Image.LANCZOS)
        im.save(os.path.join(FOT, n + '.jpg'), quality=90)
        print(n, im.size, flush=True)


if __name__ == '__main__':
    que = sys.argv[1] if len(sys.argv) > 1 else 'todo'
    if que in ('fotos', 'todo'):
        fotos()
    if que in ('videos', 'todo'):
        videos()
