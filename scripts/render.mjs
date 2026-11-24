/**
 * Renders episodes to out/.
 *   npm run render                    everything
 *   npm run render -- Ep001           one episode: long video, Short and thumbnail
 *   npm run render -- Ep001 --short   only the Short (also --long, --thumb)
 * Renders run one at a time (parallel renders compete for the same browser and cache).
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
const kinds = ['long', 'short', 'thumb'].filter((k) => args.includes(`--${k}`));
const wanted = kinds.length ? kinds : ['long', 'short', 'thumb'];

const check = spawnSync('npx', ['tsx', 'scripts/check.ts', ...ids], {stdio: 'inherit'});
if (check.status !== 0) {
  console.error('\nFix the errors above before rendering.');
  process.exit(1);
}

const all = execFileSync('npx', ['remotion', 'compositions', '--quiet'], {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim().split('\n').pop().trim().split(/\s+/);
const targets = all.filter((c) => {
  const [id, kind] = [c.slice(0, c.lastIndexOf('-')), c.slice(c.lastIndexOf('-') + 1).toLowerCase()];
  return (!ids.length || ids.includes(id)) && wanted.includes(kind);
});
if (!targets.length) {
  console.error(`Nothing to render. Available: ${all.join(', ')}`);
  process.exit(1);
}

mkdirSync('out', {recursive: true});
for (const c of targets) {
  const isThumb = c.endsWith('-Thumb');
  const file = `out/${c}.${isThumb ? 'png' : 'mp4'}`;
  console.log(`\n▶ ${c} → ${file}`);
  const r = spawnSync('npx', ['remotion', isThumb ? 'still' : 'render', c, file], {stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('\nDone. Files are in out/.');
