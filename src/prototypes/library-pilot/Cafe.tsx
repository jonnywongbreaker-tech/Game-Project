/**
 * Library pilot 1 — café interior from library assets (env.cafe-golden-hour + char.adult-reader).
 * Direction only: camera, timing, pose and a few procedural overlays.
 */
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {TextureOverlay} from '../../engine/Texture';
import {ease, keyframes, tween, useTime, wave} from '../../engine/time';
import {assetPath, Picture, Plane, Stage, useAsset} from '../../engine/Stage';
import {AssetPlanes, Puppet, Steam} from './assets';

/** The sip: 0 = mug at chest, 1 = at the lips. */
export const sipCurve = (t: number, at = 1.6) => keyframes(t, [[0, 0], [at, 0], [at + 1.0, 1], [at + 1.9, 1], [at + 2.8, 0], [99, 0]]);
export const sipPose = (t: number, k: number, blinkAt: number[]) => {
  const blink = blinkAt.some((b) => t >= b && t < b + 0.13);
  return {
    rotate: {'arm-near-upper': 40 * k, 'arm-near-fore': 74 * k, head: -9 * k + wave(t, 0.2, 1.2), torso: 0},
    swap: {head: k > 0.7 || blink ? 'eyes-closed' : undefined},
    scale: {torso: 1 + wave(t, 0.25, 0.004)},
  };
};

export const Cafe: React.FC = () => {
  const {t} = useTime();
  const room = useAsset('env.cafe-golden-hour', 'v001');
  const person = useAsset('char.adult-reader', 'v001');
  if (!room || !person) return null;
  const zoom = tween(t, [0, 5], [1.02, 1.1], ease.inOut);
  const x = tween(t, [0, 5], [950, 1060], ease.inOut);
  const k = sipCurve(t);
  const pose = sipPose(t, k, [0.55, 4.55]);
  const armRot = (pose.rotate['arm-near-upper'] ?? 0) + (pose.rotate['arm-near-fore'] ?? 0);
  const seat = (room.points as Record<string, [number, number]>).seat;

  return (
    <AbsoluteFill style={{background: '#F09A6E'}}>
      <Stage camera={{x, y: 540, zoom}}>
        <AssetPlanes asset={room} names={['city', 'room']} extra={{
          room: (
            <>
              {/* Lamp glow and a few dust motes in the window light: small, slow, purposeful */}
              <div style={{position: 'absolute', left: 1325 - 170, top: 255 - 170, width: 340, height: 340, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,226,150,0.55) 0%, rgba(255,190,120,0.18) 45%, rgba(255,170,110,0) 70%)',
                opacity: 0.85 + 0.1 * Math.sin(t * 2.1)}} />
              {Array.from({length: 14}).map((_, i) => (
                <div key={i} style={{position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: '#FFF3D2',
                  left: 520 + random(`dx${i}`) * 650 + wave(t, 0.12, 14, i * 0.3), top: 640 + random(`dy${i}`) * 300 - t * 9,
                  opacity: 0.25 + 0.3 * Math.sin(t * 0.9 + i)}} />
              ))}
              <Puppet asset={person} at={seat} scale={0.286} pose={pose}
                attach={{'arm-near-fore': <Steam t={t} x={70} y={290} size={55} counterRotate={armRot} />}} />
            </>
          ),
        }} />
        <Plane depth={room.planes!['fg-leaves'].depth}>
          <div style={{position: 'absolute', inset: 0, transformOrigin: '0px 1080px', transform: `rotate(${wave(t, 0.14, 0.8)}deg)`}}>
            <Picture src={assetPath(room.id, room.version, room.planes!['fg-leaves'].file)} rect={room.planes!['fg-leaves'].rect} />
          </div>
        </Plane>
      </Stage>
      <TextureOverlay src={`textures/grain-${Math.floor(t * 15) % 4}.png`} opacity={0.05} blend="overlay" />
    </AbsoluteFill>
  );
};
