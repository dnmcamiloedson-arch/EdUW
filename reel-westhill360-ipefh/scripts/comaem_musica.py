"""Edición musical del video de Reacreditación COMAEM sobre "Time" (Hans Zimmer).

La pieza va a 63 BPM: un compás = 3.81 s y la frase de 4 compases = 15.24 s (la armonía se repite cada frase),
así que se puede repetir o saltar cualquier tramo de N frases exactas sin que se note (cortes con fundido corto).
Partes de la canción: intro tranquila hasta 30.75 s; crece de 30.75 a 152.75; respiro en 152.2–152.7 y el clímax
entra en 152.75 (C); el clímax dura 4 frases y en C + 4 frases (213.7) cae al piano final.

Plan: el Rector termina de hablar justo en el respiro y el clímax entra con su última palabra (como pide el
guion). Debajo del Rector suena la frase previa al clímax, que es emotiva pero deja oír la voz.
Cortinilla: 1 frase de clímax (2 compases + salto a los 2 últimos compases que llevan a la caída) y el piano final.

Uso: python3 scripts/comaem_musica.py <segundo del video en que termina el Rector> [salida.wav]
Imprime el mapa (segmentos) y los tiempos clave del video.
"""
import subprocess
import sys

import numpy as np

SR = 44100
P = 60 / 63 * 16  # frase de 4 compases
C = 152.75  # entrada del clímax
CAIDA = C + 4 * P  # el clímax cae al piano final
CROSS = 0.06  # fundido en cada corte
SRC = 'remotion/public/music/time.mp3'


def plan(fin_rector):
    # cuántas frases repetir antes del clímax para que el clímax caiga en fin_rector sin empezar antes de 0 s
    k = 0
    while C + k * P - fin_rector < 0:
        k += 1
    inicio = C + k * P - fin_rector  # se recorta este tanto del inicio de la intro (siempre < 1 frase)
    if inicio > 14:  # si se recortaría demasiado de la intro, se repite una frase menos y se alarga la intro
        k -= 1
        inicio = C + k * P - fin_rector
    seg = []
    if k > 0:
        inicio -= CROSS  # el fundido del corte de repetición adelanta todo lo que sigue
    t1 = 30.75 + 2 * P  # repeticiones durante los docentes (zona media que crece despacio)
    if k > 0 and inicio >= 0:
        seg.append((inicio, t1 + k * P))
        seg.append((t1, C + P / 2))
    else:
        seg.append((max(0, inicio), C + P / 2))
    seg.append((C + 3.5 * P, CAIDA + 10.5))  # 2 compases finales del clímax y el piano final
    return seg, max(0, -inicio)


def construir(fin_rector, salida):
    seg, silencio = plan(fin_rector)
    x = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    a = np.frombuffer(x, np.float32).reshape(-1, 2)
    n = int(CROSS * SR)
    out = np.zeros((int(silencio * SR), 2), np.float32)
    t = silencio
    mapa = []
    for i, (s0, s1) in enumerate(seg):
        pedazo = a[int(s0 * SR):int(s1 * SR)].copy()
        if i and len(out) >= n:
            r = np.linspace(0, 1, n)[:, None]
            out[-n:] = out[-n:] * (1 - r) + pedazo[:n] * r
            pedazo = pedazo[n:]
            t -= CROSS
        mapa.append((round(t, 2), round(s0, 2), round(s1, 2)))
        out = np.concatenate([out, pedazo])
        t += s1 - s0
    # caída final suave
    f = int(3.0 * SR)
    out[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
    dur = len(out) / SR
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', salida], input=out.astype(np.float32).tobytes(), check=True)
    clim = fin_rector
    print('segmentos (video, desde, hasta):', mapa)
    print(f'clímax en {clim:.2f} s | caída al piano en {clim + P:.2f} s | fin {dur:.2f} s')


if __name__ == '__main__':
    construir(float(sys.argv[1]), sys.argv[2] if len(sys.argv) > 2 else 'remotion/public/music/comaem_musica.wav')
