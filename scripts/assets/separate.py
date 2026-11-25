"""Separate approved plates into transparent layers (pilot, docs/ASSET_STRATEGY.md).

Difference mattes: an AI edit removes or isolates content; comparing it with the plate it was
made from gives an exact mask, so the original artwork is preserved. Writes asset versions into
the external library and prints the world rectangles for the manifests.

Usage: python separate.py <library> <alignments.json>
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

LIB = sys.argv[1]
ALIGN = json.load(open(sys.argv[2]))
SRC = os.path.join(LIB, 'sources/openart/2026-11-25-batch2')
WORLD_W, WORLD_H = 1920, 1080


def load(name):
    return Image.open(os.path.join(SRC, name)).convert('RGB')


def arr(im):
    return np.asarray(im, dtype=np.float32)


def feather(mask, px):
    """Binary mask -> soft alpha (0..255) with a small blur on the edge only."""
    im = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(px)), dtype=np.uint8)


def save_rgba(rgb, alpha, path, crop=True):
    rgba = np.dstack([np.asarray(rgb, dtype=np.uint8), alpha])
    box = (0, 0, rgba.shape[1], rgba.shape[0])
    if crop:
        ys, xs = np.nonzero(alpha > 2)
        box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        rgba = rgba[box[1]:box[3], box[0]:box[2]]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(rgba, 'RGBA').save(path, optimize=True)
    return box


def plate_to_wide(orig, wide, a):
    """Resample the matching window of the wide edit to the original plate's size."""
    w, h = orig.size
    box = (a['ox'], a['oy'], a['ox'] + w * a['scale'], a['oy'] + h * a['scale'])
    return wide.crop(tuple(round(v) for v in box)).resize((w, h), Image.LANCZOS)


def diff(a, b, blur=3):
    d = np.abs(arr(a) - arr(b)).sum(axis=2)
    return ndimage.gaussian_filter(d, blur)


def world_rect_of_wide(orig, wide, a):
    """Rectangle (x, y, w, h) in 1920x1080 world units covered by the whole wide edit."""
    k = WORLD_W / orig.size[0]
    return [round(-a['ox'] / a['scale'] * k, 1), round(-a['oy'] / a['scale'] * k, 1),
            round(wide.size[0] / a['scale'] * k, 1), round(wide.size[1] / a['scale'] * k, 1)]


def world_rect_of_crop(orig, box):
    k = WORLD_W / orig.size[0]
    return [round(box[0] * k, 1), round(box[1] * k, 1), round((box[2] - box[0]) * k, 1), round((box[3] - box[1]) * k, 1)]


def big_regions(d, prior, threshold=150, min_frac=0.004):
    """Large solid areas of difference: drops the thin re-rendering noise along edges."""
    m = ndimage.binary_opening(d > threshold, iterations=4) & prior
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s > min_frac * m.size]
    m = np.isin(lab, keep)
    # Pad before closing: SciPy erodes at the image border, which would detach edge-touching regions.
    closed = ndimage.binary_closing(np.pad(m, 12), iterations=8)[12:-12, 12:-12] | m
    return ndimage.binary_fill_holes(closed)


def tidy(mask, min_piece=0.002, max_hole=2500):
    """Drop small isolated specks and fill only small holes (keeps sky visible between branches)."""
    lab, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    mask = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > min_piece * mask.size])
    holes = ndimage.binary_fill_holes(mask) & ~mask
    lab, n = ndimage.label(holes)
    sizes = ndimage.sum(holes, lab, range(1, n + 1))
    return mask | np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s <= max_hole])


def edge_components(mask, sides):
    """Keep connected components that touch the given frame sides (foreground framing)."""
    lab, n = ndimage.label(mask)
    keep = set()
    edges = {'left': lab[:, 0], 'right': lab[:, -1], 'bottom': lab[-1, :], 'top': lab[0, :]}
    for s in sides:
        keep |= set(np.unique(edges[s])) - {0}
    return np.isin(lab, list(keep))


out = {}

# ---------------------------------------------------------------- valley
plate = load('valley-plate-b.png')
clean = load('valley-clean-wide.png')
sky = load('valley-sky-wide.png')
a = ALIGN['valley']
base = f'{LIB}/assets/env/alpine-valley-dawn/v001'
H, W = plate.size[1], plate.size[0]

# Foreground: what the clean edit removed, near the frame edges only.
d = diff(plate, plate_to_wide(plate, clean, a))
yy, xx = np.mgrid[0:H, 0:W]
prior = (xx > W * 0.70) | (xx < W * 0.42)
fg = edge_components(big_regions(d, prior), ['left', 'right', 'bottom', 'top'])
# The framing silhouettes are near-black in the original. Where the widened edit painted dark
# grass behind them the difference is weak, so add very dark pixels, but only straight below the
# detected silhouette (its own columns, +-20 px), never the background forest beside it.
lum = arr(plate).mean(axis=2)
below = np.maximum.accumulate(fg, axis=0)
below = ndimage.binary_dilation(below, structure=np.ones((1, 41), bool))
fg = fg | ((lum < 48) & below & prior)
fg = tidy(ndimage.binary_closing(np.pad(fg, 12), iterations=4)[12:-12, 12:-12] | fg)
fg = ndimage.binary_dilation(fg, iterations=2)
right = fg & (xx > W * 0.6)
left = fg & (xx <= W * 0.6)
for name, m in (('fg-tree', right), ('fg-ledge', left)):
    box = save_rgba(plate, feather(m, 1.5), f'{base}/{name}.png')
    out[f'valley.{name}'] = world_rect_of_crop(plate, box)

# Mid: everything in the clean plate in front of the sky-and-peaks plate, filled down to the bottom.
dm = diff(clean, sky, blur=4)
# Ceiling traced once by eye just above the hills and treeline (manual step, wide-plate pixels).
ceiling_pts = [(0, 320), (720, 520), (1210, 660), (1610, 770), (2020, 720), (2360, 545), (2740, 430), (3168, 345)]
xs = np.arange(clean.size[0])
ceiling = np.interp(xs, [p[0] for p in ceiling_pts], [p[1] for p in ceiling_pts])
rows = np.arange(clean.size[1])[:, None]
solid = ndimage.binary_opening(dm > 70, iterations=3) & (rows >= ceiling[None, :])
cols = np.where(solid.any(axis=0), solid.argmax(axis=0), clean.size[1])
cols = ndimage.median_filter(cols, size=15)
# Soft 80 px ramp at the top edge: where both plates show haze and mountains, the mid layer
# fades into the far plate instead of cutting across them (no visible seam under parallax).
ramp = np.clip((rows - (cols[None, :] - 50)) / 80.0, 0, 1)
save_rgba(clean, (ramp * 255).astype(np.uint8), f'{base}/mid.png', crop=False)
sky.save(f'{base}/far.png', optimize=True)
out['valley.wide'] = world_rect_of_wide(plate, clean, a)

# ---------------------------------------------------------------- café
plate = load('cafe-plate-a.png')
clean = load('cafe-clean-wide.png')
city = load('cafe-city-view.png')
a = ALIGN['cafe']
base = f'{LIB}/assets/env/cafe-golden-hour/v001'
H, W = plate.size[1], plate.size[0]

d = diff(plate, plate_to_wide(plate, clean, a))
yy, xx = np.mgrid[0:H, 0:W]
prior = (xx < W * 0.45) & (yy > H * 0.35)
lum = arr(plate).mean(axis=2)
fg = edge_components(big_regions(d, prior) & (lum < 110), ['left', 'bottom'])
fg = ndimage.binary_fill_holes(fg)
fg = tidy(ndimage.binary_dilation(fg, iterations=2) & (lum < 125))
box = save_rgba(plate, feather(fg, 1.5), f'{base}/fg-leaves.png')
out['cafe.fg-leaves'] = world_rect_of_crop(plate, box)

# Room: the clean plate with the window glass made transparent (cool, bright, cyan pixels).
c = arr(clean)
r, g, b = c[..., 0], c[..., 1], c[..., 2]
glass = (b > 140) & (g > r + 8) & (b > r)
lab, n = ndimage.label(ndimage.binary_opening(glass, iterations=2))
sizes = ndimage.sum(glass, lab, range(1, n + 1))
glass = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 4000])
glass = ndimage.binary_fill_holes(ndimage.binary_closing(glass, iterations=3))
alpha = 255 - feather(glass, 1.2)
save_rgba(clean, alpha, f'{base}/room.png', crop=False)
city.save(f'{base}/city.png', optimize=True)
out['cafe.wide'] = world_rect_of_wide(plate, clean, a)

print(json.dumps(out, indent=1))
