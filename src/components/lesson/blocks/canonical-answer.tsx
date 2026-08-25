import type { z } from "zod";
import type { CanonicalAnswerBlock } from "@/lib/content/lesson-schema";
import { Markdown } from "../markdown";
import { Reveal } from "../reveal";
import { Section } from "../section";

export function CanonicalAnswer({ block }: { block: z.infer<typeof CanonicalAnswerBlock> }) {
  return (
    <Section type="canonical_answer" tone="accent">
      <p className="mb-3 text-sm text-muted">Say your answer out loud first — aim for about {block.seconds} seconds — then tap to compare.</p>
      <Reveal label="Show the model answer" hideLabel="Hide the model answer" testId="canonical-answer">
        <Markdown md={block.md} />
      </Reveal>
    </Section>
  );
}
