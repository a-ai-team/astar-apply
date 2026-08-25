import type { z } from "zod";
import type { NowYouCanBlock } from "@/lib/content/lesson-schema";
import { Section } from "../section";

export function NowYouCan({ block }: { block: z.infer<typeof NowYouCanBlock> }) {
  return (
    <Section type="now_you_can">
      <ul className="flex flex-col gap-2 text-sm">
        {block.items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-accent">✓</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
