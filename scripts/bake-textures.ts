/**
 * Bakes procedural textures to small tileable PNGs once, so renders don't
 * regenerate noise every frame (an SVG feTurbulence over a 1080p frame costs
 * ~50 ms/frame). Deterministic: same seed → same files.
 *   npm run bake-textures
 */
import {mkdirSync, writeFileSync} from 'node:fs';
import {PNG} from 'pngjs';

const SIZE = 512;
let s = 1234567;
const rand = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

mkdirSync('public/textures', {recursive: true});

// Film/paper grain: 4 variants, cycled every other frame for a living texture.
for (let v = 0; v < 4; v++) {
  const png = new PNG({width: SIZE, height: SIZE});
  for (let i = 0; i < SIZE * SIZE; i++) {
    png.data[i * 4] = 92;
    png.data[i * 4 + 1] = 78;
    png.data[i * 4 + 2] = 60;
    png.data[i * 4 + 3] = Math.floor(Math.pow(rand(), 2.2) * 150);
  }
  writeFileSync(`public/textures/grain-${v}.png`, PNG.sync.write(png));
}

// Paper fibres: horizontally stretched value noise, tileable (wraps at the edges).
const G = 32;
const grid = Array.from({length: G * G}, rand);
const at = (x: number, y: number) => grid[((y + G) % G) * G + ((x + G) % G)];
const smooth = (t: number) => t * t * (3 - 2 * t);
const png = new PNG({width: SIZE, height: SIZE});
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let v = 0;
    let amp = 0.6;
    for (const [fx, fy] of [[2, 16], [4, 32], [8, 32]]) {
      const gx = (x / SIZE) * fx;
      const gy = (y / SIZE) * fy;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const tx = smooth(gx - x0);
      const ty = smooth(gy - y0);
      const m = (G / fx) | 0;
      const n = (G / fy) | 0;
      const a = at((x0 % fx) * m, (y0 % fy) * n);
      const b = at(((x0 + 1) % fx) * m, (y0 % fy) * n);
      const c = at((x0 % fx) * m, ((y0 + 1) % fy) * n);
      const d = at(((x0 + 1) % fx) * m, ((y0 + 1) % fy) * n);
      v += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
      amp *= 0.5;
    }
    const i = (y * SIZE + x) * 4;
    png.data[i] = 120;
    png.data[i + 1] = 96;
    png.data[i + 2] = 64;
    png.data[i + 3] = Math.floor(Math.max(0, v - 0.45) * 160);
  }
}
writeFileSync('public/textures/fibre.png', PNG.sync.write(png));
console.log('Baked public/textures/grain-0..3.png and fibre.png');
