/**
 * Library pilot 3 — reuse test: the same approved assets in a new composition.
 * Different framing (tighter, left of the valley), different colours (a dusk grade over every
 * plane), different movement (a lateral truck with strong parallax), plus the character
 * re-posed on the ledge and nature sprites placed into the planes.
 */
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {TextureOverlay} from '../../engine/Texture';
import {ease, tween, useTime, wave} from '../../engine/time';
import {assetPath, type AssetManifest, Stage, useAsset} from '../../engine/Stage';
import {Puppet, Steam} from './assets';
import {sipCurve, sipPose} from './Cafe';
import {Smoke, ValleyPlanes} from './Valley';

type Item = {file: string; size: [number, number]; base: [number, number]};
/** A nature sprite standing on a world point, optionally swaying about its base. */
const Sprite: React.FC<{set: AssetManifest; name: string; x: number; y: number; scale: number; t: number; sway?: number}> = ({set, name, x, y, scale, t, sway = 0}) => {
  const it = (set.items as Record<string, Item>)[name];
  const w = it.size[0] * scale, h = it.size[1] * scale;
  return <Img src={staticFile(assetPath(set.id, set.version, it.file))} style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h,
    transformOrigin: '50% 100%', transform: `rotate(${wave(t, 0.15, sway, x / 500)}deg)`}} />;
};

export const Reuse: React.FC = () => {
  const {t} = useTime();
  const valley = useAsset('env.alpine-valley-dawn', 'v001');
  const person = useAsset('char.adult-reader', 'v001');
  const nature = useAsset('nature.dawn-set', 'v001');
  if (!valley || !person || !nature) return null;
  const x = tween(t, [0, 5], [620, 1010], ease.inOut);
  const zoom = tween(t, [0, 5], [1.2, 1.14], ease.inOut);
  const k = sipCurve(t, 1.2);
  const pose = sipPose(t, k, [0.4, 4.4]);
  const armRot = (pose.rotate['arm-near-upper'] ?? 0) + (pose.rotate['arm-near-fore'] ?? 0);
  const chimney = (valley.points as Record<string, [number, number]>).chimney;
  return (
    <AbsoluteFill style={{background: '#3B2F6E'}}>
      <Stage camera={{x, y: 560, zoom}}>
        <ValleyPlanes asset={valley} t={t} extra={{
          mid: (
            <>
              <Smoke t={t} x={chimney[0]} y={chimney[1]} size={14} />
              <Sprite set={nature} name="conifer-spruce" x={1010} y={760} scale={0.2} t={t} sway={0.4} />
              <Sprite set={nature} name="conifer-cypress" x={1060} y={770} scale={0.17} t={t} sway={0.4} />
              <Sprite set={nature} name="rocks-cluster" x={560} y={900} scale={0.16} t={t} />
            </>
          ),
          'fg-ledge': (
            <>
              <Sprite set={nature} name="bush-flowering" x={130} y={800} scale={0.3} t={t} sway={0.8} />
              <Puppet asset={person} at={[430, 742]} scale={0.17} mirror pose={pose}
                attach={{'arm-near-fore': <Steam t={t} x={70} y={290} size={55} counterRotate={armRot} />}} />
            </>
          ),
        }} />
      </Stage>
      {/* Dusk grade over every plane: cool multiply above, warm glow on the horizon. */}
      <AbsoluteFill style={{mixBlendMode: 'multiply', background: 'linear-gradient(180deg, rgba(92,80,190,0.75) 0%, rgba(150,110,200,0.55) 45%, rgba(230,150,140,0.45) 75%, rgba(120,80,150,0.7) 100%)'}} />
      <AbsoluteFill style={{mixBlendMode: 'screen', background: 'radial-gradient(ellipse at 50% 42%, rgba(255,170,120,0.35) 0%, rgba(255,170,120,0) 45%)'}} />
      <TextureOverlay src={`textures/grain-${Math.floor(t * 15) % 4}.png`} opacity={0.05} blend="overlay" />
    </AbsoluteFill>
  );
};
