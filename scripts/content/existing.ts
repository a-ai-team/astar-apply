// What content/ already holds, in the shape the target builders need (lessons → sibling
// one-liners, questions → "do not duplicate" lists and taken slugs).
import path from "node:path";
import type { ExistingContent } from "../../src/lib/content/generate/targets";
import { validateContentDir } from "./validate";

export function existingFromDir(root = path.resolve("content")): ExistingContent {
  const { lessons, questions } = validateContentDir(root);
  return {
    lessons: lessons.map((l) => {
      const body = l.body as { blocks?: { type: string; md?: string }[] } | null;
      const one = body?.blocks?.find((b) => b.type === "one_liner")?.md ?? null;
      return { slug: l.slug, subtopic_slug: l.subtopic_slug, title: l.title, one_liner: one };
    }),
    questions: questions.filter((q) => q.ok).map((q) => ({ slug: q.value!.slug, subtopic_slug: q.value!.subtopic_slug, kind: q.value!.kind, question: q.value!.question })),
  };
}
