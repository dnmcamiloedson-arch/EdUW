"""Regenera las fotos del video de graduación desde remotion/public/photos/grad_origen/<Facultad>.

- Endereza las fotos que venían de lado o de cabeza (ROTAR, grados en sentido antihorario).
- Quita duplicados (QUITAR).
- Cada facultad empieza con una foto grupal (PRIMERA) y algunas fotos se acomodan en el rollo (AL_ROLLO).
- Escribe remotion/public/photos/grad/<Facultad>/NN.jpg, fotos.json y remotion/src/gradFotos.ts.

La primera vez copia las fotos tal como salieron de la extracción a grad_origen/ con su fotos.json; las claves
usan esa numeración, así que se puede volver a correr.
"""
import json
import os
import shutil

from PIL import Image, ImageOps

BASE = os.path.join(os.path.dirname(__file__), '..')
ORIGEN = os.path.join(BASE, 'remotion/public/photos/grad_origen')
PUB = os.path.join(BASE, 'remotion/public/photos/grad')
TS = os.path.join(BASE, 'remotion/src/gradFotos.ts')

ROTAR = {
    ('Odontologia', '27.jpg'): 90,
    ('Odontologia', '28.jpg'): 90,
    ('Odontologia', '29.jpg'): 90,
    ('Odontologia', '50.jpg'): 180,
    ('Negocios', '09.jpg'): -90,
    ('Psicologia', '27.jpg'): 90,
    ('Psicologia', '50.jpg'): 90,
}
QUITAR = {('Psicologia', '29.jpg')}  # igual a la 27
PRIMERA = {'Arquitectura': '14.jpg', 'Odontologia': '52.jpg', 'Psicologia': '20.jpg'}
# posición 5 = primer cuadro del primer rollo (patrón: sola, trío, sola, rollo, collage)
AL_ROLLO = {'Arquitectura': ('01.jpg', 5)}

if not os.path.exists(ORIGEN):
    shutil.copytree(PUB, ORIGEN)
fotos = json.load(open(os.path.join(ORIGEN, 'fotos.json')))

salida = {}
for fac, lista in fotos.items():
    lista = [x for x in lista if (fac, x['n']) not in QUITAR]
    if fac in PRIMERA:
        p = next(x for x in lista if x['n'] == PRIMERA[fac])
        lista = [p] + [x for x in lista if x is not p]
    if fac in AL_ROLLO:
        n, pos = AL_ROLLO[fac]
        r = next(x for x in lista if x['n'] == n)
        lista = [x for x in lista if x is not r]
        lista.insert(pos, r)
    d = os.path.join(PUB, fac)
    for f in os.listdir(d):
        if f.endswith('.jpg'):
            os.remove(os.path.join(d, f))
    nuevos = []
    for i, x in enumerate(lista, 1):
        im = ImageOps.exif_transpose(Image.open(os.path.join(ORIGEN, fac, x['n']))).convert('RGB')
        rot = ROTAR.get((fac, x['n']), 0)
        if rot:
            im = im.rotate(rot, expand=True)
        im.thumbnail((1920, 1920))
        n = f'{i:02d}.jpg'
        im.save(os.path.join(d, n), quality=90)
        nuevos.append({'n': n, 'w': im.width, 'h': im.height, 'src': x['src'], 'orig': x['n']})
    salida[fac] = nuevos
    print(fac, len(nuevos))

json.dump(salida, open(os.path.join(PUB, 'fotos.json'), 'w'), indent=0, ensure_ascii=False)
filas = []
for fac in ['Arquitectura', 'Derecho', 'Negocios', 'Odontologia', 'Psicologia']:
    items = ', '.join(f"['{x['n']}', {x['w']}, {x['h']}]" for x in salida.get(fac, []))
    filas.append(f'  {fac}: [{items}],')
open(TS, 'w').write(
    '// Generado por scripts/grad_fotos.py desde public/photos/grad/fotos.json: [archivo, ancho, alto] por facultad\n'
    'export const FOTOS: Record<string, [string, number, number][]> = {\n' + '\n'.join(filas) + '\n};\n'
)
