// `npm run reembed [-- --all]` — (re)embeds approved chunks whose embedding is missing or was made
// by a different provider than the current EMBEDDINGS_PROVIDER. `--all` forces every approved chunk.
import { adminClient } from "../seed/env";
import { embeddingModel } from "../../src/lib/ai/embeddings";
import { embedChunks } from "../../src/lib/corpus/ingest";

async function main() {
  const all = process.argv.includes("--all");
  const admin = adminClient();
  const model = embeddingModel();
  let q = admin.from("corpus_chunks").select("id, text, question, embedding_model").eq("status", "approved");
  if (!all) q = q.or(`embedding_model.is.null,embedding_model.neq.${model}`);
  const { data, error } = await q;
  if (error) throw error;
  const n = await embedChunks(admin, data ?? []);
  console.log(`reembed: ${n} chunk(s) embedded with ${model}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
