"""Textura de papel (fibras + grano grueso) para el look de papel recortado/serigrafía."""
import numpy as np
from PIL import Image, ImageFilter
rng = np.random.default_rng(28)
W, H = 1080, 1920
def blurred(scale, sigma):
    n = rng.normal(0, 1, (H // scale + 2, W // scale + 2)).astype(np.float32)
    im = Image.fromarray(((n - n.min()) / (n.max() - n.min()) * 255).astype(np.uint8))
    im = im.resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(sigma))
    a = np.asarray(im, np.float32) / 255.0
    return (a - a.mean()) / (a.std() + 1e-6)
base = 0.55 * blurred(24, 6) + 0.35 * blurred(6, 1.5) + 0.25 * blurred(2, 0.6)
# fibras: trazos cortos aleatorios
fib = Image.new('L', (W, H), 0)
from PIL import ImageDraw
d = ImageDraw.Draw(fib)
for _ in range(5200):
    x, y = rng.uniform(0, W), rng.uniform(0, H)
    a = rng.uniform(0, np.pi)
    L = rng.uniform(6, 28)
    d.line([(x, y), (x + np.cos(a) * L, y + np.sin(a) * L)], fill=int(rng.uniform(60, 160)), width=1)
fib = np.asarray(fib.filter(ImageFilter.GaussianBlur(0.7)), np.float32) / 255.0
v = 128 + base * 16 + fib * 38
Image.fromarray(np.clip(v, 0, 255).astype(np.uint8)).save('public/tex/paper.png', optimize=True)
print('ok')
