"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { money, mult, pct, price, spokenValue } from "./fmt";

export type SliderUnit = "£m" | "£" | "%" | "×" | "m" | "y" | "";

/** Default on-screen rendering of a value for each unit. */
function defaultDisplay(value: number, unit: SliderUnit): string {
  switch (unit) {
    case "£m":
      return money(value);
    case "£":
      return price(value);
    case "%":
      return pct(value);
    case "×":
      return mult(value);
    case "m":
      return `${value.toLocaleString("en-GB")}m`;
    case "y":
      return `${value} ${value === 1 ? "year" : "years"}`;
    default:
      return String(value);
  }
}

export type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: SliderUnit;
  onChange: (value: number) => void;
  /** Goes on the range input, so Playwright's `fill()` drives the slider directly. */
  testId?: string;
  /** Override the on-screen value text (the paired numeric input is unaffected). */
  display?: (value: number) => string;
  /** Override the screen-reader text; defaults to "<label> <value with units>". */
  valueText?: (value: number) => string;
  className?: string;
};

/**
 * Native range input plus a paired numeric field (Loop 11 widget kit).
 *
 * Native `<input type="range">` gives keyboard support (arrows, Home/End, PageUp/Down) and screen
 * reader semantics for free; `aria-valuetext` replaces the bare number with plain English so the
 * unit is spoken. The numeric field is the precise, mobile-friendly path to the same state.
 */
export function Slider({ label, value, min, max, step = 1, unit = "", onChange, testId, display, valueText, className }: SliderProps) {
  const id = useId();
  const shown = display ? display(value) : defaultDisplay(value, unit);
  const spoken = valueText ? valueText(value) : `${label} ${spokenValue(value, unit)}`;

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <div className={cn("flex flex-col gap-1 text-xs text-muted", className)}>
      <label htmlFor={`${id}-range`} className="flex items-baseline justify-between gap-2">
        <span>{label}</span>
        <span className="font-mono text-fg">{shown}</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          id={`${id}-range`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={spoken}
          onChange={(e) => onChange(Number(e.target.value))}
          data-testid={testId}
          className="flex-1 accent-[var(--accent)]"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={`${label} (type a value)`}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(clamp(n));
          }}
          className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-right font-mono text-xs text-fg"
        />
      </div>
    </div>
  );
}
