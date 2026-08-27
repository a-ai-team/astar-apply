# Loop 10 — Launch (open PR)

_Status: open-pr (needs James). Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
public landing with unauthenticated demo chat, pricing with Stripe Checkout + Portal (test mode; `StripeStub` when no key), entitlement gating, SEO/metadata/sitemap, analytics (Vercel + PostHog no-op without key), legal templates, Non-Target playbook, `PUBLIC_LAUNCH` flag around the key gate. **Ships as an open PR labelled `needs-james`.**
## Out of scope
annual plans, referrals, mobile app.
## Research at start
Stripe Checkout/Portal/webhooks (`constructEvent` with raw body), Stripe CLI; Next `14-metadata-and-og-images.md`, `analytics.md`, `json-ld.md`, `production-checklist.md`, `content-security-policy.md`, `16-proxy.md`; PostHog App Router; `financefluency.md` § Pricing/Non-Target/Supporting.
## Data model — `0011_billing.sql`
`plans(id free|core|ai, name, monthly_gbp, stripe_price_id, features jsonb)`; `subscriptions(id, user_id unique, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, updated_at)`; `entitlements(user_id pk, plan_id, features, computed_at)`; `playbook_progress(user_id, item_key, done)`; `demo_usage(ip_hash, day, count)`. Writes only via service role in webhook; `plans` public.
## Routes/screens
`/` (hero, `DemoChat` via `POST /api/demo-chat` 3/day per hashed IP, corpus-only rung, no persistence; curriculum preview; "vs just asking AI"; placeholders for unis/testimonials; footer legal); `/pricing` (`startCheckout(plan)`), `/billing/portal`, `/billing/success`; `POST /api/stripe/webhook`; `src/lib/billing/{stripe,entitlements (can(user, feature, target)),gate (UpgradeCard)}`; gates in lessons (non-free topics show title + TOC + card), practice (full bank), interviews (AI), flashcards (SRS analytics); `/non-target` (7 original sections in `content/playbook/*.json` + `Checklist`); `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, JSON-LD, `/privacy`, `/terms` (draft-flagged); `proxy.ts` keeps key gate unless `PUBLIC_LAUNCH='true'`, always session gate; analytics events signup/lesson_complete/chat_message/checkout_started/subscribed.
## Scripts
`scripts/seed/10-plans.ts` (£0 / £4.99 / £9.99, price ids null); `scripts/billing/sync-stripe.ts` (only with key); webhook fixture replay test.
## Env
`PUBLIC_LAUNCH=false`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_POSTHOG_KEY/HOST`, `NEXT_PUBLIC_SITE_URL`, `DEMO_CHAT_DAILY_CAP=3`.
## Risks
no Stripe keys → stub path (test env only) + recorded-fixture tests; landing copy brand-sensitive → PR open; legal = templates.
## Acceptance checks
- [x] lint/typecheck/build
- [x] vitest entitlement matrix, webhook signature/upsert, demo cap (unit 168/168: `entitlements.test.ts` 6, `webhook.test.ts` 6 on 3 recorded fixtures + `generateTestHeaderString`, `usage.test.ts` 5, `playbook/content.test.ts` 1)
- [ ] `seed -- 10` — runs and **SKIPS** with a clear message (`plans` table absent: 0011 unapplied, § Blocked 1); passes once James runs `npm run db:migrate`
- [x] Playwright `e2e/10-launch.spec.ts` with `PUBLIC_LAUNCH=true` in test env — 5/5 (hero + demo answer + placeholders marked; demo cap 429 on the 4th; 3 tiers + sitemap/robots/privacy/terms/non-target/OG 200; free student sees `UpgradeCard` + TOC on a temporary approved DCF lesson, bank hides DCF, mock disabled → stub checkout → `core` → lesson renders, portal button; checklist persists across reloads). Full suite 34/34.
- [x] with `PUBLIC_LAUNCH=false` `curl -sI /home` → `307 Temporary Redirect`, `location: /unlock?next=%2Fhome`; `/` and `/pricing` → 200
- [x] Lighthouse (`npx lighthouse`, headless, `next start`) on `/`: **perf 95, SEO 100, a11y 96**, best-practices 96 (one `color-contrast` note on muted text — cosmetic)

## Tasks
- [x] migration + plans (0011 written, unapplied → § Blocked 1; `PLANS`; `seed -- 10` no-ops with message)
- [x] entitlements + `can()` + `UpgradeCard` + gates (lessons TOC+card, bank free-topics filter, question page, drills/mocks incl. firm Practise-this, decks, SRS analytics card)
- [x] Stripe client/stub, actions, webhook + tests, sync script (6 vitest cases on 3 recorded fixtures + computed signatures)
- [x] pricing + success (`/pricing`, `/billing/success`, `/billing/portal`)
- [x] landing + demo chat + cap (`/`, `DemoChat`, `POST /api/demo-chat` corpus-only fixture, 3/day hashed IP memory + `demo_usage`)
- [x] playbook content + checklist (7 sections `content/playbook/*.json`, `/non-target`, `Checklist` → `playbook_progress` else localStorage)
- [x] SEO + legal (root metadata + OG image, `sitemap.ts`, `robots.ts`, JSON-LD Organization/WebSite/Product/Article, `/privacy` + `/terms` draft-flagged)
- [x] analytics (`@vercel/analytics` + PostHog provider no-op without key; events signup / lesson_complete / chat_message / checkout_started / subscribed)
- [x] `PUBLIC_LAUNCH` flag + `PRIVATE_AREA.md`
- [x] Lighthouse + Playwright + docs + retro; open PR, do not merge

## Blocked-on-human (defaults)
prices £0/£4.99/£9.99; Stripe → stub, PR lists env vars; `PUBLIC_LAUNCH=false`; placeholders marked.


## Blocked
1. **Migration `0011_billing.sql` is written but NOT applied** — same wall as Loop 09 § Blocked 1 (Postgres unreachable from the sandbox; PostgREST only). Everything degrades: every user is `free` (`getEntitlement` → default), `PLANS` comes from the constant, `seed -- 10` skips, the demo cap is in-memory, playbook progress is localStorage-only, the StripeStub grants plans to a per-process memory store (dev/e2e only). **James:** `npm run db:migrate` (applies 0010 + 0011), then `npm run seed -- 09 && npm run seed -- 10`.
2. **No Stripe keys** — `StripeStub` everywhere. Real path is written and unit-tested against recorded fixtures but has never talked to Stripe. **James:** create test-mode keys, set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; `npx tsx scripts/billing/sync-stripe.ts` → paste `STRIPE_PRICE_CORE` / `STRIPE_PRICE_AI`; add the webhook endpoint `https://<domain>/api/stripe/webhook` (events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`); `stripe listen --forward-to localhost:3000/api/stripe/webhook` locally.
3. **No Anthropic credit** — the landing demo is corpus-only fixture mode (`DEMO_CHAT_MODE` unset). Set `DEMO_CHAT_MODE=live` once credit exists to use Opus 5 (still 3/day per IP).
4. **Landing copy / logos / testimonials** are placeholders (`TODO(james)` in `src/app/page.tsx`); legal pages are drafts (`draft` flag in `src/app/{privacy,terms}/page.tsx`). Contact address `hello@astar-apply.com` is a placeholder.


## Retro
- **Shipped:** migration `0011_billing` (`plans`, `subscriptions`, `entitlements`, `playbook_progress`, `demo_usage`, `increment_demo_usage()`, RLS on every table — unapplied); `PLANS` + `seed 10`; `src/lib/billing/{plans,entitlements,session,stripe,webhook}.ts` with `can()`, `getEntitlement`, `setPlan`, `StripeStub`/`RealStripe`, `handleStripeEvent`; `UpgradeCard`; gates on lessons (title + TOC + card), practice bank (free topics + card), question page, drills/mocks/firm Practise-this, decks, SRS analytics card; `POST /api/stripe/webhook`; `/pricing`, `/billing/success`, `/billing/portal`, `startCheckout`/`openPortal`; `scripts/billing/sync-stripe.ts`; landing `/` (hero, `DemoChat`, curriculum preview, "Couldn't I just ask AI?", placeholder strip/testimonials marked, pricing teaser, legal footer) + `POST /api/demo-chat` (corpus-only, fixture, 3/day hashed IP); Non-Target playbook (7 original sections, templates, 17-item checklist with `playbook_progress` → localStorage fallback); SEO (root metadata + template, OG image, sitemap, robots, JSON-LD Organization/WebSite/Product/Article, `/privacy` + `/terms` drafts); analytics (`@vercel/analytics` + lazy PostHog, 5 events); `PUBLIC_LAUNCH` flag + `PRIVATE_AREA.md`; `e2e/10-launch.spec.ts` 5/5 (suite 34/34), unit 168/168, Lighthouse 95/100/96; docs (`TECHNICALS` § Loop 10, `.env.example` +11).
- **Slipped:** applying 0011 (network); real Stripe round-trip (no keys); live demo chat (no credit); `@lhci/cli` config (used `npx lighthouse` once instead — no `lighthouserc`); PostHog server-side events (client only); a `signup` event that distinguishes new vs returning users (fires on magic-link request); CSP headers (`content-security-policy.md` read, not implemented — PostHog/Vercel script hosts would need allow-listing); annual plans/referrals (out of scope).
- **Decisions taken by default:** (1) prices £0 / £4.99 / £9.99 and the feature split (Core = all content + AI drills/mocks; AI = SRS analytics, detailed feedback, firm-set practice, fit grading) copied from the financefluency shape; (2) feature keys are strings on the plan (`PLANS[].features`), the DB row mirrors them; (3) free content is always open (`can()` short-circuits on `isFree`) so no free user loses anything they had; (4) **existing e2e specs sign in with `core`** via the stub success page (`signInAs(..., plan = "core")`) because Loops 05–09 assumed open content; the launch spec passes `"free"`; (5) `ALLOW_STUB_CHECKOUT=true` (Playwright only) lets the stub grant plans under `next start` (NODE_ENV=production) — refused on `VERCEL_ENV=production` or when a Stripe key exists; (6) stub plans live in a process-memory map when 0011 is absent (never in production); (7) `subscriptions.status` check list mirrors Stripe's; `invoice.payment_failed` keeps the plan (Stripe retries, `customer.subscription.deleted` ends it); (8) demo chat is fixture-only unless `DEMO_CHAT_MODE=live`, returns JSON not SSE, hashes IP with `DEMO_IP_SALT` (falls back to a service-key prefix); (9) `/non-target` is public and free (financefluency: "free with account") — progress needs an account; (10) robots disallow `/home /admin /api /billing /unlock /auth`; sitemap lists only the 5 public routes; (11) PostHog distinct id = Supabase user id, no email; EU host default; (12) legal pages are indexable drafts with a red banner; (13) `/billing/portal` is a GET that reuses `openPortal`.
- **James must set (Vercel + `.env.local`):** `PUBLIC_LAUNCH` (`true` at launch), `NEXT_PUBLIC_SITE_URL` (real domain — metadataBase/sitemap/OG), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_CORE`, `STRIPE_PRICE_AI`, `NEXT_PUBLIC_POSTHOG_KEY` (+ `NEXT_PUBLIC_POSTHOG_HOST`), `DEMO_CHAT_DAILY_CAP` (3), `DEMO_IP_SALT`, optionally `DEMO_CHAT_MODE=live`. Never set `ALLOW_STUB_CHECKOUT` in Vercel.
- **Migration-apply step:** `npm run db:migrate` (0010 + 0011, idempotent) → `npm run seed -- 09` → `npm run seed -- 10` → `npx tsx scripts/billing/sync-stripe.ts` (after keys) → `npm run db:check`. Then delete the memory-store fallback in `src/lib/billing/entitlements.ts` (`TODO(james)`).

