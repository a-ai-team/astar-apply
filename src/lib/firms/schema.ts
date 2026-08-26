// Firm dossier + firm question shapes (Loop 08, docs/loops/08-firms-pulse.md § Data model). Shared by
// the seed (fixtures/firms/*.json), the authoring script, the admin JSON editor and the pages.
import { z } from "zod";

export const FIRM_TYPES = ["bulge_bracket", "elite_boutique", "uk_mid", "buy_side", "other"] as const;
export const CATEGORIES = ["motivation", "behavioural", "commercial", "about_you", "technical"] as const;
export const STAGES = ["hirevue", "interview", "ac"] as const;
export const PROGRAMMES = ["spring", "summer", "graduate", "offcycle"] as const;
export const FREQUENCIES = ["very_common", "common", "occasional"] as const;

export const LABELS = {
  type: { bulge_bracket: "Bulge bracket", elite_boutique: "Elite boutique", uk_mid: "UK mid-market", buy_side: "Buy side", other: "Other" },
  category: { motivation: "Motivation & fit", behavioural: "Behavioural", commercial: "Commercial awareness", about_you: "About you", technical: "Technical" },
  stage: { hirevue: "HireVue", interview: "Interview", ac: "Assessment centre" },
  programme: { spring: "Spring", summer: "Summer", graduate: "Graduate", offcycle: "Off-cycle" },
  frequency: { very_common: "Very common", common: "Common", occasional: "Occasional" },
} as const;

export const SourceSchema = z.object({ title: z.string().min(1).max(200), url: z.string().url().max(500) });
export const ProcessStageSchema = z.object({
  stage: z.string().min(1).max(120),
  when: z.string().max(120).default(""),
  notes: z.string().max(600).default(""),
});

export const FirmSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(120),
  type: z.enum(FIRM_TYPES),
  founded: z.number().int().min(1600).max(2100).nullable().default(null),
  hq: z.string().max(120).nullable().default(null),
  headcount: z.string().max(120).nullable().default(null),
  scale_note: z.string().max(400).nullable().default(null),
  divisions: z.array(z.string().min(1).max(120)).max(30).default([]),
  values: z.array(z.string().min(1).max(200)).max(12).default([]),
  process: z.array(ProcessStageSchema).max(12).default([]),
  sources: z.array(SourceSchema).max(10).default([]),
});
export type Firm = z.infer<typeof FirmSchema>;
export type FirmInput = z.input<typeof FirmSchema>;

export const FirmQuestionSchema = z.object({
  category: z.enum(CATEGORIES),
  division: z.string().max(120).nullable().default(null),
  question: z.string().min(8).max(600),
  stage: z.enum(STAGES),
  programme: z.enum(PROGRAMMES),
  frequency: z.enum(FREQUENCIES).default("common"),
  recency_year: z.number().int().min(2015).max(2100).nullable().default(null),
  guidance_md: z.string().max(4000).default(""),
  sources: z.array(SourceSchema).max(5).default([]),
});
export type FirmQuestion = z.infer<typeof FirmQuestionSchema>;

/** Fixture file shape for fixtures/firms/questions/<slug>.json. */
export const FirmQuestionFileSchema = z.object({
  _note: z.string().optional(),
  firm: z.string().regex(/^[a-z0-9-]+$/),
  questions: z.array(FirmQuestionSchema).min(1).max(40),
});

/** The Claude structured-output shape for one authoring call (scripts/firms/author.ts). */
export const AuthoredQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      category: z.enum(CATEGORIES).describe("One of the five categories"),
      division: z.string().nullable().describe("Division the question is specific to, or null for any"),
      question: z.string().describe("The question exactly as an interviewer would put it"),
      stage: z.enum(STAGES).describe("Where in the process it is usually asked"),
      programme: z.enum(PROGRAMMES).describe("Programme it is most associated with"),
      frequency: z.enum(FREQUENCIES),
      guidance_md: z.string().describe("3–6 short bullet points: what a strong answer covers. Guidance, never a script."),
    }),
  ).min(10).max(15),
});
export type AuthoredQuestions = z.infer<typeof AuthoredQuestionsSchema>;

export function validateFirm(input: unknown): { ok: true; value: Firm } | { ok: false; errors: string[] } {
  const r = FirmSchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data };
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
}

/**
 * Derives the grader inputs (model answer, key points, weak-answer note) from `guidance_md` so a firm
 * question can be drilled with the Loop 07 grader (retro note 2). Key points = the bullet lines.
 */
export function gradeMaterialFromGuidance(question: string, guidanceMd: string): { model_answer_md: string; key_points: string[]; weak_answer_note: string } {
  const bullets = guidanceMd
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*•]\s+/.test(l))
    .map((l) => l.replace(/^[-*•]\s+/, "").trim())
    .filter(Boolean);
  const key_points = (bullets.length ? bullets : guidanceMd.split(/\n{2,}|\.\s+/).map((s) => s.trim()).filter(Boolean)).slice(0, 6);
  const model_answer_md = guidanceMd.trim() || `A strong answer to "${question}" is specific, structured and honest.`;
  return {
    model_answer_md,
    key_points: key_points.length ? key_points : ["Answer the question directly", "Give one concrete example", "Link it back to the role"],
    weak_answer_note: "Generic answers that could be given to any firm, or that list facts without linking them to the candidate's own experience, score poorly.",
  };
}
