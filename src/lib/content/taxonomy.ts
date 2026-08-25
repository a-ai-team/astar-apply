// Topic taxonomy shared by corpus tagging (Loop 01), the curriculum (Loop 03) and evals.
// Slugs are the *structural* section labels from docs/research/400q-taxonomy.md plus the
// application/process topics the mentor corpus covers. Add slugs; never rename existing ones.

export type TopicSlug = (typeof TOPICS)[number]["slug"];

export const TOPICS = [
  // Application process & soft skills (mentor corpus heavy)
  { slug: "spring-weeks", label: "Spring weeks", group: "process" },
  { slug: "summer-internships", label: "Summer internships", group: "process" },
  { slug: "applications-cv", label: "Applications & CV", group: "process" },
  { slug: "networking", label: "Networking & coffee chats", group: "process" },
  { slug: "assessment-centres", label: "Assessment centres & tests", group: "process" },
  { slug: "fit-behavioural", label: "Fit & behavioural questions", group: "fit" },
  { slug: "why-banking", label: "Why banking / why this firm", group: "fit" },
  { slug: "market-awareness", label: "Market awareness & deals", group: "fit" },
  // Generalist technicals (400Q sections → curriculum topics)
  { slug: "finance-foundations", label: "Finance foundations (TVM, NPV, IRR)", group: "technical" },
  { slug: "accounting", label: "Accounting & the three statements", group: "technical" },
  { slug: "eqv-ev", label: "Equity value vs enterprise value", group: "technical" },
  { slug: "valuation", label: "Valuation methods & multiples", group: "technical" },
  { slug: "dcf", label: "DCF & discount rate", group: "technical" },
  { slug: "ma", label: "M&A and merger models", group: "technical" },
  { slug: "lbo", label: "LBOs", group: "technical" },
  // Industry / group-specific (Loop 09)
  { slug: "industry", label: "Industry & group modules", group: "industry" },
] as const;

export const TOPIC_SLUGS: readonly string[] = TOPICS.map((t) => t.slug);

export function isTopicSlug(s: string): s is TopicSlug {
  return (TOPIC_SLUGS as readonly string[]).includes(s);
}

export function topicLabel(slug: string): string {
  return TOPICS.find((t) => t.slug === slug)?.label ?? slug;
}
