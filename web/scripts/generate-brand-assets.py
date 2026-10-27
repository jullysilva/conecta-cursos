"""Cuts the Conecta Cursos logo out of its light background into transparent PNG assets.

Usage (from web/): python3 scripts/generate-brand-assets.py <dir with logo-com-fundo.jpeg and logomarca-com-fundo.jpeg> public
Requires Pillow. The "sem fundo" originals are JPEGs with a baked-in checkerboard, so the
"com fundo" versions are keyed out by saturation instead.
"""
import sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]

def cutout(path):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = im.load()
    res = Image.new('RGBA', (w, h))
    rp = res.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            sat = max(r, g, b) - min(r, g, b)
            a = min(1.0, max(0.0, (sat - 14) / 36))
            if a == 0:
                rp[x, y] = (0, 0, 0, 0)
                continue
            # Un-blend from the light background so anti-aliased edges keep the logo colour.
            un = lambda c: int(min(255, max(0, (c - 245 * (1 - a)) / a)))
            rp[x, y] = (un(r), un(g), un(b), int(a * 255))
    return res.crop(res.getbbox())

def save_png(img, path):
    # 128-colour palette keeps the flat logo crisp at a fraction of the size.
    img.quantize(128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(path, optimize=True)

def square(img, pad_ratio=0.04):
    side = int(max(img.size) * (1 + pad_ratio * 2))
    canvas = Image.new('RGBA', (side, side))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas

symbol = square(cutout(f'{src}/logo-com-fundo.jpeg'))
lockup = cutout(f'{src}/logomarca-com-fundo.jpeg')
print('symbol', symbol.size, 'lockup', lockup.size)

for size in (96,):
    s = symbol.resize((size, size), Image.LANCZOS)
    save_png(s, f'{out}/brand/symbol-{size}.png')
lw = 400
l = lockup.resize((lw, round(lockup.height * lw / lockup.width)), Image.LANCZOS)
save_png(l, f'{out}/brand/logo-conecta-cursos.png')
print('lockup out', l.size)

save_png(symbol.resize((180, 180), Image.LANCZOS), f'{out}/apple-touch-icon.png')
save_png(symbol.resize((512, 512), Image.LANCZOS), f'{out}/brand/icon-512.png')
symbol.save(f'{out}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
