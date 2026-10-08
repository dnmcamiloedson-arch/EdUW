import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
files = sys.argv[3:] or sorted(glob.glob(os.path.join(d, 'f*.png')))
files = [f if os.path.isabs(f) else os.path.join(d, f) for f in files]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = 270, 480
cols = min(5, len(ims)); rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * h), (40, 40, 40))
for i, (f, im) in enumerate(zip(files, ims)):
    im = im.resize((w, h), Image.LANCZOS)
    S.paste(im, ((i % cols) * w, (i // cols) * h))
    ImageDraw.Draw(S).text(((i % cols) * w + 6, (i // cols) * h + 6), os.path.basename(f), fill=(0, 255, 0))
S.save(out)
