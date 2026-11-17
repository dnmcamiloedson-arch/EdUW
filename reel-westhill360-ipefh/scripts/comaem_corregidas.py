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
# Voces cuya versión corregida se hizo sobre una grabación más corta: desde ese segundo (en una pausa) se completa
# con el audio de la grabación, al mismo volumen. El Rector se corrigió sobre la toma que se cortaba en "grac-";
# su "Muchísimas gracias" completo sale de la toma nueva.
COMPLETAR = {'rector': 39.6}


def completar(dest, src, t):
    with tempfile.TemporaryDirectory() as d:
        c = leer(dest, 48000, os.path.join(d, 'c.wav'))
        o = leer(src, 48000, os.path.join(d, 'o.wav'))
    i = int(t * 48000)
    ref = slice(int((t - 9) * 48000), int((t - 0.5) * 48000))
    gan = np.sqrt(np.mean(c[ref] ** 2)) / (np.sqrt(np.mean(o[ref] ** 2)) + 1e-9)
    x = c[:len(o)].copy()
    f = 2400  # 50 ms de fundido
    w = np.linspace(0, 1, f)
    x[i:i + f] = x[i:i + f] * (1 - w) + o[i:i + f] * gan * w
    x[i + f:] = o[i + f:len(x)] * gan
    wavfile.write(dest, 48000, np.clip(x, -32768, 32767).astype(np.int16))
    return 20 * np.log10(gan)


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
            if nombre in COMPLETAR:
                g = completar(os.path.join(DEST, nombre + '.wav'), os.path.join(SRC, f), COMPLETAR[nombre])
                print(f'  {nombre}: desde {COMPLETAR[nombre]} s con la grabación ({g:+.1f} dB)', flush=True)


if __name__ == '__main__':
    main(sys.argv[1])
