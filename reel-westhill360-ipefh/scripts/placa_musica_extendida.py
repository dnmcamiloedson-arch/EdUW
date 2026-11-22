"""Alarga la pista del anuncio de la placa COMAEM ("Solace", capturada del video del cliente) repitiendo una frase.

La canción repite su frase cada 6.85 s; se busca el punto exacto (correlación) para pegar la parte desde A después
de B, con un fundido corto. Antes del corte, la pista se va apagando con un filtro (barrido de graves, como en una
mezcla de DJ) y en el corte vuelve completa; el down bass del video cae justo ahí.
Con un quinto argumento N (por omisión 2) la frase se repite N-1 veces; 'sinbarrido' como sexto omite el filtro.
Uso: python3 scripts/placa_musica_extendida.py <entrada.wav> <salida.wav> [A] [B] [N] [sinbarrido]
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ENT, SAL = sys.argv[1], sys.argv[2]
A = float(sys.argv[3]) if len(sys.argv) > 3 else 11.31
B = float(sys.argv[4]) if len(sys.argv) > 4 else 18.16
N = int(sys.argv[5]) if len(sys.argv) > 5 else 2
BARRIDO = not (len(sys.argv) > 6 and sys.argv[6] == 'sinbarrido')
sr, x = wavfile.read(ENT)
x = x.astype(np.float32) / 32768
if x.ndim == 1:
    x = x[:, None]
m = x.mean(1)
# afinar el punto: el que mejor correlaciona en ±60 ms alrededor de A con la ventana que termina en B
v = int(0.4 * sr)
ref = m[int(B * sr):int(B * sr) + v]
mejor, ia = -1e9, int(A * sr)
for d in range(-int(0.06 * sr), int(0.06 * sr), 4):
    i = int(A * sr) + d
    c = np.dot(ref, m[i:i + v]) / (np.linalg.norm(m[i:i + v]) + 1e-9)
    if c > mejor:
        mejor, ia = c, i
ib = int(B * sr)
print(f'corte en {B:.3f} s, continúa desde {ia / sr:.3f} s (añade {(ib - ia) / sr:.2f} s)')
# barrido de filtro antes del corte (1.4 s): pasa altas que se cierra, como quitando los graves
pre = x[:ib].copy()
n = int(1.4 * sr)
bloque = 1024
for k in range(0, n if BARRIDO else 0, bloque):
    i0 = ib - n + k
    p = k / n
    sos = butter(2, 60 + 1500 * p ** 2, 'high', fs=sr, output='sos')
    seg = pre[i0:i0 + bloque]
    pre[i0:i0 + bloque] = sosfilt(sos, seg, axis=0) * (0.9 + 0.1 * (1 - p)) + seg * 0.0
xf = int(0.06 * sr)
w = np.linspace(0, 1, xf)[:, None]
y = pre
for r in range(N - 1):
    post = x[ia:].copy() if r == N - 2 else x[ia:ib].copy()
    union = y[-xf:] * (1 - w) + post[:xf] * w
    y = np.concatenate([y[:-xf], union, post[xf:]])
y = y / max(1e-9, np.abs(y).max()) * 0.95
wavfile.write(SAL, sr, (y * 32767).astype(np.int16))
print(f'{SAL}: {len(y) / sr:.2f} s')
