@AGENTS.md

# A* Apply

A new site from A* AI (what it does is TBD — do not describe it as an application tracker). Separate site from the main A* AI product; shares branding (`public/logo.png`).

## Team
- Owners: James Wingfield (@WingfieldJames), Tesleem (president of BIG). More collaborators will join — keep everything discoverable and documented.
- Org: https://github.com/a-ai-team

## Stack
Next.js (App Router, `src/app`), TypeScript, Tailwind. npm. Deployed on Vercel (preview per PR).

## Workflow (read CONTRIBUTING.md)
- Never commit directly to `main`. Branch → PR → review → squash merge.
- Branch names: `feat/...`, `fix/...`, `chore/...`.
- Run `npm run lint` and `npm run build` before opening a PR.
- Keep secrets in `.env.local` (gitignored); document required vars in `.env.example`.
