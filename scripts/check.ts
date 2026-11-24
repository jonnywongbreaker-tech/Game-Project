/**
 * Compiles every JSON episode and reports problems before you render.
 *   npm run check            all episodes
 *   npm run check -- Ep002   one episode
 * Exits non-zero if any episode has errors.
 */
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {SCRIPTS} from '../src/episodes/scripts';
import audioDurations from '../src/generated/audio-durations.json';
import {compileScript} from '../src/script/compile';

const only = process.argv.slice(2);
let errors = 0;
let warnings = 0;

for (const script of SCRIPTS) {
  if (only.length && !only.includes(script.id)) continue;
  const ep = compileScript(script, audioDurations);
  const assets = [ep.music?.src, ...ep.lines.map((l) => l.audio), ...ep.sfx.map((s) => s.src)].filter(Boolean) as string[];
  for (const a of assets) {
    if (!existsSync(join('public', a))) ep.issues.push({level: 'error', where: 'assets', message: `Missing file public/${a}`});
  }
  const e = ep.issues.filter((i) => i.level === 'error');
  const w = ep.issues.filter((i) => i.level === 'warning');
  errors += e.length;
  warnings += w.length;
  const words = ep.lines.reduce((n, l) => n + l.words.length, 0);
  console.log(
    `\n${e.length ? '✗' : '✓'} ${ep.id} "${ep.title}" — ${ep.duration.toFixed(1)}s, ${ep.scenes.length} scenes, ${ep.lines.length} lines, ${words} words`,
  );
  for (const i of ep.issues) console.log(`  ${i.level === 'error' ? 'ERROR' : 'warn '} ${i.where}: ${i.message}`);
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
