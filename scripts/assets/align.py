"""Find where an original plate sits inside a widened AI edit (scale + offset).

Usage: python align.py <original.png> <wide.png>
Prints JSON {scale, ox, oy, score}: original pixel (u, v) maps to wide pixel (ox + u*scale, oy + v*scale).
Coarse search on downscaled greyscale images, then refinement at higher resolution.
"""
import json
import sys

import numpy as np
from PIL import Image


def grey(path, width):
    im = Image.open(path).convert('L')
    h = round(im.height * width / im.width)
    return np.asarray(im.resize((width, h), Image.LANCZOS), dtype=np.float32), im.size


def ncc(a, b):
    a = a - a.mean()
    b = b - b.mean()
    d = np.sqrt((a * a).sum() * (b * b).sum())
    return float((a * b).sum() / d) if d else -1.0


def search(orig_path, wide_path, wide_w, scales, centre=None, radius=None):
    wide, wide_size = grey(wide_path, wide_w)
    k = wide_w / wide_size[0]
    best = (-2.0, 1.0, 0, 0)
    for s in scales:
        ow = max(8, round(Image.open(orig_path).width * s * k))
        o, _ = grey(orig_path, ow)
        oh = o.shape[0]
        if oh > wide.shape[0] or ow > wide.shape[1]:
            continue
        ys = range(0, wide.shape[0] - oh + 1)
        xs = range(0, wide.shape[1] - ow + 1)
        if centre:
            cx, cy = centre[0] * k, centre[1] * k
            ys = range(max(0, int(cy - radius)), min(wide.shape[0] - oh, int(cy + radius)) + 1)
            xs = range(max(0, int(cx - radius)), min(wide.shape[1] - ow, int(cx + radius)) + 1)
        step = 2 if not centre else 1
        for y in list(ys)[::step]:
            for x in list(xs)[::step]:
                score = ncc(o, wide[y:y + oh, x:x + ow])
                if score > best[0]:
                    best = (score, s, x / k, y / k)
    return best


def main():
    orig, wide = sys.argv[1], sys.argv[2]
    coarse = search(orig, wide, 160, np.linspace(0.70, 1.10, 41))
    fine = search(orig, wide, 640, np.linspace(coarse[1] - 0.012, coarse[1] + 0.012, 13),
                  centre=(coarse[2], coarse[3]), radius=8)
    score, s, ox, oy = fine
    print(json.dumps({'scale': round(s, 4), 'ox': round(ox, 1), 'oy': round(oy, 1), 'score': round(score, 4)}))


if __name__ == '__main__':
    main()
