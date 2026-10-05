"""Genera un fondo de portada/sección con el diseño institucional original (foto en curva + olas)
usando cualquier foto (vertical u horizontal).
Uso: python3 make_intro_bg.py foto.jpg salida.jpg [--focus x0,y0,x1,y1]
La curva solo deja ver una ventana de proporción ~1.15:1 de la foto. --focus indica, en fracciones
(0–1) de la foto, la zona que debe quedar visible (personas, fachada). Sin --focus se usa la zona
central más grande con esa proporción. El resto se rellena con la misma foto desenfocada."""
import os, shutil, subprocess, sys, tempfile, zipfile
from lxml import etree
from PIL import Image, ImageFilter

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NS = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}

# Geometry of the photo slot in the original cover template: the picture is stretched to the
# shape width and 1.75x its height (fillRect t=-28%, b=-47%), and the slide + bottom waves leave
# only this window of the picture visible.
CANVAS_ASPECT = 0.553
WINDOW = (0.0, 0.27, 0.81, 0.66)  # x0, y0, x1, y1 as fractions of the canvas
WINDOW_ASPECT = (WINDOW[2] - WINDOW[0]) * CANVAS_ASPECT / (WINDOW[3] - WINDOW[1])


def compose(photo, focus=None):
    im = Image.open(photo).convert('RGB'); W, H = im.size
    if focus is None:
        if W / H > WINDOW_ASPECT:
            w = H * WINDOW_ASPECT; focus = ((W - w) / 2 / W, 0, (W + w) / 2 / W, 1)
        else:
            h = W / WINDOW_ASPECT; focus = (0, (H - h) / 2 / H, 1, (H + h) / 2 / H)
    x0, y0, x1, y1 = int(focus[0] * W), int(focus[1] * H), int(focus[2] * W), int(focus[3] * H)
    region = im.crop((x0, y0, x1, y1))
    CW = 1400; CH = int(CW / CANVAS_ASPECT)
    canvas = im.resize((CW, CH)).filter(ImageFilter.GaussianBlur(30))
    wx0, wy0, wx1, wy1 = int(WINDOW[0] * CW), int(WINDOW[1] * CH), int(WINDOW[2] * CW), int(WINDOW[3] * CH)
    ww, wh = wx1 - wx0, wy1 - wy0
    s = max(ww / region.width, wh / region.height)
    r = region.resize((int(region.width * s), int(region.height * s)), Image.LANCZOS)
    canvas.paste(r, (wx0 + (ww - r.width) // 2, wy0 + (wh - r.height) // 2))
    return canvas


def main(photo, out, focus=None):
    work = tempfile.mkdtemp(prefix='westhill_bg_')
    src = os.path.join(work, 'src')
    with zipfile.ZipFile(os.path.join(SKILL, 'assets', 'plantilla_original.pptx')) as z:
        z.extractall(src)
    # keep only the curved photo (Group 2) and the bottom waves (Group 4) on slide 1
    sl = os.path.join(src, 'ppt', 'slides', 'slide1.xml')
    t = etree.parse(sl); tree = t.find('.//p:cSld/p:spTree', NS)
    for el in list(tree):
        nv = el.find('.//p:cNvPr', NS)
        if el.tag.endswith('}nvGrpSpPr') or el.tag.endswith('}grpSpPr'):
            continue
        if nv is None or nv.get('name') not in ('Group 2', 'Group 4'):
            tree.remove(el)
    t.write(sl, xml_declaration=True, encoding='UTF-8', standalone=True)
    compose(photo, focus).save(os.path.join(src, 'ppt', 'media', 'image1.jpeg'), quality=92)
    deck = os.path.join(work, 'bg.pptx')
    with zipfile.ZipFile(deck, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(src):
            for f in files:
                full = os.path.join(root, f); z.write(full, os.path.relpath(full, src))
    profile = tempfile.mkdtemp(prefix='lo_profile_')
    env = dict(os.environ, SAL_USE_VCLPLUGIN='svp')
    subprocess.run(['soffice', f'-env:UserInstallation=file://{profile}', '--headless', '--convert-to', 'pdf', '--outdir', work, deck], env=env, capture_output=True)
    subprocess.run(['pdftoppm', '-png', '-r', '144', '-f', '1', '-l', '1', os.path.join(work, 'bg.pdf'), os.path.join(work, 'bg')], check=True)
    png = [f for f in os.listdir(work) if f.startswith('bg-') and f.endswith('.png')][0]
    Image.open(os.path.join(work, png)).convert('RGB').save(out, quality=90)
    shutil.rmtree(work, ignore_errors=True)
    print(out)

if __name__ == '__main__':
    args = sys.argv[1:]
    focus = None
    if '--focus' in args:
        i = args.index('--focus'); focus = tuple(float(v) for v in args[i + 1].split(',')); del args[i:i + 2]
    main(args[0], args[1], focus)
