/**
 * Compiles every JSON episode, runs quality control, and reports problems before you render.
 *   npm run check            all episodes
 *   npm run check -- Ep002   one episode
 *   npm run check -- --json  machine-readable output (for CI / other agents)
 * Exits non-zero if any episode has errors. Warnings never block.
 */
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {SCRIPTS} from '../src/episodes/scripts';
import audioDurations from '../src/generated/audio-durations.json';
import {analyzeEpisode} from '../src/qc/analyze';
import {compileScript} from '../src/script/compile';

const args = process.argv.slice(2);
const json = args.includes('--json');
const only = args.filter((a) => !a.startsWith('--'));
let errors = 0;
let warnings = 0;
const out: unknown[] = [];

for (const script of SCRIPTS) {
  if (only.length && !only.includes(script.id)) continue;
  const ep = compileScript(script, audioDurations);
  const assets = [ep.music?.src, ...ep.lines.map((l) => l.audio), ...ep.sfx.map((s) => s.src)].filter(Boolean) as string[];
  for (const a of assets) {
    if (!existsSync(join('public', a))) ep.issues.push({level: 'error', where: 'assets', message: `Missing file public/${a}`});
  }
  const beats = script.scenes.reduce((n, s) => n + s.beats.length, 0);
  const qc = analyzeEpisode(ep, {beats});
  const issues = [...ep.issues, ...qc.issues];
  const e = issues.filter((i) => i.level === 'error');
  errors += e.length;
  warnings += issues.length - e.length;
  out.push({id: ep.id, title: ep.title, issues, metrics: qc.metrics});
  if (json) continue;

  const m = qc.metrics;
  console.log(`\n${e.length ? '✗' : '✓'} ${ep.id} "${ep.title}"`);
  console.log(
    `  ${m.duration.toFixed(1)}s · ${m.scenes} scenes · ${m.wordsPerMin.toFixed(0)} words/min · ` +
      `${m.visualEventsPerMin.toFixed(1)} visual changes/min · longest static ${m.longestStaticShot.toFixed(1)}s · ` +
      `${(m.speechCoverage * 100).toFixed(0)}% speech · ${m.distinctPoses} poses · ${m.beatsPerMin.toFixed(1)} beats/min authored`,
  );
  for (const i of issues) console.log(`  ${i.level === 'error' ? 'ERROR' : 'warn '} ${i.where}: ${i.message}`);
}

if (json) console.log(JSON.stringify(out, null, 2));
else console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
