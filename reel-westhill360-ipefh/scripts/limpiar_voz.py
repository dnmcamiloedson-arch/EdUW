"""Limpia la voz de un clip: reducción de ruido (noisereduce, no estacionario) + EQ de voz + compresión + loudnorm.
Uso: python3 limpiar_voz.py <entrada.mp4> <salida.mp4> [fuerza 0-1]  (re-empaqueta el video sin recodificar)"""
import subprocess, sys, tempfile, os
import numpy as np, noisereduce as nr
from scipy.io import wavfile
src, dst = sys.argv[1], sys.argv[2]
prop = float(sys.argv[3]) if len(sys.argv) > 3 else 0.75
with tempfile.TemporaryDirectory() as d:
    raw, den = f'{d}/raw.wav', f'{d}/den.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '48000', raw], check=True)
    sr, x = wavfile.read(raw); x = x.astype(np.float32) / 32768
    y = nr.reduce_noise(y=x, sr=sr, stationary=False, prop_decrease=prop, n_fft=2048)
    wavfile.write(den, sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
    af = ('highpass=f=100,lowpass=f=8000,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=2800:t=q:w=1.2:g=3,'
          'acompressor=threshold=-24dB:ratio=3:attack=8:release=120,loudnorm=I=-16:TP=-1.5')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-i', den, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-af', af, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', dst], check=True)
print('ok', dst)
