import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  type Atmosphere, type Camera3, centroid, clipNear, dot, type Light, type Look, makeView, type Poly, shade, sub, toCamera, toScreen, type V3, type View,
} from '../kit/space';
import {useLayout} from './layout';

/** Something placed in 3D that draws itself in screen space (characters, orbs, particles, links). */
export interface Sprite {
  /** World anchor used for depth sorting and projection. */
  pos: V3;
  /** Depth bias in metres (negative = drawn in front of things at the same depth). */
  bias?: number;
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
  /** Polygons with no back-face culling (e.g. double-sided cutaways, foliage). */
}

type Item = {z: number; node: React.ReactNode};

/**
 * Renders a 3D scene of flat-shaded polygons + sprites with true perspective,
 * painter's-algorithm depth sorting, and band-based depth of field.
 */
export const Space: React.FC<SpaceProps> = ({camera, polys, sprites = [], lights, atmosphere, background, dof, defs, look}) => {
  const {width, height} = useLayout();
  const view = makeView(camera, width, height);
  const items: Item[] = [];

  polys.forEach((p, i) => {
    const c = centroid(p.pts);
    const facing = dot(p.n, sub(view.pos, c));
    if (facing <= 0 && !p.doubleSided) return; // back-face
    const cam = clipNear(p.pts.map((q) => toCamera(view, q)), view.near);
    if (cam.length < 3) return;
    const scr = cam.map((q) => toScreen(view, q));
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of scr) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    if (maxX < -50 || minX > width + 50 || maxY < -50 || minY > height + 50) return;
    const z = cam.reduce((s, q) => s + q[2], 0) / cam.length + (p.bias ?? 0);
    const fill = shade(c, facing > 0 ? p.n : ([-p.n[0], -p.n[1], -p.n[2]] as V3), p.m, lights, view.pos, atmosphere, look);
    const path = (points: [number, number][]) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
    const holes = (p.holes ?? []).map(hole => clipNear(hole.map(q => toCamera(view, q)), view.near))
      .filter(hole => hole.length >= 3).map(hole => path(hole.map(q => toScreen(view, q))));
    const d = path(scr) + holes.join('');
    items.push({z, node: <path key={`p${i}`} d={d} fillRule={p.holes ? 'evenodd' : undefined} fill={fill} stroke={fill} strokeWidth={0.6} strokeLinejoin="round" opacity={p.opacity} />});
  });

  sprites.forEach((s, i) => {
    const c = toCamera(view, s.pos);
    if (c[2] < view.near) return;
    const [x, y] = toScreen(view, c);
    items.push({z: c[2] + (s.bias ?? 0), node: <g key={`s${i}`}>{s.render({x, y, z: c[2], scale: view.focal / c[2], view})}</g>});
  });

  items.sort((a, b) => b.z - a.z);
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
