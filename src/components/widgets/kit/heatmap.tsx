import { cn } from "@/lib/cn";

export type HeatmapProps = {
  /** `cells[row][col]`; `null` renders as "n/a" (e.g. growth ≥ WACC, which is itself the lesson). */
  cells: (number | null)[][];
  rowLabels: string[];
  colLabels: string[];
  rowTitle: string;
  colTitle: string;
  format: (n: number) => string;
  /** Outlined cell — where the reader's sliders currently sit. */
  highlight?: { row: number; col: number };
  ariaLabel: string;
};

/**
 * Two-variable sensitivity table (Loop 11 kit). An HTML table rather than SVG: the data *is*
 * tabular, so screen readers and keyboard users get it for free, and the colour is decoration
 * layered on top of a readable number.
 */
export function Heatmap({ cells, rowLabels, colLabels, rowTitle, colTitle, format, highlight, ariaLabel }: HeatmapProps) {
  const values = cells.flat().filter((v): v is number => v !== null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const shade = (v: number) => (max === min ? 0.18 : 0.06 + ((v - min) / (max - min)) * 0.3);

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-center text-xs" aria-label={ariaLabel}>
        <caption className="sr-only">{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col" className="p-1.5 text-left font-normal text-muted">
              {rowTitle} \ {colTitle}
            </th>
            {colLabels.map((c) => (
              <th key={c} scope="col" className="p-1.5 font-mono font-normal text-muted">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((row, r) => (
            <tr key={rowLabels[r]}>
              <th scope="row" className="p-1.5 text-left font-mono font-normal text-muted">
                {rowLabels[r]}
              </th>
              {row.map((v, c) => {
                const on = highlight?.row === r && highlight?.col === c;
                return (
                  <td
                    key={c}
                    data-testid="heatmap-cell"
                    aria-current={on ? "true" : undefined}
                    className={cn("p-1.5 font-mono tabular-nums transition-colors", on && "outline outline-2 -outline-offset-2 outline-accent font-semibold")}
                    style={v === null ? undefined : { backgroundColor: `color-mix(in srgb, var(--accent) ${(shade(v) * 100).toFixed(0)}%, transparent)` }}
                  >
                    {v === null ? <span className="text-muted">n/a</span> : format(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
