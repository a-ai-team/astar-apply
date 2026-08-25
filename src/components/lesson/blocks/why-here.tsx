import type { z } from "zod";
import type { WhyHereBlock } from "@/lib/content/lesson-schema";
import { Markdown } from "../markdown";
import { Section } from "../section";

export function WhyHere({ block }: { block: z.infer<typeof WhyHereBlock> }) {
  return (
    <Section type="why_here">
      <Markdown md={block.md} />
    </Section>
  );
}
