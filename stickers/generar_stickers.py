#!/usr/bin/env python3
"""
Hoja de stickers — Universidad Westhill
=======================================

Genera, a 300 dpi:
  * individuales/*.png          cada sticker con su contorno blanco, fondo transparente
  * hoja-stickers-imprimir.png  hoja carta (8.5 x 11 in) en blanco, con guía de corte gris
  * hoja-stickers-imprimir.pdf  la misma hoja en PDF para imprimir
  * hoja-stickers-vista.png     vista previa sobre azul hielo (para ver los contornos)

Uso:  python3 stickers/generar_stickers.py
Requiere: Pillow, numpy, scipy
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage as ndi

AQUI = Path(__file__).resolve().parent
SRC = AQUI / "fuente"
OUT_IND = AQUI / "individuales"

DPI = 300
IN = DPI  # 1 pulgada en px

# Paleta institucional (skill westhill-presentaciones)
AZUL = (38, 98, 148)      # 266294
MARINO = (14, 42, 71)     # 0E2A47
DORADO = (242, 201, 76)   # F2C94C
HIELO = (237, 243, 250)   # EDF3FA
TEXTO_LOGO = (31, 38, 44)  # gris oscuro del texto del logo original
BLANCO = (255, 255, 255)


# ---------------------------------------------------------------- utilidades
def cargar(nombre):
    return Image.open(SRC / nombre).convert("RGBA")


def recortar(im):
    return im.crop(im.getchannel("A").getbbox())


def a_ancho(im, pulgadas):
    w = round(pulgadas * IN)
    h = round(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS)


def a_alto(im, pulgadas):
    h = round(pulgadas * IN)
    w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)


def pintar(im, color):
    """Rellena todo lo opaco de un solo color, conservando el alfa."""
    out = Image.new("RGBA", im.size, color + (0,))
    out.putalpha(im.getchannel("A"))
    return out


def silueta(alfa, r, unir=0):
    """
    Contorno de corte suave alrededor de la máscara.
      r    grosor del borde blanco (px)
      unir radio extra para fundir piezas separadas en un solo sticker
    Devuelve un alfa float 0..1 con borde antialias.
    """
    m = alfa > 0.5
    if unir:
        R = r + unir
        gordo = ndi.distance_transform_edt(~m) <= R
        gordo = ndi.binary_fill_holes(gordo)
        d_in = ndi.distance_transform_edt(gordo)
        m = d_in > unir  # erosiona de regreso -> queda r alrededor del arte
    m = ndi.binary_fill_holes(m)
    d = ndi.distance_transform_edt(~m)
    base = np.where(m, 1.0, 0.0)
    borde = np.clip(r + 0.5 - d, 0, 1) if not unir else np.clip(0.5 - d, 0, 1)
    return np.maximum(base, borde)


def sticker(arte, r, unir=0, color_borde=BLANCO):
    """Coloca el arte sobre su silueta blanca. Devuelve RGBA con margen."""
    pad = r + unir + 12
    lienzo = Image.new("RGBA", (arte.width + 2 * pad, arte.height + 2 * pad), (0, 0, 0, 0))
    lienzo.alpha_composite(arte, (pad, pad))
    alfa = np.asarray(lienzo.getchannel("A"), dtype=np.float32) / 255.0
    sil = silueta(alfa, r, unir)
    # suavizado final del filo
    sil_img = Image.fromarray((sil * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    fondo = Image.new("RGBA", lienzo.size, color_borde + (0,))
    fondo.putalpha(sil_img)
    fondo.alpha_composite(lienzo)
    return recortar(fondo)


# ---------------------------------------------------------------- artes base
def arte_banderin():
    return recortar(cargar("banderin_uw.png"))


def arte_uw_azul():
    """Solo las letras UW del banderín, en azul Westhill con contorno blanco."""
    b = np.asarray(cargar("banderin_uw.png")).astype(np.int16)
    blanco = (b[..., 0] > 140) & (b[..., 1] > 160) & (b[..., 2] > 180) & (b[..., 3] > 0)
    # intensidad de "blanco" -> alfa (conserva el antialias de las letras)
    lum = b[..., :3].mean(-1)
    alfa = np.clip((lum - 98) / (255 - 98), 0, 1) * (b[..., 3] / 255.0)
    alfa[:590] = 0
    alfa[1190:] = 0  # deja fuera "Westhill"
    alfa[~blanco & (alfa < 0.05)] = 0
    im = Image.new("RGBA", (b.shape[1], b.shape[0]), AZUL + (0,))
    im.putalpha(Image.fromarray((alfa * 255).astype(np.uint8)))
    return recortar(im)


def arte_logo():
    """Logo completo en alta resolución con sus colores originales."""
    w = cargar("logo_westhill_blanco.png")
    a = np.asarray(w.getchannel("A"))
    rgb = np.zeros(a.shape + (3,), np.uint8)
    rgb[:470] = AZUL          # edificio
    rgb[470:] = TEXTO_LOGO    # UNIVERSIDAD WESTHILL + lema
    im = Image.fromarray(np.dstack([rgb, a]), "RGBA")
    return recortar(im)


def arte_edificio():
    w = cargar("logo_westhill_blanco.png")
    return pintar(recortar(w.crop((0, 0, w.width, 440))), AZUL)


def arte_huella(color):
    return pintar(recortar(cargar("huella_caracal.png")), color)


def arte_mascota():
    return recortar(cargar("mascota_caracal.png"))


def arte_somos(alto_px):
    f1 = ImageFont.truetype(str(SRC / "Raleway-500.ttf"), alto_px)
    f2 = ImageFont.truetype(str(SRC / "Raleway-900.ttf"), alto_px)
    t1, t2 = "#SOMOS", "WESTHILL"
    w1 = f1.getbbox(t1)[2]
    w2 = f2.getbbox(t2)[2]
    im = Image.new("RGBA", (w1 + w2 + 20, int(alto_px * 1.4)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((0, 0), t1, font=f1, fill=AZUL)
    d.text((w1 + 6, 0), t2, font=f2, fill=AZUL)
    return recortar(im)


# ---------------------------------------------------------------- catálogo
def catalogo():
    """(nombre_archivo, imagen_sticker). Medidas en pulgadas, a 300 dpi."""
    s = {}
    ban = arte_banderin()
    s["banderin-uw-grande"] = sticker(a_alto(ban, 2.8), r=30)
    s["banderin-uw-chico"] = sticker(a_alto(ban, 1.45), r=20)

    uw = arte_uw_azul()
    s["uw-azul-grande"] = sticker(a_ancho(uw, 2.8), r=30, unir=26)
    s["uw-azul-chico"] = sticker(a_ancho(uw, 1.6), r=18, unir=16)

    logo = arte_logo()
    s["logo-westhill-grande"] = sticker(a_ancho(logo, 4.2), r=14, unir=34)
    s["logo-westhill-chico"] = sticker(a_ancho(logo, 2.7), r=11, unir=24)

    s["edificio-westhill"] = sticker(a_ancho(arte_edificio(), 2.6), r=22, unir=14)
    s["huella-azul"] = sticker(a_alto(arte_huella(AZUL), 1.15), r=20, unir=14)
    s["huella-dorada"] = sticker(a_alto(arte_huella(DORADO), 1.15), r=20, unir=14)
    s["mascota-caracal"] = sticker(a_alto(arte_mascota(), 2.85), r=26)
    s["somos-westhill"] = sticker(arte_somos(int(0.34 * IN)), r=22, unir=20)
    return s


# Acomodo de la hoja: filas de izquierda a derecha (se repiten los chicos)
FILAS = [
    ["banderin-uw-grande", "uw-azul-grande", "mascota-caracal"],
    ["logo-westhill-grande", "banderin-uw-chico", "banderin-uw-chico"],
    ["uw-azul-chico", "edificio-westhill", "uw-azul-chico"],
    ["huella-azul", "somos-westhill", "huella-dorada"],
    ["logo-westhill-chico", "huella-azul", "banderin-uw-chico"],
]


def guia_corte(st, grosor=3):
    """Línea gris finita siguiendo el borde del sticker (para cortar a mano)."""
    a = st.getchannel("A")
    m = np.asarray(a) > 127
    d = ndi.distance_transform_edt(~m)
    linea = (d > 0) & (d <= grosor)
    out = Image.new("RGBA", st.size, (0, 0, 0, 0))
    arr = np.zeros(st.size[::-1] + (4,), np.uint8)
    arr[linea] = (176, 190, 206, 255)
    out = Image.fromarray(arr, "RGBA")
    out.alpha_composite(st)
    return out


def armar_hoja(st, modo):
    W, H = int(8.5 * IN), int(11 * IN)
    margen = int(0.45 * IN)
    hueco = int(0.22 * IN)
    fondo = HIELO if modo == "vista" else BLANCO
    hoja = Image.new("RGBA", (W, H), fondo + (255,))

    # alto de cada fila y espacio vertical sobrante repartido
    filas = [[st[n] for n in fila] for fila in FILAS]
    altos = [max(i.height for i in f) for f in filas]
    pie = int(0.35 * IN)
    libre = H - 2 * margen - pie - sum(altos)
    gap_y = libre // (len(filas) - 1)
    assert gap_y >= hueco, f"no cabe: gap_y={gap_y}"

    y = margen
    for f, alto in zip(filas, altos):
        ancho_total = sum(i.width for i in f)
        gap_x = (W - 2 * margen - ancho_total) // (len(f) - 1)
        assert gap_x >= hueco, f"fila muy ancha: gap_x={gap_x}"
        x = margen
        for img in f:
            yy = y + (alto - img.height) // 2
            if modo == "vista":
                sombra = Image.new("RGBA", img.size, MARINO + (0,))
                sombra.putalpha(img.getchannel("A").point(lambda v: v * 0.22))
                sombra = sombra.filter(ImageFilter.GaussianBlur(14))
                hoja.alpha_composite(sombra, (x + 4, yy + 12))
                hoja.alpha_composite(img, (x, yy))
            else:
                hoja.alpha_composite(guia_corte(img), (x, yy))
            x += img.width + gap_x
        y += alto + gap_y

    d = ImageDraw.Draw(hoja)
    f = ImageFont.truetype(str(SRC / "Raleway-500.ttf"), 34)
    txt = "Universidad Westhill  ·  Hoja de stickers  ·  Carta 8.5 × 11 in  ·  300 dpi"
    tw = d.textlength(txt, font=f)
    d.text(((W - tw) / 2, H - margen - 34), txt, font=f, fill=(91, 107, 125))
    return hoja


def main():
    OUT_IND.mkdir(exist_ok=True)
    st = catalogo()
    for nombre, img in st.items():
        img.save(OUT_IND / f"{nombre}.png", dpi=(DPI, DPI))
        print(f"  {nombre:24s} {img.width / IN:.2f} x {img.height / IN:.2f} in")

    vista = armar_hoja(st, "vista")
    vista.convert("RGB").save(AQUI / "hoja-stickers-vista.png", dpi=(DPI, DPI))

    imp = armar_hoja(st, "imprimir").convert("RGB")
    imp.save(AQUI / "hoja-stickers-imprimir.png", dpi=(DPI, DPI))
    imp.save(AQUI / "hoja-stickers-imprimir.pdf", resolution=DPI)
    print("Listo.")


if __name__ == "__main__":
    main()
