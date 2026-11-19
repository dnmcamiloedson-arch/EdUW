"""Prepara la historia del Museo Banco de México (Coordinación de Inclusión).

- Videos (media/inclusion/fuente/wa0..wa14.mp4, vienen de WhatsApp a 480x854): a 1080x1920, 30 fps, sin audio, con
  un poco de limpieza de ruido y nitidez para que el escalado no se vea tan suave (remotion/public/proxies/banxico).
- Música: pista original de sfx/generar_musica.py (120 BPM, 1 compás = 2 s), con el drop al terminar la intro y
  el cierre en el último compás. Uso: python3 scripts/banxico_preparar.py <segundos_totales> <inicio_cierre>
"""
import glob
import os
import subprocess
import sys

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(BASE, 'media/inclusion/fuente')
OUT = os.path.join(BASE, 'remotion/public/proxies/banxico')
VF = 'hqdn3d=2:2:4:4,scale=1080:1920:flags=lanczos,unsharp=5:5:0.6,eq=contrast=1.04:saturation=1.08,fps=30,format=yuv420p'

os.makedirs(OUT, exist_ok=True)
for src in sorted(glob.glob(os.path.join(SRC, 'wa*.mp4'))):
    out = os.path.join(OUT, os.path.basename(src))
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', VF, '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-g', '15', out], check=True)
    print('video', os.path.basename(src), flush=True)

if len(sys.argv) > 2:
    dur, cierre = sys.argv[1], sys.argv[2]
    wav = os.path.join(BASE, 'remotion/public/music/banxico.wav')
    subprocess.run(['python3', os.path.join(BASE, 'sfx/generar_musica.py'), wav, dur, cierre, '9999', '4'], check=True, env={**os.environ, 'MUSICA_ALT': '1'})
