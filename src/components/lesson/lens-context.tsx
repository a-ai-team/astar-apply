"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LensSlug } from "@/lib/content/lesson-schema";

/** The reader's chosen industry lens, or null for the generalist lesson. */
const LensContext = createContext<LensSlug | null>(null);

export function LensProvider({ lens, children }: { lens: LensSlug | null; children: ReactNode }) {
  return <LensContext.Provider value={lens}>{children}</LensContext.Provider>;
}

export function useLens(): LensSlug | null {
  return useContext(LensContext);
}
