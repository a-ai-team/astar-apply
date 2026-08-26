// `npm run content:index` — rebuilds public.content_chunks (0007) from every approved lesson and
// question: one chunk per lesson block (tiny blocks merged), one per question; embeds with the
// configured provider (local hashed by default; Voyage when VOYAGE_API_KEY is set — rerun after
// switching, like `reembed`). Idempotent: chunks are replaced per item; items that lost approval
// lose their chunks. Runs with the service-role client from .env.local.
import { indexAllContent } from "../../src/lib/content/index-content";
import { adminClient } from "../seed/env";

async function main() {
  const db = adminClient();
  const r = await indexAllContent(db, (s) => console.log(`  ${s}`));
  for (const s of r.skipped) console.warn(`  SKIPPED ${s}`);
  console.log(`content:index: ${r.lessons} lesson(s) + ${r.questions} question(s) → ${r.chunks} chunk(s)${r.removed ? ` (${r.removed} stale)` : ""}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
