// Pure scale helpers for hand-drawn SVG widgets (Loop 11). Deliberately tiny — the alternative is
// a charting dependency, and every widget here is a few hundred DOM nodes at most.

export type Scale = ((value: number) => number) & { domain: [number, number]; range: [number, number]; invert: (px: number) => number };

/** Maps a value in `domain` onto `range`. A zero-width domain maps everything to the range start. */
export function linearScale({ domain, range }: { domain: [number, number]; range: [number, number] }): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const fn = ((value: number) => (span === 0 ? r0 : r0 + ((value - d0) / span) * (r1 - r0))) as Scale;
  fn.domain = domain;
  fn.range = range;
  fn.invert = (px: number) => (r1 === r0 ? d0 : d0 + ((px - r0) / (r1 - r0)) * span);
  return fn;
}

/** Round, human-looking tick values covering [min, max] — roughly `count` of them. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min];
  const span = max - min;
  const rawStep = span / Math.max(1, count - 1);
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(rawStep)));
  const normalised = rawStep / magnitude;
  const step = (normalised >= 5 ? 10 : normalised >= 2 ? 5 : normalised >= 1 ? 2 : 1) * magnitude;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step / 1e6; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}
