// Formatting helpers shared by every Technicals widget (Loop 11). British conventions throughout:
// £m with a thousands separator, a true minus sign (−) rather than a hyphen, and × for multiples.
// Keep this file free of React so widgets and pure maths can both import it.

/** `£1,530m` · `−£120m`. `dp` controls decimals (0 by default — the EV bridge rounds to whole £m). */
export function money(n: number, dp = 0): string {
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return `${sign}£${abs}m`;
}

/** `+£2.5m` / `−£10m` — deltas, where the sign is the point. */
export function signed(n: number, dp = 1): string {
  const rounded = Number(n.toFixed(dp));
  const trimmed = Number.isInteger(rounded) ? 0 : dp;
  return `${rounded >= 0 ? "+" : "−"}£${Math.abs(rounded).toLocaleString("en-GB", { minimumFractionDigits: trimmed, maximumFractionDigits: dp })}m`;
}

/** 0.095 → `9.5%`. */
export function pct(n: number, dp = 1): string {
  return `${(n * 100).toFixed(dp)}%`;
}

/** 9 → `9.0×`. */
export function mult(n: number, dp = 1): string {
  return `${n.toFixed(dp)}×`;
}

/** £4.20 — a share price, not a £m figure. */
export function price(n: number): string {
  return `${n < 0 ? "−" : ""}£${Math.abs(n).toFixed(2)}`;
}

/** Plain-English value for `aria-valuetext`, so a screen reader hears units, not a bare number. */
export function spokenValue(value: number, unit?: string): string {
  switch (unit) {
    case "£m":
      return `${value < 0 ? "minus " : ""}${Math.abs(value).toLocaleString("en-GB")} million pounds`;
    case "£":
      return `${value.toFixed(2)} pounds`;
    case "%":
      return `${(value * 100).toFixed(1)} percent`;
    case "×":
      return `${value.toFixed(1)} times`;
    case "m":
      return `${value.toLocaleString("en-GB")} million`;
    default:
      return unit ? `${value} ${unit}` : `${value}`;
  }
}
