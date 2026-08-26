# Contributing to A* Apply

## Setup
```bash
git clone https://github.com/a-ai-team/astar-apply.git
cd astar-apply
npm install
cp .env.example .env.local   # fill in: Supabase keys, PRIVATE_ACCESS_KEY (ask James)
npm run dev                  # http://localhost:3000 → /unlock → /login
```

### Database (Supabase)
There is one Supabase project (`astarapply`, ref `nvigkfmrxtxvylbhfcwa`) and no local Docker
stack. `supabase link --project-ref nvigkfmrxtxvylbhfcwa` once, then:

| Command | Does |
|---|---|
| `npm run db:migrate` | `supabase db push --linked` — applies `supabase/migrations/*.sql` to the remote project |
| `npm run seed -- 00` | creates the three `e2e-*@astar.test` users (idempotent) |
| `npm run seed -- 01` | ingests `fixtures/corpus/*` → ≥ 40 approved, embedded corpus chunks (idempotent; needs seed 00) |
| `npm run seed -- 08` | 14 firm dossiers + 210 firm questions (all `generated`, student-invisible) + the synthetic sample Pulse digest (approved) |
| `npm run firms:author -- [--firm slug]` / `npm run pulse:generate -- [--dry-run]` | Loop 08 AI authoring: firm questions → fixtures; weekly Pulse digest → `pulse_digests` (fixture branch without API credit) |
| `npm run db:check` | verifies the corpus schema on the remote project (tables, HNSW, RLS, functions, bucket) |
| `npm run corpus:process -- <id>` / `npm run reembed` | re-run extraction+chunking for one source / re-embed approved chunks after a provider switch |
| `npm run fixtures:build` | regenerates `fixtures/corpus/sample-note.png` and the (uncommitted) 3-page sample PDF |
| `npm run cache:check` | proves prompt-cache reads on the extraction prompt (spends a few cents) |
| `npm run test:unit` | vitest (`src/**/*.test.ts`, `scripts/**/*.test.ts`) |
| `npm run test:e2e` | Playwright against `next start` on port 3100, signing in via service-role magic links |
| `npm run typecheck` | `next typegen && tsc --noEmit` |

Migrations are idempotent and numbered per `docs/loops/CONTRACTS.md`; never edit an applied one
(this repo's rules are in `.claude/rules/db.md`). Auth/roles: `docs/PRIVATE_AREA.md`.

## Workflow
1. Pick or create an issue on the GitHub Projects board.
2. Branch from `main`: `git checkout -b feat/short-description`
3. Commit small, clear commits.
4. Push and open a PR — fill in the template. Vercel posts a preview link automatically.
5. One approval required, then **squash & merge**. Delete the branch.

`main` is protected: no direct pushes, PRs required.

## Conventions
- TypeScript everywhere; no `any` without a comment.
- Tailwind for styling; shared components in `src/components`.
- Run `npm run lint && npm run typecheck && npm run build && npm run test:unit` before requesting review (CI runs the same).

## Using Claude Code
`CLAUDE.md` in the root gives Claude the project context. Keep it updated when conventions change.
