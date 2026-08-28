"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LENSES } from "@/lib/content/taxonomy";
import type { LensSlug } from "@/lib/content/lesson-schema";

const STORAGE_KEY = "astar.lens";

/** Read the remembered lens; storage can throw (private mode, blocked site data). */
export function storedLens(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Industry-lens picker (Loop 11). The lens lives in `?lens=` so a link is shareable, and is
 * mirrored to localStorage so the choice carries to the next lesson. Default is generalist.
 */
export function LensPicker({ lens }: { lens: LensSlug | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlLens = params.get("lens");

  // First visit to a lesson with a remembered lens and no ?lens= — restore it.
  useEffect(() => {
    if (urlLens) return;
    const remembered = storedLens();
    if (remembered && LENSES.some((l) => l.slug === remembered)) {
      router.replace(`${pathname}?lens=${remembered}`, { scroll: false });
    }
  }, [urlLens, pathname, router]);

  const choose = (value: string) => {
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — the URL still carries the choice */
    }
    router.replace(value ? `${pathname}?lens=${value}` : pathname, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="whitespace-nowrap">Industry lens</span>
      <select
        value={lens ?? ""}
        onChange={(e) => choose(e.target.value)}
        data-testid="lens-picker"
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
      >
        <option value="">Generalist</option>
        {LENSES.map((l) => (
          <option key={l.slug} value={l.slug}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
