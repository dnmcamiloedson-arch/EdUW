"""Genera un fondo de portada/sección con el diseño institucional original (foto en curva + olas)
usando cualquier foto vertical del campus.
Uso: python3 make_intro_bg.py foto.jpg salida.jpg"""
import os, shutil, subprocess, sys, tempfile, zipfile
from lxml import etree
from PIL import Image

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NS = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}

def main(photo, out):
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
    Image.open(photo).convert('RGB').save(os.path.join(src, 'ppt', 'media', 'image1.jpeg'), quality=92)
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
    main(sys.argv[1], sys.argv[2])
