"""Audio de la historia del 2 de noviembre: «Amor eterno» (instrumental, public/audio/dosnov/musica.mp3) del segundo
3.5 al final de la historia, con salida suave al outro y el sonido del logo encima.
Uso: python3 scripts/leyendas/dos_nov.py <salida.wav>"""
import json
import os
import subprocess
import sys

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import music as M  # noqa: E402
import sfx  # noqa: E402
from sfx import SR, Bus  # noqa: E402

FPS = 30
LEN = 690
OUTRO = 135
DESDE = 3.5  # donde entra la melodía
MUS = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'public', 'audio', 'dosnov', 'musica.mp3')


def score(bus):
    rec = LEN / FPS
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(DESDE), '-t', str(rec + 0.6), '-i', MUS, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).T.astype(np.float64)
    x /= max(1e-9, np.max(np.abs(x)))
    n = x.shape[1]
    env = np.ones(n)
    fi = int(0.4 * SR)
    env[:fi] = np.linspace(0, 1, fi)
    fo0 = int((rec - 1.5) * SR)
    env[fo0:] = np.linspace(1, 0, n - fo0)
    bus.place2(x * env * 0.5, 0, 1.0)
    return rec


if __name__ == '__main__':
    out = sys.argv[1]
    total = LEN + OUTRO
    bus = Bus(total / FPS)
    M.outro(bus, score(bus))
    mix, lufs = sfx.master(bus, fade=(total / FPS - 0.2, total / FPS))
    wavfile.write(out, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
    print(json.dumps({'segundos': total / FPS, 'lufs': round(lufs, 2)}))
