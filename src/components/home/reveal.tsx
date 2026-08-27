"use client";

// Once-only scroll reveal. Markup ships visible; `[data-js] [data-reveal]` (globals.css) hides it
// only after the landing wrapper is marked by JS, and `data-in` flips it back when it scrolls into
// view. Stagger with `delay`; lift distance with `y`. Under prefers-reduced-motion the CSS is inert.
import { useEffect, useRef, type CSSProperties, type ElementType, type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLElement> & { as?: ElementType; delay?: number; y?: number };

export function Reveal({ as: Tag = "div", delay = 0, y = 14, style, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.dataset.in = "true"; return; }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { el.dataset.in = "true"; io.disconnect(); }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const vars = { "--reveal-delay": `${delay}ms`, "--reveal-y": `${y}px`, ...style } as CSSProperties;
  return (
    <Tag ref={ref} data-reveal="" style={vars} {...rest}>
      {children}
    </Tag>
  );
}
