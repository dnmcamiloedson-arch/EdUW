"""Audio del recap: la música del cliente (public/recap/musica.*) nivelada, con salida suave al outro y el sonido del
logo encima. Uso: python3 scripts/leyendas/recap_audio.py <segundos_recap> <segundos_total> <salida.wav>"""
import glob
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

rec, total, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
bus = Bus(total)
mus = sorted(glob.glob(os.path.join(os.path.dirname(os.path.dirname(HERE)), 'public', 'recap', 'musica.*')))
if mus:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mus[0], '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).T.astype(np.float64)
    n = min(x.shape[1], int((rec + 1.2) * SR))
    x = x[:, :n]
    x /= max(1e-9, np.max(np.abs(x)))
    env = np.ones(n)
    fi = int(0.6 * SR)
    env[:fi] = np.linspace(0, 1, fi)
    fo0, fo1 = int((rec - 0.6) * SR), n
    env[fo0:fo1] = np.linspace(1, 0, fo1 - fo0)
    bus.place2(x * env * 0.5, 0, 1.0)
M.outro(bus, rec)
mix, lufs = sfx.master(bus, fade=(total - 0.2, total))
wavfile.write(out, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
print({'musica': mus[0] if mus else None, 'lufs': round(lufs, 2)})
