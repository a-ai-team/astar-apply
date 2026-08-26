// /billing/success — where Checkout lands. Real Stripe: the webhook has (or is about to) set the
// plan; we just show the current entitlement. Stub (`?stub=1&plan=`): grants the plan directly,
// NEVER in production (NODE_ENV guard) — the linked project is the only environment, so this is
// how the gating e2e flips e2e-student between free and core.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEntitlement, setPlan } from "@/lib/billing/entitlements";
import { isPlanId, planById } from "@/lib/billing/plans";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { safeNext } from "@/lib/site";
import { SubscribedEvent } from "@/components/analytics/events";

export const metadata: Metadata = { title: "Subscription — A* Apply", robots: { index: false, follow: false } };

export default async function BillingSuccessPage({ searchParams }: PageProps<"/billing/success">) {
  const sp = await searchParams;
  const session = await verifySession("/pricing");
  const db = createAdminClient();
  const stub = sp.stub === "1";
  const wanted = typeof sp.plan === "string" && isPlanId(sp.plan) ? sp.plan : null;
  let note: string | null = null;
  if (stub && wanted) {
    if (process.env.NODE_ENV === "production") {
      note = "Stub checkout is disabled in production.";
    } else {
      const ent = await setPlan(db, session.userId, wanted, { status: "active", stripe_customer_id: null, stripe_subscription_id: null });
      note = `Stub checkout (no Stripe key): plan set to ${ent.plan} (${ent.source}).`;
    }
  }
  const ent = await getEntitlement(db, session.userId);
  const plan = planById(ent.plan);
  const next = safeNext(sp.next, "/home");
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <Card data-testid="billing-success" data-plan={ent.plan}>
        <CardTitle>{ent.plan === "free" ? "You're on Free" : `You're on ${plan.name}`}</CardTitle>
        <CardDescription>
          {ent.plan === "free"
            ? "If you just paid, give it a few seconds — Stripe confirms the subscription by webhook — then refresh."
            : `${plan.tagline} Monthly, cancel any time from the billing portal.`}
        </CardDescription>
        {note && <p className="mt-3 text-xs text-muted" data-testid="billing-note">{note}</p>}
        <div className="mt-4 flex gap-3 text-sm">
          <Link href={next} className="inline-flex h-9 items-center rounded-md bg-accent px-4 font-medium text-accent-fg" data-testid="billing-continue">Continue</Link>
          <Link href="/pricing" className="inline-flex h-9 items-center rounded-md border border-border px-4">Plans</Link>
        </div>
      </Card>
      {ent.plan !== "free" && <SubscribedEvent plan={ent.plan} />}
    </div>
  );
}
