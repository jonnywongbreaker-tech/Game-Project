import {writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {assemble, contactSheet, exportShot, publish, ShotRenderer} from './lib/production-media';
import {planEpisode, readEpisode, subtitles} from './lib/production-plan';
import {capabilities, commands} from './lib/production-capabilities';

const usage = ['Usage', ...Object.entries(commands).map(([name, spec]) =>
  `  npm run production -- ${name} ${spec.arguments} ${spec.flags.map(flag => `[--${flag}]`).join(' ')}`.trimEnd()),
'Run capabilities for flag descriptions and the episode format.'].join('\n');

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
    concurrency: {type: 'string'}, width: {type: 'string'}, 'require-alignment': {type: 'boolean'}, help: {type: 'boolean'},
  }});
  if (values.help) return console.log(usage);
  const [command, path, shotId] = positionals;
  if (!command || !Object.hasOwn(commands, command)) throw new Error(usage);
  const spec: {flags: string[]} = commands[command as keyof typeof commands];
  if (Object.keys(values).some(flag => !spec.flags.includes(flag))) throw new Error(usage);
  if (command === 'capabilities' && positionals.length === 1) return console.log(JSON.stringify(capabilities, null, 2));
  const singleShot = command === 'preview' || command === 'render';
  if (!path || command === 'capabilities' || positionals.length !== (singleShot ? 3 : 2)) throw new Error(usage);
  const file = resolve(path);
  const episode = readEpisode(file);
  const selected = episode.shots.find(candidate => candidate.id === shotId);
  if (singleShot && !selected) throw new Error(`Unknown shot "${shotId}" in episode "${episode.id}".`);
  const plan = planEpisode(file, selected ? {...episode, shots: [selected]} : episode);
  const shot = selected ? plan.shots[0] : undefined;
  const unaligned = plan.shots.filter(item => item.voice && !item.voice.alignment).map(item => item.id);
  if (unaligned.length && (values['require-alignment'] || command === 'srt' || command === 'assemble')) {
    const message = `Estimated subtitle timing for: ${unaligned.join(', ')}`;
    if (values['require-alignment']) throw new Error(message + '. A valid timing sidecar is required.');
    console.error(message);
  }
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
      const {defaultWidth, minWidth, maxWidth} = capabilities.preview;
      const width = integer(values.width ?? String(defaultWidth), '--width', minWidth, maxWidth);
      const preview = join(output, 'shots', `${shot.id}-${frame}.png`);
      await renderer.preview(shot, frame, preview, width);
      return console.log(preview);
    }
    if (command === 'contact') return console.log(await contactSheet(renderer, plan, output));
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
