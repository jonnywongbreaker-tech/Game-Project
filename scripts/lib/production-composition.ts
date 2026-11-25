import {record} from '../../src/script/validate';
import {issue, obj, number, one, color, lights, list, vector, type Schema} from '../../src/production/scene/schema';
import {resolveStyle, styleNames, type Profile, type StyleInput, type StyleName} from '../../src/production/scene/style';
import {EASINGS, type Entity, type Scene} from '../../src/production/scene/types';
import {add, scale, type V3} from '../../src/kit/space';
import {rotateAxis} from '../../src/kit/primitives';

export const styleSchema: Schema = {anyOf:[one(styleNames), obj({
  profile: one(styleNames), palette:obj({background:color,surface:color,primary:color,accent:color,ink:color}),
  material:one(['flat','matte','metal','glass','water']),lights:list(lights,8),
  look:obj({bands:number(0,12),shadowTint:color,lightTint:color,tintStrength:number(0,1)},
    'bands','shadowTint','lightTint','tintStrength'),
  font:one(['serif','sans']),textSize:number(12,110),lineWidth:number(1,22),character:one(['coat','jacket','sweater']),
  geometryDepth:number(.1,4),fovScale:number(.65,1.45),ease:one(EASINGS),shadow:number(0,.7),
  transition:one(['cut','fade','wipe']),transitionSeconds:number(0,2),
}, 'profile')]};
export function readStyle(value: unknown) {
  if (value === undefined) return;
  const error = issue(value, styleSchema, 'episode.style');
  if (error) throw new Error(error);
  return value as StyleName | StyleInput;
}

const identifier: Schema = {type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9-]{0,63}$'};
export const instanceSchema = obj({
  id:identifier, group:identifier, position:vector(), scale:number(.01,30),rotation:number(-3600,3600),
  variant:identifier, dressing:{type:'boolean'},
},'id','group');
type Instance = {id:string;group:string;position?:V3;scale?:number;rotation?:number;variant?:string;dressing?:boolean};
type Definition = {entities?: unknown[];groups?:unknown[];dressing?:unknown[];variants?:unknown};
type Transform = {position:V3;scale:number;rotation:number};
const identity: Transform = {position:[0,0,0],scale:1,rotation:0};
const move = (p:V3,t:Transform) => add(t.position,rotateAxis(scale(p,t.scale),[0,1,0],t.rotation*Math.PI/180));

function localEntity(value: unknown): Entity {
  if (!record(value) || typeof value.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/.test(value.id)) {
    throw new Error('Group entities need a valid local ID');
  }
  const error = issue(value.position ?? [0,0,0], vector(), 'group entity.position')
    ?? issue(value.scale ?? 1, number(.01,30), 'group entity.scale')
    ?? issue(value.rotation ?? 0, number(-3600,3600), 'group entity.rotation');
  if (error) throw new Error(error);
  return value as Entity;
}

export function expandScene(input: unknown, library: unknown): unknown {
  if (!record(input) || input.groups === undefined) return input;
  if (!record(library) || !Array.isArray(input.groups) || (input.entities !== undefined && !Array.isArray(input.entities))) {
    throw new Error('Composed groups require episode.library and a scene.groups array');
  }
  const {groups, entities, ...rest} = input;
  const placed = [...(entities ?? [])];
  let visits = 0;
  function expand(raw: unknown, prefix: string, parent: Transform, chain: string[], dress=true) {
    const error = issue(raw, instanceSchema, 'group instance');
    if (error) throw new Error(error);
    const value = raw as Instance;
    if (++visits > 128 || chain.length > 8 || chain.includes(value.group)) throw new Error('Cyclic or oversized group layout');
    const rawDef = Object.hasOwn(library as object, value.group) ? (library as Record<string, unknown>)[value.group] : undefined;
    if (!record(rawDef) || Object.keys(rawDef).some(k => !['entities','groups','variants','dressing'].includes(k))) {
      throw new Error(`Unknown or invalid group "${value.group}"`);
    }
    const def = rawDef as Definition;
    for (const list of [def.entities,def.groups,def.dressing]) if (list !== undefined && !Array.isArray(list)) throw new Error('Expected group child arrays');
    const variant: unknown = value.variant ? record(def.variants) && Object.hasOwn(def.variants, value.variant) && def.variants[value.variant] : {};
    if (!record(variant)) throw new Error(`Unknown variant "${value.variant}" in ${value.group}`);
    const name = prefix + value.id + '-';
    const transform: Transform = {position:move(value.position ?? [0,0,0],parent),scale:parent.scale*(value.scale??1),rotation:parent.rotation+(value.rotation??0)};
    const showDressing=dress && value.dressing!==false;
    const children = [...(def.entities ?? []), ...(!showDressing ? [] : def.dressing ?? [])];
    for (const key of Object.keys(variant)) {
      if (![...(def.entities ?? []), ...(def.dressing ?? [])].some(raw => record(raw) && raw.id === key)) throw new Error(`Unknown variant member "${key}"`);
    }
    for (const rawChild of children) {
      const child = localEntity(rawChild);
      const patch = Object.hasOwn(variant, child.id) ? variant[child.id] : {};
      if (!record(patch) || Object.keys(patch).some(k => !['color','tone','material','visible','opacity','asset','opening','outline','size','seed'].includes(k))) {
        throw new Error('Invalid group variant override');
      }
      if (child.attach) throw new Error('Group definitions use static transforms. Attach props in shot actions.');
      placed.push({...child,...patch,id:name+child.id,position:move(child.position??[0,0,0],transform),
        scale:transform.scale*(child.scale??1),rotation:transform.rotation+(child.rotation??0)});
      if (placed.length > 64) throw new Error('Expanded scene exceeds 64 entities');
    }
    for (const nested of def.groups ?? []) expand(nested,name,transform,[...chain,value.group],showDressing);
  }
  for (const group of groups) expand(group,'',identity,[]);
  return {...rest,entities:placed};
}

export function styleScene(scene: Scene, style: Profile | undefined): Scene {
  if (!style) return scene;
  const fov = (value:number) => Math.max(10,Math.min(110,value*style.fovScale));
  return {...scene,background:scene.background??style.palette.background,lights:scene.lights??style.lights,
    typography:{font:style.font,size:style.textSize,color:style.palette.ink,background:style.palette.background,...scene.typography},
    camera:{...scene.camera,fov:fov(scene.camera.fov??42),keys:scene.camera.keys?.map(key=>({
      ...key,ease:key.ease??style.ease,...(key.fov===undefined?{}:{fov:fov(key.fov)}),
    }))},
    actions:scene.actions?.map(action=>({...action,ease:action.ease??style.ease})),
    entities:scene.entities.map(entity=>({...entity,
      color:entity.color??style.palette[entity.tone??(entity.asset==='person'?'primary':'surface')],
      material:entity.asset==='person'?undefined:entity.material??style.material,
      size:entity.asset==='person'?undefined:[entity.size?.[0]??1,entity.size?.[1]??1,(entity.size?.[2]??1)*style.geometryDepth],
    })),
    paths:scene.paths?.map(path=>({...path,color:path.color??style.palette.accent,width:path.width??style.lineWidth})),
    links:scene.links?.map(link=>({...link,color:link.color??style.palette.accent,width:link.width??style.lineWidth})),
  };
}
export {resolveStyle};
