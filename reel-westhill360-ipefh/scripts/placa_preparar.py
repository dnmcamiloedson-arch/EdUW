"""Prepara el material del anuncio de la develación de placa COMAEM (vertical 1080x1920, 30 fps, sin audio).

Los MOV del iPhone (4K con rotación) y los mp4 verticales ya editados se pasan a
remotion/public/proxies/placa/<nombre>.mp4; las fotos a remotion/public/placa/<nombre>.jpg.
Solo procesa lo que falta. Uso: python3 scripts/placa_preparar.py
"""
import glob
import os
import shutil
import subprocess

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(BASE, 'media/placa_comaem/fuente')
PROXY = os.path.join(BASE, 'remotion/public/proxies/placa')
FOT = os.path.join(BASE, 'remotion/public/placa')
os.makedirs(PROXY, exist_ok=True)
os.makedirs(FOT, exist_ok=True)
for src in sorted(glob.glob(os.path.join(SRC, '*'))):
    nombre, ext = os.path.splitext(os.path.basename(src))
    if ext.lower() in ('.jpg', '.jpeg', '.png'):
        dst = os.path.join(FOT, nombre + '.jpg')
        if not os.path.exists(dst):
            shutil.copy(src, dst)
        continue
    out = os.path.join(PROXY, nombre + '.mp4')
    if os.path.exists(out):
        continue
    vf = 'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,fps=30,format=yuv420p'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-g', '15', out], check=True)
    print('video', nombre, flush=True)
