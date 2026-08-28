"use client";

import type { z } from "zod";
import type { LensBlock } from "@/lib/content/lesson-schema";
import { LENS_LABELS } from "@/lib/content/taxonomy";
import { Markdown } from "../markdown";
import { Reveal } from "../reveal";
import { Section } from "../section";
import { useLens } from "../lens-context";

/**
 * Industry-lens section (Loop 11). Renders only the reader's chosen lens; with no lens chosen it
 * renders a one-line hint instead. The generalist lesson is always complete without it —
 * docs/research/technicals-v2/02-lens-design.md.
 */
export function Lens({ block }: { block: z.infer<typeof LensBlock> }) {
  const lens = useLens();
  const variant = lens ? block.variants[lens] : undefined;

  if (!variant) {
    return (
      <p className="text-xs text-muted" data-testid="lens-hint">
        Targeting a specific group? Pick an industry lens at the top of this lesson to see how this changes for {Object.keys(block.variants).map((s) => LENS_LABELS[s as keyof typeof LENS_LABELS] ?? s).join(" or ")}.
      </p>
    );
  }

  return (
    <Section type="lens" title={variant.heading} tone="accent">
      <p className="-mt-2 mb-3 text-xs font-semibold uppercase tracking-wide text-accent" data-testid="lens-badge">
        {LENS_LABELS[lens!]} lens
      </p>
      <Markdown md={variant.md} />
      {variant.example_q && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm font-medium" data-testid="lens-example-q">
            {variant.example_q}
          </p>
          {variant.answer_md && (
            <div className="mt-2">
              <Reveal label="Say it out loud, then check" testId="lens-answer">
                <Markdown md={variant.answer_md} />
              </Reveal>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
