import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Space, type Sprite} from '../../engine/Space';
import {TextureOverlay} from '../../engine/Texture';
import {tween, useTime} from '../../engine/time';
import {cameraAt, type Shot, shotAt} from '../../kit/shots';
import type {Atmosphere, Light, Poly} from '../../kit/space';
import {LOOK} from '../../themes/cge/identity';
import {ChapterMark, Display} from '../../themes/cge/type';

export interface SceneDef {
  duration: number;
  shots: Shot[];
  /** Everything in the world at time t. */
  build: (t: number) => {polys: Poly[]; sprites: Sprite[]; lights: Light[]};
  atmosphere: Atmosphere;
  background: React.ReactNode;
  title: {kicker: string; lines: string[]; start: number; end: number; align?: 'left' | 'center'; top?: number; size?: number};
  /** Optional overlay (callouts, labels) drawn above the picture, below type. */
  overlay?: (t: number, view: {cam: ReturnType<typeof cameraAt>}) => React.ReactNode;
}

/** Renders any SceneDef with the shared identity: look, grade, typography, fades. */
export const SceneFrame: React.FC<{def: SceneDef; production?: boolean}> = ({def, production}) => {
  const {t, frame} = useTime();
  const {shot, local, index} = shotAt(def.shots, t);
  const cam = cameraAt(shot, local);
  const world = def.build(t);
  const fade = Math.max(tween(t, [0, 0.35], [1, 0]), tween(t, [def.duration - 0.3, def.duration], [0, 1]));
  return (
    <AbsoluteFill style={{background: '#10151C'}}>
      <Space
        camera={cam}
        polys={world.polys}
        sprites={world.sprites}
        lights={world.lights}
        atmosphere={def.atmosphere}
        look={LOOK}
        background={def.background}
        dof={shot.blur && (shot.blur.far > 0 || shot.blur.near > 0) ? {focus: cam.focus, far: shot.blur.far, near: shot.blur.near} : undefined}
      />
      {def.overlay?.(t, {cam})}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 62%, rgba(10,14,24,0.35) 100%)'}} />
      <TextureOverlay src={`textures/grain-${Math.floor(frame / 2) % 4}.png`} opacity={0.08} blend="overlay" />
      {!production && <>
      <ChapterMark index={index + 1} label={shot.label} local={local} />
      <Display kicker={def.title.kicker} lines={def.title.lines} start={def.title.start} end={def.title.end} t={t} align={def.title.align} top={def.title.top ?? 170} size={def.title.size ?? 92} />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      </>}
    </AbsoluteFill>
  );
};
