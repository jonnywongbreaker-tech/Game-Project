/** Who speaks a line. Use NARRATOR for an off-screen voice (faceless/explainer style). */
export const NARRATOR = 'narrator';

export interface Word {
  text: string;
  start: number;
  end: number;
}

export interface SpeechLine {
  who: string;
  text: string;
  start: number;
  end: number;
  audio?: string;
  words: Word[];
}

/** Characters per second for estimated (no audio yet) timing. ~15 is natural speech. */
export const DEFAULT_CPS = 15;

export const estimateDuration = (text: string, cps = DEFAULT_CPS) => Math.max(0.9, text.length / cps + 0.25);

/**
 * Spread words across [start, end], weighting by length and leaving short
 * silent gaps after punctuation so mouths close between phrases.
 */
export function wordTimings(text: string, start: number, end: number): Word[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  const weights = tokens.map((w) => ({talk: w.length + 1, gap: /[,;:]$/.test(w) ? 2 : /[.!?…]$/.test(w) ? 3.5 : 0.3}));
  const total = weights.reduce((s, w) => s + w.talk + w.gap, 0) || 1;
  const unit = (end - start) / total;
  let cursor = start;
  return tokens.map((text, i) => {
    const s = cursor;
    const e = s + weights[i].talk * unit;
    cursor = e + weights[i].gap * unit;
    return {text, start: s, end: e};
  });
}

export function isTalking(lines: SpeechLine[], who: string, t: number): boolean {
  for (const l of lines) {
    if (l.who !== who || t < l.start || t > l.end) continue;
    return l.words.some((w) => t >= w.start && t <= w.end);
  }
  return false;
}

/** The line on screen at time t (kept briefly after it ends so subtitles don't flicker). */
export function activeLine(lines: SpeechLine[], t: number, hold = 0.3): SpeechLine | undefined {
  let found: SpeechLine | undefined;
  for (const l of lines) if (t >= l.start && t <= l.end + hold) found = l;
  return found;
}

/** Most recent on-screen (non-narrator) speaker at or before t. */
export function lastSpeaker(lines: SpeechLine[], t: number): {who: string; since: number; previous?: string} | undefined {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].who !== NARRATOR && lines[i].start <= t) idx = i;
  if (idx < 0) return undefined;
  let prev: string | undefined;
  for (let i = idx - 1; i >= 0; i--) if (lines[i].who !== NARRATOR && lines[i].who !== lines[idx].who) { prev = lines[i].who; break; }
  return {who: lines[idx].who, since: t - lines[idx].start, previous: prev};
}
