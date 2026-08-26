# Loop 10 — Launch (open PR)

_Status: in progress. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
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
- [ ] lint/typecheck/build
- [ ] vitest entitlement matrix, webhook signature/upsert, demo cap
- [ ] `seed -- 10`
- [ ] Playwright `e2e/10-launch.spec.ts` with `PUBLIC_LAUNCH=true` in test env (hero + demo answer; 3 tiers; free user sees `UpgradeCard` on DCF; stub checkout → `core` → DCF visible; playbook checklist persists; sitemap/robots 200)
- [ ] with `PUBLIC_LAUNCH=false` `curl /home` → 307 `/unlock`
- [ ] Lighthouse CI on `/`: perf ≥ 85, SEO ≥ 95, a11y ≥ 90

## Tasks
- [x] migration + plans (0011 written, unapplied → § Blocked 1; `PLANS`; `seed -- 10` no-ops with message)
- [x] entitlements + `can()` + `UpgradeCard` + gates (lessons TOC+card, bank free-topics filter, question page, drills/mocks incl. firm Practise-this, decks, SRS analytics card)
- [x] Stripe client/stub, actions, webhook + tests, sync script (6 vitest cases on 3 recorded fixtures + computed signatures)
- [x] pricing + success (`/pricing`, `/billing/success`, `/billing/portal`)
- [ ] landing + demo chat + cap
- [ ] playbook content + checklist
- [ ] SEO + legal
- [ ] analytics
- [ ] `PUBLIC_LAUNCH` flag + `PRIVATE_AREA.md`
- [ ] Lighthouse + Playwright + docs + retro; open PR, do not merge

## Blocked-on-human (defaults)
prices £0/£4.99/£9.99; Stripe → stub, PR lists env vars; `PUBLIC_LAUNCH=false`; placeholders marked.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
