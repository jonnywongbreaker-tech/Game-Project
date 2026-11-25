import {execFileSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, extname, join, resolve} from 'node:path';
import {audioDigest} from './lib/production-alignment';
import {publish} from './lib/production-media';
import {readEpisode} from './lib/production-plan';

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error('Usage: npm run production:voice -- [episode.json]');
  const episodeFile = resolve(args[0] ?? 'examples/pilot/episode.json');
  const scratch = mkdtempSync(join(tmpdir(), 'toon-voice-'));
  try {
    for (const shot of readEpisode(episodeFile).shots) {
      if (!shot.voice) continue;
      const output = resolve(dirname(episodeFile), shot.voice.file);
      if (extname(output).toLowerCase() !== '.wav') throw new Error(`Shot "${shot.id}": synthesis requires a .wav destination.`);
      const text = join(scratch, 'line.txt');
      writeFileSync(text, shot.voice.text);
      let words: unknown;
      let input: string;
      if (process.platform === 'darwin') {
        input = join(scratch, 'line.aiff');
        execFileSync('say', ['-r', '166', '-f', text, '-o', input], {stdio: 'inherit'});
      } else {
        input = join(scratch, 'line.wav');
        try {
          words = JSON.parse(execFileSync('python3', ['scripts/flite-voice.py', text, input], {encoding: 'utf8'}));
        } catch (error) {
          throw new Error(`Shot "${shot.id}": require Python 3 and libflite with the SLT voice, and use English words spelled out for synthesis. ${(error as Error).message}`);
        }
      }
      await publish(output, temp => execFileSync('ffmpeg', [
        '-v', 'error', '-y', '-i', input, '-ar', '48000', '-ac', '1', temp,
      ], {stdio: 'inherit'}));
      const sidecar = output + '.timing.json';
      if (words) {
        await publish(sidecar, temp => writeFileSync(temp, JSON.stringify({
          version: 1, source: 'flite-slt', audioSha256: audioDigest(output), transcript: shot.voice!.text, words,
        }, null, 2) + '\n'));
      } else {
        rmSync(sidecar, {force: true});
      }
    }
  } finally {
    rmSync(scratch, {recursive: true, force: true});
  }
}

main().catch(error => {
  console.error((error as Error).message);
  process.exitCode = 1;
});
