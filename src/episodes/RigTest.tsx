import React from 'react';
import {Backdrop} from '../engine/Backdrop';
import {Camera} from '../engine/Camera';
import {Character} from '../engine/Character';
import {CAST_PRESETS} from '../engine/designs';
import {defineCodeEpisode} from '../engine/episode';
import {FONT} from '../engine/fonts';
import {GROUND} from '../engine/layout';
import {useTime} from '../engine/time';
import {EXPRESSIONS, POSES} from '../engine/vocab';

/**
 * Code-episode example + visual QA sheet: every preset cycling through every
 * pose and expression. Render it after touching the character rig.
 */
const RigTestScene: React.FC = () => {
  const {t} = useTime();
  const cast = Object.values(CAST_PRESETS);
  const i = Math.floor(t / 1.5);
  return (
    <Camera zoom={0.78}>
      <Backdrop name="studio" tint="#9bd0ff" />
      {cast.map((d, ci) => {
        const pose = POSES[(i + ci) % POSES.length];
        const expression = EXPRESSIONS[(i + ci) % EXPRESSIONS.length];
        const x = 160 + ci * 400;
        return (
          <g key={d.name}>
            <Character design={d} x={x} y={GROUND} pose={pose} expression={expression} talking={t % 3 < 1.5} facing={ci % 2 ? -1 : 1} />
            <text x={x} y={GROUND + 80} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#1b1424">
              {d.name}
            </text>
            <text x={x} y={GROUND + 130} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill="#1b1424">
              {pose} · {expression}
            </text>
          </g>
        );
      })}
    </Camera>
  );
};

export const rigTest = defineCodeEpisode({
  id: 'RigTest',
  title: 'Rig test',
  duration: 12,
  component: RigTestScene,
});
