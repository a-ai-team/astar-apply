import type { ComponentType } from "react";
import type { z } from "zod";
import type { WidgetBlock, WidgetName } from "@/lib/content/lesson-schema";
import { EvBridge } from "@/components/widgets/ev-bridge";
import { ThreeStatement } from "@/components/widgets/three-statement";
import { DcfSensitivity } from "@/components/widgets/dcf-sensitivity";
import { DiscountDial } from "@/components/widgets/discount-dial";
import { FadedWalk } from "@/components/widgets/faded-walk";
import { CashCycle } from "@/components/widgets/cash-cycle";
import { FilingsToggle } from "@/components/widgets/filings-toggle";
import { Section } from "../section";

/**
 * Widget registry. A lesson names a widget in its JSON; anything not built yet falls through to the
 * placeholder, so a chapter loop can author content before its widget exists.
 * `props` come from the lesson file (the batch writer always emits `{}`).
 */
const WIDGETS: Partial<Record<WidgetName, ComponentType<Record<string, unknown>>>> = {
  ev_bridge: EvBridge as ComponentType<Record<string, unknown>>,
  three_statement: ThreeStatement as ComponentType<Record<string, unknown>>,
  dcf_sensitivity: DcfSensitivity as ComponentType<Record<string, unknown>>,
  discount_dial: DiscountDial as ComponentType<Record<string, unknown>>,
  faded_walk: FadedWalk as ComponentType<Record<string, unknown>>,
  cash_cycle: CashCycle as ComponentType<Record<string, unknown>>,
  filings_toggle: FilingsToggle as ComponentType<Record<string, unknown>>,
};

export function Widget({ block }: { block: z.infer<typeof WidgetBlock> }) {
  const Component = WIDGETS[block.widget];
  return (
    <Section type="widget">
      {Component ? (
        <Component {...block.props} />
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted" data-testid={`widget-${block.widget}`}>
          Interactive <span className="font-mono">{block.widget}</span> — coming in a later loop.
        </div>
      )}
    </Section>
  );
}
