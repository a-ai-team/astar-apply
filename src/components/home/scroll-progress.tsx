"use client";

// Writes `--scroll-p` (0 → 1 as the element scrolls out of the top of the viewport) onto the
// element itself, so parallax and fades stay in CSS. One passive listener, rAF-coalesced.
import { useEffect, useRef, type HTMLAttributes } from "react";

export function heroProgress(top: number, height: number): number {
  if (height <= 0) return 0;
  return Math.min(1, Math.max(0, -top / height));
}

export function ScrollStage({ children, ...rest }: HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--scroll-p", heroProgress(r.top, r.height).toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return (
    <section ref={ref} {...rest}>
      {children}
    </section>
  );
}
