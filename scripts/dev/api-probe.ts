// `npx tsx scripts/dev/api-probe.ts` — prints whether ANTHROPIC_API_KEY can actually be used
// (distinguishes "no key", "no credit" (billing), "bad key" (auth) and other errors). The same
// probe drives CHAT_MODE=auto (src/lib/chat/mode.ts) and the eval harness's `NO API CREDIT` skip.
// Exit code: 0 usable, 2 no key/credit/auth, 1 other error.
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

export { probeApi, isCredentialFailure, classifyApiError, type ProbeResult } from "../../src/lib/ai/probe";

async function main() {
  const { probeApi, isCredentialFailure } = await import("../../src/lib/ai/probe");
  const r = await probeApi({ force: true });
  if (r.ok) {
    console.log(`api-probe: OK (${r.model})`);
    return;
  }
  console.log(`api-probe: ${r.reason.toUpperCase()} — ${r.message}`);
  if (r.reason === "billing") console.log("NO API CREDIT");
  process.exit(isCredentialFailure(r) ? 2 : 1);
}

if (process.argv[1]?.endsWith("api-probe.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
