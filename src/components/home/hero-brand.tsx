"use client";

// The hero wordmark. While it is on screen the header's small wordmark is hidden so the brand is
// not shown twice: this component toggles `data-hero-brand="visible"` on <html> from an
// IntersectionObserver, and `html[data-hero-brand="visible"] [data-brand]` (globals.css) fades the
// header copy out. The landing's inline script pre-sets the attribute before hydration so the first
// paint is already right; unmounting (any route change) removes it. No IO → header stays visible.
import Image from "next/image";
import { useEffect, useRef } from "react";

const ATTR = "data-hero-brand";

export function HeroBrand({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const html = document.documentElement;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Treat the wordmark as gone once it slides under the sticky header. rootMargin only takes
    // px or %, so convert --shell-header-h (rem) using the root font size.
    const rootStyle = getComputedStyle(html);
    const headerRem = parseFloat(rootStyle.getPropertyValue("--shell-header-h")) || 4;
    const headerPx = Math.round(headerRem * (parseFloat(rootStyle.fontSize) || 16));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) html.setAttribute(ATTR, "visible");
          else html.removeAttribute(ATTR);
        }
      },
      { threshold: 0, rootMargin: `-${headerPx}px 0px 0px 0px` },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      html.removeAttribute(ATTR);
    };
  }, []);

  return (
    <div ref={ref} className={className} data-field-focus data-testid="hero-wordmark">
      <Image
        src="/wordmark.png"
        alt="A* Apply"
        width={1400}
        height={675}
        priority
        sizes="(max-width: 768px) 72vw, 440px"
        className="h-auto w-full"
      />
    </div>
  );
}
