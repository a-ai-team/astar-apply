// One-off (needs API credit): runs the real Haiku disagreement check on the synthetic passages in
// fixtures/recorded/chat-disagreement.v1.sample.json and overwrites `response` / `parsed_output`
// with the live result, so the unit test exercises a genuine recorded response.
// `npx tsx scripts/dev/record-disagreement.ts`
import { config as loadEnv } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL_FAST, getClient } from "../../src/lib/ai/client";
import { chatDisagreementPrompt } from "../../src/lib/ai/prompts/chat-disagreement.v1";
import { DisagreementSchema, buildDisagreementInput, splitByOrigin } from "../../src/lib/chat/disagreement";

loadEnv({ path: ".env.local" });

async function main() {
  const file = "fixtures/recorded/chat-disagreement.v1.sample.json";
  const fx = JSON.parse(readFileSync(file, "utf8"));
  const { corpus, content } = splitByOrigin(fx.chunks, fx.citations);
  const res = await getClient().beta.messages.parse({
    model: MODEL_FAST,
    max_tokens: 400,
    system: [{ type: "text", text: chatDisagreementPrompt.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildDisagreementInput(fx.question, fx.answer, corpus, content) }],
    output_config: { format: betaZodOutputFormat(DisagreementSchema) },
  });
  const { parsed_output, ...response } = res;
  fx._note = "PLACEHOLDER — synthetic passages; response recorded live by scripts/dev/record-disagreement.ts";
  fx.response = response;
  fx.parsed_output = parsed_output;
  writeFileSync(file, JSON.stringify(fx, null, 2) + "\n");
  console.log("recorded:", parsed_output);
}

main().catch((e) => { console.error(e); process.exit(1); });
