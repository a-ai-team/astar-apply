// The three tiers (Loop 10). Source of truth for the UI and for `seed -- 10`; the `plans` table
// (0011) mirrors this and adds `stripe_price_id` once `scripts/billing/sync-stripe.ts` has run.
// Kept free of `server-only` so scripts, tests and client components can import it.
// TODO(james): confirm prices £0 / £4.99 / £9.99 (Loop 10 default; financefluency shape).

export type PlanId = "free" | "core" | "ai";

export const FEATURES = [
  "lessons_free", "bank_free", "flashcards_free", "firm_browse", "pulse", "playbook", "mentor_chat",
  "lessons_all", "bank_full", "flashcards_all", "ai_drills", "ai_mocks",
  "srs_analytics", "detailed_feedback", "firm_practice", "fit_grading",
] as const;
export type Feature = (typeof FEATURES)[number];

export type Plan = {
  id: PlanId;
  name: string;
  monthly_gbp: number;
  ordinal: number;
  tagline: string;
  /** Marketing bullets for /pricing. */
  bullets: string[];
  features: Feature[];
  /** Env var holding the Stripe price id (test or live). */
  priceEnv: string | null;
};

const FREE_FEATURES: Feature[] = ["lessons_free", "bank_free", "flashcards_free", "firm_browse", "pulse", "playbook", "mentor_chat"];
const CORE_FEATURES: Feature[] = [...FREE_FEATURES, "lessons_all", "bank_full", "flashcards_all", "ai_drills", "ai_mocks"];
const AI_FEATURES: Feature[] = [...CORE_FEATURES, "srs_analytics", "detailed_feedback", "firm_practice", "fit_grading"];

export const PLANS: Plan[] = [
  {
    id: "free", name: "Free", monthly_gbp: 0, ordinal: 0, priceEnv: null,
    tagline: "Start with the two topics every interview opens on.",
    bullets: ["Accounting and EqV vs EV lessons", "Practice questions and flashcards for those topics", "Ask the mentor (daily cap)", "Browse firm question banks", "Weekly Pulse", "Non-Target playbook"],
    features: FREE_FEATURES,
  },
  {
    id: "core", name: "Core", monthly_gbp: 4.99, ordinal: 1, priceEnv: "STRIPE_PRICE_CORE",
    tagline: "The whole curriculum, graded by AI.",
    bullets: ["Every topic and industry module", "Full question bank and every flashcard deck", "AI-graded topic drills and full mocks", "Interactive walkthroughs", "Everything in Free"],
    features: CORE_FEATURES,
  },
  {
    id: "ai", name: "AI", monthly_gbp: 9.99, ordinal: 2, priceEnv: "STRIPE_PRICE_AI",
    tagline: "For the final stretch before superdays.",
    bullets: ["Spaced-repetition mastery analytics", "Detailed per-answer feedback and the timed 15-question mock", "Practise firm question sets", "Fit and behavioural AI grading", "Everything in Core"],
    features: AI_FEATURES,
  },
];

export const PLAN_IDS = PLANS.map((p) => p.id) as PlanId[];

export function planById(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function isPlanId(id: unknown): id is PlanId {
  return typeof id === "string" && PLAN_IDS.includes(id as PlanId);
}

/** Price id for a paid plan from the env (null when unset or for `free`). */
export function priceIdFor(plan: PlanId): string | null {
  const p = planById(plan);
  return p.priceEnv ? process.env[p.priceEnv] || null : null;
}

/** Reverse lookup: which plan does a Stripe price id belong to? Checks env vars then `known`. */
export function planForPriceId(priceId: string | null | undefined, known: Partial<Record<PlanId, string | null>> = {}): PlanId | null {
  if (!priceId) return null;
  for (const p of PLANS) {
    if (p.priceEnv && process.env[p.priceEnv] === priceId) return p.id;
    if (known[p.id] === priceId) return p.id;
  }
  return null;
}

/** Feature list for a plan, resolved from the constant (the DB row is a mirror). */
export function featuresFor(plan: PlanId): Feature[] {
  return planById(plan).features;
}

export function formatGbp(n: number): string {
  return n === 0 ? "£0" : `£${n.toFixed(2)}`;
}
