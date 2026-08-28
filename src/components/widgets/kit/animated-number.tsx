"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

const DURATION = 320;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Eases to a new value so the reader sees the number *move* when they drag a slider — the change
 * is the lesson. Under reduced motion it snaps. The rendered text is `aria-live="polite"` so a
 * screen reader hears the settled figure rather than every intermediate frame.
 */
export function AnimatedNumber({ value, format, className, testId }: { value: number; format: (n: number) => string; className?: string; testId?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // Under reduced motion nothing animates: the render below reads `value` directly, so the ref
    // only needs to stay in step for when the setting is turned back off.
    if (reduced) {
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const next = from + (value - from) * easeOut(t);
      setShown(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, reduced]);

  return (
    <span className={className} data-testid={testId} aria-live="polite">
      {format(reduced ? value : shown)}
    </span>
  );
}
