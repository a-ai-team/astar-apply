"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Opens the browser's print dialog; `auto` opens it once on arrival (the no-PDF-yet fallback). */
export function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    // Let KaTeX fonts land first, or the first page prints with fallback glyphs.
    let cancelled = false;
    document.fonts.ready.then(() => { if (!cancelled) window.print(); });
    return () => { cancelled = true; };
  }, [auto]);
  return (
    <Button type="button" variant="secondary" size="sm" onClick={() => window.print()} data-testid="pack-print">
      Print
    </Button>
  );
}
