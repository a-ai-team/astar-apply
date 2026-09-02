// Renders any valid Lesson JSON (docs/loops/CONTRACTS.md) in the fixed template order the JSON
// supplies. One component per block type; unknown types never reach here (zod rejects them).
// KaTeX CSS is imported here so it only ships on routes that render lessons.
// Loop 06: every block gets a stable anchor (`#block-<n>`, the index in body.blocks — citation
// chips deep-link to it) and, when `lessonId` is given, an "Ask Mentor about this" link.
import "katex/dist/katex.min.css";
import { blockAnchor } from "@/lib/content/block-labels";
import { AskMentorButton } from "@/components/chat/ask-mentor-button";
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
import { Predict } from "./blocks/predict";
import { FillNumbers } from "./blocks/fill-numbers";
import { OrderSteps } from "./blocks/order-steps";
import { Lens } from "./blocks/lens";
import { Template } from "./blocks/template";

/** Blocks that get no "Ask Mentor" affordance — interactive or purely structural. */
const NO_ASK_MENTOR = new Set<LessonBlock["type"]>(["widget", "template", "order_steps", "predict"]);

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
    case "predict": return <Predict block={block} />;
    case "fill_numbers": return <FillNumbers block={block} />;
    case "order_steps": return <OrderSteps block={block} />;
    case "lens": return <Lens block={block} />;
    case "template": return <Template block={block} />;
  }
}

export function LessonRenderer({ body, lessonId }: { body: LessonBody; lessonId?: string }) {
  return (
    <article className="flex w-full flex-col gap-10" data-testid="lesson-renderer">
      {body.blocks.map((block, i) => (
        <div key={`${block.type}-${i}`} id={blockAnchor(i)} data-block-index={i} className="scroll-mt-20 target:rounded-lg target:ring-2 target:ring-accent/40 target:ring-offset-4 target:ring-offset-bg">
          <LessonBlockView block={block} />
          {lessonId && !NO_ASK_MENTOR.has(block.type) && (
            <div className="mt-3">
              <AskMentorButton size="xs" target={{ kind: "lesson", lessonId, blockIndex: i }} />
            </div>
          )}
        </div>
      ))}
    </article>
  );
}
