// `npx tsx scripts/dev/dump-chunks.ts` — one line per approved chunk (source kind | title | ordinal
// | chunk kind | first 110 chars). Handy when writing fixtures/eval/retrieval.jsonl.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { adminClient } from "../seed/env";

async function main() {
  const db = adminClient();
  const { data: s } = await db.from("corpus_sources").select("id,title,kind");
  const m = new Map((s ?? []).map((x) => [x.id, x]));
  const { data } = await db.from("corpus_chunks").select("source_id,ordinal,kind,question,text").eq("status", "approved").order("source_id").order("ordinal");
  for (const c of data ?? []) {
    const src = m.get(c.source_id);
    console.log(`${src?.kind}|${src?.title.slice(0, 60)}|${c.ordinal}|${c.kind}|${(c.question ?? c.text).replace(/\s+/g, " ").slice(0, 110)}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
