import React from 'react';
import {AbsoluteFill} from 'remotion';
import {activeLine} from '../../engine/speech';
import {Space, type Sprite} from '../../engine/Space';
import {TextureOverlay} from '../../engine/Texture';
import {tween, useTime} from '../../engine/time';
import {cameraAt, shotAt} from '../../kit/shots';
import {add, hex, lightAt, makeView, normalize, projectPoint, scale, sub, type V3, type View} from '../../kit/space';
import {Archivist, UNITS_PER_M} from '../../themes/cge/Archivist';
import {ChapterMark, Display, Subtitle} from '../../themes/cge/type';
import {
  ARCH, ATMOSPHERE, DIST, heroAt, LINKS, lightsAt, linkEnergy, lonelyDissolve, lonelyParticles, NARRATION, node, NODES, ORB_R, orbEnergy,
  POLYS, SHOTS, shaftMotes, SKY, TITLE_1, TITLE_END,
} from './scene';

const AMBER = '#FFC56B';

/** A glowing memory, drawn at `r` px. `energy` 0..1.5 drives glow; `fade` desaturates. */
const OrbGraphic: React.FC<{x: number; y: number; r: number; energy: number; dim?: number; id: string}> = ({x, y, r, energy, dim = 0, id}) => {
  const e = Math.max(0, energy);
  const rr = Math.max(1.4, r);
  return (
    <g>
      <circle cx={x} cy={y} r={Math.max(rr * (3.5 + e * 3), 12 * e)} fill="url(#orb-glow)" opacity={Math.min(1, e * 0.9)} style={{mixBlendMode: 'screen'}} />
      {e > 0.8 && rr < 6 && <circle cx={x} cy={y} r={Math.max(4, rr * 1.6)} fill="#FFE9C2" opacity={0.85} />}
      <circle cx={x} cy={y} r={rr} fill={dim > 0.5 ? 'url(#orb-dead)' : 'url(#orb-core)'} />
      <circle cx={x} cy={y} r={rr} fill="url(#orb-dead)" opacity={dim} />
      {rr > 6 && <ellipse cx={x - rr * 0.3} cy={y - rr * 0.38} rx={rr * 0.3} ry={rr * 0.17} fill="#fff" opacity={0.85 * (1 - dim)} />}
      <title>{id}</title>
    </g>
  );
};

export const Memory3: React.FC = () => {
  const {t, frame} = useTime();
  const {shot, local, index} = shotAt(SHOTS, t);
  const cam = cameraAt(shot, local);
  const hero = heroAt(t);
  const sprites: Sprite[] = [];

  // carried orb world position (for its light), from the puppet's local frame
  const viewForPlacement = (v: View) => v;
  void viewForPlacement;
  const carriedWorld: V3 | null = hero.held && hero.visible ? [hero.pos[0], (-hero.held[1]) / UNITS_PER_M, hero.pos[2]] : null;
  const lights = lightsAt(t, carriedWorld);

  // ---- the archivist (a lit cut-out in 3D)
  if (hero.visible) {
    sprites.push({
      pos: hero.pos,
      bias: -0.05,
      render: ({x, y, scale: s, view}) => {
        const ahead = projectPoint(view, add(hero.pos, scale(hero.heading, 0.6)));
        const here = projectPoint(view, hero.pos);
        const facing: 1 | -1 = ahead && here && ahead.x < here.x ? -1 : 1;
        const chest: V3 = add(hero.pos, [0, 1.3, 0]);
        const L = lightAt(chest, normalize(sub(view.pos, chest)), lights).map((v) => Math.min(1.35, v)) as [number, number, number];
        const rim = hero.held ? {color: AMBER, strength: 0.9, side: 1 as const} : t > 10 ? {color: AMBER, strength: 0.6, side: -1 as const} : undefined;
        return (
          <Archivist
            j={hero.joints}
            facing={facing}
            scale={s / UNITS_PER_M}
            x={x}
            y={y}
            expression={hero.expression}
            light={{light: L, keySide: 1, rim}}
            velocity={hero.velocity}
            t={t}
            held={hero.held ? {at: hero.held, render: (hx, hy) => <OrbGraphic x={hx} y={hy} r={ORB_R * UNITS_PER_M} energy={0.9 + 0.3 * tween(t, [5.5, 7], [0, 1])} id="held" />} : undefined}
          />
        );
      },
    });
  }

  // ---- memories
  for (const n of NODES) {
    if (n.id === 'new' && t < 9.2) continue;
    const dissolve = n.id === 'lonely' ? lonelyDissolve(t) : 0;
    if (dissolve >= 1) continue;
    const e = orbEnergy(n.id, t);
    sprites.push({
      pos: n.pos,
      bias: -0.3,
      render: ({x, y, scale: s}) => (
        <g opacity={1 - dissolve}>
          <OrbGraphic x={x} y={y} r={ORB_R * s * (1 - dissolve * 0.6)} energy={e} dim={n.id === 'lonely' ? tween(t, [14.4, 15.9], [0, 0.85]) : 0} id={n.id} />
        </g>
      ),
    });
  }

  // ---- links: threads of light that ignite as recall spreads
  for (const [a, b] of LINKS) {
    const A = node(a).pos;
    const B = node(b).pos;
    const e = linkEnergy(a, b, t);
    const mid = add(scale(add(A, B), 0.5), [0, 0, 0]);
    const toCentre = normalize(sub([0, mid[1] + 2, 0], mid));
    const bow = scale(toCentre, Math.min(3, 0.12 * Math.hypot(...(sub(B, A) as [number, number, number]))));
    sprites.push({
      pos: mid,
      bias: 0.5,
      render: ({scale: s, view}) => {
        const pts: string[] = [];
        let ok = true;
        const N = 14;
        const from = (DIST.get(a) ?? 99) <= (DIST.get(b) ?? 99) ? A : B;
        const to = from === A ? B : A;
        const at = (k: number): V3 => {
          const u = 1 - k;
          const c = add(mid, bow);
          return add(add(scale(from, u * u), scale(c, 2 * u * k)), scale(to, k * k));
        };
        for (let i = 0; i <= N; i++) {
          const p = projectPoint(view, at(i / N));
          if (!p) {
            ok = false;
            break;
          }
          pts.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
        }
        if (!ok) return null;
        const w = Math.max(1.1, Math.min(3.2, s * 0.018));
        const tip = e > 0 && e < 1 ? projectPoint(view, at(e)) : null;
        return (
          <g style={{mixBlendMode: 'screen'}}>
            <path d={`M${pts.join('L')}`} stroke={AMBER} strokeWidth={w * (1 + 5 * e)} opacity={0.2 * e} fill="none" strokeLinecap="round" />
            <path d={`M${pts.join('L')}`} stroke={e > 0 ? '#FFE6B8' : '#9FB3BC'} strokeWidth={w * (0.6 + e * 0.8)} opacity={0.12 + 0.7 * e} fill="none" strokeLinecap="round" />
            {tip && <circle cx={tip.x} cy={tip.y} r={w * 3.5} fill="#fff" opacity={0.9} />}
          </g>
        );
      },
    });
  }

  // ---- particles: shaft motes and the dissolving memory
  for (const p of shaftMotes(t)) {
    sprites.push({pos: p.pos, render: ({x, y, scale: s}) => <circle cx={x} cy={y} r={Math.max(0.6, p.size * s)} fill="#FFF1D6" opacity={p.alpha * 0.8} />});
  }
  for (const p of lonelyParticles(t)) {
    sprites.push({
      pos: p.pos,
      bias: -0.5,
      render: ({x, y, scale: s}) => {
        const r = Math.max(0.8, Math.min(5, p.size * s));
        return (
          <g style={{mixBlendMode: 'screen'}}>
            <circle cx={x} cy={y} r={r * 4} fill="url(#orb-glow)" opacity={p.alpha * 0.6} />
            <circle cx={x} cy={y} r={r} fill="#FFE2AE" opacity={p.alpha} />
          </g>
        );
      },
    });
  }

  // ---- volumetric beam from the oculus
  sprites.push({
    pos: [0, ARCH.height * 0.45, 0],
    bias: 2,
    render: ({view}) => {
      const top = projectPoint(view, [0, ARCH.height, 0]);
      const bottom = projectPoint(view, [0, 0, 0]);
      if (!top || !bottom) return null;
      const ax = normalize([bottom.x - top.x, bottom.y - top.y, 0] as V3);
      const px = [-ax[1], ax[0]];
      const wt = 5 * top.scale;
      const wb = 4.4 * bottom.scale;
      const d = `M ${top.x + px[0] * wt} ${top.y + px[1] * wt} L ${top.x - px[0] * wt} ${top.y - px[1] * wt} L ${bottom.x - px[0] * wb} ${bottom.y - px[1] * wb} L ${bottom.x + px[0] * wb} ${bottom.y + px[1] * wb} Z`;
      return (
        <g style={{mixBlendMode: 'screen'}} filter="url(#beam-soft)">
          <defs>
            <linearGradient id="beam" gradientUnits="userSpaceOnUse" x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y}>
              <stop offset="0" stopColor="#FFF4DE" stopOpacity={0.5} />
              <stop offset="1" stopColor="#FFF4DE" stopOpacity={0.16} />
            </linearGradient>
          </defs>
          <path d={d} fill="url(#beam)" />
        </g>
      );
    },
  });

  const view = makeView(cam, 1920, 1080);
  void view;
  const line = activeLine(NARRATION, t, 0.4);
  const fadeIn = tween(t, [0, 0.6], [1, 0]);
  const fadeOut = tween(t, [17.6, 18], [0, 1]);
  const darkenForTitle = tween(t, [16.2, 16.8], [0, 0.35]);

  return (
    <AbsoluteFill style={{background: '#0B1016'}}>
      <Space
        camera={cam}
        polys={POLYS}
        sprites={sprites}
        lights={lights}
        atmosphere={ATMOSPHERE}
        dof={shot.blur && (shot.blur.far > 0 || shot.blur.near > 0) ? {focus: cam.focus, far: shot.blur.far, near: shot.blur.near} : undefined}
        background={<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 0%, ${SKY.top} 0%, ${SKY.mid} 45%, #6C8590 100%)`}} />}
        defs={
          <>
            <radialGradient id="orb-glow">
              <stop offset="0" stopColor={AMBER} stopOpacity={0.85} />
              <stop offset="0.3" stopColor={AMBER} stopOpacity={0.28} />
              <stop offset="1" stopColor={AMBER} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="orb-core" cx="0.38" cy="0.34" r="0.75">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.35" stopColor="#FFF0CF" />
              <stop offset="0.75" stopColor={AMBER} />
              <stop offset="1" stopColor="#D2752B" />
            </radialGradient>
            <radialGradient id="orb-dead" cx="0.38" cy="0.34" r="0.75">
              <stop offset="0" stopColor="#D8DEE4" />
              <stop offset="1" stopColor="#4A5560" />
            </radialGradient>
            <filter id="beam-soft" x="-30%" y="-10%" width="160%" height="120%">
              <feGaussianBlur stdDeviation={14} />
            </filter>
          </>
        }
      />
      {/* grade: cool shadows, warm highlights; vignette; fine grain */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,240,215,0.10) 0%, rgba(30,60,90,0.16) 100%)', mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(6,9,14,0.55) 100%)'}} />
      <TextureOverlay src={`textures/grain-${Math.floor(frame / 2) % 4}.png`} opacity={0.12} blend="overlay" />
      <AbsoluteFill style={{background: '#06090E', opacity: darkenForTitle}} />

      <ChapterMark index={index + 1} label={shot.label} local={local} />
      <Display kicker={TITLE_1.kicker} lines={TITLE_1.lines} start={TITLE_1.start} end={TITLE_1.end} t={t} size={104} top={190} />
      {line && <Subtitle line={line} t={t} />}
      <Display lines={TITLE_END.lines} start={TITLE_END.start} end={TITLE_END.end + 1} t={t} align="center" size={120} top={330} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut)}} />
    </AbsoluteFill>
  );
};

export const MEMORY3_SECONDS = 18;
void hex;
