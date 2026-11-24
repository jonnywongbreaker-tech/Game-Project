/**
 * Visual regression: renders key frames and compares them with approved "golden" images.
 *   npm run test:visual             compare against goldens (fails on visible change)
 *   npm run test:visual -- --update approve the current look as the new goldens
 * Goldens are stored per platform (font rasterisation differs slightly between macOS and Linux).
 * Also verifies determinism: the same frame rendered twice must be pixel-identical.
 */
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {renderStill} from '@remotion/renderer';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {browserExecutable, bundleProject, getComposition} from './lib/remotion';

const FRAMES: [string, number][] = [
  ['RigTest-Long', 0],
  ['RigTest-Long', 50],
  ['Ep001-Long', 200],
  ['Ep001-Short', 330],
  ['Ep001-Thumb', 0],
  ['Ep002-Long', 560],
  ['Memory-A-Geometric-Long', 120],
  ['Memory-A-Geometric-Long', 245],
  ['Memory-B-Textured-Long', 245],
  ['Memory-C-Cinematic-Long', 245],
  ['Memory-C-Cinematic-Long', 390],
  ['Memory-v3-CinematicGeometric-Long', 75],
  ['Memory-v3-CinematicGeometric-Long', 190],
  ['Memory-v3-CinematicGeometric-Long', 405],
];
const SCALE = 0.5;
/** Fraction of pixels allowed to differ before a frame counts as changed. */
const TOLERANCE = 0.002;

const update = process.argv.includes('--update');
const goldenDir = join('tests', 'golden', `${process.platform}-${process.arch}`);
const outDir = join('out', 'visual');
mkdirSync(goldenDir, {recursive: true});
mkdirSync(outDir, {recursive: true});

async function main() {
  const serveUrl = await bundleProject();
  const render = async (id: string, frame: number, file: string) => {
    const composition = await getComposition(serveUrl, id);
    await renderStill({serveUrl, composition, frame, output: file, scale: SCALE, browserExecutable, logLevel: 'error', overwrite: true});
  };
  const diff = (a: string, b: string, diffFile?: string) => {
    const A = PNG.sync.read(readFileSync(a));
    const B = PNG.sync.read(readFileSync(b));
    if (A.width !== B.width || A.height !== B.height) return 1;
    const out = new PNG({width: A.width, height: A.height});
    const n = pixelmatch(A.data, B.data, out.data, A.width, A.height, {threshold: 0.1});
    if (diffFile && n) writeFileSync(diffFile, PNG.sync.write(out));
    return n / (A.width * A.height);
  };

  let failed = 0;
  for (const [id, frame] of FRAMES) {
    const name = `${id}@${frame}.png`;
    const actual = join(outDir, name);
    const golden = join(goldenDir, name);
    await render(id, frame, actual);
    if (update || !existsSync(golden)) {
      copyFileSync(actual, golden);
      console.log(`  saved   ${name}`);
      continue;
    }
    const d = diff(actual, golden, join(outDir, `DIFF-${name}`));
    const ok = d <= TOLERANCE;
    if (!ok) failed++;
    console.log(`  ${ok ? 'ok     ' : 'CHANGED'} ${name}  ${(d * 100).toFixed(3)}% pixels differ`);
  }

  // Determinism: identical input must give identical pixels.
  const [did, dframe] = ['Memory-B-Textured-Long', 100];
  await render(did, dframe, join(outDir, 'det-1.png'));
  await render(did, dframe, join(outDir, 'det-2.png'));
  const det = diff(join(outDir, 'det-1.png'), join(outDir, 'det-2.png'));
  console.log(`  ${det === 0 ? 'ok     ' : 'FAILED '} determinism (${did}@${dframe} rendered twice)`);
  if (det !== 0) failed++;

  if (failed) {
    console.log(`\n${failed} visual check(s) failed. Diff images are in ${outDir}/. If the change is intended: npm run test:visual -- --update`);
    process.exit(1);
  }
  console.log(update ? '\nGoldens updated.' : '\nAll visual checks passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
