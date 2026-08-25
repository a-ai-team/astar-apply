@AGENTS.md

# A* Apply

AI-supported finance-careers resource from A* AI, built with student mentors. Two products: the
**Mentor chatbot** (RAG over mentors' own material) and **Technicals** (curriculum, question bank,
flashcards, mock interviews). Not an application tracker. Shares A* branding (`public/logo.png`).

## Start here — every session
1. Read `docs/loops/CURRENT.md` (live state: loop, branch, task, blockers, next action).
2. Then the current loop doc in `docs/loops/NN-*.md` and `docs/loops/CONTRACTS.md`.
3. Only then `docs/MASTER_PLAN.md` for the big picture. Protocol: `docs/loops/README.md`.

## Team
- Owners: James Wingfield (@WingfieldJames), Tesleem (president of BIG, mentor #1). More
  collaborators will join — keep everything discoverable and documented.
- Org: https://github.com/a-ai-team (repo is **public**).

## Stack
Next.js 16 App Router (`src/app`, `src/proxy.ts`), TypeScript, Tailwind 4, Supabase
(Postgres + pgvector + Auth + Storage, project `astarapply`, ref `nvigkfmrxtxvylbhfcwa`),
Anthropic TS SDK (`claude-opus-5`), Vercel. npm. Path-scoped rules in `.claude/rules/` load
when you touch `src/lib/ai`, `supabase`, `content`, `src/app`, or tests.

## Commands
- `npm run dev` · `npm run lint` · `npm run typecheck` · `npm run build`
- `npm run test:unit` (vitest) · `npm run test:e2e` (Playwright vs `next start` :3100)
- `npm run db:migrate` (`supabase db push --linked`) · `npm run seed -- <loop>` · `npm run eval -- --suite <s>`
- Before every push: `npm run lint && npm run typecheck && npm run build`.

## Workflow
- Never commit directly to `main`. Branch `feat/<slug>` → PR (template) → squash merge.
- One loop at a time; tick tasks in the loop doc as they complete; rewrite `CURRENT.md` after
  every task; append to `docs/loops/RUNLOG.md` when a loop ends.
- Secrets only in `.env.local`; document every var in `.env.example`.
- Blocked on a human? Take the loop doc's stated default, note it under "Decisions taken by
  default", add `TODO(james):` at the code site, keep going.

## Hard rails
- Never commit `.env*`, `.eval/`, `supabase/.temp`, PDFs, or images outside `fixtures/`.
- Never read or copy files from `~/Desktop` except the 400Q PDF via `scripts/eval/extract-400q.ts`,
  which writes only to `$EVAL_HIDDEN_DIR/.eval/`. The 400Q guide and financefluency.co.uk are
  structural references only — never reproduce their text. All content is original.
- Never force-push, `supabase db reset`, drop tables, or `vercel env rm`.
- Stay inside the current loop's task list. Three failed builds on one task → mark it blocked, move on.

## Private area
`/` is public "Coming soon". Real site lives at `/home`, gated by `PRIVATE_ACCESS_KEY` in
`src/proxy.ts` (plus Supabase session from Loop 00) — see `docs/PRIVATE_AREA.md`.

## Mentor chatbot
`/home/mentor` streams cited answers from the mentor corpus — pipeline, modes (`CHAT_MODE`), evals: `docs/CHAT.md`.
