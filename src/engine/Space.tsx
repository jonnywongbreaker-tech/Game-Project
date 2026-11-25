import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DEFAULT_DEPTH, type DepthMethod, order, prepare} from '../kit/depth';
import {type Atmosphere, type Camera3, centroid, dot, type Light, type Look, makeView, type Poly, shade, sub, type V3, type View} from '../kit/space';
import {useLayout} from './layout';

/** Something placed in 3D that draws itself in screen space (characters, orbs, particles, links). */
export interface Sprite {
  /** World anchor used for depth sorting and projection. */
  pos: V3;
  /** Depth bias in metres (negative = drawn in front of things at the same depth). */
  bias?: number;
  /** Billboard size in metres [width, height] standing up from `pos`; lets the depth stage test occlusion. */
  extent?: [number, number];
  render: (p: {x: number; y: number; z: number; scale: number; view: View}) => React.ReactNode;
}

export interface SpaceProps {
  camera: Camera3;
  polys: Poly[];
  sprites?: Sprite[];
  lights: Light[];
  atmosphere: Atmosphere;
  /** Drawn behind everything (sky, void). */
  background?: React.ReactNode;
  /** Depth of field: objects far from `focus` (m) are blurred in bands. */
  dof?: {focus: number; far: number; near: number};
  defs?: React.ReactNode;
  /** Stylized shading (bands + tints). Omit for plain lighting. */
  look?: Look;
  /** Visibility ordering strategy (PROJECT.md ADR 8). */
  depth?: DepthMethod;
}

type Item = {z: number; node: React.ReactNode};

/**
 * Renders a 3D scene of flat-shaded polygons + sprites with true perspective,
 * painter's-algorithm visibility (`kit/depth.ts`), and band-based depth of field.
 */
export const Space: React.FC<SpaceProps> = ({camera, polys, sprites = [], lights, atmosphere, background, dof, defs, look, depth = DEFAULT_DEPTH}) => {
  const {width, height} = useLayout();
  const view = makeView(camera, width, height);
  const prepared = prepare(view, polys, sprites, depth);
  // Shade once per source polygon so subdivided pieces keep the original flat look.
  const fills = new Map<number, string>();
  const fillOf = (source: number) => {
    let fill = fills.get(source);
    if (fill === undefined) {
      const p = polys[source];
      const c = centroid(p.pts);
      const facing = dot(p.n, sub(view.pos, c));
      fill = shade(c, facing > 0 ? p.n : ([-p.n[0], -p.n[1], -p.n[2]] as V3), p.m, lights, view.pos, atmosphere, look);
      fills.set(source, fill);
    }
    return fill;
  };
  const path = (points: [number, number][]) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
  const items: Item[] = order(prepared, depth, view).map((it, i) => {
    if (it.kind === 'sprite') {
      const s = sprites[it.source];
      return {z: it.band, node: <g key={`s${i}`}>{s.render({x: it.x, y: it.y, z: it.z - (s.bias ?? 0), scale: it.scale, view})}</g>};
    }
    const p = polys[it.source];
    const fill = fillOf(it.source);
    const d = path(it.scr) + it.holes.map(path).join('');
    return {z: it.band, node: <path key={`p${i}`} d={d} fillRule={p.holes ? 'evenodd' : undefined} fill={fill} stroke={fill} strokeWidth={0.6} strokeLinejoin="round" opacity={p.opacity} />};
  });
  const far = dof ? items.filter((it) => it.z > dof.focus * 1.7) : [];
  const near = dof ? items.filter((it) => it.z < dof.focus * 0.55) : [];
  const mid = dof ? items.filter((it) => it.z <= dof.focus * 1.7 && it.z >= dof.focus * 0.55) : items;

  return (
    <AbsoluteFill>
      {background}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute'}}>
        <defs>
          {defs}
          {dof && dof.far > 0 && (
            <filter id="space-far" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={dof.far} />
            </filter>
          )}
          {dof && dof.near > 0 && (
            <filter id="space-near" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={dof.near} />
            </filter>
          )}
        </defs>
        <g filter={dof && dof.far > 0 ? 'url(#space-far)' : undefined}>{far.map((it) => it.node)}</g>
        <g>{mid.map((it) => it.node)}</g>
        <g filter={dof && dof.near > 0 ? 'url(#space-near)' : undefined}>{near.map((it) => it.node)}</g>
      </svg>
    </AbsoluteFill>
  );
};
