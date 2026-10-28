"""Nombres de las facultades con el diseño de su leyenda, en PNG con fondo transparente.

Uso: python3 scripts/nombres_facultades.py <carpeta_salida> <rye.ttf> <alike.ttf>
"""
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

OUT, RYE, ALIKE = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
W, H = 2400, 1000


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def text_mask(lines):
    """lines: [(texto, fuente, tamaño, y_centro)] → máscara L centrada horizontalmente (achica si no cabe)."""
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    for txt, path, size, yc in lines:
        f = ImageFont.truetype(path, size)
        while d.textlength(txt, font=f) > W - 260 and size > 40:
            size -= 4
            f = ImageFont.truetype(path, size)
        tw = d.textlength(txt, font=f)
        d.text(((W - tw) / 2, yc), txt, font=f, fill=255, anchor='lm')
    return m


def vgrad(c0, c1, c2=None):
    """Degradado vertical RGBA de W×H."""
    a = np.linspace(0, 1, H)[:, None, None]
    c0, c1 = np.array(hexc(c0), float), np.array(hexc(c1), float)
    if c2 is None:
        g = c0 * (1 - a) + c1 * a
    else:
        c2 = np.array(hexc(c2), float)
        g = np.where(a < 0.5, c0 * (1 - a * 2) + c1 * a * 2, c1 * (1 - (a - 0.5) * 2) + c2 * (a - 0.5) * 2)
    g = np.repeat(g, W, axis=1)
    return Image.fromarray(g.astype(np.uint8), 'RGBA')


def noise(seed, scale=6, contrast=1.0):
    rng = np.random.default_rng(seed)
    small = rng.random((H // scale + 2, W // scale + 2))
    img = Image.fromarray((small * 255).astype(np.uint8), 'L').resize((W, H), Image.BICUBIC)
    if contrast != 1:
        arr = np.asarray(img, float)
        arr = np.clip((arr - 128) * contrast + 128, 0, 255)
        img = Image.fromarray(arr.astype(np.uint8), 'L')
    return img


def fill(mask, src):
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.paste(src, (0, 0), mask)
    return out


def glow(mask, color, radius, strength=1.0):
    g = mask.filter(ImageFilter.GaussianBlur(radius))
    g = g.point(lambda v: min(255, int(v * strength)))
    lay = Image.new('RGBA', (W, H), hexc(color, 0))
    lay.putalpha(g)
    return lay


def stroke(mask, width):
    return ImageChops.subtract(mask.filter(ImageFilter.MaxFilter(width * 2 + 1)), mask)


def solid(mask, color):
    lay = Image.new('RGBA', (W, H), hexc(color))
    lay.putalpha(mask)
    return lay


def compose(*layers):
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for l in layers:
        out = Image.alpha_composite(out, l)
    return out


def trim(img, pad=40):
    bb = img.getbbox()
    if not bb:
        return img
    x0, y0, x1, y1 = bb
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)))


def flame(d, x, y, s, col_out, col_in):
    """Flamita: gota con punta ondulada."""
    for k, (c, sc) in enumerate(((col_out, 1.0), (col_in, 0.55))):
        pts = []
        for i in range(40):
            a = i / 40 * math.tau
            r = s * sc * (0.55 if math.sin(a) > 0 else 0.55 + 0.9 * (-math.sin(a)) ** 1.6)
            pts.append((x + math.cos(a) * s * sc * 0.55, y + math.sin(a) * r + (0 if math.sin(a) > 0 else -s * sc * 0.2)))
        d.polygon(pts, fill=c)


# ---------- 1) Psicología y Ciencias de la Educación — Brujas de Fuego: letras de lumbre con brasas ----------
def brujas():
    m = text_mask([('PSICOLOGÍA', RYE, 300, 400), ('y Ciencias de la Educación', ALIKE, 120, 640)])
    body = vgrad('#FFF1B0', '#F5A23A', '#C2361A')
    tex = noise(1, 10, 1.6)
    body = Image.composite(body, vgrad('#F26D3D', '#A83A25'), tex.point(lambda v: 255 if v > 90 else 120))
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rnd = random.Random(3)
    # flamitas que salen de las letras
    arr = np.asarray(m)
    cols = np.where(arr[300:520].max(axis=0) > 0)[0]
    for _ in range(26):
        x = int(rnd.choice(cols))
        top = np.argmax(arr[:, x] > 0)
        flame(d, x, top - 10, rnd.uniform(28, 60), (242, 109, 61, 230), (255, 214, 120, 255))
    for _ in range(140):
        x, y = rnd.uniform(150, W - 150), rnd.uniform(80, 900)
        r = rnd.uniform(2, 7)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, rnd.randint(150, 220), 80, rnd.randint(120, 255)))
    return trim(compose(glow(m, '#F26D3D', 60, 1.6), glow(m, '#FFB24A', 18, 1.3), lay.filter(ImageFilter.GaussianBlur(1.2)), solid(stroke(m, 6), '#4a1606'), fill(m, body)))


# ---------- 2) Institute — Nahual: plata de luna, sombra de coyote y ojos verdes ----------
def nahual():
    m = text_mask([('INSTITUTE', RYE, 330, 470)])
    body = vgrad('#F4F7F5', '#9FC3C4', '#3B6E73')
    # luna llena con halo detrás de la última letra
    moon = Image.new('L', (W, H), 0)
    ImageDraw.Draw(moon).ellipse((1720, 60, 1980, 320), fill=255)
    moonl = compose(glow(moon, '#9FC3C4', 70, 1.2), fill(moon, vgrad('#FFFFFF', '#C9DAD8')))
    # bruma verde azulada al pie de las letras
    mist = noise(2, 60, 1.3).filter(ImageFilter.GaussianBlur(35))
    band = Image.new('L', (W, H), 0)
    ImageDraw.Draw(band).rectangle((0, 560, W, 720), fill=255)
    mistl = Image.new('RGBA', (W, H), (120, 170, 160, 0))
    mistl.putalpha(ImageChops.multiply(mist, band.filter(ImageFilter.GaussianBlur(50))).point(lambda v: int(v * 0.6)))
    # dos ojos de animal que miran desde la oscuridad
    eyes = Image.new('L', (W, H), 0)
    de = ImageDraw.Draw(eyes)
    for x in (560, 640):
        de.ellipse((x - 18, 806, x + 18, 826), fill=255)
    return trim(compose(moonl, glow(m, '#1F5C48', 50, 1.4), solid(stroke(m, 6), '#0E1E22'), fill(m, body), glow(m, '#D9F0EE', 6, 0.5), mistl, glow(eyes, '#A8F070', 16, 2.2), solid(eyes, '#d8ffb0')))


# ---------- 3) Arquitectura — Charro Negro: negro con botonadura de plata y monedas de oro ----------
def charro():
    m = text_mask([('ARQUITECTURA', RYE, 290, 470)])
    body = vgrad('#3a3530', '#0d0b0a', '#1e1a17')
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    arr = np.asarray(m)
    # botonadura de plata siguiendo la base de las letras
    ys = np.where(arr.max(axis=1) > 0)[0]
    y0, y1 = ys.min(), ys.max()
    for x in range(180, W - 180, 54):
        if arr[:, x].max() == 0:
            continue
        for y in (y0 - 40, y1 + 40):
            d.ellipse((x - 11, y - 11, x + 11, y + 11), fill=(217, 205, 182, 255), outline=(120, 110, 95, 255), width=3)
            d.ellipse((x - 5, y - 6, x + 1, y), fill=(255, 255, 255, 220))
    # monedas de oro
    rnd = random.Random(7)
    for i in range(7):
        x, y = rnd.uniform(200, W - 200), rnd.choice([rnd.uniform(60, y0 - 90), rnd.uniform(y1 + 90, 940)])
        r = rnd.uniform(26, 40)
        d.ellipse((x - r, y - r * 0.85, x + r, y + r * 0.85), fill=(216, 166, 55, 255), outline=(140, 96, 20, 255), width=4)
        d.ellipse((x - r * 0.55, y - r * 0.47, x + r * 0.55, y + r * 0.47), outline=(255, 220, 120, 200), width=3)
    return trim(compose(glow(m, '#F5C242', 40, 0.6), solid(stroke(m, 9), '#D9CDB6'), fill(m, body), glow(stroke(m, 2), '#ffffff', 2, 0.6), lay))


# ---------- 4) Medicina — Niño Fantasma del KM 31: niebla de carretera y ojos rojos ----------
def km31():
    m = text_mask([('MEDICINA', RYE, 340, 470)])
    body = vgrad('#ECEFF0', '#9FB0B5', '#55666b')
    fog = noise(4, 90, 1.3).filter(ImageFilter.GaussianBlur(45))
    fogl = Image.new('RGBA', (W, H), (205, 215, 218, 0))
    band = Image.new('L', (W, H), 0)
    ImageDraw.Draw(band).rectangle((0, 520, W, 760), fill=255)
    band = band.filter(ImageFilter.GaussianBlur(70))
    fogl.putalpha(ImageChops.multiply(fog, band).point(lambda v: int(v * 0.9)))
    eyes = Image.new('L', (W, H), 0)
    de = ImageDraw.Draw(eyes)
    for x in (1980, 2040):
        de.ellipse((x - 12, 175, x + 12, 195), fill=255)
    # línea de carretera debajo
    road = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(road)
    for x in range(260, W - 260, 160):
        dr.rectangle((x, 820, x + 90, 838), fill=(245, 194, 66, 220))
    return trim(compose(glow(m, '#9FB0B5', 45, 1.0), road, solid(stroke(m, 6), '#20292c'), fill(m, body), fogl, glow(eyes, '#ff2a14', 18, 2.5), solid(eyes, '#ff6040')))


# ---------- 5) Odontología — Momias de Guanajuato: piedra sepia agrietada, grabado antiguo ----------
def momias():
    m = text_mask([('ODONTOLOGÍA', RYE, 300, 470)])
    stone = vgrad('#E8D2A8', '#B08C5C', '#6E5130')
    tex = noise(5, 3, 1.8)
    stone = Image.composite(stone, vgrad('#8a6a44', '#4a341e'), tex.point(lambda v: 255 if v > 70 else 0))
    lay = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(lay)
    rnd = random.Random(11)
    for _ in range(26):  # grietas
        x, y = rnd.uniform(200, W - 200), rnd.uniform(330, 610)
        for _ in range(6):
            nx, ny = x + rnd.uniform(-40, 40), y + rnd.uniform(-35, 35)
            d.line((x, y, nx, ny), fill=255, width=rnd.choice([3, 4, 5]))
            x, y = nx, ny
    cracks = ImageChops.multiply(lay, m)
    # achurado de grabado en la mitad inferior de las letras
    hatch = Image.new('L', (W, H), 0)
    dh = ImageDraw.Draw(hatch)
    for k in range(-H, W, 14):
        dh.line((k, H, k + H, 0), fill=150, width=3)
    lower = Image.new('L', (W, H), 0)
    ImageDraw.Draw(lower).rectangle((0, 500, W, H), fill=255)
    hatch = ImageChops.multiply(ImageChops.multiply(hatch, m), lower.filter(ImageFilter.GaussianBlur(40)))
    return trim(compose(glow(m, '#000000', 22, 1.2), solid(stroke(m, 7), '#2a1a0c'), fill(m, stone), solid(hatch, '#3a2512'), solid(cracks, '#231305')))


# ---------- 6) Derecho y Relaciones Internacionales — La Llorona: blanco azulado, velo y ondas de agua ----------
def llorona():
    m = text_mask([('DERECHO', RYE, 300, 360), ('y Relaciones Internacionales', ALIKE, 120, 600)])
    body = vgrad('#FFFFFF', '#D9E8EC', '#8FB3BD')
    rip = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(rip)
    for i, r in enumerate((180, 320, 470, 640, 820)):
        d.ellipse((W / 2 - r * 1.6, 820 - r * 0.22, W / 2 + r * 1.6, 820 + r * 0.22), outline=(175, 205, 214, 160 - i * 25), width=4)
    veil = Image.new('L', (W, H), 0)
    dv = ImageDraw.Draw(veil)
    dv.ellipse((1800, 40, 2200, 520), fill=150)
    veil = veil.filter(ImageFilter.GaussianBlur(60))
    vl = Image.new('RGBA', (W, H), (235, 240, 240, 0))
    vl.putalpha(veil)
    # reflejo del texto en el agua
    refl = m.transpose(Image.FLIP_TOP_BOTTOM).transform((W, H), Image.AFFINE, (1, 0, 0, 0, 1, -360)).filter(ImageFilter.GaussianBlur(4))
    refl = ImageChops.multiply(refl, Image.linear_gradient('L').resize((W, H)).point(lambda v: int(max(0, 255 - v * 1.6) * 0.35)))
    return trim(compose(vl, glow(m, '#8FB3BD', 50, 1.3), rip, solid(refl, '#9fc3c4'), solid(stroke(m, 5), '#1a3442'), fill(m, body), glow(m, '#ffffff', 8, 0.4)))


# ---------- 7) Negocios · Económico Administrativo — Chaneques: verde de bosque, listón rojo y luciérnagas ----------
def chaneques():
    m = text_mask([('NEGOCIOS', RYE, 320, 380), ('Económico Administrativo', ALIKE, 120, 610)])
    body = vgrad('#D8F0A0', '#7FB86A', '#2f7a52')
    leaf = noise(8, 5, 1.7)
    body = Image.composite(body, vgrad('#a8d888', '#3f8f5a'), leaf.point(lambda v: 255 if v > 100 else 0))
    rib = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(rib)
    pts = [(x, 820 + 45 * math.sin(x / 170) + 14 * math.sin(x / 47)) for x in range(160, W - 160, 8)]
    d.line(pts, fill=(176, 48, 31, 255), width=22, joint='curve')
    d.line([(x, y - 6) for x, y in pts], fill=(220, 90, 70, 200), width=5)
    flies = Image.new('L', (W, H), 0)
    df = ImageDraw.Draw(flies)
    rnd = random.Random(5)
    for _ in range(40):
        x, y = rnd.uniform(120, W - 120), rnd.uniform(60, 940)
        df.ellipse((x - 6, y - 6, x + 6, y + 6), fill=255)
    return trim(compose(glow(flies, '#C8F080', 14, 3), glow(m, '#1F5C48', 40, 1.6), rib, solid(stroke(m, 6), '#0a1a12'), fill(m, body), solid(flies, '#e8ffb0')))


DISENOS = {
    'psicologia-y-ciencias-de-la-educacion': brujas,
    'institute': nahual,
    'arquitectura': charro,
    'medicina': km31,
    'odontologia': momias,
    'derecho-y-relaciones-internacionales': llorona,
    'negocios-economico-administrativo': chaneques,
}
for nombre, fn in DISENOS.items():
    img = fn()
    img.save(os.path.join(OUT, f'{nombre}.png'), optimize=True)
    print(nombre, img.size)
