import type { z } from "zod";
import type { TrapBlock } from "@/lib/content/lesson-schema";
import { Markdown } from "../markdown";
import { Section } from "../section";

export function Trap({ block }: { block: z.infer<typeof TrapBlock> }) {
  return (
    <Section type="trap" tone="callout">
      <Markdown md={block.md} />
    </Section>
  );
}
