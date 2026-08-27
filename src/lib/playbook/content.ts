// Non-Target playbook (Loop 10): 7 original sections in content/playbook/*.json, validated with
// zod at import time. Checklist items carry stable keys (playbook_progress.item_key).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const ChecklistItem = z.object({ key: z.string().regex(/^[a-z0-9-]+$/), label: z.string().min(1) });
const Block = z.discriminatedUnion("type", [
  z.object({ type: z.literal("md"), md: z.string().min(1) }),
  z.object({ type: z.literal("template"), title: z.string().min(1), md: z.string().min(1) }),
  z.object({ type: z.literal("checklist"), title: z.string().min(1), items: z.array(ChecklistItem).min(1) }),
]);
export const PlaybookSectionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  ordinal: z.number().int().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  blocks: z.array(Block).min(1),
});
export type PlaybookSection = z.infer<typeof PlaybookSectionSchema>;
export type PlaybookBlock = z.infer<typeof Block>;

const DIR = path.join(process.cwd(), "content", "playbook");

let cached: PlaybookSection[] | null = null;

export function loadPlaybook(dir = DIR): PlaybookSection[] {
  if (cached && dir === DIR) return cached;
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const sections = files.map((f) => PlaybookSectionSchema.parse(JSON.parse(readFileSync(path.join(dir, f), "utf8")))).sort((a, b) => a.ordinal - b.ordinal);
  const keys = checklistKeys(sections);
  if (new Set(keys).size !== keys.length) throw new Error("playbook: duplicate checklist keys");
  if (dir === DIR) cached = sections;
  return sections;
}

export function checklistKeys(sections: PlaybookSection[]): string[] {
  return sections.flatMap((s) => s.blocks.flatMap((b) => (b.type === "checklist" ? b.items.map((i) => i.key) : [])));
}
