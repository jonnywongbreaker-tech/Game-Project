import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {record} from '../../src/script/validate';

export type TimedWord = {text: string; start: number; end: number};
export type Alignment = {source: string; words: TimedWord[]};

export function audioDigest(file: string) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function loadAlignment(file: string, text: string, duration: number): Alignment | undefined {
  const sidecar = file + '.timing.json';
  let raw: string;
  try {
    raw = readFileSync(sidecar, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 1 || typeof value.source !== 'string' || !value.source.trim()) {
      throw new Error('expected version 1 and a timing source');
    }
    if (value.audioSha256 !== audioDigest(file) || value.transcript !== text) {
      throw new Error('audio or transcript has changed; regenerate the timing file');
    }
    const tokens = text.split(/\s+/);
    if (!Array.isArray(value.words) || value.words.length !== tokens.length) {
      throw new Error('expected one timing per transcript word');
    }
    let previous = 0;
    const words = value.words.map((word: unknown, index): TimedWord => {
      if (!record(word) || word.text !== tokens[index] || typeof word.start !== 'number' || typeof word.end !== 'number'
          || !Number.isFinite(word.start) || !Number.isFinite(word.end) || word.start < previous
          || word.end - word.start < 0.002 || word.end > duration) {
        throw new Error(`invalid timing for word ${index + 1} ("${tokens[index]}")`);
      }
      previous = word.end;
      return {text: tokens[index], start: word.start, end: word.end};
    });
    return {source: value.source, words};
  } catch (error) {
    throw new Error(`${sidecar}: ${(error as Error).message}`);
  }
}
