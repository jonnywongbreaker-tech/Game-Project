/**
 * Minimal 2.5D compositor for library assets (docs/ASSET_STRATEGY.md, pilot).
 *
 * - `useAsset(id, version)` loads an asset manifest from the external library
 *   (served at `library/` through a local link; see .gitignore).
 * - `<Stage>` is a 1920×1080 world seen through a camera (focus, zoom), with the same
 *   parallax maths as `Camera.depthTransform`: a plane at depth d moves d times the camera.
 * - `<Plane>` places one bitmap (or any children) in world coordinates at a depth.
 * - `<Part>` is a cut-out piece with a pivot; children are positioned in its pixel space,
 *   so moving a parent moves everything attached to it.
 * Uses Remotion's <Img>, so rendering waits for every image to load.
 */
import React, {createContext, useContext, useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, Img, staticFile} from 'remotion';

export type Pt = [number, number];

export interface PlaneSpec {
  /** File relative to the asset version folder. */
  file: string;
  /** Default parallax depth: 0 fixed, 1 the stage, >1 foreground. */
  depth: number;
  /** World rectangle the image covers (x, y, width, height) in 1920×1080 stage units. */
  rect: [number, number, number, number];
}
export interface PartSpec {
  file: string;
  /** Pivot in the part's own pixels. */
  pivot: Pt;
  /** Where the pivot sits in the parent's pixels (or, for the root, in stage units). */
  at: Pt;
  parent?: string;
  /** Drawn order among siblings and the parent (lower first). */
  z?: number;
}
export interface AssetManifest {
  id: string;
  version: string;
  family: string;
  kind: 'png-layers' | 'svg' | 'procedural';
  planes?: Record<string, PlaneSpec>;
  parts?: Record<string, PartSpec>;
  points?: Record<string, Pt>;
  scale?: number;
  [key: string]: unknown;
}

export const assetPath = (id: string, version: string, file = 'asset.json') => {
  const [family, name] = id.split('.');
  return `library/assets/${family}/${name}/${version}/${file}`;
};

/** Load a manifest once (blocks rendering until it arrives). */
export function useAsset(id: string, version: string): AssetManifest | null {
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [handle] = useState(() => delayRender(`asset ${id}@${version}`));
  useEffect(() => {
    fetch(staticFile(assetPath(id, version)))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${id}@${version}: HTTP ${r.status}`))))
      .then((m: AssetManifest) => { setManifest(m); continueRender(handle); })
      .catch((e) => cancelRender(e));
  }, [id, version, handle]);
  return manifest;
}

type Cam = {x: number; y: number; zoom: number; roll?: number};
const StageCtx = createContext<Cam>({x: 960, y: 540, zoom: 1});
const W = 1920, H = 1080;

/** A world seen through a camera; children are <Plane>s. */
export const Stage: React.FC<{camera: Cam; background?: string; children: React.ReactNode}> = ({camera, background, children}) => (
  <AbsoluteFill style={{background, overflow: 'hidden'}}>
    <StageCtx.Provider value={camera}>{children}</StageCtx.Provider>
  </AbsoluteFill>
);

/** Something placed in world units at a parallax depth. */
export const Plane: React.FC<{depth: number; children: React.ReactNode; style?: React.CSSProperties}> = ({depth, children, style}) => {
  const c = useContext(StageCtx);
  const s = 1 + (c.zoom - 1) * depth;
  const cx = W / 2 + (c.x - W / 2) * depth;
  const cy = H / 2 + (c.y - H / 2) * depth;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0',
      transform: `translate(${W / 2}px, ${H / 2}px) rotate(${c.roll ?? 0}deg) scale(${s}) translate(${-cx}px, ${-cy}px)`, ...style}}>
      {children}
    </div>
  );
};

/** A bitmap covering a world rectangle. */
export const Picture: React.FC<{src: string; rect: [number, number, number, number]; style?: React.CSSProperties}> = ({src, rect, style}) => (
  <Img src={staticFile(src)} style={{position: 'absolute', left: rect[0], top: rect[1], width: rect[2], height: rect[3], ...style}} />
);

/**
 * A cut-out part: its image is placed so `pivot` (its own pixels) lands on `at`
 * (parent pixels), then rotated/scaled about the pivot. Children use this part's pixels.
 */
export const Part: React.FC<{src: string; pivot: Pt; at: Pt; size: Pt; rotate?: number; scale?: number; offset?: Pt; opacity?: number; children?: React.ReactNode; behind?: React.ReactNode}> = ({src, pivot, at, size, rotate = 0, scale = 1, offset = [0, 0], opacity, children, behind}) => (
  <div style={{position: 'absolute', left: at[0] - pivot[0] + offset[0], top: at[1] - pivot[1] + offset[1], width: size[0], height: size[1],
    transformOrigin: `${pivot[0]}px ${pivot[1]}px`, transform: `rotate(${rotate}deg) scale(${scale})`, opacity}}>
    {behind}
    <Img src={staticFile(src)} style={{position: 'absolute', left: 0, top: 0, width: size[0], height: size[1]}} />
    {children}
  </div>
);
