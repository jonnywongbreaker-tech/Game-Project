/**
 * Person v2 facial expressions as data. One parameter set per expression drives
 * every view (profile, front), so adding an expression never touches drawing code.
 * Units are head-frame units (head radius ≈ 44).
 */
export const PERSON_EXPRESSIONS = ['neutral', 'smile', 'laugh', 'content', 'wonder', 'concern', 'sad', 'angry', 'thinking', 'determined'] as const;
export type Expression = (typeof PERSON_EXPRESSIONS)[number];

export interface FaceParams {
  brow: {
    /** Vertical offset (negative = raised). */
    lift: number;
    /** Degrees; positive drops the inner end (anger, focus), negative raises it (worry, sadness). */
    inner: number;
  };
  eye: {
    /** Vertical opening, 1 = rest. */
    open: number;
    /** 0..1 lower lid pushed up by the cheek (smiling squint). */
    cheek: number;
    /** Pupil offset in eye units, added to the look direction (e.g. thinking looks up and away). */
    gaze?: [number, number];
  };
  mouth: {
    /** Half-width, rest ≈ 6. */
    width: number;
    /** Corner height relative to the centre: positive = corners up (smile), negative = frown. */
    curve: number;
    /** Opening height, 0 = closed line. */
    open: number;
    /** Vertical offset of the mouth. */
    y?: number;
    /** One-sided mouth (smirk, thinking): shifts the curve to one corner, -1..1. */
    skew?: number;
  };
}

export const FACES: Record<Expression, FaceParams> = {
  neutral: {brow: {lift: 0, inner: 0}, eye: {open: 1, cheek: 0}, mouth: {width: 5, curve: 0, open: 0}},
  smile: {brow: {lift: -1.5, inner: -2}, eye: {open: 0.9, cheek: 0.35}, mouth: {width: 6.5, curve: 4, open: 0}},
  laugh: {brow: {lift: -4, inner: -4}, eye: {open: 0.3, cheek: 0.8}, mouth: {width: 7, curve: 3, open: 7}},
  content: {brow: {lift: 0, inner: -2}, eye: {open: 0.25, cheek: 0.5}, mouth: {width: 5.5, curve: 2.5, open: 0}},
  wonder: {brow: {lift: -5, inner: -6}, eye: {open: 1.25, cheek: 0}, mouth: {width: 2.6, curve: 0, open: 4}},
  concern: {brow: {lift: -1, inner: -12}, eye: {open: 1, cheek: 0}, mouth: {width: 4.5, curve: -1.5, open: 0}},
  sad: {brow: {lift: 0, inner: -16}, eye: {open: 0.6, cheek: 0}, mouth: {width: 5, curve: -3, open: 0, y: 1}},
  angry: {brow: {lift: 2.5, inner: 16}, eye: {open: 0.75, cheek: 0.15}, mouth: {width: 5.5, curve: -2, open: 2.5}},
  thinking: {brow: {lift: -2, inner: 6}, eye: {open: 0.8, cheek: 0, gaze: [0.4, -0.7]}, mouth: {width: 4, curve: 0.5, open: 0, skew: 0.8}},
  determined: {brow: {lift: 1.5, inner: 9}, eye: {open: 0.85, cheek: 0.1}, mouth: {width: 5, curve: 0.5, open: 0}},
};

/** Mouth shape while talking (two-frame flap until visemes land). */
export const TALK_OPEN: FaceParams['mouth'] = {width: 4.5, curve: 0.5, open: 5.5};
