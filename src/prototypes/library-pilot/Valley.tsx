/**
 * Library pilot 2 — mountain valley from library assets (env.alpine-valley-dawn).
 * Direction only: a slow push-in, chimney smoke, drifting mist and a gentle sway on the framing tree.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TextureOverlay} from '../../engine/Texture';
import {ease, tween, useTime, wave} from '../../engine/time';
import {assetPath, type AssetManifest, Picture, Plane, Stage, useAsset} from '../../engine/Stage';

/** Chimney smoke: soft puffs rising and drifting with the breeze. */
export const Smoke: React.FC<{t: number; x: number; y: number; size: number}> = ({t, x, y, size}) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const k = (t * 0.22 + i / 4) % 1;
      return <div key={i} style={{position: 'absolute', left: x + k * size * 2.2 - size * 0.3 * (0.5 + k), top: y - k * size * 4.5,
        width: size * (0.6 + k), height: size * (0.6 + k), borderRadius: '50%', background: 'rgba(246,226,240,0.9)', opacity: 0.55 * (1 - k)}} />;
    })}
  </>
);

/** Mist band: a soft horizontal gradient drifting slowly. */
export const Mist: React.FC<{t: number; y: number; opacity: number}> = ({t, y, opacity}) => (
  <div style={{position: 'absolute', left: -400 + t * 12, top: y, width: 2800, height: 90, opacity,
    background: 'radial-gradient(ellipse at center, rgba(255,232,222,0.75) 0%, rgba(255,232,222,0) 70%)'}} />
);

/** The valley's planes with a swaying framing tree; scenes add their own extras per plane. */
export const ValleyPlanes: React.FC<{asset: AssetManifest; t: number; extra?: Record<string, React.ReactNode>}> = ({asset, t, extra = {}}) => {
  const p = asset.planes!;
  const src = (n: string) => assetPath(asset.id, asset.version, p[n].file);
  const tree = p['fg-tree'].rect;
  return (
    <>
      <Plane depth={p.far.depth}><Picture src={src('far')} rect={p.far.rect} />{extra.far}</Plane>
      <Plane depth={0.4}><Mist t={t} y={560} opacity={0.55} /></Plane>
      <Plane depth={p.mid.depth}><Picture src={src('mid')} rect={p.mid.rect} />{extra.mid}</Plane>
      <Plane depth={p['fg-ledge'].depth}>
        <Picture src={src('fg-ledge')} rect={p['fg-ledge'].rect} />
        {extra['fg-ledge']}
        <div style={{position: 'absolute', inset: 0, transformOrigin: `${tree[0] + tree[2] * 0.6}px ${tree[1] + tree[3]}px`, transform: `rotate(${wave(t, 0.12, 0.35)}deg)`}}>
          <Picture src={src('fg-tree')} rect={tree} />
        </div>
      </Plane>
    </>
  );
};

export const Valley: React.FC = () => {
  const {t} = useTime();
  const valley = useAsset('env.alpine-valley-dawn', 'v001');
  if (!valley) return null;
  const zoom = tween(t, [0, 5], [1.03, 1.1], ease.inOut);
  const x = tween(t, [0, 5], [930, 1000], ease.inOut);
  const chimney = (valley.points as Record<string, [number, number]>).chimney;
  return (
    <AbsoluteFill style={{background: '#7A64B8'}}>
      <Stage camera={{x, y: 540, zoom}}>
        <ValleyPlanes asset={valley} t={t} extra={{mid: <Smoke t={t} x={chimney[0]} y={chimney[1]} size={14} />}} />
      </Stage>
      <TextureOverlay src={`textures/grain-${Math.floor(t * 15) % 4}.png`} opacity={0.05} blend="overlay" />
    </AbsoluteFill>
  );
};
