"""Segunda ronda: propuestas de estilo urbano (streetwear) para la sudadera del personal de Universidad Westhill.

Combina los elementos de la primera ronda (UW, huella de caracal, lema "ni un paso atrás") con recursos urbanos:
letra condensada grande, texto en contorno, repeticiones, etiquetas, zarpazo y letra de brocha.
Escribe urbano/urbano_N.html; `node render.js urbano` las pasa a imagen.
Coordenadas en pixeles de la maqueta (1920 x 819): frente centro x=325, espalda centro x=880, manga x~1300.
"""
import os

from generar import CSS, img, txt

AQUI = os.path.dirname(os.path.abspath(__file__))
MARINO = '#0B2A4A'
AZUL = '#27639A'
AMARILLO = '#F7C531'
CSS_U = CSS.replace('../assets/', '../assets/') + """
@font-face{font-family:Kaushan;src:url(../assets/kaushan-script-latin-400-normal.woff2)}
.hueco{color:transparent}
"""


def caja(x, y, w, h, color, clase='tinta', extra=''):
    return f'<div class="e {clase}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:{color};{extra}"></div>'


def zarpazo(x, y, w, h, color, clase='blanca'):
    """tres rasguños diagonales (de arriba a la derecha hacia abajo a la izquierda)"""
    cortes = ''
    for i in range(3):
        x0 = 0.42 + i * 0.26
        x1 = x0 - 0.38
        g = 0.05 if i != 1 else 0.065
        cortes += f'<path d="M{x0 * 100:.1f},{4 + i * 3} Q{(x0 + x1) / 2 * 100 + g * 100:.1f},{50 - g * 60:.1f} {x1 * 100:.1f},{96 - (2 - i) * 4} Q{(x0 + x1) / 2 * 100 - g * 100:.1f},{50 + g * 60:.1f} {x0 * 100:.1f},{4 + i * 3} Z" fill="{color}"/>'
    return f'<svg class="e {clase}" style="left:{x}px;top:{y}px" width="{w}" height="{h}" viewBox="0 0 100 100" preserveAspectRatio="none">{cortes}</svg>'


def barras(x, y, w, h, color, clase='tinta'):
    """código de barras decorativo"""
    anchos = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3]
    r, px = '', 0
    u = w / (sum(anchos) + len(anchos))
    for i, a in enumerate(anchos):
        r += f'<div style="position:absolute;left:{px:.1f}px;top:0;width:{a * u:.1f}px;height:{h}px;background:{color}"></div>'
        px += (a + 1) * u
    return f'<div class="e {clase}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">{r}</div>'


ANTON = 'font-family:Anton;line-height:.92;'
P = []

# 1. Bloque: caja al frente, letras macizas y en contorno atrás
P.append(dict(
    n=1, titulo='Bloque', sub='Caja de marca al frente; atrás WEST macizo y HILL en contorno, con la huella como sello', base='sudadera_gris.png',
    capas=caja(225, 300, 200, 48, MARINO)
    + txt('WESTHILL', 225, 305, 200, ANTON + 'font-size:36px;letter-spacing:5px;color:#fff', 'blanca')
    + txt('WEST', 730, 282, 300, ANTON + f'font-size:150px;letter-spacing:2px;color:{MARINO}')
    + txt('HILL', 730, 428, 300, ANTON + f'font-size:150px;letter-spacing:9px;color:transparent;-webkit-text-stroke:4px {MARINO}')
    + img('huella_amarilla.png', 952, 386, 88, 'blanca', 'transform:rotate(14deg);')
    + caja(760, 590, 240, 3, MARINO)
    + txt('UNIVERSIDAD WESTHILL / EQUIPO', 730, 600, 300, f'font-weight:800;font-size:11px;letter-spacing:2px;color:{MARINO}')
    + txt('NI UN PASO ATRÁS', 730, 620, 300, f'font-weight:800;font-size:12px;letter-spacing:6px;color:{AZUL}')
    + txt('UW', 1150, 292, 300, ANTON + f'font-size:40px;color:{MARINO};transform:rotate(8deg)'),
    pie=['<b>Frente:</b> caja azul marino con WESTHILL en blanco.', '<b>Espalda:</b> WEST macizo, HILL en contorno y huella amarilla encimada como sello.', '<b>Manga:</b> UW.', '<b>Tintas:</b> 3 (marino, blanco, amarillo).'],
))

# 2. Eco: repetición
lineas = ''
for i in range(5):
    macizo = i == 2
    lineas += txt('WESTHILL', 730, 286 + i * 62, 300, ANTON + f'font-size:68px;letter-spacing:4px;' + (f'color:{MARINO}' if macizo else f'color:transparent;-webkit-text-stroke:2px {MARINO}'))
manga = txt('WESTHILL &nbsp; WESTHILL', 1150, 430, 300, ANTON + f'font-size:30px;letter-spacing:5px;color:transparent;-webkit-text-stroke:1.4px {MARINO};transform:rotate(80deg)')
P.append(dict(
    n=2, titulo='Eco', sub='WESTHILL repetido en contorno con una línea maciza: el recurso urbano más reconocible', base='sudadera_gris.png',
    capas=img('huella_marino.png', 392, 262, 56)
    + txt('W—H', 370, 322, 100, ANTON + f'font-size:26px;letter-spacing:3px;color:{MARINO}')
    + lineas
    + img('huella_amarilla.png', 975, 262, 70, 'blanca', 'transform:rotate(16deg);')
    + txt('NI UN PASO ATRÁS', 730, 606, 300, f'font-weight:900;font-size:15px;letter-spacing:7px;color:{AZUL}')
    + manga,
    pie=['<b>Frente:</b> huella y W—H al pecho izquierdo.', '<b>Espalda:</b> WESTHILL cinco veces (una maciza), huella amarilla y la frase.', '<b>Manga:</b> WESTHILL en contorno a lo largo.', '<b>Tintas:</b> 3 (marino, azul, amarillo).'],
))

# 3. Garra: zarpazo, en negro
P.append(dict(
    n=3, titulo='Garra', sub='Zarpazo de caracal y letra de brocha, sobre sudadera negra', base='sudadera_negra.png',
    capas=zarpazo(378, 256, 84, 78, AMARILLO)
    + txt('UW', 370, 336, 100, ANTON + 'font-size:30px;letter-spacing:3px;color:#fff', 'blanca')
    + zarpazo(742, 272, 290, 250, AMARILLO)
    + txt('Ni un paso', 730, 318, 300, 'font-family:Kaushan;font-size:64px;line-height:1;color:#fff;transform:rotate(-7deg);text-shadow:3px 3px 0 #111', 'blanca')
    + txt('atrás', 760, 384, 300, 'font-family:Kaushan;font-size:78px;line-height:1;color:#fff;transform:rotate(-7deg);text-shadow:3px 3px 0 #111', 'blanca')
    + txt('WESTHILL', 730, 520, 300, ANTON + 'font-size:70px;letter-spacing:7px;color:#fff', 'blanca')
    + txt('UNIVERSIDAD &nbsp;·&nbsp; EQUIPO', 730, 596, 300, f'font-weight:800;font-size:13px;letter-spacing:5px;color:{AMARILLO}', 'blanca')
    + img('huella_blanca.png', 1278, 266, 52, 'blanca', 'transform:rotate(10deg);'),
    pie=['<b>Frente:</b> zarpazo amarillo con UW al pecho izquierdo.', '<b>Espalda:</b> zarpazo grande, "Ni un paso atrás" en letra de brocha y WESTHILL.', '<b>Manga:</b> huella blanca.', '<b>Tintas:</b> 2 (blanco y amarillo). Requiere sudadera negra.'],
))

# 4. Colegial de calle: letra grande tipo parche y arco sobre la huella
arco = f'''<svg class="e tinta" style="left:715px;top:262px" width="330" height="150" viewBox="0 0 330 150">
<path id="a" d="M 20 132 Q 165 34 310 132" fill="none"/>
<text font-family="Anton" font-size="70" letter-spacing="5" fill="{MARINO}" text-anchor="middle"><textPath href="#a" startOffset="50%">WESTHILL</textPath></text></svg>'''
P.append(dict(
    n=4, titulo='Colegial de calle', sub='Letra W tipo parche al frente; atrás arco, huella grande y "Equipo" en brocha', base='sudadera_gris.png',
    capas=txt('W', 366, 236, 130, ANTON + f'font-size:150px;color:{MARINO};-webkit-text-stroke:5px #fff;paint-order:stroke fill;text-shadow:7px 7px 0 {AMARILLO}')
    + arco
    + img('huella_marino.png', 786, 412, 188)
    + txt('Equipo', 730, 468, 300, f'font-family:Kaushan;font-size:92px;line-height:1;color:{AMARILLO};transform:rotate(-9deg);text-shadow:3px 3px 0 {MARINO}', 'blanca')
    + txt('★ &nbsp; NI UN PASO ATRÁS &nbsp; ★', 730, 610, 300, f'font-weight:900;font-size:14px;letter-spacing:5px;color:{MARINO}')
    + txt('UW', 1150, 292, 300, ANTON + f'font-size:40px;color:{MARINO};-webkit-text-stroke:2px #fff;paint-order:stroke fill;transform:rotate(8deg)'),
    pie=['<b>Frente:</b> W grande con contorno blanco y sombra amarilla.', '<b>Espalda:</b> WESTHILL en arco, huella grande y "Equipo" en brocha amarilla.', '<b>Manga:</b> UW.', '<b>Tintas:</b> 3 (marino, blanco, amarillo).'],
))

# 5. Etiqueta: utilitaria
P.append(dict(
    n=5, titulo='Etiqueta', sub='Estilo utilitario: etiqueta con código de barras al frente y UW gigante en contorno atrás', base='sudadera_gris.png',
    capas=f'<div class="e tinta" style="left:368px;top:262px;width:122px;height:76px;border:3px solid {MARINO}"></div>'
    + txt('UW / WESTHILL', 368, 270, 122, f'font-weight:900;font-size:11px;color:{MARINO}')
    + barras(378, 290, 102, 24, MARINO)
    + txt('EQUIPO — 2026', 368, 320, 122, f'font-weight:800;font-size:8px;letter-spacing:2px;color:{MARINO}')
    + txt('UW', 730, 262, 300, ANTON + f'font-size:270px;letter-spacing:6px;color:transparent;-webkit-text-stroke:5px {MARINO}')
    + caja(740, 520, 280, 46, MARINO)
    + txt('NI UN PASO ATRÁS', 740, 532, 280, 'font-weight:900;font-size:18px;letter-spacing:3px;color:#fff', 'blanca')
    + txt('VESTIGIA NULLA RETRORSUM', 730, 578, 300, f'font-weight:800;font-size:10px;letter-spacing:4px;color:{MARINO}')
    + txt('↑', 700, 596, 300, f'font-weight:900;font-size:34px;color:{AMARILLO}', 'blanca')
    + img('huella_marino.png', 905, 606, 30, 'tinta', 'transform:rotate(12deg);')
    + txt('WESTHILL', 1150, 430, 300, 'font-weight:900;font-size:40px;letter-spacing:12px;color:#fff;transform:rotate(80deg)', 'blanca'),
    pie=['<b>Frente:</b> etiqueta con UW / WESTHILL y código de barras.', '<b>Espalda:</b> UW gigante en contorno, franja "Ni un paso atrás" y flecha hacia arriba.', '<b>Manga:</b> WESTHILL en blanco a lo largo.', '<b>Tintas:</b> 3 (marino, blanco, amarillo).'],
))

ETQ = ''.join(f'<div class="etq" style="left:{x}px">{t}</div>' for x, t in [(325, 'FRENTE'), (880, 'ESPALDA'), (1320, 'PERFIL IZQUIERDO'), (1745, 'PERFIL DERECHO')])
os.makedirs(os.path.join(AQUI, 'urbano'), exist_ok=True)
for p in P:
    pie = ''.join(f'<div class="col">{t}</div>' for t in p['pie'])
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>{CSS_U}</style></head><body>
<div class="cab"><div class="n">U{p['n']}</div><div><div class="t">{p['titulo']}</div><div class="s">{p['sub']}</div></div><img src="../assets/logo_blanco.png"></div>
<div class="maq"><img class="base" src="../assets/{p['base']}">{p['capas']}{ETQ}</div>
<div class="pie">{pie}</div></body></html>'''
    open(os.path.join(AQUI, 'urbano', f"urbano_{p['n']}.html"), 'w').write(html)
print(len(P), 'propuestas urbanas')
