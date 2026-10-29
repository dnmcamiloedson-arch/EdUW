"""Prepara la grabación de pantalla de la historia (debate de ofrendas) para la intro:
quita la barra de estado y desenfoca fotos de perfil y nombres de usuario en cada tramo.
Uso: python3 historia_privada.py <grabación.mp4> <salida.mp4>"""
import subprocess, sys
src, dst = sys.argv[1], sys.argv[2]
# (x, y, ancho, alto, desde, hasta) ya recortada la barra de estado (1206x2452)
cajas = [(0, 2160, 330, 125, 0, 7.0)]  # avatares de "Actividad"
cajas += [(0, y, 1206, h, 6.95, 9.35) for y, h in [(1025, 120), (1645, 180), (1935, 517)]]  # panel: respuestas y quién vio
cajas += [(0, y, 1206, h, 9.3, 10.5) for y, h in [(215, 115), (755, 115), (1295, 115), (1835, 115), (2370, 82)]]  # rejilla
g = ['[0:v]crop=1206:2452:0:170[v0]']
for i, (x, y, w, h, a, b) in enumerate(cajas):
    g.append(f'[v{i}]split=2[m{i}][c{i}]')
    g.append(f'[c{i}]crop={w}:{h}:{x}:{y},boxblur=luma_radius=26:luma_power=4:chroma_radius=12:chroma_power=4[b{i}]')
    g.append(f"[m{i}][b{i}]overlay={x}:{y}:enable='between(t,{a},{b})'[v{i + 1}]")
g.append(f'[v{len(cajas)}]scale=808:-2:flags=lanczos,fps=60[out]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', ';'.join(g), '-map', '[out]',
                '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-an', dst], check=True)
print('ok', dst)
