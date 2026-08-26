"use client";

// Checkout button: fires the `checkout_started` analytics event, then submits the server action.
import { useFormStatus } from "react-dom";
import { startCheckout } from "@/app/pricing/actions";
import { track } from "@/lib/analytics/client";
import type { PlanId } from "@/lib/billing/plans";
import { Button } from "@/components/ui/button";

function Submit({ label, plan }: { label: string; plan: PlanId }) {
  const { pending } = useFormStatus();
  return <Button type="submit" className="w-full" disabled={pending} data-testid={`checkout-${plan}`}>{pending ? "Redirecting…" : label}</Button>;
}

export function CheckoutButton({ plan, label, signedIn }: { plan: PlanId; label: string; signedIn: boolean }) {
  return (
    <form action={startCheckout} onSubmit={() => track("checkout_started", { plan, signed_in: signedIn })}>
      <input type="hidden" name="plan" value={plan} />
      <Submit label={label} plan={plan} />
    </form>
  );
}
