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

// ---------------------------------------------------------------------------------------------
// Curriculum (Loop 03). Nine topics → ~50 subtopics, seeded into `topics`/`subtopics` by
// `scripts/seed/03-taxonomy.ts`. `source_section` is the 400Q section *label* only (structure,
// never text). `target_questions` is the Loop 04 question-writer target per subtopic
// (≈ proportional to the 400Q counts in docs/research/400q-taxonomy.md; total ≈ 350).
// Free topics (TODO(james): confirm) default to Accounting + EqV/EV, matching the reference
// site's free tier. Add subtopics freely; never rename a slug once seeded.

import type { LensSlug } from "./lesson-schema";

export type TopicKind = "core" | "foundation" | "fit" | "industry";
export type SubtopicKind = "concept" | "calculation" | "mixed";
export type TopicLevel = "foundation" | "core" | "advanced";

export type CurriculumSubtopic = {
  slug: string;
  title: string;
  kind: SubtopicKind;
  source_section: string;
  target_questions: number;
  /** Walkthrough subtopics require a `scenario` block in their lessons before approval. */
  walkthrough?: boolean;
  /** Loop 11+: kept in the taxonomy (slugs are never removed) but hidden until a lesson exists. */
  deferred?: boolean;
};

export type CurriculumTopic = {
  slug: TopicSlug;
  title: string;
  kind: TopicKind;
  level: TopicLevel;
  is_free: boolean;
  summary: string;
  source_section: string;
  /** Loop 09: industry modules only (`topics.group_family`). */
  group_family?: IndustryFamily;
  subtopics: CurriculumSubtopic[];
};

const sub = (slug: string, title: string, kind: SubtopicKind, source_section: string, target_questions: number, walkthrough = false): CurriculumSubtopic =>
  ({ slug, title, kind, source_section, target_questions, walkthrough });

export const CURRICULUM: CurriculumTopic[] = [
  {
    slug: "finance-foundations", title: "Finance foundations", kind: "foundation", level: "foundation", is_free: false,
    summary: "Time value of money, discounting, NPV and IRR — the five ideas every later topic leans on.",
    source_section: "Finance concepts",
    subtopics: [
      // Loop 12: three lessons carry the chapter; `discount-rates-and-risk` folds into lesson 1 and
      // `irr-and-payback` into lesson 2, so both are deferred (slugs kept — never removed).
      sub("time-value-of-money", "Time value of money", "mixed", "Finance concepts", 4),
      { ...sub("discount-rates-and-risk", "Discount rates and risk", "concept", "Finance concepts", 0), deferred: true },
      sub("pv-npv", "Present value, NPV and IRR", "calculation", "Finance concepts", 4),
      { ...sub("irr-and-payback", "IRR and payback", "calculation", "Finance concepts", 0), deferred: true },
      sub("wacc-intro", "WACC: a first look", "mixed", "Finance concepts", 4),
    ],
  },
  {
    slug: "accounting", title: "Accounting", kind: "core", level: "core", is_free: true,
    summary: "The three statements, how they link, and the statement walkthroughs interviewers love.",
    source_section: "Accounting – concepts / calculations",
    subtopics: [
      // Loop 13: eight lessons carry the chapter. `depreciation-and-capex` folds into
      // `single-step-walkthroughs`; `deferred-taxes-and-other-items` becomes cheat-sheet
      // "you may hear" material. Both deferred — slugs kept, never removed.
      sub("three-statements-overview", "The three statements at a glance", "concept", "Accounting – concepts", 5),
      sub("income-statement", "Income statement", "concept", "Accounting – concepts", 4),
      sub("balance-sheet", "Balance sheet", "concept", "Accounting – concepts", 5),
      sub("cash-flow-statement", "Cash flow statement", "concept", "Accounting – concepts", 5),
      sub("three-statement-links", "How the three statements link", "mixed", "Accounting – concepts", 5, true),
      sub("working-capital", "Working capital", "mixed", "Accounting – concepts", 5),
      { ...sub("depreciation-and-capex", "Depreciation, capex and non-cash items", "calculation", "Accounting – calculations", 0, true), deferred: true },
      sub("single-step-walkthroughs", "Single-step walkthroughs", "calculation", "Accounting – calculations", 6, true),
      sub("multi-step-walkthroughs", "Multi-step walkthroughs", "calculation", "Accounting – calculations", 5, true),
      { ...sub("deferred-taxes-and-other-items", "Deferred taxes, leases and other items", "mixed", "Accounting – calculations", 0), deferred: true },
    ],
  },
  {
    slug: "eqv-ev", title: "Equity value vs enterprise value", kind: "core", level: "core", is_free: true,
    summary: "What each value means, the bridge between them, and which metrics pair with which.",
    source_section: "Equity value & enterprise value – concepts / calculations",
    subtopics: [
      // Loop 14: four lessons carry the chapter. `ev-edge-cases` folds into the bridge lesson
      // (leases, pensions, NCI and preferred all appear there) — deferred, slug kept.
      sub("equity-and-enterprise-value", "Equity value and enterprise value", "concept", "EqV & EV – concepts", 7),
      sub("ev-bridge-calculations", "The EqV → EV bridge", "calculation", "EqV & EV – calculations", 8),
      sub("diluted-shares", "Diluted share count", "calculation", "EqV & EV – calculations", 7),
      { ...sub("ev-edge-cases", "Edge cases: leases, NCI, preferred, pensions", "mixed", "EqV & EV – concepts", 0), deferred: true },
      sub("pairing-metrics-with-values", "Pairing metrics with the right value", "concept", "EqV & EV – concepts", 6),
    ],
  },
  {
    slug: "valuation", title: "Valuation", kind: "core", level: "core", is_free: false,
    summary: "The three core methodologies, the multiples they use, and how to pick between them.",
    source_section: "Valuation methodologies / metrics & multiples",
    subtopics: [
      // Loop 15: five lessons carry the chapter. `other-methodologies` (SOTP, liquidation, LBO
      // valuation) is named in the cheat sheet's "you may hear" box — deferred, slug kept.
      sub("valuation-methodologies", "The three methodologies", "concept", "Valuation methodologies", 7),
      sub("comparable-companies", "Comparable companies", "mixed", "Valuation methodologies", 6),
      sub("precedent-transactions", "Precedent transactions", "mixed", "Valuation methodologies", 6),
      sub("multiples-and-metrics", "Multiples and metrics", "calculation", "Valuation metrics & multiples", 6),
      sub("choosing-and-presenting", "Choosing a method and presenting a range", "concept", "Valuation metrics & multiples", 6),
      { ...sub("other-methodologies", "Other methods: SOTP, liquidation, LBO valuation", "concept", "Valuation methodologies", 0), deferred: true },
    ],
  },
  {
    slug: "dcf", title: "DCF", kind: "core", level: "core", is_free: false,
    summary: "Free cash flow, the discount rate and terminal value — built step by step with real numbers.",
    source_section: "DCF – assumptions & analysis / the discount rate",
    subtopics: [
      // Loop 16: seven lessons carry the chapter. `levered-dcf-and-variants` (levered DCF, APV) is
      // named in the cheat sheet's "you may hear" box — deferred, slug kept.
      sub("dcf-overview", "What a DCF is doing", "concept", "DCF – assumptions & analysis", 6),
      sub("unlevered-free-cash-flow", "Unlevered free cash flow", "calculation", "DCF – assumptions & analysis", 6),
      sub("projections-and-assumptions", "Projections and assumptions", "mixed", "DCF – assumptions & analysis", 6),
      sub("dcf-sensitivities", "Sensitivities and sanity checks", "mixed", "DCF – assumptions & analysis", 6),
      sub("cost-of-equity-capm", "Cost of equity and CAPM", "calculation", "DCF – the discount rate", 6),
      sub("wacc", "WACC", "calculation", "DCF – the discount rate", 6),
      sub("terminal-value", "Terminal value", "calculation", "DCF – assumptions & analysis", 6),
      { ...sub("levered-dcf-and-variants", "Levered DCF and other variants", "concept", "DCF – the discount rate", 0), deferred: true },
    ],
  },
  {
    slug: "ma", title: "M&A", kind: "core", level: "advanced", is_free: false,
    summary: "Why companies buy each other, and whether the deal is accretive or dilutive.",
    source_section: "Merger models – concepts / calculations",
    subtopics: [
      sub("why-companies-acquire", "Why companies acquire", "concept", "Merger models – concepts", 8),
      sub("accretion-dilution-concepts", "Accretion / dilution: the idea", "concept", "Merger models – concepts", 8),
      sub("accretion-dilution-calculations", "Accretion / dilution: the numbers", "calculation", "Merger models – calculations", 9),
      sub("purchase-price-allocation", "Purchase price allocation and goodwill", "mixed", "Merger models – calculations", 6),
      sub("synergies-and-deal-structure", "Synergies, consideration and deal structure", "mixed", "Merger models – concepts", 6),
    ],
  },
  {
    slug: "lbo", title: "LBO", kind: "core", level: "advanced", is_free: false,
    summary: "How private equity buys with debt, and the mental maths that gets you through the interview.",
    source_section: "LBO models – concepts / calculations",
    subtopics: [
      sub("lbo-overview", "What an LBO is", "concept", "LBO models – concepts", 8),
      sub("sources-and-uses", "Sources and uses", "calculation", "LBO models – calculations", 4),
      sub("debt-tranches", "Debt tranches and covenants", "concept", "LBO models – concepts", 8),
      sub("returns-irr-mom", "Returns: IRR and money multiple", "calculation", "LBO models – calculations", 6),
      sub("lbo-mental-maths", "LBO mental maths", "calculation", "LBO models – calculations", 4),
    ],
  },
  {
    slug: "why-banking", title: "Markets & why banking", kind: "fit", level: "foundation", is_free: false,
    summary: "What banks actually do, why you want in, and how to talk about markets and deals.",
    source_section: "Understanding banking / Why banking",
    subtopics: [
      sub("what-banks-do", "What investment banks do", "concept", "Understanding banking", 6),
      sub("why-banking-why-firm", "Why banking, why this firm", "concept", "Why banking / Why our firm", 8),
      sub("market-awareness", "Market awareness", "concept", "Understanding banking", 4),
      sub("deals-and-commercial-awareness", "Talking about deals", "concept", "Discussing transaction experience", 6),
    ],
  },
  {
    slug: "fit-behavioural", title: "Fit & behavioural", kind: "fit", level: "foundation", is_free: false,
    summary: "Your story, strengths, failures and CV — plus the brain teasers that sneak into fit rounds.",
    source_section: "Fit / behavioural",
    subtopics: [
      sub("big-five-fit", "The big five fit questions", "concept", "The Big 5 fit questions", 8),
      sub("strengths-weaknesses-failures", "Strengths, weaknesses and failures", "concept", "Strengths & weaknesses / Flaws & failures", 8),
      sub("teamwork-leadership", "Teamwork and leadership stories", "concept", "Teamwork / leadership", 4),
      sub("cv-and-experience", "Walking through your CV", "concept", "Resume / CV", 4),
      sub("brain-teasers", "Brain teasers", "calculation", "Outside the box", 4),
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Industry lenses (Loop 11). A lens is a *reader setting*, not a curriculum: choosing one swaps in
// `lens` blocks and unlocks `lens:`-tagged questions. The generalist lesson is always complete on
// its own. Design: docs/research/technicals-v2/02-lens-design.md. Add lenses; never rename a slug.
// ---------------------------------------------------------------------------------------------

export type Lens = { slug: LensSlug; label: string; module_slug: string };

/** `module_slug` points at the Loop 09 industry module the lens links out to for the deep dive. */
export const LENSES: Lens[] = [
  { slug: "tmt", label: "TMT", module_slug: "tmt" },
  { slug: "healthcare", label: "Healthcare & Biotech", module_slug: "healthcare-biotech" },
];

export const LENS_LABELS: Record<LensSlug, string> = Object.fromEntries(LENSES.map((l) => [l.slug, l.label])) as Record<LensSlug, string>;

export function isLensSlug(s: string | undefined | null): s is LensSlug {
  return !!s && LENSES.some((l) => l.slug === s);
}

export const FREE_TOPIC_SLUGS: readonly TopicSlug[] = CURRICULUM.filter((t) => t.is_free).map((t) => t.slug);

// ---------------------------------------------------------------------------------------------
// Industry / group modules (Loop 09). One `topics` row per module (`kind = 'industry'`,
// `group_family`), each with 2–4 lesson subtopics. Targets follow docs/loops/09-industry-modules.md:
// lessons 2 / 3 / 4 by 400Q source count (< 8 / 8–12 / > 12); questions = source count to the
// nearest 5, minimum 8. `source_count` is the number of questions in the guide's section (a count,
// never text). Industry modules are never free (`is_free: false`) — see Loop 09 retro.
// ---------------------------------------------------------------------------------------------

export type IndustryFamily = "coverage" | "product" | "other";

export type IndustryModule = {
  slug: string;
  title: string;
  family: IndustryFamily;
  source_section: string;
  source_count: number;
  summary: string;
  /** Lesson subjects, in teaching order; `lessonTargetCount(source_count)` of them. */
  lessons: { slug: string; title: string; kind?: SubtopicKind }[];
};

export function lessonTargetCount(sourceCount: number): 2 | 3 | 4 {
  return sourceCount < 8 ? 2 : sourceCount <= 12 ? 3 : 4;
}
export function questionTargetCount(sourceCount: number): number {
  return Math.max(8, Math.round(sourceCount / 5) * 5);
}

export const INDUSTRY_FAMILY_LABELS: Record<IndustryFamily, string> = { coverage: "Coverage groups", product: "Product groups", other: "Specialist & private capital" };

export const INDUSTRY_MODULES: IndustryModule[] = [
  { slug: "consumer-retail", title: "Consumer & Retail", family: "coverage", source_section: "Industry – Consumer/Retail", source_count: 4,
    summary: "Like-for-like sales, store economics and why brand strength shows up in the multiple.",
    lessons: [
      { slug: "consumer-retail-metrics", title: "Retail KPIs: like-for-like, gross margin and sales density" },
      { slug: "consumer-retail-valuation", title: "Valuing consumer businesses: brands, leases and EV/EBITDAR", kind: "calculation" },
    ] },
  { slug: "dcm-levfin", title: "DCM & Leveraged Finance", family: "product", source_section: "Industry – DCM & LevFin", source_count: 14,
    summary: "Bonds, loans, pricing off a benchmark and how a leveraged deal is structured and syndicated.",
    lessons: [
      { slug: "dcm-bond-basics", title: "Investment-grade bonds: yield, spread and price" },
      { slug: "dcm-leveraged-loans", title: "Leveraged loans and high-yield bonds" },
      { slug: "dcm-credit-metrics", title: "Credit metrics: leverage, coverage and ratings", kind: "calculation" },
      { slug: "dcm-deal-process", title: "Structuring and syndicating a financing" },
    ] },
  { slug: "distressed-restructuring", title: "Distressed & Restructuring", family: "product", source_section: "Industry – Distressed & Restructuring", source_count: 15,
    summary: "What happens when a company cannot pay its debts: the waterfall, the fulcrum security and the restructuring toolkit.",
    lessons: [
      { slug: "restructuring-why-companies-fail", title: "Why companies get into distress" },
      { slug: "restructuring-capital-structure-waterfall", title: "The capital-structure waterfall and the fulcrum security", kind: "calculation" },
      { slug: "restructuring-options", title: "Restructuring options: amend-and-extend, debt-for-equity, sale" },
      { slug: "restructuring-valuation", title: "Valuing a distressed company", kind: "calculation" },
    ] },
  { slug: "ecm", title: "Equity Capital Markets", family: "product", source_section: "Industry – ECM", source_count: 10,
    summary: "IPOs, follow-ons and rights issues — how shares are priced, sold and what the fees pay for.",
    lessons: [
      { slug: "ecm-ipo-process", title: "How an IPO works" },
      { slug: "ecm-ipo-pricing", title: "Pricing an IPO: valuation, discount and the book", kind: "calculation" },
      { slug: "ecm-follow-ons-and-rights", title: "Follow-ons, blocks and rights issues" },
    ] },
  { slug: "fig", title: "Financial Institutions (FIG)", family: "coverage", source_section: "Industry – FIG", source_count: 15,
    summary: "Banks and insurers break the generalist framework: no EV, regulatory capital and a balance sheet that is the business.",
    lessons: [
      { slug: "fig-why-banks-are-different", title: "Why banks are valued differently" },
      { slug: "fig-bank-metrics", title: "Bank metrics: NIM, ROE, CET1 and cost-income", kind: "calculation" },
      { slug: "fig-bank-valuation", title: "Valuing a bank: P/B, P/E and the dividend discount model", kind: "calculation" },
      { slug: "fig-insurance", title: "Insurers: combined ratio, float and embedded value" },
    ] },
  { slug: "fsg", title: "Financial Sponsors Group", family: "coverage", source_section: "Industry – FSG", source_count: 5,
    summary: "Covering private-equity clients: fund structures, what sponsors want from a bank and how a sponsor process runs.",
    lessons: [
      { slug: "fsg-how-sponsors-work", title: "How private-equity funds work" },
      { slug: "fsg-serving-sponsors", title: "What a sponsors group actually does" },
    ] },
  { slug: "healthcare-biotech", title: "Healthcare & Biotech", family: "coverage", source_section: "Industry – Healthcare & Biotech", source_count: 4,
    summary: "Pipelines, probability of success and why a company with no revenue can be worth £2bn.",
    lessons: [
      { slug: "healthcare-subsectors", title: "Pharma, biotech, devices and services" },
      { slug: "healthcare-rnpv", title: "Risk-adjusted NPV of a drug pipeline", kind: "calculation" },
    ] },
  { slug: "industrials", title: "Industrials", family: "coverage", source_section: "Industry – Industrials", source_count: 5,
    summary: "Cyclicality, order books and operating leverage in capital-heavy businesses.",
    lessons: [
      { slug: "industrials-cycle-and-metrics", title: "Cyclicality, backlog and operating leverage" },
      { slug: "industrials-valuation", title: "Valuing industrials through the cycle", kind: "calculation" },
    ] },
  { slug: "metals-mining", title: "Metals & Mining", family: "coverage", source_section: "Industry – Metals & Mining", source_count: 9,
    summary: "Reserves, cash costs and commodity prices — valuing a finite asset with a price you do not control.",
    lessons: [
      { slug: "mining-reserves-and-costs", title: "Reserves, resources and the cost curve" },
      { slug: "mining-nav", title: "Mine NAV: a DCF over the life of the asset", kind: "calculation" },
      { slug: "mining-multiples-and-deals", title: "Mining multiples, royalties and streaming" },
    ] },
  { slug: "oil-gas", title: "Oil & Gas", family: "coverage", source_section: "Industry – Oil & Gas", source_count: 10,
    summary: "Upstream, midstream and downstream; reserves, netbacks and the NAV that drives E&P valuation.",
    lessons: [
      { slug: "oil-gas-value-chain", title: "Upstream, midstream, downstream" },
      { slug: "oil-gas-reserves-and-nav", title: "Reserves, decline curves and E&P NAV", kind: "calculation" },
      { slug: "oil-gas-multiples", title: "EV/EBITDAX, EV/boe and the metrics interviewers probe" },
    ] },
  { slug: "power-utilities", title: "Power & Utilities", family: "coverage", source_section: "Industry – Power & Utilities", source_count: 10,
    summary: "Regulated asset bases, allowed returns and why a utility is valued on its RAB rather than its EBITDA.",
    lessons: [
      { slug: "utilities-regulated-vs-merchant", title: "Regulated networks vs merchant generation" },
      { slug: "utilities-rab", title: "The regulated asset base and allowed returns", kind: "calculation" },
      { slug: "utilities-valuation", title: "Valuing utilities: RAB premium, dividend yield and DCF" },
    ] },
  { slug: "secondaries", title: "Private Capital Advisory (Secondaries)", family: "other", source_section: "Industry – Private Capital Advisory (Secondaries)", source_count: 5,
    summary: "Buying and selling stakes in private funds: LP-led and GP-led deals, pricing to NAV and continuation vehicles.",
    lessons: [
      { slug: "secondaries-market", title: "What the secondaries market is" },
      { slug: "secondaries-pricing", title: "Pricing a secondary: discount to NAV and returns", kind: "calculation" },
    ] },
  { slug: "private-companies", title: "Private Companies", family: "other", source_section: "Industry – Private Companies", source_count: 5,
    summary: "Valuing a business with no share price: illiquidity discounts, normalised earnings and owner-manager adjustments.",
    lessons: [
      { slug: "private-companies-differences", title: "What changes when there is no share price" },
      { slug: "private-companies-valuation", title: "Discounts, normalisation and a private-company valuation", kind: "calculation" },
    ] },
  { slug: "project-finance", title: "Project Finance & Infrastructure", family: "product", source_section: "Industry – Project Finance & Infra", source_count: 9,
    summary: "Non-recourse debt against a single asset's cash flows: DSCR, sculpting and the risks each party carries.",
    lessons: [
      { slug: "project-finance-structure", title: "How a project financing is structured" },
      { slug: "project-finance-dscr", title: "DSCR, LLCR and debt sizing", kind: "calculation" },
      { slug: "project-finance-risks", title: "Allocating construction, operating and demand risk" },
    ] },
  { slug: "real-estate", title: "Real Estate", family: "coverage", source_section: "Industry – Real Estate", source_count: 10,
    summary: "Income-producing property: NOI, cap rates and NAV — the three numbers every real-estate interview revolves around.",
    lessons: [
      { slug: "real-estate-noi-cap-rates", title: "NOI, cap rates and NAV", kind: "calculation" },
      { slug: "real-estate-valuation-methods", title: "Valuing property companies: NAV, DCF and comps" },
      { slug: "real-estate-deals-and-financing", title: "Real-estate deals, leverage and what interviewers probe" },
    ] },
  { slug: "reits", title: "REITs", family: "coverage", source_section: "Industry – REITs", source_count: 10,
    summary: "Listed property vehicles: FFO and AFFO instead of net income, and the premium or discount to NAV.",
    lessons: [
      { slug: "reits-structure", title: "What a REIT is and why it pays out its income" },
      { slug: "reits-ffo-affo", title: "FFO, AFFO and the REIT multiples", kind: "calculation" },
      { slug: "reits-nav-premium-discount", title: "Trading at a premium or discount to NAV" },
    ] },
  { slug: "renewables", title: "Renewables", family: "coverage", source_section: "Industry – Renewables", source_count: 5,
    summary: "Wind and solar as long-dated cash-flow assets: capacity factors, PPAs and LCOE.",
    lessons: [
      { slug: "renewables-economics", title: "Capacity factors, PPAs and merchant risk" },
      { slug: "renewables-lcoe-and-valuation", title: "LCOE and valuing a renewables portfolio", kind: "calculation" },
    ] },
  { slug: "tmt", title: "Technology, Media & Telecoms", family: "coverage", source_section: "Industry – TMT", source_count: 10,
    summary: "Recurring revenue, unit economics and why growth companies trade on revenue multiples.",
    lessons: [
      { slug: "tmt-saas-metrics", title: "SaaS metrics: ARR, churn, CAC and the rule of 40", kind: "calculation" },
      { slug: "tmt-valuing-growth", title: "Valuing growth: EV/revenue, EV/EBITDA and when each applies" },
      { slug: "tmt-media-and-telecoms", title: "Media and telecoms: subscribers, ARPU and capex intensity" },
    ] },
];

/** Largest-remainder split of a module's question target across its lessons (front-loaded). */
function splitQuestions(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  let left = total - base * parts;
  return Array.from({ length: parts }, () => base + (left-- > 0 ? 1 : 0));
}

/** The 18 industry modules as curriculum topics (one subtopic per lesson), for seeds and targets. */
export const INDUSTRY_CURRICULUM: CurriculumTopic[] = INDUSTRY_MODULES.map((m) => {
  const n = lessonTargetCount(m.source_count);
  const lessons = m.lessons.slice(0, n);
  const q = splitQuestions(questionTargetCount(m.source_count), lessons.length);
  return {
    slug: m.slug as TopicSlug,
    title: m.title,
    kind: "industry",
    level: "advanced",
    is_free: false,
    summary: m.summary,
    source_section: m.source_section,
    group_family: m.family,
    subtopics: lessons.map((l, i) => sub(l.slug, l.title, l.kind ?? "mixed", m.source_section, q[i])),
  };
});

export const INDUSTRY_SLUGS: readonly string[] = INDUSTRY_MODULES.map((m) => m.slug);
export function isIndustrySlug(s: string): boolean {
  return INDUSTRY_SLUGS.includes(s);
}
/** Any slug a lesson/question `topic_slug` may reference: generalist topics or industry modules. */
export function isContentTopicSlug(s: string): boolean {
  return isTopicSlug(s) || isIndustrySlug(s);
}
export function industryModule(slug: string): IndustryModule | undefined {
  return INDUSTRY_MODULES.find((m) => m.slug === slug);
}

/** Generalist curriculum + industry modules — everything `topics`/`subtopics` hold. */
export const ALL_CURRICULUM: CurriculumTopic[] = [...CURRICULUM, ...INDUSTRY_CURRICULUM];

export function curriculumTopic(slug: string): CurriculumTopic | undefined {
  return ALL_CURRICULUM.find((t) => t.slug === slug);
}

export function findSubtopic(slug: string): { topic: CurriculumTopic; subtopic: CurriculumSubtopic } | undefined {
  for (const topic of ALL_CURRICULUM) {
    const subtopic = topic.subtopics.find((s) => s.slug === slug);
    if (subtopic) return { topic, subtopic };
  }
  return undefined;
}

export const TOTAL_TARGET_QUESTIONS = CURRICULUM.reduce((n, t) => n + t.subtopics.reduce((m, s) => m + s.target_questions, 0), 0);

// Default learning path: 10 weeks × 5 days; day 5 is a review placeholder (lesson_slug null).
// `lesson_slug` is the planned lesson slug (one lesson per subtopic, slug = subtopic slug, except
// the two Loop 03 hand-written lessons). Items whose lesson does not exist yet are stored with
// `lesson_id = null` and resolved when Loop 04 loads the lesson.
export type PathDay = { day: number; label: string; lesson_slug: string | null; question_set?: string[] };
export type PathWeek = { week: number; title: string; topic_slug: TopicSlug; days: PathDay[] };

const week = (week: number, title: string, topic_slug: TopicSlug, lessons: [string, string][]): PathWeek => ({
  week, title, topic_slug,
  days: [
    ...lessons.map(([lesson_slug, label], i) => ({ day: i + 1, label, lesson_slug })),
    { day: 5, label: "Review: flashcards + 5-question drill", lesson_slug: null },
  ],
});

export const DEFAULT_PATH = {
  slug: "default-10-week",
  title: "10-week technicals path",
  description: "Foundations → accounting → EqV/EV → valuation → DCF → M&A → LBO → fit and a full mock. Four lessons a week plus a review day.",
  weeks: [
    week(1, "Finance foundations", "finance-foundations", [["time-value-of-money", "Time value of money"], ["discount-rates-and-risk", "Discount rates and risk"], ["pv-npv", "Present value and NPV"], ["irr-and-payback", "IRR and payback"]]),
    week(2, "Accounting concepts", "accounting", [["three-statements-overview", "The three statements at a glance"], ["income-statement", "Income statement"], ["balance-sheet", "Balance sheet"], ["cash-flow-statement", "Cash flow statement"]]),
    week(3, "Accounting walkthroughs", "accounting", [["three-statement-links", "How the three statements link"], ["working-capital", "Working capital"], ["single-step-walkthroughs", "Single-step walkthroughs"], ["multi-step-walkthroughs", "Multi-step walkthroughs"]]),
    week(4, "Equity value vs enterprise value", "eqv-ev", [["equity-and-enterprise-value", "Equity value and enterprise value"], ["ev-bridge-basics", "The EqV → EV bridge"], ["diluted-shares", "Diluted share count"], ["ev-edge-cases", "Edge cases: leases, NCI, preferred, pensions"]]),
    week(5, "Valuation & multiples", "valuation", [["valuation-methodologies", "The three methodologies"], ["comparable-companies", "Comparable companies"], ["precedent-transactions", "Precedent transactions"], ["multiples-and-metrics", "Multiples and metrics"]]),
    week(6, "DCF assumptions", "dcf", [["dcf-overview", "What a DCF is doing"], ["unlevered-free-cash-flow", "Unlevered free cash flow"], ["projections-and-assumptions", "Projections and assumptions"], ["dcf-sensitivities", "Sensitivities and sanity checks"]]),
    week(7, "DCF discount rate & terminal value", "dcf", [["cost-of-equity-capm", "Cost of equity and CAPM"], ["wacc", "WACC"], ["terminal-value", "Terminal value"], ["levered-dcf-and-variants", "Levered DCF and other variants"]]),
    week(8, "M&A", "ma", [["why-companies-acquire", "Why companies acquire"], ["accretion-dilution-concepts", "Accretion / dilution: the idea"], ["accretion-dilution-calculations", "Accretion / dilution: the numbers"], ["purchase-price-allocation", "Purchase price allocation and goodwill"]]),
    week(9, "LBO", "lbo", [["lbo-overview", "What an LBO is"], ["sources-and-uses", "Sources and uses"], ["debt-tranches", "Debt tranches and covenants"], ["returns-irr-mom", "Returns: IRR and money multiple"]]),
    {
      week: 10, title: "Fit + full mock", topic_slug: "fit-behavioural" as TopicSlug,
      days: [
        { day: 1, label: "The big five fit questions", lesson_slug: "big-five-fit" },
        { day: 2, label: "Why banking, why this firm", lesson_slug: "why-banking-why-firm" },
        { day: 3, label: "Walking through your CV", lesson_slug: "cv-and-experience" },
        { day: 4, label: "Full mock: 15 timed questions (Loop 07)", lesson_slug: null },
        { day: 5, label: "Review: weak areas + flashcards", lesson_slug: null },
      ],
    },
  ] as PathWeek[],
};
