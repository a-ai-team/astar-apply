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
import { TsmDilution } from "@/components/widgets/tsm-dilution";
import { LeaseToggle } from "@/components/widgets/lease-toggle";
import { MultipleMatcher } from "@/components/widgets/multiple-matcher";
import { FootballField } from "@/components/widgets/football-field";
import { TvShare } from "@/components/widgets/tv-share";
import { GordonVsExit } from "@/components/widgets/gordon-vs-exit";
import { WaccBuilder } from "@/components/widgets/wacc-builder";
import { BetaRelever } from "@/components/widgets/beta-relever";
import { LboReturns } from "@/components/widgets/lbo-returns";
import { PaperLbo } from "@/components/widgets/paper-lbo";
import { AccretionRule } from "@/components/widgets/accretion-rule";
import { SynergyNpv } from "@/components/widgets/synergy-npv";
import { PpaGoodwill } from "@/components/widgets/ppa-goodwill";
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
  tsm_dilution: TsmDilution as ComponentType<Record<string, unknown>>,
  lease_toggle: LeaseToggle as ComponentType<Record<string, unknown>>,
  multiple_matcher: MultipleMatcher as ComponentType<Record<string, unknown>>,
  football_field: FootballField as ComponentType<Record<string, unknown>>,
  tv_share: TvShare as ComponentType<Record<string, unknown>>,
  gordon_vs_exit: GordonVsExit as ComponentType<Record<string, unknown>>,
  wacc_builder: WaccBuilder as ComponentType<Record<string, unknown>>,
  beta_relever: BetaRelever as ComponentType<Record<string, unknown>>,
  accretion_rule: AccretionRule as ComponentType<Record<string, unknown>>,
  synergy_npv: SynergyNpv as ComponentType<Record<string, unknown>>,
  ppa_goodwill: PpaGoodwill as ComponentType<Record<string, unknown>>,
  lbo_returns: LboReturns as ComponentType<Record<string, unknown>>,
  paper_lbo: PaperLbo as ComponentType<Record<string, unknown>>,
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
