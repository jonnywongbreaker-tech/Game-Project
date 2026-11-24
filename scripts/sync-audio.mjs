/**
 * Measures every audio file in public/ with ffprobe and writes
 * src/generated/audio-durations.json, which the compiler uses so beats
 * line up exactly with the voice-over. Run after adding or replacing audio.
 */
import {execFileSync} from 'node:child_process';
import {readdirSync, statSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';

const AUDIO = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : AUDIO.test(f) ? [p] : [];
  });

const out = {};
for (const file of walk('public').sort()) {
  const secs = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim();
  out[relative('public', file).split('\\').join('/')] = Math.round(parseFloat(secs) * 1000) / 1000;
}
writeFileSync('src/generated/audio-durations.json', JSON.stringify(out, null, 2) + '\n');
console.log(`Measured ${Object.keys(out).length} audio file(s) → src/generated/audio-durations.json`);
