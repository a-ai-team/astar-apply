import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// Gate 1 needs a key; when .env.local has none, use a throwaway one. The webServer inherits it.
process.env.PRIVATE_ACCESS_KEY ??= "e2e-access-key";
// Loop 01: e2e never spends API credit — extraction returns the recorded fixture and embeddings
// are the local hashed provider. The webServer inherits these.
process.env.CORPUS_EXTRACTION_MODE ??= "fixture";
process.env.EMBEDDINGS_PROVIDER ??= "local";
// Loop 02: the chat pipeline runs real retrieval but composes answers deterministically (no API
// spend); the daily cap is 1 so the 429 path is exercised (e2e resets the student's usage first).
process.env.CHAT_MODE = "fixture";
process.env.CHAT_DAILY_CAP = "1";
// Loop 10: the launch spec exercises the public flow (gate 1 off); the "flag off → 307 /unlock"
// check runs separately with curl against a PUBLIC_LAUNCH=false server. No Stripe key → StripeStub.
process.env.PUBLIC_LAUNCH = "true";
process.env.ALLOW_STUB_CHECKOUT = "true"; // `next start` is NODE_ENV=production; let the stub grant plans to e2e users
process.env.DEMO_CHAT_DAILY_CAP = "3";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  // One worker: specs sign in as the same seeded users, and a second magic link for a user
  // invalidates the first (parallel files raced on e2e-student → /login?error=link).
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
