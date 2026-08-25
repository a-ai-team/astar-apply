import type { z } from "zod";
import type { WidgetBlock } from "@/lib/content/lesson-schema";
import { EvBridge, type EvBridgeProps } from "@/components/widgets/ev-bridge";
import { Section } from "../section";

/** Widget dispatcher. `ev_bridge` is the Loop 03 reference widget; the rest are static placeholders. */
export function Widget({ block }: { block: z.infer<typeof WidgetBlock> }) {
  return (
    <Section type="widget">
      {block.widget === "ev_bridge" ? (
        <EvBridge {...(block.props as EvBridgeProps)} />
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted" data-testid={`widget-${block.widget}`}>
          Interactive <span className="font-mono">{block.widget}</span> — coming in a later loop.
        </div>
      )}
    </Section>
  );
}
