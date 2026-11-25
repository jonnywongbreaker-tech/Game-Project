/**
 * Library pilot: generic helpers that draw assets straight from their manifests
 * (docs/ASSET_STRATEGY.md). Scenes only choose assets, camera, timing and pose.
 */
import React from 'react';
import {type AssetManifest, assetPath, Part, Picture, Plane, type Pt} from '../../engine/Stage';

/** Draw the named planes of an environment asset at their manifest depths and rects. */
export const AssetPlanes: React.FC<{asset: AssetManifest; names: string[]; style?: (name: string) => React.CSSProperties | undefined; extra?: Record<string, React.ReactNode>}> = ({asset, names, style, extra}) => (
  <>
    {names.map((name) => {
      const p = asset.planes![name];
      return (
        <Plane key={name} depth={p.depth}>
          <Picture src={assetPath(asset.id, asset.version, p.file)} rect={p.rect} style={style?.(name)} />
          {extra?.[name]}
        </Plane>
      );
    })}
  </>
);

export interface PuppetPose {
  /** Degrees per part (clockwise positive). */
  rotate?: Record<string, number>;
  /** Image swap per part, by the swap name in the manifest (e.g. head: 'eyes-closed'). */
  swap?: Record<string, string | undefined>;
  /** Uniform scale per part (e.g. breathing on the torso). */
  scale?: Record<string, number>;
}

type PartSpecFull = {file: string; size: Pt; pivot: Pt; at: Pt; parent?: string; z?: number; swaps?: Record<string, string>};

/**
 * A cut-out character from its manifest: parts nest under their parents, children with
 * z < 0 draw behind the parent, z >= 0 in front. `attach` adds content to a part's space.
 */
export const Puppet: React.FC<{asset: AssetManifest; at: Pt; scale: number; mirror?: boolean; pose?: PuppetPose; attach?: Record<string, React.ReactNode>}> = ({asset, at, scale, mirror, pose = {}, attach = {}}) => {
  const parts = asset.parts as unknown as Record<string, PartSpecFull>;
  const root = asset.root as string;
  const draw = (name: string): React.ReactNode => {
    const p = parts[name];
    const kids = Object.entries(parts).filter(([, c]) => c.parent === name).sort((a, b) => (a[1].z ?? 0) - (b[1].z ?? 0));
    const swap = pose.swap?.[name];
    const file = swap && p.swaps?.[swap] ? p.swaps[swap] : p.file;
    return (
      <Part key={name} src={assetPath(asset.id, asset.version, file)} size={p.size} pivot={p.pivot}
        at={name === root ? p.pivot : p.at} rotate={pose.rotate?.[name] ?? 0} scale={pose.scale?.[name] ?? 1}
        behind={kids.filter(([, c]) => (c.z ?? 0) < 0).map(([k]) => draw(k))}>
        {kids.filter(([, c]) => (c.z ?? 0) >= 0).map(([k]) => draw(k))}
        {attach[name]}
      </Part>
    );
  };
  const r = parts[root];
  return (
    <div style={{position: 'absolute', left: at[0], top: at[1], width: 0, height: 0,
      transform: `scale(${mirror ? -scale : scale}, ${scale})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -r.pivot[0], top: -r.pivot[1]}}>{draw(root)}</div>
    </div>
  );
};

/** Rising steam, drawn upright in its own space (counter-rotate it when attached to a moving part). */
export const Steam: React.FC<{t: number; x: number; y: number; size: number; counterRotate?: number}> = ({t, x, y, size, counterRotate = 0}) => (
  <svg style={{position: 'absolute', left: x - size, top: y - size * 3, width: size * 2, height: size * 3, overflow: 'visible',
    transform: `rotate(${-counterRotate}deg)`, transformOrigin: `${size}px ${size * 3}px`}}>
    {[0, 1, 2].map((i) => {
      const k = (t * 0.35 + i / 3) % 1;
      const sx = size + Math.sin(k * 6 + i * 2) * size * 0.25;
      const top = size * 3 * (1 - k);
      return <path key={i} d={`M${sx} ${top + size * 0.9}Q${sx + size * 0.3} ${top + size * 0.45} ${sx} ${top}Q${sx - size * 0.3} ${top - size * 0.45} ${sx} ${top - size * 0.9}`}
        stroke="#FFF6EC" strokeWidth={size * 0.16 * (1 - k * 0.5)} strokeLinecap="round" fill="none" opacity={0.55 * Math.sin(k * Math.PI)} />;
    })}
  </svg>
);
