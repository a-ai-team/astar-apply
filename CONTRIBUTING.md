# Contributing to A* Apply

## Setup
```bash
git clone https://github.com/a-ai-team/astar-apply.git
cd astar-apply
npm install
cp .env.example .env.local   # fill in any values
npm run dev                  # http://localhost:3000
```

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
- Run `npm run lint && npm run build` before requesting review.

## Using Claude Code
`CLAUDE.md` in the root gives Claude the project context. Keep it updated when conventions change.
