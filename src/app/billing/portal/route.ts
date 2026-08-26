// GET /billing/portal — convenience redirect into the Stripe Customer Portal (same as the
// `openPortal` action; linked from the app shell / emails). Requires a session.
import { openPortal } from "@/app/pricing/actions";

export async function GET() {
  await openPortal();
}
