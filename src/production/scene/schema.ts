import {record} from '../../script/validate';
import {POSES} from '../../engine/vocab';
import {PERSON_EXPRESSIONS} from '../../themes/cge/face';
import {ASSETS, EASINGS, PROPS, TIME_EPSILON, type Scene, type State} from './types';

export type Schema = {
  type?: 'object' | 'array' | 'number' | 'string' | 'boolean' | 'null';
  description?: string;
  enum?: readonly string[];
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: false;
  minProperties?: number;
  items?: Schema;
  prefixItems?: Schema[];
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  anyOf?: Schema[];
};
export const obj = (properties: Record<string, Schema>, ...required: string[]): Schema =>
  ({type: 'object', properties, required, additionalProperties: false});
export const list = (items: Schema, maxItems: number, minItems = 0): Schema => ({type: 'array', items, maxItems, minItems});
export const number = (minimum: number, maximum: number): Schema => ({type: 'number', minimum, maximum});
export const text = (maxLength: number): Schema => ({type: 'string', minLength: 1, maxLength, pattern: '\\S'});
export const one = (values: readonly string[]): Schema => ({type: 'string', enum: values});
const tuple = (...prefixItems: Schema[]): Schema =>
  ({type: 'array', prefixItems, minItems: prefixItems.length, maxItems: prefixItems.length});
export const vector = (min = -1000, max = 1000): Schema => tuple(number(min, max), number(min, max), number(min, max));
const bool: Schema = {type: 'boolean'};
const id: Schema = {type: 'string', pattern: '^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$'};
export const color: Schema = {type: 'string', pattern: '^#[0-9a-fA-F]{6}$'};
const time = number(0, 130);
const easing = one(EASINGS);
const aim: Schema = {anyOf: [vector(), obj({subject: id, offset: vector()}, 'subject')]};
const camera = {position: vector(), target: aim, fov: number(10, 110), roll: number(-180, 180)};
const style = {color, size: number(12, 132), font: one(['serif', 'sans']), background: color};
const window = {at: time, until: time, reveal: time};
const state = {
  position: vector(), scale: number(.01, 30), rotation: number(-3600, 3600), color, opacity: number(0, 1),
  visible: bool, highlight: number(0, 1), pose: one(POSES), expression: one(PERSON_EXPRESSIONS),
  attach: {anyOf: [id, {type: 'null'}]} as Schema, asset: one(ASSETS),
};
const lightBase = {intensity: number(0, 4)};
export const lights: Schema = {anyOf: [
  obj({...lightBase, kind: one(['hemisphere']), sky: color, ground: color}, 'kind', 'sky', 'ground', 'intensity'),
  obj({...lightBase, kind: one(['directional']), dir: vector(-1, 1), color}, 'kind', 'dir', 'color', 'intensity'),
  obj({...lightBase, kind: one(['point']), pos: vector(), color, range: number(.01, 1000)}, 'kind', 'pos', 'color', 'range', 'intensity'),
  obj({...lightBase, kind: one(['spot']), pos: vector(), dir: vector(-1, 1), color,
    angle: number(1, 89), softness: number(.001, 1)}, 'kind', 'pos', 'dir', 'color', 'angle', 'softness', 'intensity'),
]};

export const sceneSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  ...obj({
    entities: list(obj({...state, id, tone: one(['surface','primary','accent','ink']), size: vector(.01, 200), seed: text(64),
      opening: tuple(number(.01, .98), number(.01, .98), number(0, .49)),
      outline: list(tuple(number(-4, 4), number(0, 4)), 64, 3),
      material: one(['matte', 'metal', 'glass', 'water', 'flat'])}, 'id', 'asset'), 64, 1),
    actions: list(obj({target: id, at: time, duration: time, ease: easing,
      set: {...obj(state), minProperties: 1}}, 'target', 'at', 'set'), 256),
    camera: obj({...camera, keys: list(obj({...camera, at: time, ease: easing}, 'at'), 60)}, 'position', 'target'),
    lights: list(lights, 8),
    atmosphere: obj({low: color, high: color, height: number(.01, 1000), density: number(0, 1)}, 'low', 'high', 'height', 'density'),
    background: color,
    typography: obj(style),
    annotations: list(obj({...window, ...style, text: text(110), subject: id,
      atScreen: tuple(number(0, 1), number(0, 1)), offset: tuple(number(-1000, 1000), number(-1000, 1000))}, 'text'), 48),
    links: list(obj({...window, from: id, to: id, color, width: number(1, 32), arrow: bool}, 'from', 'to'), 64),
    paths: list(obj({...window, points: list(vector(), 80, 2), color, width: number(1, 32), arrow: bool}, 'points'), 64),
  }, 'entities', 'camera'),
};

export function issue(value: unknown, schema: Schema, path: string): string | undefined {
  const fail = (expected: string) => `${path}: expected ${expected}`;
  if (schema.anyOf) {
    const variants = schema.anyOf.map(candidate => issue(value, candidate, path));
    if (variants.includes(undefined)) return;
    const kind = record(value) ? value.kind : undefined;
    const matching = schema.anyOf.findIndex(candidate => candidate.properties?.kind?.enum?.includes(String(kind)));
    return matching >= 0 ? variants[matching] : fail('one of the documented forms');
  }
  switch (schema.type) {
    case 'object':
      if (!record(value)) return fail('an object');
      for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) return fail(`field "${key}"`);
      if (Object.keys(value).length < (schema.minProperties ?? 0)) return fail('at least one property');
      for (const [key, item] of Object.entries(value)) {
        const rule = schema.properties && Object.hasOwn(schema.properties, key) ? schema.properties[key] : undefined;
        if (!rule) return `${path}.${key}: unknown property`;
        const error = issue(item, rule, `${path}.${key}`);
        if (error) return error;
      }
      return;
    case 'array':
      if (!Array.isArray(value) || value.length < schema.minItems! || value.length > schema.maxItems!) {
        return fail(`an array of ${schema.minItems}–${schema.maxItems} items`);
      }
      for (const [index, item] of value.entries()) {
        const error = issue(item, schema.items ?? schema.prefixItems![index], `${path}[${index}]`);
        if (error) return error;
      }
      return;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value) || value < schema.minimum! || value > schema.maximum!) {
        return fail(`a number from ${schema.minimum} to ${schema.maximum}`);
      }
      return;
    case 'string':
      if (typeof value !== 'string') return fail('a string');
      if (schema.enum && !schema.enum.includes(value)) return fail(schema.enum.join(', '));
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) return fail(`a string matching ${schema.pattern}`);
      if (value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? Infinity)) return fail('a string within the length limit');
      return;
    case 'boolean': return typeof value === 'boolean' ? undefined : fail('a boolean');
    case 'null': return value === null ? undefined : fail('null');
  }
}

export function readScene(input: unknown, where: string): Scene {
  const error = issue(input, sceneSchema, where);
  if (error) throw new Error(error);
  const scene = input as Scene;
  const fail = (message: string): never => { throw new Error(`${where}: ${message}`); };
  const entities = new Map(scene.entities.map(entity => [entity.id, entity]));
  if (entities.size !== scene.entities.length) fail('entity IDs must be unique');
  const subject = (id: string) => { if (!entities.has(id)) fail(`unknown subject "${id}"`); };
  const checkState = (value: Partial<State>, base: State['asset'], id: string) => {
    if (value.asset && value.asset !== base && [base, value.asset].some(asset => asset === 'aperture' || asset === 'outline')) {
      fail(`"${id}" cannot switch to or from a parameterized mesh`);
    }
    if (value.asset && value.asset !== base && !([base, value.asset] as string[]).every(asset => PROPS.some(prop => prop === asset))) {
      fail(`"${id}" may swap assets only within the prop family`);
    }
    if ((value.pose || value.expression) && base !== 'person') fail(`"${id}" is not a person`);
    if (value.attach != null && (!PROPS.some(prop => prop === base) || entities.get(value.attach)?.asset !== 'person')) {
      fail(`"${id}" may attach only a prop to a named person`);
    }
  };
  for (const entity of scene.entities) {
    checkState(entity, entity.asset, entity.id);
    if (Boolean(entity.opening) !== (entity.asset === 'aperture')) fail(`"${entity.id}" requires opening exactly for aperture assets`);
    if (entity.opening && entity.opening[2] > Math.min(entity.opening[0], entity.opening[1]) / 2) {
      fail(`"${entity.id}" opening radius exceeds half its smaller dimension`);
    }
    if (Boolean(entity.outline) !== (entity.asset === 'outline')) fail(`"${entity.id}" requires outline points exactly for outline assets`);
    if (entity.outline) {
      const area = entity.outline.reduce((sum, [x, y], i, points) => {
        const [nx, ny] = points[(i + 1) % points.length];
        return sum + x * ny - y * nx;
      }, 0);
      if (Math.abs(area) < 1e-6) fail(`"${entity.id}" outline must enclose an area`);
    }
    if (entity.asset === 'person' && (entity.size || entity.material)) {
      fail(`"${entity.id}" uses uniform scale and the person material`);
    }
  }
  const ends = new Map<string, number>();
  for (const action of [...(scene.actions ?? [])].sort((a, b) => a.at - b.at)) {
    const entity = entities.get(action.target) ?? fail(`unknown action subject "${action.target}"`);
    checkState(action.set, entity.asset, entity.id);
    if (Object.hasOwn(action.set, 'attach') && (!action.set.position || action.duration)) {
      fail(`"${entity.id}" attachment changes require a position and zero duration`);
    }
    for (const property of Object.keys(action.set)) {
      const track = `${entity.id}.${property}`;
      if (action.at + TIME_EPSILON < (ends.get(track) ?? 0)) fail(`overlapping actions on "${track}"`);
      ends.set(track, action.at + (action.duration ?? 0));
    }
  }
  let previous = 0;
  for (const key of scene.camera.keys ?? []) {
    if (key.at <= previous) fail('camera keys must increase strictly after zero');
    if (key.position === undefined && key.target === undefined && key.fov === undefined && key.roll === undefined) {
      fail('camera keys must change at least one camera field');
    }
    previous = key.at;
  }
  for (const camera of [scene.camera, ...(scene.camera.keys ?? [])]) {
    if (camera.target && !Array.isArray(camera.target)) subject(camera.target.subject);
  }
  for (const light of scene.lights ?? []) if ('dir' in light && Math.hypot(...light.dir) < 1e-8) fail('light directions must be nonzero');
  for (const item of scene.annotations ?? []) {
    if (Boolean(item.subject) === Boolean(item.atScreen)) fail('each annotation needs exactly one subject or screen anchor');
    if (item.subject) subject(item.subject);
  }
  for (const link of scene.links ?? []) {
    subject(link.from);
    subject(link.to);
    if (link.from === link.to) fail('links need two distinct subjects');
  }
  for (const overlay of [...(scene.annotations ?? []), ...(scene.links ?? []), ...(scene.paths ?? [])]) {
    if (overlay.until !== undefined && (overlay.at ?? 0) + (overlay.reveal ?? 0) > overlay.until + TIME_EPSILON) {
      fail('overlay reveal must finish by its until time');
    }
  }
  return scene;
}

export function validateSceneDuration(scene: Scene, seconds: number, where: string) {
  const bounds = [
    ...(scene.actions ?? []).map(a => a.at + (a.duration ?? 0)),
    ...(scene.camera.keys ?? []).map(k => k.at),
    ...[...(scene.annotations ?? []), ...(scene.links ?? []), ...(scene.paths ?? [])].flatMap(o => [
      (o.at ?? 0) + (o.reveal ?? 0), o.until ?? 0,
    ]),
  ];
  if (bounds.some(time => time > seconds + TIME_EPSILON)) {
    throw new Error(`${where}: action, camera key or overlay exceeds the shot duration (${seconds}s)`);
  }
}
