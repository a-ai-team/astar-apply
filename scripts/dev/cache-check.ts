// `npm run cache:check` — sends the corpus-extract system prompt twice and verifies the second call
// reads from the prompt cache (usage.cache_read_input_tokens > 0). Costs a few cents. Skips
// cleanly without a key. Rules: .claude/rules/ai.md (≥ 1024 tokens before the breakpoint).
import { config as loadEnv } from "dotenv";
import { MODEL_CHAT, OPUS_BETAS, OPUS_FALLBACKS, getClient, hasAnthropicKey } from "../../src/lib/ai/client";
import { corpusExtractPrompt } from "../../src/lib/ai/prompts/corpus-extract.v1";

loadEnv({ path: ".env.local" });

async function main() {
  if (!hasAnthropicKey()) {
    console.log("cache-check: ANTHROPIC_API_KEY unset — skipped");
    return;
  }
  const client = getClient();
  // Pad the cached prefix past the 1024-token minimum with the tag prompt's taxonomy text.
  const { corpusTagPrompt } = await import("../../src/lib/ai/prompts/corpus-tag.v1");
  const system = [
    { type: "text" as const, text: corpusExtractPrompt.system + "\n\n" + corpusTagPrompt.system.repeat(3), cache_control: { type: "ephemeral" as const } },
  ];
  const call = () =>
    client.beta.messages.create({
      model: MODEL_CHAT,
      max_tokens: 64,
      betas: [...OPUS_BETAS],
      fallbacks: OPUS_FALLBACKS,
      output_config: { effort: "low" },
      system,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
    });
  const a = await call();
  const b = await call();
  console.log("first :", { created: a.usage.cache_creation_input_tokens, read: a.usage.cache_read_input_tokens });
  console.log("second:", { created: b.usage.cache_creation_input_tokens, read: b.usage.cache_read_input_tokens });
  if (!b.usage.cache_read_input_tokens) {
    console.error("cache-check: second call did not read from cache");
    process.exit(1);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
