import { money } from "./fmt";

export type Segment = { label: string; value: number; colour?: string };

const PALETTE = ["var(--accent)", "#6fbf8a", "#d8a657", "var(--danger)", "var(--muted)"];

/**
 * One horizontal stacked bar (Loop 11 kit) — "where did the value come from?" in a single row.
 * Used for LBO return attribution and the terminal-value share of a DCF. Negative segments are
 * dropped from the bar but kept in the legend, where their sign is the point.
 */
export function StackedBar({ segments, ariaLabel, format = money, height = 28 }: { segments: Segment[]; ariaLabel: string; format?: (n: number) => string; height?: number }) {
  const positive = segments.filter((s) => s.value > 0);
  const total = positive.reduce((s, x) => s + x.value, 0);

  return (
    <div className="mt-3">
      <div className="flex w-full overflow-hidden rounded-md" style={{ height }} role="img" aria-label={ariaLabel}>
        {positive.map((s, i) => (
          <div
            key={s.label}
            title={`${s.label}: ${format(s.value)}`}
            style={{ width: `${total === 0 ? 0 : (s.value / total) * 100}%`, backgroundColor: s.colour ?? PALETTE[i % PALETTE.length], transition: "width 300ms ease" }}
          />
        ))}
      </div>
      <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.colour ?? PALETTE[i % PALETTE.length] }} />
            <span className="text-muted">{s.label}</span>
            <span className="ml-auto font-mono text-fg">{format(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
