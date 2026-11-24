/**
 * SPIKE (evaluation only, not part of the engine): renders the same procedural
 * atrium geometry as Memory v3 through Three.js inside Remotion, with toon
 * shading (banded look), a shadow-mapped oculus spotlight and fog, using the
 * same camera move. Used by docs/RENDERER_ASSESSMENT.md to compare cost and
 * capability. Safe to delete.
 */
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {useTime} from '../engine/time';
import {cameraAt, shotAt} from '../kit/shots';
import {POLYS, SHOTS} from '../prototypes/memory3/scene';

function buildGeometry() {
  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  for (const p of POLYS) {
    if (p.m.kind === 'flat') continue;
    c.set(p.m.color);
    for (let i = 1; i < p.pts.length - 1; i++) {
      for (const q of [p.pts[0], p.pts[i], p.pts[i + 1]]) {
        pos.push(q[0], q[1], q[2]);
        col.push(c.r, c.g, c.b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/** 4-step gradient map = the same banded light as our LOOK. */
function toonRamp() {
  const data = new Uint8Array([60, 60, 60, 255, 120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

const Scene: React.FC = () => {
  const {t} = useTime();
  const {shot, local} = shotAt(SHOTS, t);
  const cam = cameraAt(shot, local);
  const geometry = useMemo(buildGeometry, []);
  const ramp = useMemo(toonRamp, []);
  return (
    <>
      <fog attach="fog" args={['#C9D7DB', 15, 120]} />
      <hemisphereLight args={['#C7D8DF', '#7A6855', 0.9]} />
      <directionalLight position={[-5, 40, -8]} intensity={0.5} />
      <spotLight position={[0, 48, 0]} angle={0.12} penumbra={0.5} intensity={900} distance={0} decay={1.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshToonMaterial vertexColors gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <CameraRig pos={cam.pos} target={cam.target} fov={cam.fov} />
    </>
  );
};

const CameraRig: React.FC<{pos: [number, number, number]; target: [number, number, number]; fov: number}> = ({pos, target, fov}) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  camera.position.set(...pos);
  camera.fov = fov;
  camera.near = 0.05;
  camera.far = 400;
  camera.lookAt(...target);
  camera.updateProjectionMatrix();
  return null;
};

export const ThreeAtrium: React.FC = () => {
  const {width, height} = useVideoConfig();
  const {t} = useTime();
  const {shot, local} = shotAt(SHOTS, t);
  const cam = cameraAt(shot, local);
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{position: cam.pos, fov: cam.fov, near: 0.05, far: 400}} gl={{antialias: true}} style={{background: '#C9D7DB'}}>
      <Scene />
    </ThreeCanvas>
  );
};
