// Renders any valid Lesson JSON (docs/loops/CONTRACTS.md) in the fixed template order the JSON
// supplies. One component per block type; unknown types never reach here (zod rejects them).
// KaTeX CSS is imported here so it only ships on routes that render lessons.
import "katex/dist/katex.min.css";
import type { LessonBlock, LessonBody } from "@/lib/content/lesson-schema";
import { WhyHere } from "./blocks/why-here";
import { Concept } from "./blocks/concept";
import { Mechanics } from "./blocks/mechanics";
import { WorkedCalc } from "./blocks/worked-calc";
import { Trap } from "./blocks/trap";
import { CanonicalAnswer } from "./blocks/canonical-answer";
import { Scenario } from "./blocks/scenario";
import { YourTurn } from "./blocks/your-turn";
import { QuickFire } from "./blocks/quick-fire";
import { OneLiner } from "./blocks/one-liner";
import { NowYouCan } from "./blocks/now-you-can";
import { Widget } from "./blocks/widget";
import { KeyMetrics } from "./blocks/key-metrics";

export function LessonBlockView({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "why_here": return <WhyHere block={block} />;
    case "concept": return <Concept block={block} />;
    case "mechanics": return <Mechanics block={block} />;
    case "worked_calc": return <WorkedCalc block={block} />;
    case "trap": return <Trap block={block} />;
    case "canonical_answer": return <CanonicalAnswer block={block} />;
    case "scenario": return <Scenario block={block} />;
    case "your_turn": return <YourTurn block={block} />;
    case "quick_fire": return <QuickFire block={block} />;
    case "one_liner": return <OneLiner block={block} />;
    case "now_you_can": return <NowYouCan block={block} />;
    case "widget": return <Widget block={block} />;
    case "key_metrics": return <KeyMetrics block={block} />;
  }
}

export function LessonRenderer({ body }: { body: LessonBody }) {
  return (
    <article className="flex max-w-3xl flex-col gap-10" data-testid="lesson-renderer">
      {body.blocks.map((block, i) => (
        <LessonBlockView key={`${block.type}-${i}`} block={block} />
      ))}
    </article>
  );
}
