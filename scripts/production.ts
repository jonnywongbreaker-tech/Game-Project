import {writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {assemble, exportShot, publish, ShotRenderer} from './lib/production-media';
import {planEpisode, readEpisode, subtitles} from './lib/production-plan';

const usage = `Usage
  npm run production -- check <episode.json>
  npm run production -- preview <episode.json> <shot-id> [--frame N]
  npm run production -- render <episode.json> <shot-id> [--force] [--concurrency N]
  npm run production -- assemble <episode.json> [--concurrency N]
  npm run production -- srt <episode.json>
File-producing commands accept --out <directory> (default out/production/<episode-id>).`;

function integer(text: string, flag: string, min: number, max: number) {
  const value = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${flag}: expected an integer between ${min} and ${max}.`);
  }
  return value;
}

async function main() {
  const {positionals, values} = parseArgs({allowPositionals: true, options: {
    out: {type: 'string'}, frame: {type: 'string'}, force: {type: 'boolean'},
    concurrency: {type: 'string'}, help: {type: 'boolean'},
  }});
  if (values.help) return console.log(usage);
  const [command, path, shotId] = positionals;
  const singleShot = command === 'preview' || command === 'render';
  if (!path || !['check', 'preview', 'render', 'assemble', 'srt'].includes(command)
      || positionals.length !== (singleShot ? 3 : 2)) throw new Error(usage);
  if ((values.frame !== undefined && command !== 'preview') || (values.force && command !== 'render')
      || (values.concurrency !== undefined && command !== 'render' && command !== 'assemble')
      || (values.out !== undefined && command === 'check')) throw new Error(usage);
  const file = resolve(path);
  const episode = readEpisode(file);
  const selected = episode.shots.find(candidate => candidate.id === shotId);
  if (singleShot && !selected) throw new Error(`Unknown shot "${shotId}" in episode "${episode.id}".`);
  const plan = planEpisode(file, selected ? {...episode, shots: [selected]} : episode);
  const shot = selected ? plan.shots[0] : undefined;
  const manifest = JSON.stringify(plan, null, 2) + '\n';
  if (command === 'check') return process.stdout.write(manifest);

  const output = resolve(values.out ?? join('out', 'production', plan.id));
  const srt = join(output, plan.id + '.srt');
  const writeSrt = () => publish(srt, temp => writeFileSync(temp, subtitles(plan)));
  if (command === 'srt') {
    await writeSrt();
    return console.log(srt);
  }

  const concurrency = integer(values.concurrency ?? '2', '--concurrency', 1, 32);
  const frame = values.frame === undefined ? Math.floor((shot?.visual.frames ?? 1) / 2)
    : integer(values.frame, '--frame', 0, shot!.visual.frames - 1);
  const renderer = await ShotRenderer.create();
  try {
    const cache = join(output, '.cache');
    if (command === 'preview' && shot) {
      const preview = join(output, 'shots', `${shot.id}-${frame}.png`);
      await renderer.preview(shot, frame, preview);
      return console.log(preview);
    }
    if (command === 'render' && shot) {
      const shotFile = join(output, 'shots', shot.id + '.mp4');
      const video = await renderer.video(shot, cache, values.force, concurrency);
      await exportShot(video, shot, file, shotFile);
      return console.log(shotFile);
    }
    const videos: string[] = [];
    for (const item of plan.shots) videos.push(await renderer.video(item, cache, false, concurrency));
    const movie = join(output, plan.id + '.mp4');
    await assemble(plan, file, videos, movie);
    await writeSrt();
    await publish(join(output, plan.id + '.json'), temp => writeFileSync(temp, manifest));
    console.log(movie);
  } finally {
    await renderer.close();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
