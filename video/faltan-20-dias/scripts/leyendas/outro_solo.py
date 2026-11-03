"""Sonido del outro de Westhill aislado. Uso: python3 scripts/leyendas/outro_solo.py <salida.wav>"""
import os
import sys

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import music as M  # noqa: E402
import sfx  # noqa: E402
from sfx import SR, Bus  # noqa: E402

bus = Bus(4.5)
M.outro(bus, 0.0)
mix, lufs = sfx.master(bus, fade=(4.3, 4.5))
wavfile.write(sys.argv[1], SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
print({'lufs': round(lufs, 2)})
