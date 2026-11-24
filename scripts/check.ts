/**
 * Compiles every JSON episode, runs quality control, and reports problems before you render.
 *   npm run check            all episodes
 *   npm run check -- Ep002   one episode
 *   npm run check -- --json  machine-readable output (for CI / other agents)
 * Exits non-zero if any episode has errors. Warnings never block.
 */
import {existsSync, realpathSync, statSync} from 'node:fs';
import {resolve, relative, isAbsolute} from 'node:path';
import {SCRIPTS} from '../src/episodes/scripts';
import audioDurations from '../src/generated/audio-durations.json';
import {analyzeEpisode} from '../src/qc/analyze';
import {compileScript} from '../src/script/compile';

const args = process.argv.slice(2);
const json = args.includes('--json');
// The render wrapper has already verified code-defined composition IDs.
const allowCode = args.includes('--allow-code');
const only = args.filter((a) => !a.startsWith('--'));
let errors = 0;
let warnings = 0;
const out: unknown[] = [];
for (const id of only) {
  if (allowCode || SCRIPTS.some(script => script?.id === id)) continue;
  const issue = {level: 'error', where: 'episode', message: `Unknown episode "${id}".`};
  errors++;
  if (json) out.push({id, issues: [issue]});
  else console.error(issue.message);
}

for (const script of SCRIPTS) {
  if (only.length && !only.includes(script?.id)) continue;
  const ep = compileScript(script, audioDurations);
  const assets = [ep.music?.src, ...ep.lines.map((l) => l.audio), ...ep.sfx.map((s) => s.src)].filter(Boolean) as string[];
  for (const a of assets) {
    const root = realpathSync('public');
    const file = resolve(root, a);
    const inside = (p: string) => {
      const path = relative(root, p);
      return path !== '..' && !path.startsWith('../') && !isAbsolute(path);
    };
    if (isAbsolute(a) || !inside(file) || !existsSync(file) || !inside(realpathSync(file)) || !statSync(file).isFile()) {
      ep.issues.push({level: 'error', where: 'assets', message: `Expected a local file inside public/: "${a}".`});
    }
  }
  const beats = ep.issues.some(issue => issue.level === 'error')
    ? undefined : script.scenes.reduce((n, scene) => n + scene.beats.length, 0);
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
