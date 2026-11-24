/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb color. amt in -1..1. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = (v: number) => {
    const out = amt < 0 ? v * (1 + amt) : v + (255 - v) * amt;
    return Math.round(Math.max(0, Math.min(255, out)));
  };
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
