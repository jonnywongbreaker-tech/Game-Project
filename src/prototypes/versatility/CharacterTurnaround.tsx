import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, SERIF} from '../../engine/fonts';
import {blendedArms} from '../../engine/rig';
import {useTime} from '../../engine/time';
import {type PuppetInput, solvePuppet, type View} from '../../kit/puppet';
import type {RGB} from '../../kit/space';
import {LOOK} from '../../themes/cge/identity';
import {ARCHIVIST, type Expression, type HandPose, Person, PERSON_EXPRESSIONS, type PersonSpec, proportionsFor, randomPerson} from '../../themes/cge/Person';

const LIGHT: RGB = [1.08, 1.02, 0.96];

interface FigProps {
  spec: PersonSpec;
  x: number;
  y: number;
  s: number;
  view?: View;
  input?: Partial<PuppetInput>;
  hands?: {l?: HandPose; r?: HandPose};
  expression?: Expression;
  facing?: 1 | -1;
  /** Place the head centre at (x, y) instead of the feet. */
  headAt?: boolean;
}

const Fig: React.FC<FigProps> = ({spec, x, y, s, view = 'profile', input, hands, expression, facing = 1, headAt}) => {
  const {t} = useTime();
  const j = solvePuppet({t, arms: blendedArms('idle', t), walking: false, walkPhase: 0, seed: spec.height * 10, ...input, view}, proportionsFor(spec));
  const px = headAt ? x - j.head[0] * s * facing : x;
  const py = headAt ? y - j.head[1] * s : y;
  return <Person spec={spec} j={j} view={view} facing={facing} scale={s} x={px} y={py} light={LIGHT} look={LOOK} hands={hands} expression={expression} t={t} />;
};

const Label: React.FC<{x: number; y: number; children: React.ReactNode; center?: boolean}> = ({x, y, children, center}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: center ? 'translateX(-50%)' : undefined, fontFamily: FONT, fontWeight: 700, fontSize: 16, letterSpacing: 4, color: '#1B2433', opacity: 0.7, whiteSpace: 'nowrap'}}>{children}</div>
);

const CELL = 160;
const GRID_X = 1010;
const GRID_Y = 190;

/** Review sheet for Person v2 views and expressions: turnaround, front walk, expression set, cast from the front. */
export const CharacterTurnaround: React.FC = () => {
  const {t} = useTime();
  const cast = Array.from({length: 8}).map((_, i) => randomPerson(`cast-${i}`));
  return (
    <AbsoluteFill style={{background: '#EFE6D6'}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <rect x={0} y={700} width={1920} height={380} fill="#E4D8C3" />
        <defs>
          <clipPath id="exprcell"><circle r={CELL * 0.46} /></clipPath>
        </defs>
        {/* turnaround */}
        <Fig spec={ARCHIVIST} x={170} y={1000} s={0.98} view="front" />
        <Fig spec={ARCHIVIST} x={340} y={1000} s={0.98} view="profile" />
        <Fig spec={ARCHIVIST} x={510} y={1000} s={0.98} view="back" />
        <Fig spec={ARCHIVIST} x={680} y={1000} s={0.98} view="front" input={{walking: true, walkPhase: t * 0.9, velocity: 300}} hands={{l: 'relaxed', r: 'relaxed'}} expression="smile" />
        <Fig spec={ARCHIVIST} x={850} y={1000} s={0.98} view="front" input={{arms: blendedArms('cheer', t)}} hands={{l: 'open', r: 'open'}} expression="laugh" />
        {/* expression set, front view */}
        {PERSON_EXPRESSIONS.map((e, i) => {
          const cx = GRID_X + (i % 5) * CELL + CELL / 2;
          const cy = GRID_Y + Math.floor(i / 5) * (CELL + 40) + CELL / 2;
          return (
            <g key={e} transform={`translate(${cx} ${cy})`}>
              <circle r={CELL * 0.46} fill="#D9CBB2" />
              <g clipPath="url(#exprcell)">
                <Fig spec={ARCHIVIST} x={0} y={14} s={1.45} view="front" expression={e} headAt />
              </g>
            </g>
          );
        })}
        {/* cast, front view */}
        {cast.map((c, i) => (
          <Fig key={i} spec={c} x={1080 + i * 100} y={1000} s={0.56} view={i % 3 === 2 ? 'back' : 'front'} input={{seed: i}} expression={PERSON_EXPRESSIONS[(i * 3) % PERSON_EXPRESSIONS.length]} />
        ))}
      </svg>
      <div style={{position: 'absolute', left: 112, top: 60, fontFamily: SERIF, fontWeight: 700, fontSize: 52, color: '#1B2433'}}>Person v2 · views and expressions</div>
      <div style={{position: 'absolute', left: 112, top: 126, fontFamily: FONT, fontWeight: 700, fontSize: 18, letterSpacing: 5, color: '#E0553A'}}>CINEMATIC GEOMETRIC EDITORIAL · FOR REVIEW</div>
      <Label x={170} y={1030} center>FRONT</Label>
      <Label x={340} y={1030} center>PROFILE</Label>
      <Label x={510} y={1030} center>BACK</Label>
      <Label x={765} y={1030} center>WALK · CHEER</Label>
      {PERSON_EXPRESSIONS.map((e, i) => (
        <Label key={e} x={GRID_X + (i % 5) * CELL + CELL / 2} y={GRID_Y + Math.floor(i / 5) * (CELL + 40) + CELL + 4} center>
          {e.toUpperCase()}
        </Label>
      ))}
      <Label x={1430} y={1030} center>PROCEDURAL CAST · FRONT / BACK</Label>
    </AbsoluteFill>
  );
};
