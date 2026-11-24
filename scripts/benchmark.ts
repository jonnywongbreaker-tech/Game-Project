/**
 * Benchmark suite: measures the five PROJECT.md benchmarks where they can be measured.
 *   npm run benchmark                         default set
 *   npm run benchmark -- Ep001-Long           specific compositions
 *   npm run benchmark -- --concurrency=8      tune parallel frames (try your core count)
 * Writes benchmarks/results.json (history) and benchmarks/LATEST.md.
 * Rendered files go to out/bench/.
 */
import {appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import {renderMedia} from '@remotion/renderer';
import {CAST_PRESETS} from '../src/engine/designs';
import {BACKDROPS, EXPRESSIONS, POSES} from '../src/engine/vocab';
import {SCRIPTS} from '../src/episodes/scripts';
import audioDurations from '../src/generated/audio-durations.json';
import {analyzeEpisode} from '../src/qc/analyze';
import {compileScript} from '../src/script/compile';
import {browserExecutable, bundleProject, getComposition, memoryMonitor} from './lib/remotion';

const DEFAULT = ['Ep001-Long', 'Ep001-Short', 'Memory-A-Geometric-Long', 'Memory-B-Textured-Long', 'Memory-C-Cinematic-Long'];
const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
const concArg = args.find((a) => a.startsWith('--concurrency='));
const concurrency = concArg ? Number(concArg.split('=')[1]) : null;

async function main() {
  mkdirSync('out/bench', {recursive: true});
  const machine = {
    platform: `${os.platform()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? 'unknown',
    cores: os.cpus().length,
    memoryGB: +(os.totalmem() / 1e9).toFixed(1),
    node: process.version,
  };
  console.log(`Machine: ${machine.cpu} · ${machine.cores} cores · ${machine.memoryGB} GB`);

  const t0 = Date.now();
  const serveUrl = await bundleProject();
  const bundleSeconds = (Date.now() - t0) / 1000;

  const renders = [];
  for (const id of ids.length ? ids : DEFAULT) {
    const composition = await getComposition(serveUrl, id);
    const videoSeconds = composition.durationInFrames / composition.fps;
    const mem = memoryMonitor();
    const start = Date.now();
    await renderMedia({
      serveUrl, composition, codec: 'h264', crf: 18, imageFormat: 'jpeg',
      outputLocation: `out/bench/${id}.mp4`, browserExecutable, logLevel: 'error', overwrite: true,
      ...(concurrency ? {concurrency} : {}),
    });
    const seconds = (Date.now() - start) / 1000;
    const peak = mem.stop();
    const r = {
      id, resolution: `${composition.width}x${composition.height}`, frames: composition.durationInFrames, videoSeconds,
      renderSeconds: +seconds.toFixed(1),
      fps: +(composition.durationInFrames / seconds).toFixed(1),
      /** Render time per second of video. 1.0 = real time. */
      realtimeFactor: +(seconds / videoSeconds).toFixed(2),
      tenMinuteVideoMinutes: +((seconds / videoSeconds) * 10).toFixed(1),
      peakMemoryMB: Math.round(peak / 1e6),
    };
    renders.push(r);
    console.log(`  ${id.padEnd(24)} ${r.renderSeconds}s for ${videoSeconds}s · ${r.fps} fps · ${r.realtimeFactor}× real time · 10-min video ≈ ${r.tenMinuteVideoMinutes} min · peak ${r.peakMemoryMB} MB`);
  }

  const versatility = {
    castPresets: Object.keys(CAST_PRESETS).length, poses: POSES.length, expressions: EXPRESSIONS.length,
    backdrops: BACKDROPS.length, captionStyles: 3, visualStyles: 3,
    /** Distinct single-character states (pose × expression) available without new art. */
    characterStates: POSES.length * EXPRESSIONS.length,
  };
  const automation = SCRIPTS.map((s) => {
    const ep = compileScript(s, audioDurations);
    const beats = s.scenes.reduce((n, sc) => n + sc.beats.length, 0);
    const q = analyzeEpisode(ep, {beats});
    return {
      id: s.id,
      beatsPerMinute: +q.metrics.beatsPerMin.toFixed(1),
      scriptBytesPerMinute: Math.round(JSON.stringify(s).length / (ep.duration / 60)),
      qcWarnings: q.issues.length + ep.issues.length,
      manualSteps: 'write script → npm run check → npm run render',
    };
  });

  const result = {date: new Date().toISOString(), machine, bundleSeconds: +bundleSeconds.toFixed(1), concurrency: concurrency ?? 'default', renders, versatility, automation};
  const histFile = 'benchmarks/results.json';
  const hist = existsSync(histFile) ? JSON.parse(readFileSync(histFile, 'utf8')) : [];
  hist.push(result);
  writeFileSync(histFile, JSON.stringify(hist, null, 2) + '\n');

  const md = [
    `# Latest benchmark`,
    ``,
    `${result.date.slice(0, 16).replace('T', ' ')} UTC · ${machine.cpu} · ${machine.cores} cores · ${machine.memoryGB} GB · ${machine.platform} · concurrency ${result.concurrency}`,
    ``,
    `| Composition | Resolution | Video | Render | FPS | × real time | 10-min video | Peak memory |`,
    `| --- | --- | --- | --- | --- | --- | --- | --- |`,
    ...renders.map((r) => `| ${r.id} | ${r.resolution} | ${r.videoSeconds.toFixed(1)}s | ${r.renderSeconds}s | ${r.fps} | ${r.realtimeFactor} | ${r.tenMinuteVideoMinutes} min | ${r.peakMemoryMB} MB |`),
    ``,
    `Bundle (one-off per render session): ${result.bundleSeconds}s.`,
    ``,
    `**Versatility:** ${Object.entries(versatility).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
    ``,
    `**Manual intervention:** ${automation.map((a) => `${a.id}: ${a.beatsPerMinute} authored beats/min, ${a.scriptBytesPerMinute} bytes of script/min, ${a.qcWarnings} QC warnings`).join('; ')}. ` +
      `Steps per video: ${automation[0]?.manualSteps}.`,
    ``,
    `**Visual quality:** not machine-scored. Judged by eye against the style benchmarks and protected by \`npm run test:visual\`.`,
    ``,
  ].join('\n');
  writeFileSync('benchmarks/LATEST.md', md);
  appendFileSync('benchmarks/.gitkeep', '');
  console.log('\nWrote benchmarks/LATEST.md and benchmarks/results.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
