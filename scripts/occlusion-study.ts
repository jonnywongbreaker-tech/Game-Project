/**
 * Compares painter's ordering strategies against the ray-cast reference on the
 * representative occlusion cases (PROJECT.md ADR 8).
 *   npx tsx scripts/occlusion-study.ts [--grid=96x54] [--json]
 */
import {DEPTH_METHODS, order, prepare, type DepthMethod} from '../src/kit/depth';
import {compareOrder, sampleGrid} from '../src/kit/occlusion';
import {CASES} from '../tests/fixtures/occlusion-cases';

const grid = (process.argv.find((a) => a.startsWith('--grid='))?.split('=')[1] ?? '96x54').split('x').map(Number);
const ratio = Number(process.argv.find((a) => a.startsWith('--ratio='))?.split('=')[1] ?? 0.35);
const only = process.argv.find((a) => a.startsWith('--methods='))?.split('=')[1]?.split(',') as DepthMethod[] | undefined;
const METHODS = only ?? DEPTH_METHODS;
const rows: {case: string; method: DepthMethod; errorRate: number; worstFrame: number; msPerFrame: number; items: number}[] = [];

for (const build of CASES) {
  const c = build();
  for (const method of METHODS) {
    let errors = 0, covered = 0, worst = 0, ms = 0, items = 0;
    for (const f of c.frames) {
      const t0 = performance.now();
      const prepared = prepare(f.view, f.polys, f.sprites, method, {polyObject: (i) => f.objects[i], pieceRatio: ratio});
      const ordered = order(prepared, method, f.view, {pieceRatio: ratio});
      ms += performance.now() - t0;
      items += ordered.length;
      const r = compareOrder(f.view, prepared, ordered, sampleGrid(f.view, grid[0], grid[1]));
      errors += r.errors;
      covered += r.covered;
      worst = Math.max(worst, r.rate);
    }
    rows.push({case: c.name, method, errorRate: errors / Math.max(1, covered), worstFrame: worst, msPerFrame: ms / c.frames.length, items: Math.round(items / c.frames.length)});
  }
}

if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
else {
  const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
  console.log(`| Case | ${METHODS.join(' | ')} |`);
  console.log(`| --- | ${METHODS.map(() => '---').join(' | ')} |`);
  for (const name of [...new Set(rows.map((r) => r.case))]) {
    const cells = METHODS.map((m) => {
      const r = rows.find((x) => x.case === name && x.method === m)!;
      return `${pct(r.errorRate)} (worst ${pct(r.worstFrame)}, ${r.msPerFrame.toFixed(1)} ms, ${r.items} items)`;
    });
    console.log(`| ${name} | ${cells.join(' | ')} |`);
  }
}
