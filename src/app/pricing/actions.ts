"use server";

// Loop 10 billing actions. Server Actions bypass the proxy → verifySession() here. `startCheckout`
// sends a signed-in user to Stripe Checkout (or the stub success page); `openPortal` to the
// Customer Portal (needs a stored customer id; the stub just bounces back).
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { requestOrigin } from "@/lib/site";
import { getBilling } from "@/lib/billing/stripe";
import { isPlanId } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTableMissing } from "@/lib/billing/entitlements";

export async function startCheckout(formData: FormData): Promise<void> {
  const plan = String(formData.get("plan") ?? "");
  if (!isPlanId(plan) || plan === "free") throw new Error("bad plan");
  const session = await verifySession(`/pricing?plan=${plan}`);
  const origin = await requestOrigin();
  let url: string;
  try {
    ({ url } = await getBilling().createCheckout({
      userId: session.userId, email: session.email, plan,
      successUrl: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing?cancelled=1`,
    }));
  } catch (e) {
    console.error("checkout failed", e);
    redirect(`/pricing?error=${encodeURIComponent("Checkout is not available right now.")}`);
  }
  redirect(url);
}

export async function openPortal(): Promise<void> {
  const session = await verifySession("/pricing");
  const origin = await requestOrigin();
  const db = createAdminClient();
  const { data, error } = await db.from("subscriptions").select("stripe_customer_id").eq("user_id", session.userId).maybeSingle();
  if (error && !isTableMissing(error)) console.warn("portal: subscription lookup failed", error.message);
  const customerId = (data?.stripe_customer_id as string | null | undefined) ?? null;
  const billing = getBilling();
  if (billing.kind === "stripe" && !customerId) redirect(`/pricing?error=${encodeURIComponent("No Stripe customer on this account yet.")}`);
  let url: string;
  try {
    ({ url } = await billing.createPortal({ customerId: customerId ?? "cus_stub", returnUrl: `${origin}/pricing` }));
  } catch (e) {
    console.error("portal failed", e);
    redirect(`/pricing?error=${encodeURIComponent("The billing portal is not available right now.")}`);
  }
  redirect(url);
}
