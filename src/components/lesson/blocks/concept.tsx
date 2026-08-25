import type { z } from "zod";
import type { ConceptBlock } from "@/lib/content/lesson-schema";
import { Markdown } from "../markdown";
import { Section } from "../section";

export function Concept({ block }: { block: z.infer<typeof ConceptBlock> }) {
  return (
    <Section type="concept" title={block.heading}>
      <Markdown md={block.md} />
    </Section>
  );
}
