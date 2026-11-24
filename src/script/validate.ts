import type {Issue} from './compile';

type Rule = (value: unknown, path: string, report: (path: string, message: string) => void) => void;
export const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const expect = (predicate: (value: unknown) => boolean, description: string): Rule =>
  (value, path, report) => { if (!predicate(value)) report(path, `Expected ${description}.`); };
const string = expect(v => typeof v === 'string' && v.trim().length > 0, 'a nonempty string');
const number = (min = -Infinity, max = Infinity) =>
  expect(v => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max, `a finite number in [${min}, ${max}]`);
const positive = expect(v => typeof v === 'number' && Number.isFinite(v) && v > 0, 'a finite positive number');
const optional = (rule: Rule): Rule => (v, p, r) => { if (v !== undefined) rule(v, p, r); };
const object = (fields: Record<string, Rule>): Rule => (v, p, r) => {
  if (!record(v)) return r(p, 'Expected an object.');
  for (const [key, rule] of Object.entries(fields)) rule(v[key], `${p}.${key}`, r);
};
const array = (rule: Rule): Rule => (v, p, r) => {
  if (!Array.isArray(v)) return r(p, 'Expected an array.');
  v.forEach((item, index) => rule(item, `${p}[${index}]`, r));
};
const dictionary = (rule: Rule): Rule => (v, p, r) => {
  if (!record(v)) return r(p, 'Expected an object.');
  for (const [key, item] of Object.entries(v)) {
    if (Object.hasOwn(Object.prototype, key) || key === 'prototype') r(`${p}.${key}`, 'Reserved identifier.');
    else rule(item, `${p}.${key}`, r);
  }
};

const facing = expect(v => v === 'left' || v === 'right', '"left" or "right"');
const camera = object({zoom: optional(positive), y: optional(number()),
  focus: optional(expect(v => typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)), 'a name or finite number'))});
const emote = optional(expect(v => v === null || typeof v === 'string', 'a string or null'));
const actor = {x: optional(number()), y: optional(number()), scale: optional(positive), facing: optional(facing),
  look: optional(number(-1, 1)), pose: optional(string), expression: optional(string), emote};
const action: Rule = (v, p, r) => {
  object({...actor, actor: string, walkTo: optional(number()), speed: optional(positive),
    enter: optional(facing), exit: optional(facing)})(v, p, r);
  if (record(v)) {
    for (const key of ['y', 'scale']) if (v[key] !== undefined) r(`${p}.${key}`, 'Set this on the scene actor. Actions cannot change it.');
    if (v.enter !== undefined && v.exit !== undefined) r(p, 'An action cannot enter and exit simultaneously.');
  }
};
const caption: Rule = (v, p, r) => {
  if (typeof v === 'string') string(v, p, r);
  else object({text: string, hold: optional(positive), style: optional(expect(v => v === 'big' || v === 'title' || v === 'note', 'a caption style'))})(v, p, r);
};
const beat = object({say: optional(string), text: optional(string), narrate: optional(string), audio: optional(string),
  dur: optional(positive), pause: optional(number(0)), pose: optional(string), expression: optional(string), emote,
  do: optional(array(action)), camera: optional(camera), caption: optional(caption), sfx: optional(string)});
const design = object({name: string, skin: string, hair: string, hairStyle: string, shirt: string,
  shirtAccent: optional(string), pants: string, shoes: string, color: string, accessory: optional(string),
  size: optional(positive), seed: optional(number())});
const cast: Rule = (v, p, r) => (typeof v === 'string' ? string : design)(v, p, r);

const script = object({
  id: expect(v => typeof v === 'string' && /^[A-Za-z0-9-]+$/.test(v), 'an ID containing letters, digits or dashes'),
  title: string, cast: dictionary(cast),
  fps: optional(expect(v => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 120, 'an integer frame rate from 1 to 120')),
  cps: optional(positive), pause: optional(number(0)), accent: optional(string),
  subtitles: optional(expect(v => v === 'both' || v === 'long' || v === 'short' || v === 'none', 'a subtitle mode')),
  music: optional(object({src: string, volume: optional(number(0, 1))})),
  thumbnail: optional(object({at: number(0), text: optional(string)})),
  scenes: array(object({backdrop: string, tint: optional(string), title: optional(string),
    actors: optional(dictionary(object(actor))), camera: optional(camera), beats: array(beat)})),
});

export function validateScript(input: unknown): Issue[] {
  const issues: Issue[] = [];
  script(input, 'episode', (where, message) => issues.push({level: 'error', where, message}));
  return issues;
}
