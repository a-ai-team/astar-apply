// `npx tsx scripts/dev/chat-cli.ts "what is enterprise value" [--mode live|fixture] [--json]`
// Runs the chat pipeline in-process (no HTTP, no persistence) and prints the streamed answer with
// its citations and the retrieval record. Useful for prompt work and for checking retrieval.
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

async function main() {
  const args = process.argv.slice(2);
  const modeIdx = args.indexOf("--mode");
  const forced = modeIdx >= 0 ? (args[modeIdx + 1] as "live" | "fixture") : undefined;
  const json = args.includes("--json");
  const message = args.filter((a, i) => !a.startsWith("--") && (modeIdx < 0 || i !== modeIdx + 1)).join(" ").trim();
  if (!message) {
    console.error('usage: npx tsx scripts/dev/chat-cli.ts "question" [--mode live|fixture] [--json]');
    process.exit(1);
  }
  const { adminClient } = await import("../seed/env");
  const { resolveChatMode } = await import("../../src/lib/chat/mode");
  const { runPipeline, loadMentorNames } = await import("../../src/lib/chat/pipeline");
  const db = adminClient();
  const mode = forced ?? (await resolveChatMode());
  const mentorNames = await loadMentorNames(db);
  console.log(`mode: ${mode}\n`);
  for await (const ev of runPipeline({ db, message, history: [], mode, mentorNames })) {
    if (ev.type === "delta") process.stdout.write(ev.text);
    else if (ev.type === "retrieval") console.log(`[retrieval] intent=${ev.rewrite.intent} queries=${JSON.stringify(ev.rewrite.queries)} rung=${ev.rung}\n${ev.chunks.map((c, i) => `  [${i + 1}] ${c.label}`).join("\n")}\n`);
    else if (ev.type === "citation") process.stdout.write(`[${ev.index}]`);
    else if (ev.type === "done") {
      console.log(`\n\n[done] model=${ev.content.model} rung=${ev.content.rung} citations=${ev.content.citations.length} latency=${ev.latency_ms}ms usage=${JSON.stringify(ev.content.usage)}`);
      if (json) console.log(JSON.stringify(ev, null, 2));
    } else if (ev.type === "error") console.error(`[error] ${ev.message}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
