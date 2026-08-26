import type { Metadata } from "next";
import { getSession } from "@/lib/dal";
import { LegalPage } from "@/components/site/legal";

export const metadata: Metadata = { title: "Terms of service", alternates: { canonical: "/terms" }, robots: { index: true, follow: true } };

export default async function TermsPage() {
  const session = await getSession();
  return (
    <LegalPage title="Terms of service" updated="26 August 2026" draft session={session}>
      <h2>The service</h2>
      <p>A* Apply is a study tool for investment banking applications and interviews. It is not careers advice, not a guarantee of any outcome, and not affiliated with any bank, university or the authors of any third-party guide.</p>
      <h2>Accounts</h2>
      <p>You must be 16 or over. Keep your sign-in link private; you are responsible for activity on your account. One person per account.</p>
      <h2>Plans and payment</h2>
      <p>Free, Core (£4.99/month) and AI (£9.99/month), billed monthly by Stripe. No refunds on monthly plans; cancel any time from the billing portal and keep access until the end of the paid period. Prices include VAT where applicable and may change with 30 days&apos; notice. {/* TODO(james): confirm prices + VAT treatment */}</p>
      <h2>Content</h2>
      <p>Lessons, questions and mentor material are ours or licensed to us and are for your personal study only. No scraping, redistribution or use to train models. AI-generated grades and answers can be wrong; check anything that matters.</p>
      <h2>Acceptable use</h2>
      <p>Do not attempt to bypass plan limits, the access key or rate limits; do not upload material you do not have the right to share; do not use the mentor chatbot to obtain confidential information about any firm.</p>
      <h2>Termination</h2>
      <p>We may suspend accounts that break these terms. You may delete your account at any time by emailing us.</p>
      <h2>Liability</h2>
      <p>To the extent permitted by law, our liability is limited to the fees you paid in the previous three months. Nothing excludes liability for fraud or death or personal injury caused by negligence.</p>
      <h2>Law</h2>
      <p>England and Wales. Contact: hello@astar-apply.com.</p>
    </LegalPage>
  );
}
