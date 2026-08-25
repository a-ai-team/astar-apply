"use client";

import { useState } from "react";
import type { z } from "zod";
import type { QuickFireBlock } from "@/lib/content/lesson-schema";
import { cn } from "@/lib/cn";
import { Section } from "../section";

/** Four flip cards: question on the front, tap to reveal the answer. */
export function QuickFire({ block }: { block: z.infer<typeof QuickFireBlock> }) {
  const [open, setOpen] = useState<boolean[]>(() => block.pairs.map(() => false));
  return (
    <Section type="quick_fire">
      <ol className="grid gap-3 sm:grid-cols-2" data-testid="quick-fire-pairs">
        {block.pairs.map((p, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpen((o) => o.map((v, j) => (j === i ? !v : v)))}
              aria-expanded={open[i]}
              data-testid="quick-fire-card"
              className={cn("w-full rounded-lg border p-4 text-left text-sm transition", open[i] ? "border-accent/40 bg-accent/5" : "border-border bg-surface hover:border-muted")}
            >
              <p className="font-medium">{p.q}</p>
              {open[i] ? <p className="mt-2 text-muted">{p.a}</p> : <p className="mt-2 text-xs text-muted">Tap to check</p>}
            </button>
          </li>
        ))}
      </ol>
    </Section>
  );
}
