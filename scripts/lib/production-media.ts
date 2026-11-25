import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  createReadStream, createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  renameSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {bundle} from '@remotion/bundler';
import {ensureBrowser, openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {FPS, HEIGHT, SAMPLE_RATE, WIDTH, type RenderProps} from '../../src/production/types';
import {browserExecutable} from './remotion';
import {capabilities} from './production-capabilities';
import type {EpisodePlan} from './production-plan';

type PlannedShot = EpisodePlan['shots'][number];
const samplesPerFrame = SAMPLE_RATE / FPS;

function ffmpeg(...args: string[]) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', ...args], {stdio: 'inherit'});
}

export async function publish(file: string, write: (temp: string) => Promise<unknown> | unknown) {
  mkdirSync(dirname(file), {recursive: true});
  const scratch = mkdtempSync(join(dirname(file), '.write-'));
  const temp = join(scratch, file.split('/').pop()!);
  try {
    await write(temp);
    renameSync(temp, file);
  } finally {
    rmSync(scratch, {recursive: true, force: true});
  }
}

function digest(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex');
}

function rendererFingerprint(chrome: string) {
  const hash = createHash('sha256');
  hash.update(JSON.stringify([process.platform, process.arch, chrome,
    execFileSync(chrome, ['--version'], {encoding: 'utf8'}).trim()]));
  const add = (path: string) => hash.update(JSON.stringify([path, digest(readFileSync(path))]));
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else add(path);
    }
  };
  walk('src');
  walk('public/fonts');
  walk('public/textures');
  add('package-lock.json');
  add('scripts/lib/production-media.ts');
  return hash.digest('hex');
}

function validPicture(file: string, frames: number) {
  if (!existsSync(file)) return false;
  try {
    const metadata = execFileSync('ffprobe', ['-v', 'error', '-protocol_whitelist', 'file,pipe',
      '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_frames', '-of', 'json', file],
    {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
    const [stream, extra] = JSON.parse(metadata).streams;
    return !extra && stream.codec_name === 'h264' && stream.width === WIDTH && stream.height === HEIGHT
      && stream.r_frame_rate === `${FPS}/1` && Number(stream.nb_frames) === frames;
  } catch {
    return false;
  }
}

export class ShotRenderer {
  private scratch?: string;
  private serveUrl?: string;
  private browser?: Awaited<ReturnType<typeof openBrowser>>;
  private constructor(private readonly chrome: string, private readonly fingerprint: string) {}

  static async create() {
    const configured = browserExecutable ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
    const status = await ensureBrowser({browserExecutable: configured, logLevel: 'error'});
    if (!('path' in status)) throw new Error('Chrome unavailable. Set REMOTION_BROWSER_EXECUTABLE to a local browser.');
    return new ShotRenderer(status.path, rendererFingerprint(status.path));
  }

  private async composition(inputProps: RenderProps) {
    if (!this.serveUrl) {
      this.scratch = mkdtempSync(join(tmpdir(), 'toon-remotion-'));
      const publicDir = join(this.scratch, 'public');
      mkdirSync(publicDir);
      for (const dir of ['fonts', 'textures']) symlinkSync(resolve('public', dir), join(publicDir, dir), 'dir');
      this.serveUrl = await bundle({
        entryPoint: resolve('src/production/index.tsx'), publicDir,
        outDir: join(this.scratch, 'bundle'), onProgress: () => undefined,
      });
      this.browser = await openBrowser('chrome', {browserExecutable: this.chrome, logLevel: 'error'});
    }
    const shared = {serveUrl: this.serveUrl, inputProps, puppeteerInstance: this.browser, logLevel: 'error' as const};
    const composition = await selectComposition({...shared, id: 'ProductionShot'});
    return {...shared, composition};
  }

  async preview(shot: PlannedShot, frame: number, file: string, width: number) {
    const options = await this.composition(shot.visual);
    await publish(file, temp => renderStill({...options, frame, output: temp, scale: width / WIDTH}));
  }

  async video(shot: PlannedShot, cache: string, force = false, concurrency = 2) {
    const key = digest(JSON.stringify([this.fingerprint, shot.visual]));
    const file = join(cache, key + '.mp4');
    if (!force && validPicture(file, shot.visual.frames)) {
      console.error(`Cache hit ${shot.id}`);
      return file;
    }
    console.error(`Rendering ${shot.id} (${shot.visual.frames} frames)`);
    const options = await this.composition(shot.visual);
    await publish(file, temp => renderMedia({
      ...options, outputLocation: temp, codec: 'h264', crf: 18, imageFormat: 'jpeg',
      pixelFormat: 'yuv420p', muted: true, concurrency,
    }));
    return file;
  }

  async close() {
    try {
      await this.browser?.close({silent: true});
    } finally {
      if (this.scratch) rmSync(this.scratch, {recursive: true, force: true});
    }
  }
}

function shotPcm(shot: PlannedShot, episodeFile: string, output: string) {
  const input = shot.voice
    ? ['-protocol_whitelist', 'file,pipe', '-i', resolve(dirname(episodeFile), shot.voice.file)]
    : ['-f', 'lavfi', '-i', `anullsrc=r=${SAMPLE_RATE}:cl=mono`];
  const samples = shot.visual.frames * samplesPerFrame;
  const filter = `aresample=${SAMPLE_RATE},apad=whole_len=${samples},atrim=end_sample=${samples},asetpts=N/SR/TB`;
  ffmpeg(...input, '-map', '0:a:0', '-af', filter, '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 's16le', output);
}

function mix(videoInput: string[], pcm: string, output: string) {
  ffmpeg(...videoInput, '-f', 's16le', '-ar', String(SAMPLE_RATE), '-ac', '1', '-i', pcm,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', output);
}

export async function exportShot(video: string, shot: PlannedShot, episodeFile: string, output: string) {
  const scratch = mkdtempSync(join(tmpdir(), 'toon-shot-'));
  try {
    const pcm = join(scratch, 'voice.pcm');
    shotPcm(shot, episodeFile, pcm);
    await publish(output, temp => mix(['-i', video], pcm, temp));
  } finally {
    rmSync(scratch, {recursive: true, force: true});
  }
}

export async function assemble(plan: EpisodePlan, episodeFile: string, videos: string[], output: string) {
  const scratch = mkdtempSync(join(tmpdir(), 'toon-assembly-'));
  try {
    const list = join(scratch, 'shots.ffconcat');
    const audio = join(scratch, 'episode.pcm');
    const entries = ['ffconcat version 1.0'];
    plan.shots.forEach((shot, index) => {
      const name = `shot-${index}.mp4`;
      symlinkSync(resolve(videos[index]), join(scratch, name));
      const micros = (frames: number) => Math.round(frames * 1_000_000 / FPS);
      entries.push(`file ${name}`, `duration ${((micros(shot.endFrame) - micros(shot.startFrame)) / 1_000_000).toFixed(6)}`);
    });
    writeFileSync(list, entries.join('\n') + '\n');
    // Concatenate raw samples and encode once to avoid AAC priming at every cut.
    async function* audioChunks() {
      const pcm = join(scratch, 'shot.pcm');
      for (const shot of plan.shots) {
        shotPcm(shot, episodeFile, pcm);
        yield* createReadStream(pcm);
      }
    }
    await pipeline(audioChunks(), createWriteStream(audio));
    await publish(output, temp => mix(['-f', 'concat', '-safe', '1', '-i', list], audio, temp));
  } finally {
    rmSync(scratch, {recursive: true, force: true});
  }
}

export async function contactSheet(renderer: ShotRenderer, plan: EpisodePlan, output: string) {
  const {defaultWidth, contactRows, contactColumns} = capabilities.preview;
  const scratch = mkdtempSync(join(tmpdir(), 'toon-contact-'));
  const sheets: {file: string; cells: {id: string; frame: number; row: number; column: number}[]}[] = [];
  const pageSize = contactRows * contactColumns;
  try {
    for (let offset = 0; offset < plan.shots.length; offset += pageSize) {
      const shots = plan.shots.slice(offset, offset + pageSize);
      const cells = [];
      for (const [index, shot] of shots.entries()) {
        const frame = Math.floor(shot.visual.frames / 2);
        await renderer.preview(shot, frame, join(scratch, `thumb-${index}.png`), defaultWidth);
        cells.push({id: shot.id, frame, row: Math.floor(index / contactColumns) + 1, column: index % contactColumns + 1});
      }
      const sheet = `contact-${sheets.length + 1}.png`;
      const rows = Math.ceil(shots.length / contactColumns);
      await publish(join(output, sheet), temp => ffmpeg('-start_number', '0', '-i', join(scratch, 'thumb-%d.png'),
        '-vf', `tile=${contactColumns}x${rows}:nb_frames=${shots.length}:padding=4`, '-frames:v', '1', '-threads', '1', temp));
      for (const index of shots.keys()) rmSync(join(scratch, `thumb-${index}.png`));
      sheets.push({file: sheet, cells});
    }
    const index = join(output, 'contact.json');
    await publish(index, temp => writeFileSync(temp, JSON.stringify({episode: plan.id, sheets}, null, 2) + '\n'));
    return index;
  } finally {
    rmSync(scratch, {recursive: true, force: true});
  }
}
