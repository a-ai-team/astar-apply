// Copy and data for the /home landing (src/components/home/sections.tsx). Server-safe, no React.
// The mono "facts" lines are static on purpose (no DB reads on the landing) — update them when the
// curriculum changes; nothing pins them in tests (docs/loops/CURRENT.md, rule 9).

export type ToolCard = {
  href: string;
  title: string;
  body: string;
  facts: string;
  testId: string;
};

export const TOOLKIT: ToolCard[] = [
  {
    href: "/home/mentor",
    title: "Mentor",
    body: "Ask a student who got the offer, and get an answer with the passage it came from.",
    facts: "cited answers · applications · networking · ACs",
    testId: "home-mentor-card",
  },
  {
    href: "/home/technicals",
    title: "Technicals",
    body: "The IB technicals textbook written for a second-year with one finance module.",
    facts: "35 lessons · 7 chapters · 20 widgets · 7 cheat sheets",
    testId: "home-technicals-card",
  },
  {
    href: "/home/practice",
    title: "Practice",
    body: "Timed questions you grade yourself, and flashcards that come back just before you forget.",
    facts: "210 questions · 4 levels · 176 cards · spaced repetition",
    testId: "home-practice-card",
  },
  {
    href: "/home/interviews",
    title: "Interviews",
    body: "Answer on the clock, get a score out of ten and a debrief that points at what to fix.",
    facts: "drill 5 × 120 s · mock 15 × 90 s · scored /10",
    testId: "home-interviews-card",
  },
];

export type Chip = { href: string; label: string };

export type Stage = { n: string; title: string; body: string; chips: Chip[] };

const MENTOR: Chip = { href: "/home/mentor", label: "Mentor" };
const TECHNICALS: Chip = { href: "/home/technicals", label: "Technicals" };
const PRACTICE: Chip = { href: "/home/practice", label: "Practice" };
const INTERVIEWS: Chip = { href: "/home/interviews", label: "Interviews" };

/** The five stages a spring week or summer internship runs through, and what covers each. No dates. */
export const ROUTE: Stage[] = [
  {
    n: "01",
    title: "Applications and CV",
    body: "Which programmes to go for, what a strong second-year CV looks like, and who to talk to before you apply.",
    chips: [MENTOR],
  },
  {
    n: "02",
    title: "Online tests and recorded interviews",
    body: "What the tests look like, and how to answer to a timer when nobody is on the other end.",
    chips: [MENTOR, INTERVIEWS],
  },
  {
    n: "03",
    title: "First interviews",
    body: "The technicals and the fit questions, learned once and drilled until they come out clean.",
    chips: [TECHNICALS, PRACTICE, INTERVIEWS],
  },
  {
    n: "04",
    title: "Assessment centre",
    body: "The full mock, the cheat sheets the night before, and a mentor who remembers what the room was like.",
    chips: [INTERVIEWS, { href: "/home/technicals", label: "Cheat sheets" }, MENTOR],
  },
  {
    n: "05",
    title: "Offer",
    body: "The ten-week path puts the four stages above in the right order, so the work is done before it is needed.",
    chips: [{ href: "/home/path", label: "10-week path" }],
  },
];

/** Mirrors DEFAULT_PATH in src/lib/content/taxonomy.ts (weeks 1–9 lessons, week 10 fit + full mock). */
export const PATH_WEEKS: Array<{ week: number; label: string }> = [
  { week: 1, label: "Foundations" },
  { week: 2, label: "Accounting" },
  { week: 3, label: "Accounting" },
  { week: 4, label: "EqV vs EV" },
  { week: 5, label: "Valuation" },
  { week: 6, label: "DCF" },
  { week: 7, label: "DCF" },
  { week: 8, label: "M&A" },
  { week: 9, label: "LBO" },
  { week: 10, label: "Fit + full mock" },
];

export const REASONS: Array<{ n: string; title: string; body: string }> = [
  {
    n: "01",
    title: "Their notes, not the internet's",
    body: "Answers come from what the mentor wrote and was asked, and from the lessons here, not from forum folklore.",
  },
  {
    n: "02",
    title: "Every answer cited",
    body: "Each reply links to the passage it came from, so you can read the original and decide for yourself.",
  },
  {
    n: "03",
    title: "Says so when it doesn't know",
    body: "If nothing in the material covers it, the Mentor tells you and gives the standard answer instead of inventing one.",
  },
];

/** The static chat mock on the landing — illustrative, not a real thread. */
export const CHAT_MOCK = {
  question: "When should I start messaging analysts if spring week applications open in September?",
  answer:
    "Before they open. Most people wait for the form and then send twenty messages in one week. The ones who got replies started a month earlier, one message at a time, and had something specific to ask each person…",
  chips: ["Networking & coffee chats · notes", "Spring weeks · Q&A"],
};

export type WorkItem = { tag: "Coming" | "Planned"; title: string; body: string };

/** Built-but-unapproved and planned products. Never "live"; no dates; no prices. */
export const IN_THE_WORKS: WorkItem[] = [
  {
    tag: "Coming",
    title: "Firm question banks",
    body: "Questions students were actually asked, by firm and by stage, checked by a mentor before they appear.",
  },
  {
    tag: "Coming",
    title: "Pulse",
    body: "A weekly market digest, reviewed by a mentor, so you walk into a coffee chat with something to say.",
  },
  {
    tag: "Planned",
    title: "Video interview practice",
    body: "Answer to a camera on the clock, the way recorded first-round interviews work.",
  },
];
