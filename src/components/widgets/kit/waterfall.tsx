import { money } from "./fmt";

export type WaterfallRow = {
  label: string;
  /** Bar size: the total for `start`/`end`, the step for `add`/`subtract`. */
  value: number;
  kind: "start" | "add" | "subtract" | "end";
  /** Cumulative total after this row — where an `add`/`subtract` bar floats to. */
  running: number;
};

const W = 640;
const H = 240;
const PAD_L = 10;
const PAD_B = 34;
const PAD_T = 20;

/**
 * Floating-bar waterfall (Loop 11 kit). Hand-drawn SVG with CSS transitions — no charting
 * dependency. Totals are full-height columns from zero; steps float on the running total.
 */
export function Waterfall({ rows, ariaLabel, format = money }: { rows: WaterfallRow[]; ariaLabel: string; format?: (n: number) => string }) {
  const segments = rows.map((r) => {
    const end = r.kind === "start" || r.kind === "end" ? r.value : r.running;
    const start = r.kind === "start" || r.kind === "end" ? 0 : r.running - r.value;
    return { ...r, lo: Math.min(start, end), hi: Math.max(start, end) };
  });

  const maxY = Math.max(1, ...segments.map((s) => s.hi));
  const minY = Math.min(0, ...segments.map((s) => s.lo));
  const plotH = H - PAD_B - PAD_T;
  const y = (v: number) => PAD_T + plotH - ((v - minY) / (maxY - minY)) * plotH;
  const colW = (W - PAD_L * 2) / Math.max(1, segments.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" role="img" aria-label={ariaLabel}>
      <line x1={PAD_L} x2={W - PAD_L} y1={y(0)} y2={y(0)} stroke="var(--border)" />
      {segments.map((s, i) => {
        const x = PAD_L + i * colW + colW * 0.15;
        const w = colW * 0.7;
        const top = y(s.hi);
        const bottom = y(s.lo);
        const isTotal = s.kind === "start" || s.kind === "end";
        const fill = isTotal ? "var(--accent)" : s.value >= 0 ? "#6fbf8a" : "var(--danger)";
        return (
          <g key={`${s.label}-${i}`}>
            <rect x={x} y={top} width={w} height={Math.max(1, bottom - top)} fill={fill} rx={3} style={{ transition: "y 300ms ease, height 300ms ease" }} />
            <text x={x + w / 2} y={top - 5} textAnchor="middle" fontSize="11" fill="var(--fg)" style={{ transition: "y 300ms ease" }}>
              {format(s.value)}
            </text>
            <text x={x + w / 2} y={H - PAD_B + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
