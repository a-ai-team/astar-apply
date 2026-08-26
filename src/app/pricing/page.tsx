// /pricing — three tiers from PLANS (Loop 10). Public; the checkout button needs a session
// (the action redirects to /login?next=/pricing otherwise). Current plan is highlighted.
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/dal";
import { getSessionEntitlement } from "@/lib/billing/session";
import { formatGbp, PLANS } from "@/lib/billing/plans";
import { getBilling } from "@/lib/billing/stripe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { openPortal } from "./actions";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free covers Accounting and EqV vs EV. Core unlocks the whole curriculum and AI-graded mocks for £4.99 a month; AI adds mastery analytics and detailed feedback for £9.99.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  const sp = await searchParams;
  const [session, ent] = await Promise.all([getSession(), getSessionEntitlement()]);
  const error = typeof sp.error === "string" ? sp.error : null;
  const highlight = typeof sp.plan === "string" ? sp.plan : "core";
  const stub = getBilling().kind === "stub";
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-semibold sm:text-4xl" data-testid="pricing-heading">Simple monthly pricing</h1>
        <p className="mt-3 max-w-2xl text-muted">Start free with the two topics every interview opens on. Upgrade when you want the rest. Monthly, cancel any time. Prices in GBP, VAT included.</p>
        {error && <p className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger" data-testid="pricing-error">{error}</p>}
        {sp.cancelled === "1" && <p className="mt-4 text-sm text-muted">Checkout cancelled — nothing was charged.</p>}
        {stub && <p className="mt-4 text-xs text-muted" data-testid="pricing-stub-note">Stripe is not configured on this deployment; checkout runs in stub mode.</p>}
        <div className="mt-10 grid gap-4 md:grid-cols-3" data-testid="pricing-tiers">
          {PLANS.map((p) => {
            const current = ent.plan === p.id;
            return (
              <div key={p.id} className={`flex flex-col rounded-xl border p-6 ${highlight === p.id ? "border-accent" : "border-border"} bg-surface`} data-testid="pricing-tier" data-plan={p.id} data-current={current ? "1" : "0"}>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  {current && <Badge tone="accent" data-testid="pricing-current">Your plan</Badge>}
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums">{formatGbp(p.monthly_gbp)}<span className="text-sm font-normal text-muted">/month</span></p>
                <p className="mt-2 text-sm text-muted">{p.tagline}</p>
                <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm">
                  {p.bullets.map((b) => <li key={b} className="flex gap-2"><span aria-hidden className="text-accent">✓</span><span>{b}</span></li>)}
                </ul>
                <div className="mt-6">
                  {p.id === "free" ? (
                    session ? <Link href="/home" className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border text-sm">Go to the app</Link>
                      : <Link href="/login?next=/home" className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border text-sm" data-testid="pricing-signup">Create a free account</Link>
                  ) : current ? (
                    <form action={openPortal}><Button type="submit" variant="secondary" className="w-full" data-testid="pricing-portal">Manage subscription</Button></form>
                  ) : (
                    <CheckoutButton plan={p.id} label={ent.plan === "free" ? `Get ${p.name}` : p.ordinal > PLANS.find((x) => x.id === ent.plan)!.ordinal ? `Upgrade to ${p.name}` : `Switch to ${p.name}`} signedIn={Boolean(session)} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-xs text-muted">Payments by Stripe. No refunds on monthly plans; cancel any time and keep access until the end of the period. Students at partner universities: ask your society for a promo code.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
