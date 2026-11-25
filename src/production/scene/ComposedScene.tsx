import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Profile} from './style';
import {planarShadow} from '../../kit/primitives';
import {Space, type Sprite} from '../../engine/Space';
import {FONT, SERIF} from '../../engine/fonts';
import {add, makeView, projectPoint, type Light, type Poly, type V3} from '../../kit/space';
import {LOOK} from '../../themes/cge/identity';
import {randomPerson} from '../../themes/cge/Person';
import {personSprite} from '../../themes/cge/personSprite';
import type {Asset, Scene} from './types';
import {geometry, placeGeometry} from './geometry';
import {compileScene, mix, overlayProgress} from './timeline';

const defaultLights: Light[] = [
  {kind: 'hemisphere', sky: '#CEDDEB', ground: '#7C839E', intensity: .75},
  {kind: 'directional', dir: [0.5, -.8, .3], color: '#FFE9CF', intensity: .82},
];

export const ComposedScene: React.FC<{scene: Scene; profile?:Profile; frames?:number}> = ({scene,profile,frames}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const time = frame / fps;
  const sampler = useMemo(() => compileScene(scene), [scene]);
  const library = useMemo(() => new Map(scene.entities.map(entity => {
    const assets = new Set<Asset>([entity.asset]);
    for (const action of scene.actions ?? []) if (action.target === entity.id && action.set.asset) assets.add(action.set.asset);
    const meshes = new Map<Asset, {polys: Poly[]; height: number}>();
    for (const asset of assets) {
      if (asset === 'person') continue;
      const polys = geometry(asset, entity);
      const top = Math.max(0, ...polys.flatMap(polygon => polygon.pts.map(point => point[1])));
      meshes.set(asset, {polys, height: top * (entity.size?.[1] ?? 1)});
    }
    return [entity.id, meshes];
  })), [scene]);
  const states = new Map(scene.entities.map(entity => [entity.id, sampler.sample(entity.id, time)]));
  const polys: Poly[] = [];
  const sprites: Sprite[] = [];
  const shadowGround=scene.entities.find(entity=>entity.asset==='ground');
  const lights = scene.lights ?? defaultLights;
  const camera = sampler.camera(time);
  const visible = (s: {visible: boolean; opacity: number}) => s.visible && s.opacity > 0;
  for (const entity of scene.entities) {
    const state = states.get(entity.id)!;
    if (!visible(state)) continue;
    if (state.asset === 'person') {
      const radians = state.rotation * Math.PI / 180;
      const character = personSprite({
        spec: {...randomPerson(entity.seed ?? entity.id), top: state.color, ...(profile ? {outfit:profile.character} : {})},
        pos: state.position, heading: [Math.sin(radians), 0, Math.cos(radians)], t: time,
        pose: state.pose, expression: state.expression, walked: state.walked, walking: state.walking,
      }, lights);
      sprites.push({...character, render: projection => (
        <g opacity={state.opacity}>
          {state.highlight > 0 && <circle cx={projection.x} cy={projection.y - projection.scale * state.scale * .8}
            r={projection.scale * state.scale * .96} fill="#FFC15E" opacity={state.highlight * .38} />}
          {character.render({...projection, scale: projection.scale * state.scale})}
        </g>
      )});
    } else {
      const mesh=placeGeometry(library.get(entity.id)!.get(state.asset)!.polys, entity, state);
      polys.push(...mesh);
      if(profile?.shadow && shadowGround && entity!==shadowGround && mesh.length<220){
        const dir=lights.find(light=>light.kind==='directional')?.dir ?? [.6,-1,.3];
        if(dir[1]<-.05) polys.push(...planarShadow(mesh,dir,sampler.sample(shadowGround.id,time).position[1],profile.palette.ink,profile.shadow));
      }
    }
  }

  const view = makeView(camera, width, height);
  const project = (id: string) => {
    const state = states.get(id)!;
    if (!visible(state)) return null;
    const anchorHeight = state.asset === 'person' ? 1.65 : (library.get(id)!.get(state.asset)!.height * .55);
    const anchor: V3 = [0, state.scale * anchorHeight, 0];
    return projectPoint(view, add(state.position, anchor));
  };
  const transitionFrames=(profile?.transitionSeconds??0)*fps;
  const transition=transitionFrames && frames ? Math.min(1,frame/transitionFrames,(frames-1-frame)/transitionFrames) : 1;
  const background = scene.background ?? '#26364A';

  return (
    <AbsoluteFill>
      <Space camera={camera} polys={polys} sprites={sprites} lights={lights} look={profile?.look??LOOK}
        background={<AbsoluteFill style={{background}} />}
        atmosphere={scene.atmosphere ?? {low: background, high: background, height: 12, density: 0}} />
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        {(scene.links ?? []).map((link, i) => {
          const k = overlayProgress(link, time);
          const a = project(link.from), b = project(link.to);
          if (k <= 0 || !a || !b) return null;
          const x = mix(a.x, b.x, k), y = mix(a.y, b.y, k);
          const angle = Math.atan2(y - a.y, x - a.x) * 180 / Math.PI;
          const color = link.color ?? '#FFE5AE';
          return <g key={i} opacity={Math.min(1, k * 4)}>
            <path d={`M ${a.x} ${a.y} L ${x} ${y}`} stroke={color} strokeWidth={link.width ?? 5} />
            {link.arrow && <path d="M 0 0 L -20 -11 L -20 11 Z" fill={color}
              transform={`translate(${x} ${y}) rotate(${angle})`} />}
          </g>;
        })}
        {(scene.paths ?? []).map((path, i) => {
          const k = overlayProgress(path, time);
          if (k <= 0) return null;
          const projected = path.points.map(point => projectPoint(view, point));
          if (projected.some(point => !point)) return null;
          const points = projected.map(point => ({x: point!.x, y: point!.y}));
          const lengths = points.slice(1).map((point, j) => Math.hypot(point.x - points[j].x, point.y - points[j].y));
          let remaining = lengths.reduce((a, b) => a + b, 0) * k;
          const used = [points[0]];
          for (const [j, length] of lengths.entries()) {
            const a = points[j], b = points[j + 1];
            if (!length) continue;
            const fraction = Math.min(1, remaining / length);
            used.push({x: mix(a.x, b.x, fraction), y: mix(a.y, b.y, fraction)});
            remaining -= length;
            if (remaining <= 0) break;
          }
          if (used.length < 2) return null;
          const end = used.at(-1)!, previous = used.at(-2)!;
          const color = path.color ?? '#FFE5AE', width = path.width ?? 5;
          const angle = Math.atan2(end.y - previous.y, end.x - previous.x) * 180 / Math.PI;
          return <g key={i}>
            <polyline points={used.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke={color}
              strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
            {path.arrow && <path d={`M 0 0 L ${-4 * width} ${-2 * width} L ${-4 * width} ${2 * width} Z`}
              fill={color} transform={`translate(${end.x} ${end.y}) rotate(${angle})`} />}
          </g>;
        })}
        {(scene.annotations ?? []).map((label, i) => {
          const opacity = overlayProgress(label, time);
          if (!opacity) return null;
          const point = label.subject ? project(label.subject) : null;
          if (label.subject && !point) return null;
          const style = {...scene.typography, ...label};
          const anchor = label.atScreen;
          const [dx, dy] = label.offset ?? (anchor ? [0, 0] : [100, -100]);
          const x = (point?.x ?? anchor![0] * width) + dx;
          const y = (point?.y ?? anchor![1] * height) + dy;
          const color = style.color ?? '#F3E9D8';
          const size = style.size ?? 38;
          return <g key={i} opacity={opacity}>
            {point && <path d={`M ${point.x} ${point.y} L ${x} ${y}`} stroke={color} strokeWidth={3} />}
            <foreignObject x={x - 360} y={y - size} width={720} height={size * 3}>
              <div style={{display: 'flex', justifyContent: 'center', textAlign: 'center'}}>
                <span style={{color, padding: '2px 13px', lineHeight: 1.12, fontWeight: 700,
                  fontSize: size, fontFamily: style.font === 'serif' ? SERIF : FONT,
                  background: style.background ?? '#172434'}}>{label.text}</span>
              </div>
            </foreignObject>
          </g>;
        })}
      </svg>
      {profile?.transition==='fade' && transition<1 && <AbsoluteFill style={{background,opacity:1-transition}} />}
      {profile?.transition==='wipe' && transition<1 && <AbsoluteFill style={{background,
        clipPath:`inset(0 0 0 ${transition*100}%)`}} />}
    </AbsoluteFill>
  );
};
