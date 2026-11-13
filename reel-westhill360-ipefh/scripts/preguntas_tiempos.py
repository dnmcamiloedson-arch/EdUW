"""Tramos con voz de cada entrevista (para sincronizar los subtítulos del reel de opiniones).

Lee las voces limpias de remotion/public/preguntas/voz y escribe remotion/src/preguntasVoz.ts con los tramos
[inicio, fin] (segundos de la grabación) donde hay voz: ventanas de 20 ms por encima del piso de ruido + 14 dB,
uniendo huecos menores a 90 ms. Los subtítulos reparten cada palabra solo dentro de estos tramos.
Uso: python3 scripts/preguntas_tiempos.py
"""
import json
import os

import numpy as np
from scipy.io import wavfile

BASE = os.path.join(os.path.dirname(__file__), '..')
VOZ = os.path.join(BASE, 'remotion/public/preguntas/voz')
salida = {}
for f in sorted(os.listdir(VOZ)):
    sr, x = wavfile.read(os.path.join(VOZ, f))
    x = x.astype(np.float32) / 32768
    w = int(0.02 * sr)
    db = 20 * np.log10(np.array([np.sqrt(np.mean(x[i:i + w] ** 2)) for i in range(0, len(x) - w, w)]) + 1e-9)
    on = db > max(np.percentile(db, 10) + 14, -44)
    tramos = []
    i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and (on[j] or on[j:j + 5].any()):
                j += 1
            if (j - i) * 0.02 >= 0.06:
                tramos.append([round(i * 0.02, 2), round(j * 0.02, 2)])
            i = j
        else:
            i += 1
    salida[f[:-4]] = tramos
    print(f, len(tramos), 'tramos')
open(os.path.join(BASE, 'remotion/src/preguntasVoz.ts'), 'w').write(
    '// Generado por scripts/preguntas_tiempos.py: tramos [inicio, fin] con voz en cada grabación (segundos)\n'
    f'export const VOZ_TRAMOS: Record<string, [number, number][]> = {json.dumps(salida)};\n'
)
