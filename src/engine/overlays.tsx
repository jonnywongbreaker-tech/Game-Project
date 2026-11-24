import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT} from './fonts';
import {useLayout} from './layout';
import {activeLine, NARRATOR, SpeechLine} from './speech';
import {ease, tween, useTime} from './time';

export interface Speaker {
  name: string;
  color: string;
}

/**
 * Burned-in subtitles. Character lines get a coloured name tag; narrator
 * lines use a bold caption style with word-by-word highlighting (great for Shorts).
 */
export const Subtitles: React.FC<{lines: SpeechLine[]; speakers: Record<string, Speaker>}> = ({lines, speakers}) => {
  const {t} = useTime();
  const {vertical, u, height} = useLayout();
  const line = activeLine(lines, t);
  if (!line) return null;
  const narrator = line.who === NARRATOR;
  const speaker = speakers[line.who];
  const appear = tween(t - line.start, [0, 0.18], [0, 1], ease.out);
  const leave = tween(t, [line.end + 0.1, line.end + 0.3], [1, 0], ease.in);
  const fontSize = (vertical ? 60 : 46) * u * (narrator ? 1.12 : 1);

  return (
    <AbsoluteFill
      style={{
        justifyContent: vertical ? 'flex-start' : 'flex-end',
        alignItems: 'center',
        paddingTop: vertical ? height * 0.8 : 0,
        paddingBottom: vertical ? 0 : 60 * u,
        opacity: appear * leave,
      }}
    >
      <div
        style={{
          maxWidth: vertical ? '86%' : '76%',
          transform: `scale(${0.92 + 0.08 * appear})`,
          background: narrator ? 'transparent' : 'rgba(25, 20, 35, 0.78)',
          borderRadius: 22 * u,
          padding: narrator ? 0 : `${16 * u}px ${30 * u}px`,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: narrator ? 900 : 700,
          fontSize,
          lineHeight: 1.22,
          color: '#fff',
          textShadow: narrator ? `0 ${4 * u}px 0 #1b1424, 0 0 ${18 * u}px rgba(0,0,0,0.55)` : 'none',
          WebkitTextStroke: narrator ? `${2 * u}px #1b1424` : undefined,
        }}
      >
        {!narrator && speaker && (
          <div style={{fontSize: fontSize * 0.55, fontWeight: 900, color: speaker.color, letterSpacing: 1, marginBottom: 4 * u}}>
            {speaker.name.toUpperCase()}
          </div>
        )}
        {line.words.map((w, i) => {
          const spoken = t >= w.start;
          const current = t >= w.start && t <= w.end + 0.05;
          return (
            <span
              key={i}
              style={{
                opacity: spoken ? 1 : 0.42,
                color: narrator && current ? '#ffd84d' : undefined,
              }}
            >
              {w.text}{' '}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export type CaptionStyle = 'title' | 'big' | 'note';

/** On-screen text: chapter titles, punchy explainer words, or small notes. */
export const Caption: React.FC<{
  text: string;
  start: number;
  end: number;
  style?: CaptionStyle;
  accent?: string;
}> = ({text, start, end, style = 'big', accent = '#ff7a3d'}) => {
  const {t} = useTime();
  const {vertical, u} = useLayout();
  if (t < start || t > end) return null;
  const inK = tween(t - start, [0, 0.4], [0, 1], ease.back);
  const out = tween(t, [end - 0.3, end], [1, 0], ease.in);

  if (style === 'note') {
    return (
      <AbsoluteFill style={{padding: 50 * u, alignItems: 'flex-start', justifyContent: 'flex-start', opacity: out}}>
        <div
          style={{
            transform: `translateX(${(1 - inK) * -60 * u}px)`,
            opacity: inK,
            background: '#fff',
            borderLeft: `${12 * u}px solid ${accent}`,
            borderRadius: 12 * u,
            padding: `${14 * u}px ${24 * u}px`,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 38 * u,
            color: '#231b2e',
            boxShadow: `0 ${8 * u}px 0 rgba(0,0,0,0.15)`,
            marginTop: vertical ? 120 * u : 0,
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    );
  }

  if (style === 'title') {
    return (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: out}}>
        <div
          style={{
            transform: `scale(${inK}) rotate(${-2 + (1 - inK) * -6}deg)`,
            background: accent,
            color: '#fff',
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: (vertical ? 92 : 110) * u,
            padding: `${24 * u}px ${56 * u}px`,
            borderRadius: 28 * u,
            border: `${8 * u}px solid #fff`,
            boxShadow: `0 ${14 * u}px 0 rgba(0,0,0,0.22)`,
            textAlign: 'center',
            maxWidth: '84%',
            lineHeight: 1.05,
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: (vertical ? 260 : 90) * u, opacity: out}}>
      <div
        style={{
          transform: `scale(${inK})`,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: (vertical ? 120 : 130) * u,
          color: '#fff',
          WebkitTextStroke: `${5 * u}px #1b1424`,
          paintOrder: 'stroke fill',
          textShadow: `0 ${10 * u}px 0 #1b1424`,
          textAlign: 'center',
          maxWidth: '90%',
          lineHeight: 1.0,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Dip-to-black between scenes. `cuts` are scene boundary times. */
export const SceneFades: React.FC<{cuts: number[]; total: number}> = ({cuts, total}) => {
  const {t} = useTime();
  let o = tween(t, [0, 0.35], [1, 0], ease.out);
  for (const c of cuts) {
    if (Math.abs(t - c) < 0.3) o = Math.max(o, 1 - Math.abs(t - c) / 0.3);
  }
  o = Math.max(o, tween(t, [total - 0.5, total], [0, 1], ease.in));
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: '#000', opacity: o}} />;
};
