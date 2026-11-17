"""Prepara el material del video de Reacreditación COMAEM.

- Video: pasa cada toma de media/comaem/fuente a 1920x1080, 30 fps, H.264 (remotion/public/proxies/comaem).
  La toma del Dr. Asisclo viene en HDR (HLG, bt2020) y se convierte a color normal (bt709) con mapeo de tonos.
  Las tomas de 720p se escalan con un poco de nitidez.
- Voz: sonido natural, tal como viene en la grabación (sin reducción de ruido, ecualización ni compresión, que
  la hacían sonar peor que el original). Solo se quita el retumbe por debajo de 70 Hz y se nivela cada voz a
  -16 LUFS medidos solo en el tramo donde habla, con un limitador suave para los picos (remotion/public/comaem/voz/<nombre>.wav, misma línea de tiempo que su video).
- Voz corregida (`voz corregidas`): usa las voces que editó el equipo (media/comaem/corregidas/<nombre>.wav, ver
  scripts/comaem_corregidas.py) en vez del audio de la grabación; no se les aplica ningún filtro, solo la nivelación.
Uso: python3 scripts/comaem_preparar.py [video|voz] [corregidas]
"""
import os
import subprocess
import sys


BASE = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(BASE, 'media/comaem/fuente')
PROXY = os.path.join(BASE, 'remotion/public/proxies/comaem')
VOZ = os.path.join(BASE, 'remotion/public/comaem/voz')

# nombre: (archivo, tramo de habla en segundos)
HABLAN = {
    'elvia': ('elvia.mp4', (2.2, 26.4)),
    'alan': ('alan.mp4', (0.5, 13.0)),
    'loera': ('loera.mov', (2.0, 7.5)),
    'bonilla': ('bonilla.mp4', (7.4, 15.4)),
    'perez': ('perez_pelaez.mp4', (1.2, 9.9)),
    'frida': ('alumno1.MOV', (3.9, 14.1)),
    'jorge': ('alumno2.MOV', (4.8, 13.6)),
    'alexa': ('alumno3.mp4', (3.5, 11.6)),
    'asisclo': ('asisclo.mov', (0.2, 41.3)),
    'rector': ('rector.mov', (2.8, 38.9)),
}
# solo voz (su toma no se usa a cuadro)
SOLO_VOZ = {'yarim': ('yarim.mp4', (0.4, 10.5))}
APOYO = {f'b{i}': f for i, f in enumerate(['apoyo1.mp4', 'apoyo2.mp4', 'apoyo3.mp4', 'apoyo4.mp4', 'apoyo5.MOV', 'apoyo6.MP4', 'apoyo7.MP4', 'apoyo8.MP4', 'apoyo9.mp4', 'apoyo10.mp4', 'apoyo11.mp4', 'apoyo12.mp4', 'apoyo13.mp4', 'apoyo14.mp4', 'apoyo15.mp4', 'apoyo16.mp4', 'apoyo17.mp4', 'apoyo18.mp4', 'apoyo19.mp4'], 1)}
HDR = 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,'


def video():
    os.makedirs(PROXY, exist_ok=True)
    for nombre, f in list({k: v[0] for k, v in HABLAN.items()}.items()) + list(APOYO.items()):
        if not os.path.exists(os.path.join(SRC, f)):
            print('falta', f, '(se omite)', flush=True)
            continue
        src = os.path.join(SRC, f)
        info = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=height,color_transfer', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout
        vf = (HDR if 'arib' in info else '') + 'scale=1920:1080:flags=lanczos'
        if info.startswith('720'):
            vf += ',unsharp=5:5:0.7'
        vf += ',fps=30,format=yuv420p'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-g', '15', os.path.join(PROXY, nombre + '.mp4')], check=True)
        print('video', nombre, flush=True)


def voz(corregidas=False):
    os.makedirs(VOZ, exist_ok=True)
    for nombre, (f, (a, b)) in {**HABLAN, **SOLO_VOZ}.items():
        tmp = f'/tmp/comaem_{nombre}'
        src = os.path.join(BASE, 'media/comaem/corregidas', nombre + '.wav') if corregidas else os.path.join(SRC, f)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '48000', tmp + '_raw.wav'], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp + '_raw.wav', '-af', 'anull' if corregidas else 'highpass=f=70', tmp + '_eq.wav'], check=True)
        # sonoridad medida solo donde habla
        out = subprocess.run(['ffmpeg', '-ss', str(a), '-t', str(b - a), '-i', tmp + '_eq.wav', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
        lufs = float([l for l in out.split('\n') if l.strip().startswith('I:')][-1].split()[1])
        gan = -16.0 - lufs
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp + '_eq.wav', '-af', f'volume={gan}dB,alimiter=limit=0.89:attack=3:release=60', '-ar', '48000', os.path.join(VOZ, nombre + '.wav')], check=True)
        for s in ('_raw.wav', '_eq.wav'):
            os.remove(tmp + s)
        print(f'voz {nombre}: {lufs:.1f} LUFS, ganancia {gan:+.1f} dB', flush=True)


if __name__ == '__main__':
    que = sys.argv[1] if len(sys.argv) > 1 else 'todo'
    if que in ('voz', 'todo'):
        voz(corregidas=len(sys.argv) > 2 and sys.argv[2] == 'corregidas')
    if que in ('video', 'todo'):
        video()
