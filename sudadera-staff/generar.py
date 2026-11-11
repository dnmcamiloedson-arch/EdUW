"""Propuestas de diseño para la sudadera del personal de Universidad Westhill.

Escribe una página HTML por propuesta en propuestas/ (la maqueta de la sudadera con el diseño encima) y
render.js las convierte en PNG. Las coordenadas son pixeles de la maqueta (1920 x 819):
frente centro x=325, espalda centro x=880, manga del perfil izquierdo x~1300, manga del perfil derecho x~1745.
Uso: python3 generar.py && node render.js
"""
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
MARINO = '#0B2A4A'
AZUL = '#27639A'
ORO = '#D9B76A'

CSS = """
@font-face{font-family:Montserrat;font-weight:500;src:url(../assets/montserrat-latin-500-normal.woff2)}
@font-face{font-family:Montserrat;font-weight:700;src:url(../assets/montserrat-latin-700-normal.woff2)}
@font-face{font-family:Montserrat;font-weight:800;src:url(../assets/montserrat-latin-800-normal.woff2)}
@font-face{font-family:Montserrat;font-weight:900;src:url(../assets/montserrat-latin-900-normal.woff2)}
@font-face{font-family:Anton;src:url(../assets/anton-latin-400-normal.woff2)}
@font-face{font-family:Cinzel;font-weight:700;src:url(../assets/cinzel-latin-700-normal.woff2)}
@font-face{font-family:Playfair;font-style:italic;font-weight:700;src:url(../assets/playfair-display-latin-700-italic.woff2)}
@font-face{font-family:Yellowtail;src:url(../assets/yellowtail-latin-400-normal.woff2)}
*{box-sizing:border-box}
body{margin:0;width:1920px;height:1060px;background:#fff;font-family:Montserrat;color:#0B2A4A;position:relative;overflow:hidden}
.cab{position:absolute;left:0;top:0;width:1920px;height:120px;background:#0B2A4A;color:#fff;display:flex;align-items:center;padding:0 60px;gap:26px}
.cab .n{font-weight:900;font-size:58px;color:#D9B76A}
.cab .t{font-weight:800;font-size:38px}
.cab .s{font-weight:500;font-size:22px;opacity:.85;margin-top:4px}
.cab img{margin-left:auto;height:74px}
.maq{position:absolute;left:0;top:120px;width:1920px;height:819px}
.maq>img.base{position:absolute;left:0;top:0;width:1920px;height:819px}
.e{position:absolute;white-space:nowrap}
.tinta{mix-blend-mode:multiply;opacity:.93}
.blanca{opacity:.9}
.pie{position:absolute;left:0;top:939px;width:1920px;height:121px;background:#F4EEE2;display:flex;align-items:center;padding:0 60px;gap:50px;font-size:21px;font-weight:500}
.pie b{font-weight:800}
.pie .col{flex:1}
.etq{position:absolute;white-space:nowrap;top:780px;font-size:16px;font-weight:700;letter-spacing:4px;color:#8a93a0;transform:translateX(-50%)}
"""


def img(src, x, y, w, clase='tinta', extra=''):
    return f'<img class="e {clase}" src="../assets/{src}" style="left:{x}px;top:{y}px;width:{w}px;{extra}">'


def txt(html, x, y, w, estilo, clase='tinta'):
    return f'<div class="e {clase}" style="left:{x}px;top:{y}px;width:{w}px;text-align:center;{estilo}">{html}</div>'


def huellas(puntos, src, clase='tinta'):
    return ''.join(img(src, x - s / 2, y - s / 2, s, clase, f'transform:rotate({r}deg);') for x, y, s, r in puntos)


P = []

# 1. Institucional clásica
P.append(dict(
    n=1, titulo='Institucional clásica', sub='Sobria y formal: el logo como protagonista', base='sudadera_gris.png',
    capas=img('logo_marino.png', 372, 262, 118)
    + img('logo_marino.png', 740, 310, 280)
    + txt('STAFF', 780, 446, 200, f'font-weight:800;font-size:26px;letter-spacing:18px;text-indent:18px;color:{MARINO}')
    + img('banderin_uw.png', 1281, 262, 48, 'tinta', 'transform:rotate(8deg);'),
    pie=['<b>Frente:</b> logo en azul marino al pecho izquierdo.', '<b>Espalda:</b> logo grande y la palabra STAFF.', '<b>Manga:</b> banderín UW en el hombro.', '<b>Tintas:</b> 1 (azul marino) + banderín.'],
))

# 2. Colegial (varsity)
arco = f'''<svg class="e tinta" style="left:165px;top:262px" width="320" height="170" viewBox="0 0 320 170">
<path id="a" d="M 22 128 Q 160 48 298 128" fill="none"/>
<text font-family="Anton" font-size="66" letter-spacing="4" fill="{MARINO}" stroke="#fff" stroke-width="3" paint-order="stroke" text-anchor="middle"><textPath href="#a" startOffset="50%">WESTHILL</textPath></text>
<text x="160" y="160" font-family="Montserrat" font-weight="800" font-size="17" letter-spacing="7" fill="{MARINO}" text-anchor="middle">UNIVERSIDAD</text>
</svg>'''
P.append(dict(
    n=2, titulo='Colegial', sub='Estilo universitario clásico, juvenil y con orgullo', base='sudadera_gris.png',
    capas=arco
    + txt('UW', 730, 268, 300, f'font-family:Anton;font-size:210px;line-height:1;color:{MARINO};-webkit-text-stroke:5px #fff;paint-order:stroke fill;letter-spacing:6px')
    + txt('Westhill', 730, 468, 300, f'font-family:Yellowtail;font-size:76px;line-height:1;color:{AZUL}')
    + txt('E Q U I P O &nbsp; W E S T H I L L', 730, 566, 300, f'font-weight:800;font-size:15px;color:{MARINO}')
    + img('huella_marino.png', 1276, 268, 54, 'tinta', 'transform:rotate(10deg);'),
    pie=['<b>Frente:</b> WESTHILL en arco, letras de bloque.', '<b>Espalda:</b> UW grande con "Westhill" en letra manuscrita.', '<b>Manga:</b> huella de caracal.', '<b>Tintas:</b> 2 (marino y azul) + contorno blanco.'],
))

# 3. Huella: "Vestigia Nulla Retrorsum" = ni un paso atrás
rastro = [(856, 652, 40, -8), (906, 604, 43, 8), (856, 554, 46, -8), (906, 504, 49, 8), (856, 452, 52, -8)]
P.append(dict(
    n=3, titulo='Huella', sub='El lema del escudo hecho imagen: las huellas de West solo van hacia adelante', base='sudadera_gris.png',
    capas=img('huella_marino.png', 395, 268, 62)
    + txt('UW', 380, 334, 92, f'font-weight:900;font-size:26px;letter-spacing:3px;color:{MARINO}')
    + huellas(rastro, 'huella_marino.png')
    + txt('NI UN PASO<br>ATRÁS', 730, 286, 300, f'font-weight:900;font-size:46px;line-height:1.02;color:{MARINO}')
    + txt('Vestigia Nulla Retrorsum', 730, 388, 300, f'font-family:Playfair;font-style:italic;font-weight:700;font-size:22px;color:{AZUL}'),
    pie=['<b>Frente:</b> huella de caracal con UW al pecho izquierdo.', '<b>Espalda:</b> la frase "Ni un paso atrás" (el lema Vestigia Nulla Retrorsum) y un camino de huellas que sube hacia ella.', '<b>Tintas:</b> 2 (marino y azul).'],
))

# 4. Banderín
P.append(dict(
    n=4, titulo='Banderín', sub='La marca UW de redes, moderna y reconocible', base='sudadera_gris.png',
    capas=img('banderin_uw.png', 392, 256, 74)
    + txt('SOMOS', 730, 300, 300, f'font-weight:800;font-size:26px;letter-spacing:16px;color:{AZUL}')
    + txt('WEST<br>HILL', 730, 334, 300, f'font-weight:900;font-size:112px;line-height:.9;letter-spacing:-2px;color:{MARINO}')
    + f'<div class="e tinta" style="left:790px;top:548px;width:180px;height:5px;background:{ORO}"></div>'
    + txt('E Q U I P O', 730, 566, 300, f'font-weight:800;font-size:22px;color:{MARINO}')
    + img('huella_marino.png', 862, 606, 36),
    pie=['<b>Frente:</b> banderín UW al pecho izquierdo.', '<b>Espalda:</b> "SOMOS WESTHILL" en tipografía grande, línea dorada y huella.', '<b>Tintas:</b> 3 (marino, azul, dorado) + banderín.'],
))

# 5. Minimal en blanco
P.append(dict(
    n=5, titulo='Minimal', sub='Discreta y actual: tinta blanca sobre gris, como prenda de marca', base='sudadera_gris.png',
    capas=txt('<span style="font-weight:900">UW</span> <span style="font-weight:500">Westhill</span>', 215, 292, 220, 'font-size:34px;color:#fff;letter-spacing:1px', 'blanca')
    + img('logo_blanco.png', 815, 276, 130, 'blanca')
    + txt('S T A F F', 780, 624, 200, 'font-weight:800;font-size:18px;color:#fff', 'blanca')
    + txt('WESTHILL', 1150, 430, 300, 'font-weight:900;font-size:44px;letter-spacing:10px;color:#fff;transform:rotate(80deg)', 'blanca'),
    pie=['<b>Frente:</b> "UW Westhill" pequeño al centro.', '<b>Espalda:</b> logo pequeño bajo la capucha y STAFF abajo.', '<b>Manga:</b> WESTHILL a lo largo.', '<b>Tintas:</b> 1 (blanco). La más económica.'],
))

# 6. Edición azul marino
P.append(dict(
    n=6, titulo='Edición azul marino', sub='La misma sudadera en el azul institucional, con blanco y dorado', base='sudadera_marino.png',
    capas=img('logo_blanco.png', 372, 262, 118, 'blanca')
    + img('huella_oro.png', 800, 290, 160, 'blanca')
    + txt('WESTHILL', 730, 470, 300, 'font-weight:900;font-size:58px;letter-spacing:4px;color:#fff', 'blanca')
    + txt('Vestigia Nulla Retrorsum', 730, 540, 300, f'font-family:Playfair;font-style:italic;font-weight:700;font-size:22px;color:{ORO}', 'blanca')
    + txt('E Q U I P O', 730, 580, 300, 'font-weight:800;font-size:16px;color:#fff', 'blanca')
    + img('banderin_uw.png', 1281, 262, 48, 'blanca', 'transform:rotate(8deg);'),
    pie=['<b>Frente:</b> logo blanco al pecho izquierdo.', '<b>Espalda:</b> huella dorada, WESTHILL y el lema.', '<b>Manga:</b> banderín UW.', '<b>Tintas:</b> 2 (blanco y dorado). Requiere sudadera azul marino.'],
))

ETQ = ''.join(f'<div class="etq" style="left:{x}px">{t}</div>' for x, t in [(325, 'FRENTE'), (880, 'ESPALDA'), (1320, 'PERFIL IZQUIERDO'), (1745, 'PERFIL DERECHO')])
for p in P:
    pie = ''.join(f'<div class="col">{t}</div>' for t in p['pie'])
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="cab"><div class="n">{p['n']}</div><div><div class="t">{p['titulo']}</div><div class="s">{p['sub']}</div></div><img src="../assets/logo_blanco.png"></div>
<div class="maq"><img class="base" src="../assets/{p['base']}">{p['capas']}{ETQ}</div>
<div class="pie">{pie}</div></body></html>'''
    open(os.path.join(AQUI, 'propuestas', f"propuesta_{p['n']}.html"), 'w').write(html)
print(len(P), 'propuestas')
