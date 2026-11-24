import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, SERIF} from '../../engine/fonts';
import {blendedArms} from '../../engine/rig';
import {useTime} from '../../engine/time';
import {type PuppetInput, solvePuppet} from '../../kit/puppet';
import type {RGB} from '../../kit/space';
import {LOOK} from '../../themes/cge/identity';
import {ARCHIVIST, type HandPose, Person, PersonHand, type PersonSpec, proportionsFor, randomPerson} from '../../themes/cge/Person';

const LIGHT: RGB = [1.08, 1.02, 0.96];

const Fig: React.FC<{spec: PersonSpec; x: number; y: number; s: number; input?: Partial<PuppetInput>; hands?: {l?: HandPose; r?: HandPose}; expression?: 'neutral' | 'wonder' | 'content' | 'concern' | 'smile'; facing?: 1 | -1}> = ({spec, x, y, s, input, hands, expression, facing = 1}) => {
  const {t} = useTime();
  const j = solvePuppet({t, arms: blendedArms('idle', t), walking: false, walkPhase: 0, seed: spec.height * 10, ...input}, proportionsFor(spec));
  return <Person spec={spec} j={j} facing={facing} scale={s} x={x} y={y} light={LIGHT} look={LOOK} hands={hands} expression={expression} t={t} />;
};

const Label: React.FC<{x: number; y: number; children: React.ReactNode}> = ({x, y, children}) => (
  <div style={{position: 'absolute', left: x, top: y, fontFamily: FONT, fontWeight: 700, fontSize: 18, letterSpacing: 4, color: '#1B2433', opacity: 0.7}}>{children}</div>
);

/** Design sheet for review: portrait, hands, poses and a procedurally varied cast. */
export const CharacterSheet: React.FC = () => {
  const {t} = useTime();
  const cast = Array.from({length: 7}).map((_, i) => randomPerson(`cast-${i}`));
  return (
    <AbsoluteFill style={{background: '#EFE6D6'}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <rect x={0} y={640} width={1920} height={440} fill="#E4D8C3" />
        {/* portrait: head at close-up scale */}
        <defs>
          <clipPath id="portrait"><circle r={200} /></clipPath>
          <clipPath id="handc"><circle r={86} /></clipPath>
        </defs>
        <g transform="translate(290 370)">
          <circle r={200} fill="#D9CBB2" />
          <g clipPath="url(#portrait)">
            <Fig spec={ARCHIVIST} x={-40} y={505 * 3.2} s={3.2} input={{lookAt: [200, -470]}} expression="wonder" />
          </g>
        </g>
        {/* the archivist in poses */}
        <Fig spec={ARCHIVIST} x={640} y={960} s={0.98} />
        <Fig spec={ARCHIVIST} x={820} y={960} s={0.98} input={{walking: true, walkPhase: t * 0.9 + 0.25, velocity: 300}} />
        <Fig spec={ARCHIVIST} x={1000} y={960} s={0.98} input={{ik: {l: {target: [40, -318], weight: 1}, r: {target: [70, -300], weight: 1}}, lookAt: [60, -300]}} hands={{l: 'hold', r: 'hold'}} expression="content" />
        <Fig spec={ARCHIVIST} x={1180} y={960} s={0.98} input={{arms: blendedArms('present', t), lean: -3}} hands={{l: 'open', r: 'open'}} expression="smile" />
        {/* procedurally varied cast */}
        {cast.map((c, i) => (
          <Fig key={i} spec={c} x={1360 + i * 82} y={960} s={0.62} facing={i % 2 ? -1 : 1} input={{seed: i}} expression={i % 3 === 0 ? 'smile' : 'neutral'} />
        ))}
        {/* hand study */}
        {(['relaxed', 'hold', 'open'] as HandPose[]).map((p, i) => (
          <g key={p} transform={`translate(${640 + i * 200} 300)`}>
            <circle r={86} fill="#D9CBB2" />
            <PersonHand x={-34} y={8} angle={-28} scale={2.6} pose={p} skin={ARCHIVIST.skin} light={LIGHT} look={LOOK} />
          </g>
        ))}
      </svg>
      <div style={{position: 'absolute', left: 112, top: 60, fontFamily: SERIF, fontWeight: 700, fontSize: 52, color: '#1B2433'}}>Person v2 · character design</div>
      <div style={{position: 'absolute', left: 112, top: 126, fontFamily: FONT, fontWeight: 700, fontSize: 18, letterSpacing: 5, color: '#E0553A'}}>CINEMATIC GEOMETRIC EDITORIAL · EXPLORATORY</div>
      <Label x={112} y={590}>PORTRAIT</Label>
      <Label x={560} y={410}>HANDS · RELAXED / HOLD / OPEN</Label>
      <Label x={600} y={1000}>THE ARCHIVIST · IDLE / WALK / HOLD / PRESENT</Label>
      <Label x={1340} y={1000}>PROCEDURAL CAST</Label>
    </AbsoluteFill>
  );
};
