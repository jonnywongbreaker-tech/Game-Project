import {execFileSync} from 'node:child_process';
import {readFileSync, statSync} from 'node:fs';
import {dirname, isAbsolute, resolve} from 'node:path';
import {FPS, TEMPLATES, type EpisodeInput, type RenderProps, type ShotInput, type Template} from '../../src/production/types';
import {wordTimings} from '../../src/engine/speech';
import {record} from '../../src/script/validate';

type PlannedShot = {
  id: string;
  startFrame: number;
  endFrame: number;
  visual: RenderProps;
  voice?: {file: string; text: string; seconds: number};
};

export interface EpisodePlan {
  id: string;
  title: string;
  fps: number;
  totalFrames: number;
  shots: PlannedShot[];
}

function object(value: unknown, where: string, fields: string[]): Record<string, unknown> {
  if (!record(value)) throw new Error(`${where}: expected an object.`);
  for (const key of Object.keys(value)) {
    if (!fields.includes(key)) throw new Error(`${where}.${key}: unknown field.`);
  }
  return value;
}

function line(value: unknown, where: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\r\n\u0000]/.test(value)) {
    throw new Error(`${where}: expected a nonempty single line of at most ${max} characters.`);
  }
  return value.trim();
}

function id(value: unknown, where: string): string {
  const result = line(value, where, 64);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(result)) {
    throw new Error(`${where}: use letters, digits and dashes, beginning with a letter or digit.`);
  }
  return result;
}

function seconds(value: unknown, where: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${where}: expected a duration from ${min} to ${max} seconds.`);
  }
  return value;
}

function parseShot(value: unknown, index: number): ShotInput {
  const where = `shots[${index}]`;
  const input = object(value, where, ['id', 'template', 'headline', 'labels', 'voice', 'duration', 'tail']);
  const shotId = id(input.id, `${where}.id`);
  const field = `shot "${shotId}"`;
  const template = line(input.template, `${field}.template`, 20) as Template;
  if (!TEMPLATES.includes(template)) throw new Error(`${field}.template: expected ${TEMPLATES.join(', ')}.`);
  const headline = input.headline === undefined ? undefined : line(input.headline, `${field}.headline`, 72);
  if ((template === 'card' || template === 'flow') && !headline) throw new Error(`${field}.headline: required for ${template}.`);
  let labels: string[] | undefined;
  if (template === 'flow') {
    if (!Array.isArray(input.labels) || input.labels.length < 2 || input.labels.length > 4) {
      throw new Error(`${field}.labels: flow requires two to four labels.`);
    }
    labels = input.labels.map((label, i) => line(label, `${field}.labels[${i}]`, 26));
  } else if (input.labels !== undefined) {
    throw new Error(`${field}.labels: only supported by flow.`);
  }

  const visual = {id: shotId, template, headline, labels};
  if (input.voice === undefined) {
    if (input.tail !== undefined) throw new Error(`${field}.tail: requires voice.`);
    return {...visual, duration: seconds(input.duration, `${field}.duration`, 1 / FPS, 120)};
  }
  if (input.duration !== undefined) throw new Error(`${field}.duration: conflicts with measured voice duration. Use tail for extra hold.`);
  const voice = object(input.voice, `${field}.voice`, ['file', 'text']);
  const file = line(voice.file, `${field}.voice.file`, 1024);
  if (isAbsolute(file) || /^[a-z][a-z0-9+.-]*:/i.test(file) || file.includes('\\')) {
    throw new Error(`${field}.voice.file: use a local relative path with forward slashes.`);
  }
  return {...visual, voice: {file, text: line(voice.text, `${field}.voice.text`, 160)},
    tail: input.tail === undefined ? 0 : seconds(input.tail, `${field}.tail`, 0, 10)};
}

export function parseEpisode(value: unknown): EpisodeInput {
  const input = object(value, 'episode', ['id', 'title', 'shots']);
  const episodeId = id(input.id, 'episode.id');
  const title = line(input.title, 'episode.title', 120);
  if (!Array.isArray(input.shots) || !input.shots.length) throw new Error('episode.shots: expected a nonempty array.');
  const shots = input.shots.map(parseShot);
  const seen = new Set<string>();
  for (const shot of shots) {
    const key = shot.id.toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate shot ID "${shot.id}".`);
    seen.add(key);
  }
  return {id: episodeId, title, shots};
}

export function readEpisode(file: string): EpisodeInput {
  try {
    return parseEpisode(JSON.parse(readFileSync(file, 'utf8')));
  } catch (error) {
    throw new Error(`${file}: ${(error as Error).message}`);
  }
}

function probeAudio(file: string): number {
  if (!statSync(file).isFile()) throw new Error('Expected an audio file.');
  const output = execFileSync('ffprobe', [
    '-v', 'error', '-protocol_whitelist', 'file,pipe', '-select_streams', 'a:0', '-show_entries', 'stream=duration:format=duration', '-of', 'json', file,
  ], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
  const data = JSON.parse(output);
  if (!data.streams?.length) throw new Error('No audio stream found.');
  const streamDuration = Number(data.streams[0].duration);
  return Number.isFinite(streamDuration) && streamDuration > 0 ? streamDuration : Number(data.format?.duration);
}

export function planEpisode(file: string, episode = readEpisode(file), probe = probeAudio): EpisodePlan {
  let cursor = 0;
  const shots = episode.shots.map((shot): PlannedShot => {
    let voice: PlannedShot['voice'];
    if (shot.voice) {
      const filePath = resolve(dirname(file), shot.voice.file);
      try {
        voice = {...shot.voice, seconds: seconds(probe(filePath), 'audio', 1 / FPS, 120)};
      } catch (error) {
        throw new Error(`Shot "${shot.id}" voice.file "${shot.voice.file}": ${(error as Error).message}`);
      }
    }
    const duration = voice ? voice.seconds + (shot.tail ?? 0) : shot.duration!;
    const frames = Math.ceil(duration * FPS - 1e-9);
    const startFrame = cursor;
    cursor += frames;
    return {id: shot.id, startFrame, endFrame: cursor, voice,
      visual: {template: shot.template, headline: shot.headline, labels: shot.labels, frames}};
  });
  return {id: episode.id, title: episode.title, fps: FPS, totalFrames: cursor, shots};
}

function timestamp(milliseconds: number): string {
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor(milliseconds / 60_000) % 60;
  const sec = Math.floor(milliseconds / 1000) % 60;
  return [hours, minutes, sec].map(value => String(value).padStart(2, '0')).join(':')
    + ',' + String(milliseconds % 1000).padStart(3, '0');
}

export function subtitles(plan: EpisodePlan): string {
  const lines: string[] = [];
  for (const {startFrame, voice} of plan.shots) {
    if (!voice) continue;
    const start = startFrame / plan.fps;
    const end = start + voice.seconds;
    const words = wordTimings(voice.text, start, end);
    const wrapped: {text: string; start: number}[] = [];
    for (const word of words) {
      const row = wrapped[wrapped.length - 1];
      if (!row || row.text.length + 1 + word.text.length > 46) wrapped.push({text: word.text, start: word.start});
      else row.text += ' ' + word.text;
    }
    for (let row = 0; row < wrapped.length; row += 2) {
      const cueStart = Math.ceil(wrapped[row].start * 1000);
      const cueEnd = Math.floor((wrapped[row + 2]?.start ?? end) * 1000);
      if (cueEnd <= cueStart) continue;
      const text = wrapped.slice(row, row + 2).map(item => item.text).join('\n')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      lines.push(`${lines.length + 1}\n${timestamp(cueStart)} --> ${timestamp(cueEnd)}\n${text}\n`);
    }
  }
  return lines.length ? lines.join('\n') + '\n' : '';
}
