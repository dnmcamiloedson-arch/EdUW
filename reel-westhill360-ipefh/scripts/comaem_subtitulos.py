"""Genera remotion/src/comaemSubs.ts: las palabras de cada voz con su tiempo (segundos de su grabación) para los
subtítulos de la versión subtitulada del video COMAEM (composición ComaemSub).

Entrada: media/comaem/transcripcion/<voz>_palabras.json (Parakeet v3 con tiempos por palabra, sobre las voces
corregidas). El reconocedor se equivoca en nombres y algunos términos; CORRECCIONES los arregla (revisado a oído
y con Whisper como segunda opinión). Cada corrección cambia una secuencia de palabras por otra y reparte su tiempo.
Uso: python3 scripts/comaem_subtitulos.py
"""
import json
import os

BASE = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(BASE, 'media/comaem/transcripcion')
TS = os.path.join(BASE, 'remotion/src/comaemSubs.ts')

CORRECCIONES = {
    'elvia': [('facultad de medicina por Comaín.', 'Facultad de Medicina por COMAEM.')],
    'alan': [('otro, implicó', 'otro; implicó'), ('indicadores, y', 'indicadores. Y')],
    'bonilla': [('medicina va', 'Medicina va')],
    'perez': [('siglos V,', 'ciclos clínicos,'), ('comprende', 'comprenden')],
    'frida': [('valuada', 'evaluada')],
    'jorge': [('día,', 'día:')],
    'asisclo': [('Comaem', 'COMAEM'), ('Because the', 'Porque la')],
    'rector': [('contarles', 'comentarles'), ('Riobón', 'Riobóo'), ('Huesquil.', 'Westhill.'), ('Huesquil', 'Westhill'),
               ('comunidad.', 'comunidad,'), ('Y cada', 'y cada'), ('separar.', 'separado.')],
}


def corregir(pal, corr):
    for viejo, nuevo in corr:
        v, n = viejo.split(), nuevo.split()
        i = 0
        hallado = False
        while i <= len(pal) - len(v):
            if [p['w'] for p in pal[i:i + len(v)]] == v:
                t0, t1 = pal[i]['t0'], pal[i + len(v) - 1]['t1']
                paso = (t1 - t0) / len(n)
                pal[i:i + len(v)] = [{'w': w, 't0': round(t0 + k * paso, 2), 't1': round(t0 + (k + 1) * paso, 2)} for k, w in enumerate(n)]
                hallado = True
                i += len(n)
            else:
                i += 1
        assert hallado, viejo
    return pal


salida = {}
for f in sorted(os.listdir(SRC)):
    voz = f.replace('_palabras.json', '')
    salida[voz] = corregir(json.load(open(os.path.join(SRC, f))), CORRECCIONES.get(voz, []))
    print(voz, ' '.join(p['w'] for p in salida[voz]))

filas = [f"  {v}: [{', '.join(json.dumps([p['w'], p['t0'], p['t1']], ensure_ascii=False) for p in pal)}]," for v, pal in salida.items()]
open(TS, 'w').write('// Generado por scripts/comaem_subtitulos.py: [palabra, inicio, fin] en segundos de la grabación de cada voz\n'
                    'export const PALABRAS: Record<string, [string, number, number][]> = {\n' + '\n'.join(filas) + '\n};\n')
