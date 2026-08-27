// UpgradeCard (Loop 10): the one gate UI. Says which plan unlocks the feature and links to /pricing.
import Link from "next/link";
import type { Feature } from "@/lib/billing/plans";
import { formatGbp, planById } from "@/lib/billing/plans";
import { planNeededFor } from "@/lib/billing/entitlements";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURE_COPY: Partial<Record<Feature, { title: string; body: string }>> = {
  lessons_all: { title: "This topic is part of Core", body: "Free covers Accounting and EqV vs EV — the two topics every interview opens on. Core unlocks every other topic and all 18 industry modules." },
  bank_full: { title: "The full question bank is part of Core", body: "Free includes the Accounting and EqV vs EV questions. Core opens the whole bank, every difficulty, every topic." },
  flashcards_all: { title: "This deck is part of Core", body: "Free decks cover Accounting and EqV vs EV. Core unlocks every deck, including the industry modules." },
  ai_drills: { title: "AI-graded drills are part of Core", body: "Answer under a timer and get graded against the model answer, with a debrief on what to reread." },
  ai_mocks: { title: "Full mocks are part of Core", body: "Up to 15 questions across the technical topics with a focus-area report at the end." },
  srs_analytics: { title: "Mastery analytics are part of AI", body: "See retention per deck, your forgetting curve and which cards are about to lapse." },
  firm_practice: { title: "Practising firm sets is part of AI", body: "Browse any bank for free; AI lets you drill a firm's questions as a graded set." },
  detailed_feedback: { title: "Detailed feedback is part of AI", body: "Per-answer feedback and the timed 15-question mock." },
  fit_grading: { title: "Fit & behavioural grading is part of AI", body: "Get your stories graded for structure, specificity and length." },
};

export function UpgradeCard({ feature, className, compact }: { feature: Feature; className?: string; compact?: boolean }) {
  const planId = planNeededFor(feature);
  const plan = planById(planId);
  const copy = FEATURE_COPY[feature] ?? { title: `This is part of ${plan.name}`, body: plan.tagline };
  return (
    <Card className={className} data-testid="upgrade-card" data-feature={feature} data-plan={planId}>
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle>{copy.title}</CardTitle>
        <Badge tone="accent">{plan.name} · {formatGbp(plan.monthly_gbp)}/month</Badge>
      </div>
      {!compact && <CardDescription>{copy.body}</CardDescription>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href={`/pricing?plan=${planId}`} className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90" data-testid="upgrade-link">
          See plans
        </Link>
        <span className="text-xs text-muted">Monthly, cancel any time.</span>
      </div>
    </Card>
  );
}
