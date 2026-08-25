import type { z } from "zod";
import type { MechanicsBlock } from "@/lib/content/lesson-schema";
import { Markdown } from "../markdown";
import { Section } from "../section";

export function Mechanics({ block }: { block: z.infer<typeof MechanicsBlock> }) {
  return (
    <Section type="mechanics">
      <Markdown md={block.md} />
    </Section>
  );
}
