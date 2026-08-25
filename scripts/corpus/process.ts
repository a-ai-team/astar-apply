// `npm run corpus:process -- <sourceId>` — re-run extraction + chunking + tagging for one source.
import { adminClient } from "../seed/env";
import { processSource } from "../../src/lib/corpus/ingest";

const id = process.argv[2];
if (!id) {
  console.error("usage: npm run corpus:process -- <sourceId>");
  process.exit(1);
}
processSource(adminClient(), id)
  .then((r) => console.log(JSON.stringify(r)))
  .catch((e) => { console.error(e); process.exit(1); });
