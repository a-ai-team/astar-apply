// Industry addendum (Loop 09). Appended, verbatim and static, to the lesson-writer and
// question-writer system prompts when the target belongs to an industry module (`--kind industry`),
// so the cached prefix stays stable within a batch. Per-module facts (module title, family, the
// sibling lessons) go in the user turn via `industryUserLines()`.
import type { IndustryFamily } from "@/lib/content/taxonomy";

export const industryAddendumPrompt = {
  id: "industry-addendum",
  version: 1,
  system: `## Industry / group module addendum
This target belongs to an *industry or product-group* module, not the generalist curriculum. The reader has already worked through the generalist lessons (three statements, EqV/EV, valuation, DCF, M&A, LBO). Your job is to show **how the generalist framework changes** for this group, in this order of priority:

1. **Metrics that replace or sit beside EBITDA** — name the two to five numbers this group's analysts actually look at (for example NOI and cap rates, NIM and CET1, ARR and net retention, reserves and cash costs, DSCR, FFO). Define each one from first principles with a worked £m number. Emit a \`key_metrics\` block (industry lessons must include one) with one row per metric: \`metric\`, a one-sentence \`definition\`, and \`why_it_matters\` in an interview.
2. **Valuation methods that dominate** — which of the three core methodologies still apply, which are dropped (and why), and which group-specific methods take over (NAV, P/B, rNPV, RAB premium, LCOE, EV/EBITDAX…). Show the mechanics with a worked number.
3. **Typical deals** — the two or three transaction types a junior in this group sees (IPO, refinancing, portfolio sale, sale-and-leaseback, farm-down…), in one or two paragraphs; no real deal names or real figures.
4. **What interviewers probe** — the questions this group asks that a generalist would not, and the trap a generalist falls into (for example applying EV/EBITDA to a bank, or treating depreciation as a real cost for a REIT).

Rules on top of the general ones:
- Keep every generalist term but assume it is known; explain only the industry-specific ones the first time they appear.
- Numbers stay in £m (or £ per share / per unit where the metric is per-unit, such as £/tonne or £/MWh) and stay internally consistent across blocks.
- Questions for an industry module are tagged with the module slug; \`source_topic\` is the guide's section label given in the user turn (label only).
- Never reproduce a published interview guide's wording, examples or numbers; write from first principles.`,
} as const;

export type IndustryContext = {
  module_slug: string;
  module_title: string;
  family: IndustryFamily;
  /** Number of questions in the guide's section — a count, used only to size the module. */
  source_count: number;
  sibling_lessons: string[];
};

const FAMILY_WORDS: Record<IndustryFamily, string> = { coverage: "coverage group (an industry sector)", product: "product group (a financing or advisory product)", other: "specialist / private-capital group" };

/** Extra user-turn lines for industry targets (volatile data belongs after the cached system prompt). */
export function industryUserLines(i: IndustryContext): string[] {
  return [
    `Industry module: "${i.module_title}" (slug ${i.module_slug}) — a ${FAMILY_WORDS[i.family]}.`,
    `Other lessons in this module (do not repeat their ground; together they cover the module): ${i.sibling_lessons.length ? i.sibling_lessons.join("; ") : "none"}.`,
    "This is an industry lesson: include a `key_metrics` block and follow the industry addendum (metrics → valuation methods → typical deals → what interviewers probe).",
  ];
}
