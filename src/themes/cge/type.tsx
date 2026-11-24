/**
 * Editorial typography system for Cinematic Geometric Editorial:
 * chapter marks, serif display titles, and high-readability subtitles over a
 * soft gradient scrim (no boxes, max two lines, generous size, left-aligned).
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, SERIF} from '../../engine/fonts';
import type {SpeechLine} from '../../engine/speech';
import {ease, tween} from '../../engine/time';

export const INK = '#F6F1E8';
export const ACCENT = '#FFC56B';

export const Scrim: React.FC<{opacity: number}> = ({opacity}) => (
  <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(8,12,18,0.72) 0%, rgba(8,12,18,0.35) 18%, rgba(8,12,18,0) 34%)', opacity}} />
);

export const Subtitle: React.FC<{line: SpeechLine; t: number}> = ({line, t}) => {
  const k = tween(t, [line.start, line.start + 0.35], [0, 1], ease.out) * tween(t, [line.end + 0.1, line.end + 0.4], [1, 0]);
  if (k <= 0) return null;
  return (
    <>
      <Scrim opacity={k} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 0 74px 112px'}}>
        <div style={{opacity: k, transform: `translateY(${(1 - k) * 10}px)`, maxWidth: 1000, fontFamily: FONT, fontWeight: 700, fontSize: 44, lineHeight: 1.28, letterSpacing: -0.2, color: INK, textShadow: '0 2px 18px rgba(0,0,0,0.55)'}}>
          {line.text}
        </div>
      </AbsoluteFill>
    </>
  );
};

export const ChapterMark: React.FC<{index: number; label: string; local: number}> = ({index, label, local}) => {
  const k = tween(local, [0.2, 0.7], [0, 1], ease.out) * tween(local, [2.6, 3.2], [1, 0]);
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{padding: '64px 0 0 112px'}}>
      <div style={{opacity: k, display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: 6, color: INK, textShadow: '0 1px 10px rgba(0,0,0,0.4)'}}>
        <span style={{color: ACCENT}}>{String(index).padStart(2, '0')}</span>
        <span style={{width: 56 * k, height: 2, background: INK, opacity: 0.7}} />
        <span>{label.toUpperCase()}</span>
      </div>
    </AbsoluteFill>
  );
};

/** Large serif statement with a small sans kicker. `align` sets the composition side. */
export const Display: React.FC<{kicker?: string; lines: string[]; start: number; end: number; t: number; align?: 'left' | 'center'; size?: number; top?: number}> = ({kicker, lines, start, end, t, align = 'left', size = 96, top = 150}) => {
  const out = tween(t, [end - 0.5, end], [1, 0]);
  if (t < start || t > end) return null;
  return (
    <AbsoluteFill style={{padding: align === 'left' ? `${top}px 0 0 112px` : `${top}px 0 0 0`, alignItems: align === 'left' ? 'flex-start' : 'center', opacity: out}}>
      {kicker && (
        <div style={{opacity: tween(t, [start, start + 0.5], [0, 1]), fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: 7, color: ACCENT, marginBottom: 22}}>{kicker.toUpperCase()}</div>
      )}
      {lines.map((l, i) => {
        const k = tween(t, [start + 0.25 + i * 0.35, start + 1.05 + i * 0.35], [0, 1], ease.out);
        return (
          <div key={i} style={{overflow: 'hidden', paddingBottom: 6}}>
            <div style={{transform: `translateY(${(1 - k) * 110}%)`, fontFamily: SERIF, fontWeight: 700, fontStyle: i % 2 ? 'italic' : 'normal', fontSize: size, lineHeight: 1.05, letterSpacing: -1, color: i % 2 ? ACCENT : INK, textShadow: '0 4px 30px rgba(0,0,0,0.35)'}}>
              {l}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
