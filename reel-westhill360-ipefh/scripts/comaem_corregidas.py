"""Separa el archivo de voces corregidas (todas las voces seguidas en un solo audio, editadas por el equipo) en una
voz por persona: media/comaem/corregidas/<nombre>.wav, con la misma duración y el mismo arranque que la grabación
original, para que siga sincronizada con los labios.

Cada voz se localiza en el archivo por correlación con su audio original (no importa el orden ni los silencios
entre una y otra). Luego: python3 scripts/comaem_preparar.py voz corregidas
Uso: python3 scripts/comaem_corregidas.py <Audios_Corregidos.mp4>
"""
import os
import subprocess
import sys
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comaem_preparar import HABLAN, SOLO_VOZ, SRC  # noqa: E402

BASE = os.path.join(os.path.dirname(__file__), '..')
DEST = os.path.join(BASE, 'media/comaem/corregidas')
SR = 8000  # para buscar; el corte final se hace a 48 kHz


def leer(src, sr, tmp):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', str(sr), tmp], check=True)
    return wavfile.read(tmp)[1].astype(np.float32)


def main(archivo):
    os.makedirs(DEST, exist_ok=True)
    with tempfile.TemporaryDirectory() as d:
        u = leer(archivo, SR, os.path.join(d, 'u.wav'))
        for nombre, (f, _) in {**HABLAN, **SOLO_VOZ}.items():
            o = leer(os.path.join(SRC, f), SR, os.path.join(d, 'o.wav'))
            c = fftconvolve(u, o[::-1], mode='full')
            k = int(np.argmax(np.abs(c)))
            ini = (k - (len(o) - 1)) / SR
            seg = u[max(0, k - len(o) + 1):k + 1]
            parecido = abs(c[k]) / (np.linalg.norm(o) * np.linalg.norm(seg) + 1e-9)
            dur = len(o) / SR
            # mismo arranque y duración que el original (si empieza antes del archivo, se rellena con silencio)
            pre = max(0.0, -ini)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0.0, ini):.4f}', '-t', f'{dur - pre:.4f}', '-i', archivo, '-vn', '-ar', '48000',
                            '-af', f'adelay={int(pre * 1000)}:all=1,apad', '-t', f'{dur:.4f}', '-c:a', 'pcm_s16le', os.path.join(DEST, nombre + '.wav')], check=True)
            print(f'{nombre}: en {ini:.3f} s, {dur:.2f} s, parecido {parecido:.2f}', flush=True)


if __name__ == '__main__':
    main(sys.argv[1])
