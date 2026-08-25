---
paths:
  - "src/app/**"
  - "src/proxy.ts"
  - "src/components/**"
  - "next.config.ts"
---

# Next.js 16.3 rules (from `node_modules/next/dist/docs/01-app/` — read the file before coding)

- `src/proxy.ts` replaces middleware (`16-proxy.md`). **Node runtime only**; no `runtime`
  export. Do cookie-only optimistic checks + Supabase session refresh there; no DB queries.
- Server Actions are POSTs to the page route and **bypass proxy matchers** — every action calls
  `verifySession()` from `src/lib/dal.ts` (`server-only`, `cache()`d). `redirect()` outside `try`.
- `params` / `searchParams` are Promises. Use the generated global types `PageProps<'/route'>`,
  `LayoutProps<'/route'>`, `RouteContext<'/api/x'>`; run `next typegen` before `tsc` (the
  `typecheck` script does this).
- `cacheComponents` is off. Reading cookies makes a route dynamic (fine for `/home/**`).
  `revalidateTag(tag, 'max')` — two args. Prefer `refresh()` from `next/cache` after mutations.
  Don't add `use cache`, `unstable_cache`, or flip `cacheComponents` in a loop.
- Streaming responses: route handler returns `new Response(readableStream, { headers:
  {'Content-Type': 'text/event-stream'} })`; bridge the Anthropic SDK stream with an async
  generator; `export const maxDuration = 60`. Never `runtime = 'edge'` (deprecated).
- Chat/forms: `useOptimistic` for pending messages, `formRef.current?.reset()` inside the action
  (state setters are deferred in transitions), `useActionState(action, initial)` signature
  `(prevState, formData)`.
- No MDX. Lessons render from JSON via `src/components/lesson/LessonRenderer`.
- UI: Tailwind 4 tokens from `globals.css` (`--bg --surface --border --fg --muted --accent`),
  dark-first, primitives in `src/components/ui/`. Every page under `/home` and `/admin` sets
  `robots: { index: false }` until launch.
