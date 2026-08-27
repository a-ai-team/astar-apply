import type { Metadata } from "next";
import { getSession } from "@/lib/dal";
import { LegalPage } from "@/components/site/legal";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" }, robots: { index: true, follow: true } };

export default async function PrivacyPage() {
  const session = await getSession();
  return (
    <LegalPage title="Privacy policy" updated="26 August 2026" draft session={session}>
      <h2>Who we are</h2>
      <p>A* Apply is operated by A* AI (“we”). Contact: hello@astar-apply.com. {/* TODO(james): legal entity name, address, ICO registration if required */}</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account</strong>: your email address (magic-link sign-in) and the role we assign you (student, mentor, admin).</li>
        <li><strong>Learning data</strong>: lessons completed, practice attempts and self-grades, flashcard reviews, mock-interview answers and their AI grades, chatbot threads and feedback.</li>
        <li><strong>Billing</strong>: your plan and Stripe customer / subscription identifiers. Card details are handled by Stripe and never reach our servers.</li>
        <li><strong>Usage</strong>: page views and product events (sign-up, lesson complete, chat message, checkout started, subscribed) via Vercel Analytics and PostHog, tied to your user id, never your email.</li>
        <li><strong>Demo chat</strong>: a salted hash of your IP address to enforce the daily limit; the question is not stored.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To run the service, grade your answers, remember your progress, bill you, and improve the curriculum. Chat messages and interview answers are sent to Anthropic&apos;s API to generate responses and grades; they are not used to train models.</p>
      <h2>Legal basis</h2>
      <p>Contract (providing the service), legitimate interests (security, analytics, product improvement) and consent where required for cookies.</p>
      <h2>Processors</h2>
      <p>Supabase (database and auth, EU), Vercel (hosting and analytics), Stripe (payments), Anthropic (AI), PostHog (analytics, EU), Voyage AI (embeddings, when enabled).</p>
      <h2>Retention</h2>
      <p>Account and learning data for as long as you have an account, then deleted within 30 days of a deletion request. Billing records for six years as required by UK tax law.</p>
      <h2>Your rights</h2>
      <p>Access, rectification, erasure, portability, restriction and objection under UK GDPR. Email us; we respond within one month. You may complain to the ICO.</p>
      <h2>Cookies</h2>
      <p>Strictly necessary cookies for sign-in and the private-area key; analytics cookies only when PostHog is enabled.</p>
      <h2>Changes</h2>
      <p>We will post changes here and update the date above.</p>
    </LegalPage>
  );
}
