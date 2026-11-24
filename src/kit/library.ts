/**
 * Environment kit: modular, data-described scene pieces. Layouts are plain
 * data; every theme supplies its own drawing for each module type.
 */
import {random} from 'remotion';

export interface ShelfSpec {
  x: number;
  /** Top edge (world y). */
  y: number;
  w: number;
  h: number;
  rows: number;
  cols: number;
  seed: string;
  /** Slots kept empty of books (e.g. for orbs), as "row,col". */
  reserved?: string[];
}

export interface Slot {
  row: number;
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Centre of the slot's floor: where an object rests. */
  rest: [number, number];
}

export const SHELF_FRAME = 18;

export function shelfSlots(s: ShelfSpec): Slot[] {
  const innerW = s.w - SHELF_FRAME * 2;
  const innerH = s.h - SHELF_FRAME * 2;
  const sw = innerW / s.cols;
  const sh = innerH / s.rows;
  const out: Slot[] = [];
  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.cols; c++) {
      const x = s.x + SHELF_FRAME + c * sw;
      const y = s.y + SHELF_FRAME + r * sh;
      out.push({row: r, col: c, x, y, w: sw, h: sh - 12, rest: [x + sw / 2, y + sh - 12]});
    }
  }
  return out;
}

export const slotOf = (s: ShelfSpec, row: number, col: number) => shelfSlots(s).find((x) => x.row === row && x.col === col)!;

export interface Book {
  x: number;
  /** Bottom of the book (world y). */
  y: number;
  w: number;
  h: number;
  /** Lean in degrees (only the last book in a row leans). */
  tilt: number;
  /** Index into the theme's book palette. */
  color: number;
  /** Decorative band style 0..2. */
  band: number;
  /** Lying flat in a small stack. */
  flat: boolean;
}

/** Procedurally fills every non-reserved slot with books. Same seed → same shelf. */
export function shelfBooks(s: ShelfSpec): Book[] {
  const books: Book[] = [];
  for (const slot of shelfSlots(s)) {
    if (s.reserved?.includes(`${slot.row},${slot.col}`)) continue;
    const key = `${s.seed}-${slot.row}-${slot.col}`;
    let x = slot.x + 4;
    const end = slot.x + slot.w - 4;
    const gapAt = random(`${key}gap`) < 0.5 ? slot.x + slot.w * (0.45 + random(`${key}gp`) * 0.3) : Infinity;
    let i = 0;
    // A short horizontal stack at the start of some slots.
    if (random(`${key}stack`) < 0.25) {
      const n = 2 + Math.floor(random(`${key}sn`) * 3);
      const w = Math.min(slot.w * 0.45, 70);
      for (let k = 0; k < n; k++) {
        books.push({x, y: slot.y + slot.h - k * 13, w: w - k * 4, h: 12, tilt: 0, color: Math.floor(random(`${key}sc${k}`) * 6), band: 0, flat: true});
      }
      x += w + 6;
    }
    while (x < end - 10) {
      const w = 13 + random(`${key}w${i}`) * 16;
      if (x + w > end) break;
      if (x > gapAt && x < gapAt + 30) {
        x += 26;
        continue;
      }
      const h = slot.h * (0.62 + random(`${key}h${i}`) * 0.34);
      books.push({x, y: slot.y + slot.h, w, h, tilt: 0, color: Math.floor(random(`${key}c${i}`) * 6), band: Math.floor(random(`${key}b${i}`) * 3), flat: false});
      x += w + 1.5;
      i++;
    }
    const last = books[books.length - 1];
    if (last && !last.flat && end - (last.x + last.w) > 18) last.tilt = 12 + random(`${key}t`) * 8;
  }
  return books;
}

/** A placed module. `depth` sets parallax: 0 = far, 1 = stage, >1 = foreground. */
export type Module =
  | {type: 'backdrop'; depth: number}
  | {type: 'window'; depth: number; x: number; y: number; w: number; h: number}
  | {type: 'shelf'; depth: number; spec: ShelfSpec}
  | {type: 'lamp'; depth: number; x: number; y: number; cord: number}
  | {type: 'floor'; depth: number}
  | {type: 'rug'; depth: number; x: number; w: number}
  | {type: 'ladder'; depth: number; x: number; topY: number; lean: number}
  | {type: 'table'; depth: number; x: number; w: number; seed: string}
  | {type: 'plant'; depth: number; x: number; scale: number}
  | {type: 'column'; depth: number; x: number; w: number}
  | {type: 'bookstack'; depth: number; x: number; y: number; seed: string; count: number};

export type ModuleType = Module['type'];
