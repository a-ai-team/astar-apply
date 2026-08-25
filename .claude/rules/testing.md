---
paths:
  - "e2e/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "vitest.config.*"
  - "playwright.config.*"
  - ".github/workflows/**"
---

# Testing rules

- Unit: `vitest`, files next to code as `*.test.ts`; AI calls are never made in unit tests —
  use recorded fixture responses under `fixtures/recorded/`.
- E2E: `@playwright/test` in `e2e/*.spec.ts`, run by `npm run test:e2e` against `next start` on
  port 3100 with `.env.local`. Sign in with `e2e/helpers/auth.ts` (service-role
  `auth.admin.generateLink({ type: 'magiclink' })` → visit `action_link`). Test users:
  `e2e-student@astar.test`, `e2e-mentor@astar.test`, `e2e-admin@astar.test`
  (created by `npm run seed -- 00`). Use `data-testid` selectors; keep each spec < 60 s.
- Acceptance checks in the loop doc are the contract: each one maps to a command, a test, or a
  `curl`. Tick them in the doc only after they actually ran; paste failing output into the loop
  doc's "Blocked" section, don't summarise it away.
- Evals (`npm run eval`) hit the real API and cost money; run with `--limit` while iterating
  and the full suite once before merging.
- CI (`.github/workflows/ci.yml`): `npm ci` → lint → typecheck → build → test:unit; `eval`
  job only on PRs touching `src/lib/ai/**` and only when `ANTHROPIC_API_KEY` secret exists.
