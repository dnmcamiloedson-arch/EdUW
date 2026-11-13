"""Prepara el material del reel de opiniones del Congreso de Derecho (media/preguntas/fuente).

- Video: cada toma a 1080x1920, 30 fps, H.264 (remotion/public/proxies/preguntas). Las tomas 4K de iPhone vienen
  giradas por metadatos; ffmpeg las endereza al decodificar.
- Voz: de cada entrevista, reducción de ruido + ecualización + compresión, nivelada a -16 LUFS medidos donde
  habla (remotion/public/preguntas/voz/<nombre>.wav, misma línea de tiempo que el video).
Uso: python3 scripts/preguntas_preparar.py [video|voz]
"""
import os
import subprocess
import sys

import noisereduce as nr
import numpy as np
from scipy.io import wavfile

BASE = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(BASE, 'media/preguntas/fuente')
PROXY = os.path.join(BASE, 'remotion/public/proxies/preguntas')
VOZ = os.path.join(BASE, 'remotion/public/preguntas/voz')

ENTREVISTAS = {
    'e1': '11131.mp4',  # chica de cabello largo (junto a su compañera)
    'e2': '11132.mp4',  # chica junto a un compañero
    'e3': '11133.mp4',  # Emily
    'e4': '11134.mp4',  # Susan
    'e5': '11135.mp4',  # Emilie
    'miguel': 'miguel.mp4',
}
APOYO = {f'a{i}': f for i, f in enumerate(['apoyo1.mp4', 'apoyo2.mp4', 'apoyo3.mp4', 'apoyo4.mp4', 'apoyo5.mp4', 'apoyo6.mp4', 'apoyo7.MOV', 'apoyo8.MOV', 'apoyo9.MOV'], 1)}


def video():
    os.makedirs(PROXY, exist_ok=True)
    for nombre, f in list(ENTREVISTAS.items()) + list(APOYO.items()):
        vf = 'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,fps=30,format=yuv420p'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(SRC, f), '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-g', '15', os.path.join(PROXY, nombre + '.mp4')], check=True)
        print('video', nombre, flush=True)


def voz():
    os.makedirs(VOZ, exist_ok=True)
    for nombre, f in ENTREVISTAS.items():
        tmp = f'/tmp/preg_{nombre}'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(SRC, f), '-vn', '-ac', '1', '-ar', '48000', tmp + '_raw.wav'], check=True)
        sr, x = wavfile.read(tmp + '_raw.wav')
        x = x.astype(np.float32) / 32768
        y = nr.reduce_noise(y=x, sr=sr, stationary=False, prop_decrease=0.7, n_fft=2048)
        wavfile.write(tmp + '_den.wav', sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
        af = 'highpass=f=90,lowpass=f=10000,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3000:t=q:w=1.2:g=3,acompressor=threshold=-26dB:ratio=3:attack=8:release=140:makeup=2'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp + '_den.wav', '-af', af, tmp + '_eq.wav'], check=True)
        # sonoridad medida solo en los tramos con voz (puerta de -45 dBFS en ventanas de 50 ms)
        sr2, z = wavfile.read(tmp + '_eq.wav')
        z = z.astype(np.float32) / 32768
        w = int(0.05 * sr2)
        mask = np.zeros(len(z), bool)
        for i in range(0, len(z) - w, w):
            if 20 * np.log10(np.sqrt(np.mean(z[i:i + w] ** 2)) + 1e-9) > -45:
                mask[i:i + w] = True
        wavfile.write(tmp + '_voz.wav', sr2, (z[mask] * 32767).astype(np.int16))
        out = subprocess.run(['ffmpeg', '-i', tmp + '_voz.wav', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
        lufs = float([l for l in out.split('\n') if l.strip().startswith('I:')][-1].split()[1])
        gan = -16.0 - lufs
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp + '_eq.wav', '-af', f'volume={gan}dB,alimiter=limit=0.89:attack=3:release=60', '-ar', '48000', os.path.join(VOZ, nombre + '.wav')], check=True)
        for s in ('_raw.wav', '_den.wav', '_eq.wav', '_voz.wav'):
            os.remove(tmp + s)
        print(f'voz {nombre}: {lufs:.1f} LUFS, ganancia {gan:+.1f} dB', flush=True)


if __name__ == '__main__':
    que = sys.argv[1] if len(sys.argv) > 1 else 'todo'
    if que in ('voz', 'todo'):
        voz()
    if que in ('video', 'todo'):
        video()
