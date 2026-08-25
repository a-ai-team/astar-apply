import type { z } from "zod";
import type { OneLinerBlock } from "@/lib/content/lesson-schema";
import { Markdown } from "../markdown";
import { Section } from "../section";

export function OneLiner({ block }: { block: z.infer<typeof OneLinerBlock> }) {
  return (
    <Section type="one_liner" tone="accent">
      <Markdown md={block.md} className="text-lg" />
    </Section>
  );
}
