// Corpus tagging prompt (Haiku): topic slugs from the fixed taxonomy + named entities.
import { TOPICS } from "@/lib/content/taxonomy";

const taxonomyList = TOPICS.map((t) => `- ${t.slug}: ${t.label}`).join("\n");

export const corpusTagPrompt = {
  id: "corpus-tag",
  version: 1,
  system: `You tag short passages from a finance mentor's notes for a UK student careers site. For each passage return:
- "topic_tags": 1–3 slugs chosen ONLY from this taxonomy (use the slug exactly):
${taxonomyList}
- "entities": {"firms": [...], "programmes": [...]} — proper names of banks/funds/firms mentioned, and named programmes (e.g. "spring week", "summer analyst", "off-cycle"). Empty arrays when none.

Return one item per passage, in the same order, keyed by the passage "id" you were given. Answer only with the structured object.`,
} as const;
