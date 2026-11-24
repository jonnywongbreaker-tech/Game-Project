import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {readEpisode} from './lib/production-plan';

const episodeFile = resolve('examples/pilot/episode.json');
const scratch = mkdtempSync(join(tmpdir(), 'toon-pilot-'));
try {
  for (const shot of readEpisode(episodeFile).shots) {
    if (!shot.voice) continue;
    const output = resolve(dirname(episodeFile), shot.voice.file);
    mkdirSync(dirname(output), {recursive: true});
    const text = join(scratch, 'line.txt');
    writeFileSync(text, shot.voice.text);
    const input = process.platform === 'darwin'
      ? ['-i', join(scratch, 'line.aiff')]
      : ['-f', 'lavfi', '-i', 'flite=textfile=line.txt:voice=slt'];
    if (process.platform === 'darwin') {
      execFileSync('say', ['-r', '166', '-f', text, '-o', input[1]], {stdio: 'inherit'});
    }
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...input, '-ar', '48000', '-ac', '1', output],
      {cwd: scratch, stdio: 'inherit'});
  }
} finally {
  rmSync(scratch, {recursive: true, force: true});
}
