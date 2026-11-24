/**
 * Procedural architecture for the Space renderer. Everything is generated from
 * parameters + a seed, so the same generators build any number of different
 * interiors (libraries, archives, atriums, vaults) in any theme palette.
 */
import {random} from 'remotion';
import {add, type Material, type Poly, quad, scale, type V3} from './space';

export interface ArchPalette {
  stone: string;
  stoneDark: string;
  recess: string;
  ledgeTop: string;
  ledgeFront: string;
  floor: string;
  floorInlay: string;
  brass: string;
  ceiling: string;
  books: string[];
}

export interface AtriumSpec {
  sides: number;
  /** Distance from centre to each wall (m). */
  apothem: number;
  levels: number;
  levelHeight: number;
  baysPerWall: number;
  /** Radius of the sky opening in the ceiling. */
  oculus: number;
  /** Levels below this get individual books; above, simplified book blocks. */
  detailLevels: number;
  /** Height of the ground-level shelf (a counter at waist height). */
  groundShelf?: number;
  seed: string;
  palette: ArchPalette;
}

export interface Slot3 {
  /** Where an object rests in the bay (m). */
  pos: V3;
  /** Normal pointing out of the wall into the room. */
  normal: V3;
  wall: number;
  level: number;
  bay: number;
}

export interface Atrium {
  polys: Poly[];
  slots: Slot3[];
  height: number;
  spec: AtriumSpec;
}

const M = (color: string, occlusion = 1, emissive = 0): Material => ({color, occlusion, emissive});

export function atrium(spec: AtriumSpec): Atrium {
  const {sides, apothem: R, levels, levelHeight: LH, baysPerWall: B, palette: P} = spec;
  const polys: Poly[] = [];
  const slots: Slot3[] = [];
  const H = levels * LH;
  const hw = R * Math.tan(Math.PI / sides);
  const recessDepth = 0.6;
  const ledgeDepth = 0.9;

  for (let w = 0; w < sides; w++) {
    const a = (w / sides) * Math.PI * 2;
    const out: V3 = [Math.sin(a), 0, Math.cos(a)];
    const n: V3 = [-out[0], 0, -out[2]];
    const tan: V3 = [Math.cos(a), 0, -Math.sin(a)];
    const C = scale(out, R);
    const at = (s: number, y: number, depth = 0): V3 => add(add(C, scale(tan, s)), add([0, y, 0], scale(out, depth)));

    // pilaster at the left corner of this wall, full height
    polys.push(quad(at(-hw, 0, -0.35), at(-hw + 0.9, 0, -0.35), at(-hw + 0.9, H, -0.35), at(-hw, H, -0.35), n, M(P.stone), -0.02));

    const margin = 0.9;
    const gap = 0.5;
    const bw = (2 * hw - 2 * margin - (B - 1) * gap) / B;

    for (let l = 0; l < levels; l++) {
      const y0 = l * LH;
      const y1 = y0 + LH;
      const shelfY = y0 + (l === 0 ? spec.groundShelf ?? 0.35 : 0.35);
      const topY = y1 - 0.5;
      const key = `${spec.seed}-${w}-${l}`;
      // frame bands between bays (the wall surface)
      polys.push(quad(at(-hw, topY, 0), at(hw, topY, 0), at(hw, y1, 0), at(-hw, y1, 0), n, M(P.stone)));
      polys.push(quad(at(-hw, y0, 0), at(hw, y0, 0), at(hw, shelfY, 0), at(-hw, shelfY, 0), n, M(P.stone)));
      for (let b = 0; b <= B; b++) {
        const s0 = b === 0 ? -hw : -hw + margin + b * bw + (b - 1) * gap;
        const s1 = b === 0 ? -hw + margin : b === B ? hw : s0 + gap;
        polys.push(quad(at(s0, shelfY, 0), at(s1, shelfY, 0), at(s1, topY, 0), at(s0, topY, 0), n, M(P.stone)));
      }
      // recessed bays with real depth: back, floor, ceiling, sides
      for (let b = 0; b < B; b++) {
        const s0 = -hw + margin + b * (bw + gap);
        const s1 = s0 + bw;
        const D = recessDepth;
        polys.push(quad(at(s0, shelfY, D), at(s1, shelfY, D), at(s1, topY, D), at(s0, topY, D), n, M(P.recess, 0.55), 0.3));
        polys.push(quad(at(s0, shelfY, 0), at(s1, shelfY, 0), at(s1, shelfY, D), at(s0, shelfY, D), [0, 1, 0], M(P.ledgeTop, 0.7), 0.2));
        polys.push(quad(at(s0, topY, 0), at(s1, topY, 0), at(s1, topY, D), at(s0, topY, D), [0, -1, 0], M(P.recess, 0.35), 0.2));
        polys.push(quad(at(s0, shelfY, 0), at(s0, topY, 0), at(s0, topY, D), at(s0, shelfY, D), tan, M(P.stoneDark, 0.6), 0.2));
        polys.push(quad(at(s1, shelfY, 0), at(s1, topY, 0), at(s1, topY, D), at(s1, shelfY, D), scale(tan, -1), M(P.stoneDark, 0.6), 0.2));

        // books stand at the back of the bay
        const bd = D - 0.18;
        const bh = topY - shelfY;
        if (l < spec.detailLevels) {
          let s = s0 + 0.05;
          let i = 0;
          while (s < s1 - 0.1) {
            const wd = 0.1 + random(`${key}-${b}-w${i}`) * 0.12;
            if (s + wd > s1 - 0.05) break;
            if (random(`${key}-${b}-g${i}`) < 0.06) {
              s += 0.35;
              i++;
              continue;
            }
            const h = bh * (0.55 + random(`${key}-${b}-h${i}`) * 0.35);
            const col = P.books[Math.floor(random(`${key}-${b}-c${i}`) * P.books.length)];
            polys.push(quad(at(s, shelfY, bd), at(s + wd, shelfY, bd), at(s + wd, shelfY + h, bd), at(s, shelfY + h, bd), n, M(col, 0.85), 0.1));
            s += wd + 0.01;
            i++;
          }
        } else {
          const blocks = 3;
          for (let k = 0; k < blocks; k++) {
            const a0 = s0 + 0.08 + (k * (bw - 0.16)) / blocks;
            const a1 = a0 + (bw - 0.16) / blocks - 0.06;
            const h = bh * (0.6 + random(`${key}-${b}-bh${k}`) * 0.25);
            const col = P.books[Math.floor(random(`${key}-${b}-bc${k}`) * P.books.length)];
            polys.push(quad(at(a0, shelfY, bd), at(a1, shelfY, bd), at(a1, shelfY + h, bd), at(a0, shelfY + h, bd), n, M(col, 0.8), 0.1));
          }
        }
        const mid = (s0 + s1) / 2;
        slots.push({pos: add(at(mid, shelfY + 0.32, 0.12), [0, 0, 0]), normal: n, wall: w, level: l, bay: b});
      }
      // balcony slab projecting into the room (every level but the floor)
      if (l > 0) {
        const t = 0.28;
        polys.push(quad(at(-hw, y0, -ledgeDepth), at(hw, y0, -ledgeDepth), at(hw, y0, 0), at(-hw, y0, 0), [0, 1, 0], M(P.ledgeTop), -0.05));
        polys.push(quad(at(-hw, y0 - t, -ledgeDepth), at(hw, y0 - t, -ledgeDepth), at(hw, y0, -ledgeDepth), at(-hw, y0, -ledgeDepth), n, M(P.ledgeFront), -0.1));
        polys.push(quad(at(-hw, y0 - t, 0), at(hw, y0 - t, 0), at(hw, y0 - t, -ledgeDepth), at(-hw, y0 - t, -ledgeDepth), [0, -1, 0], M(P.stoneDark, 0.5), -0.05));
        // brass rail line on the slab edge
        polys.push(quad(at(-hw, y0 + 0.9, -ledgeDepth + 0.05), at(hw, y0 + 0.9, -ledgeDepth + 0.05), at(hw, y0 + 0.96, -ledgeDepth + 0.05), at(-hw, y0 + 0.96, -ledgeDepth + 0.05), n, M(P.brass, 1, 0.2), -0.12));
      }
    }
  }

  // floor and inlay rings (a target / iris motif)
  const Rc = R / Math.cos(Math.PI / sides);
  const ring = (r0: number, r1: number, segs: number, m: Material, bias: number, y = 0) => {
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      const p = (r: number, a: number): V3 => [Math.sin(a) * r, y, Math.cos(a) * r];
      polys.push(quad(p(r1, a0), p(r1, a1), p(r0, a1), p(r0, a0), [0, y > 0 ? -1 : 1, 0], m, bias));
    }
  };
  // Floor and ceiling are huge planes whose centroid depth is meaningless for
  // sorting; a large bias keeps them behind everything that stands on/under them.
  ring(0, Rc + 1, sides, M(P.floor), 200);
  ring(5.2, 5.5, 48, M(P.floorInlay), 199);
  ring(3.4, 3.55, 48, M(P.brass, 1, 0.1), 199);
  ring(0, 1.2, 24, M(P.floorInlay), 199);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const p = (r: number, da: number): V3 => [Math.sin(a + da) * r, 0, Math.cos(a + da) * r];
    polys.push(quad(p(1.4, -0.03), p(1.4, 0.03), p(3.3, 0.012), p(3.3, -0.012), [0, 1, 0], M(P.floorInlay), 199));
  }
  // ceiling with an oculus
  ring(spec.oculus, Rc + 1, 32, M(P.ceiling, 0.6), 200, H);
  ring(spec.oculus, spec.oculus + 0.4, 32, M(P.brass, 1, 0.35), 199, H - 0.05);

  return {polys, slots, height: H, spec};
}

/** A leaning ladder (two rails + rungs) facing `n`. */
export function ladder(base: V3, top: V3, n: V3, side: V3, width: number, m: Material, rungs = 30): Poly[] {
  const polys: Poly[] = [];
  const rail = 0.08;
  for (const o of [0, width]) {
    const b0 = add(base, scale(side, o));
    const t0 = add(top, scale(side, o));
    polys.push(quad(b0, add(b0, scale(side, rail)), add(t0, scale(side, rail)), t0, n, m, -0.2));
  }
  for (let i = 1; i < rungs; i++) {
    const k = i / rungs;
    const p = add(base, scale(add(top, scale(base, -1)), k));
    polys.push(quad(p, add(p, scale(side, width)), add(add(p, scale(side, width)), [0, 0.06, 0]), add(p, [0, 0.06, 0]), n, m, -0.21));
  }
  return polys;
}
