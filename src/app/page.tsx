// / — public landing (Loop 10). Hero + DemoChat, curriculum preview, "Couldn't I just ask AI?",
// placeholder uni strip + testimonials (clearly marked), pricing teaser, footer legal. Indexable.
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/dal";
import { CURRICULUM, INDUSTRY_MODULES } from "@/lib/content/taxonomy";
import { formatGbp, PLANS } from "@/lib/billing/plans";
import { SITE } from "@/lib/seo";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { DemoChat } from "@/components/landing/demo-chat";
import { JsonLd } from "@/components/site/json-ld";

export const metadata: Metadata = {
  title: { absolute: "A* Apply — Ask a mentor who got in" },
  description: SITE.description,
  alternates: { canonical: "/" },
};

// TODO(james): replace with real partner societies / permission-cleared logos.
const PLACEHOLDER_UNIS = ["Placeholder University A", "Placeholder University B", "Placeholder University C", "Placeholder University D"];
// TODO(james): replace with real, consented quotes. These are synthetic and labelled as such.
const PLACEHOLDER_TESTIMONIALS = [
  { quote: "Placeholder testimonial — synthetic text for layout only.", who: "Student, non-target, 2027 intake (placeholder)" },
  { quote: "Placeholder testimonial — synthetic text for layout only.", who: "Spring week offer holder (placeholder)" },
  { quote: "Placeholder testimonial — synthetic text for layout only.", who: "Summer analyst (placeholder)" },
];

const AI_ROWS = [
  { q: "Where do answers come from?", ai: "Whatever is on the internet, blended.", us: "A mentor who got in — his notes, his answers, cited by source." },
  { q: "Is it right for a UK spring week or summer?", ai: "Often US-shaped and out of date.", us: "Written for UK undergrads, in £m, against this cycle's process." },
  { q: "What happens when I'm wrong?", ai: "It agrees with you.", us: "Timed drills graded against a model answer, with what to reread." },
  { q: "Who checks it?", ai: "Nobody.", us: "Every lesson and question passes a mentor review before you see it." },
];

export default async function LandingPage() {
  const session = await getSession();
  const core = CURRICULUM.filter((t) => t.kind !== "fit");
  const cta = session ? { href: "/home", label: "Open the app" } : { href: "/login?next=/home", label: "Start free" };
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Organization", name: SITE.publisher, url: SITE.url, logo: `${SITE.url}/logo.png` },
          { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, description: SITE.description },
          {
            "@context": "https://schema.org", "@type": "Product", name: `${SITE.name} Core`, description: SITE.description, brand: { "@type": "Brand", name: SITE.publisher },
            offers: PLANS.filter((p) => p.monthly_gbp > 0).map((p) => ({ "@type": "Offer", name: p.name, price: p.monthly_gbp.toFixed(2), priceCurrency: "GBP", url: `${SITE.url}/pricing?plan=${p.id}`, availability: "https://schema.org/InStock" })),
          },
        ]}
      />
      <SiteHeader session={session} />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-16 sm:pt-24">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Investment banking interview prep</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl" data-testid="hero-heading">Ask a mentor who got in.</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">Interview-framed technicals, a graded question bank, AI mocks — and a chatbot that answers the way a mentor would, citing his own material rather than the internet&apos;s. Built for UK undergrads going for spring weeks and summers.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={cta.href} className="inline-flex h-11 items-center rounded-md bg-accent px-6 text-sm font-medium text-accent-fg" data-testid="hero-cta">{cta.label}</Link>
            <Link href="/pricing" className="inline-flex h-11 items-center rounded-md border border-border px-6 text-sm">See pricing</Link>
          </div>
          <div className="mt-12 max-w-3xl">
            <h2 className="mb-3 text-sm font-medium text-muted">Try it — three questions a day, no account.</h2>
            <DemoChat />
          </div>
        </section>

        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold sm:text-3xl">The curriculum, in interview order</h2>
            <p className="mt-2 max-w-2xl text-muted">{core.length} generalist topics and {INDUSTRY_MODULES.length} industry modules. Every lesson ends with the canonical 45-second answer, the trap interviewers set, and four quick-fire pairs.</p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="curriculum-preview">
              {core.map((t, i) => (
                <li key={t.slug} className="rounded-lg border border-border bg-bg p-4" data-testid="curriculum-topic">
                  <div className="flex items-center gap-2 text-xs text-muted"><span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span><span>{t.subtopics.length} lessons</span>{t.is_free && <span className="ml-auto rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-accent">Free</span>}</div>
                  <h3 className="mt-2 font-medium">{t.title}</h3>
                  <p className="mt-1 text-sm text-muted">{t.summary}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-muted">Plus: {INDUSTRY_MODULES.slice(0, 6).map((m) => m.title).join(", ")} and {INDUSTRY_MODULES.length - 6} more industry modules. Fit &amp; behavioural, firm question banks, weekly Pulse, and the Non-Target playbook.</p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-16" data-testid="vs-ai">
          <h2 className="text-2xl font-semibold sm:text-3xl">&ldquo;Couldn&apos;t I just ask AI?&rdquo;</h2>
          <p className="mt-2 max-w-2xl text-muted">You could. Here is what you would be missing.</p>
          <div className="mt-8 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3"></th><th className="px-4 py-3">A general chatbot</th><th className="px-4 py-3">A* Apply</th></tr></thead>
              <tbody>
                {AI_ROWS.map((r) => (
                  <tr key={r.q} className="border-t border-border align-top"><th scope="row" className="px-4 py-3 font-medium">{r.q}</th><td className="px-4 py-3 text-muted">{r.ai}</td><td className="px-4 py-3">{r.us}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t border-border" data-testid="social-proof">
          <div className="mx-auto w-full max-w-6xl px-6 py-12">
            <p className="text-center text-xs uppercase tracking-[0.2em] text-muted">Used by students at <span className="rounded bg-danger/10 px-1 text-danger">placeholder — logos pending permission</span></p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted" data-testid="uni-strip">
              {PLACEHOLDER_UNIS.map((u) => <li key={u} className="opacity-60">{u}</li>)}
            </ul>
            <ul className="mt-10 grid gap-4 md:grid-cols-3" data-testid="testimonials">
              {PLACEHOLDER_TESTIMONIALS.map((t, i) => (
                <li key={i} className="rounded-lg border border-dashed border-border p-5 text-sm">
                  <p className="text-muted">“{t.quote}”</p>
                  <p className="mt-3 text-xs text-muted">— {t.who}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold sm:text-3xl">Start free. Upgrade when you need the rest.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3" data-testid="pricing-teaser">
              {PLANS.map((p) => (
                <Link key={p.id} href={`/pricing?plan=${p.id}`} className="rounded-lg border border-border bg-bg p-5 hover:border-accent">
                  <div className="flex items-baseline justify-between"><h3 className="font-semibold">{p.name}</h3><span className="tabular-nums">{formatGbp(p.monthly_gbp)}<span className="text-xs text-muted">/mo</span></span></div>
                  <p className="mt-2 text-sm text-muted">{p.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
