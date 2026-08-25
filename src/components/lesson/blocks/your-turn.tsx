import type { z } from "zod";
import type { YourTurnBlock } from "@/lib/content/lesson-schema";
import { Markdown } from "../markdown";
import { Reveal } from "../reveal";
import { Section } from "../section";

export function YourTurn({ block }: { block: z.infer<typeof YourTurnBlock> }) {
  return (
    <Section type="your_turn" tone="accent">
      <Markdown md={block.prompt} />
      <div className="mt-3">
        <Reveal label="Reveal model answer" hideLabel="Hide model answer" testId="your-turn">
          <Markdown md={block.model_answer_md} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">A strong answer…</p>
          <ul className="mt-1 list-disc pl-5 text-sm" data-testid="your-turn-rubric">
            {block.rubric.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
