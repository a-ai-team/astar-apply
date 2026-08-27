// / — public landing (Loop 10). Hero + DemoChat, curriculum preview, "Couldn't I just ask AI?",
// placeholder uni strip + testimonials (clearly marked), pricing teaser, footer legal. Indexable.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/dal";
import { CURRICULUM, INDUSTRY_MODULES } from "@/lib/content/taxonomy";
import { formatGbp, PLANS } from "@/lib/billing/plans";
import { SITE } from "@/lib/seo";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { DemoChat } from "@/components/landing/demo-chat";
import { JsonLd } from "@/components/site/json-ld";
import { NeuralField } from "@/components/home/neural-field";
import { Reveal } from "@/components/home/reveal";
import { ScrollStage } from "@/components/home/scroll-progress";
import { MENTORS, credentialLine, portraitSrc } from "@/content/mentors";

const lead = MENTORS.find((m) => m.live) ?? MENTORS[0];

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
    <div className="flex min-h-screen flex-col bg-bg text-fg" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: "document.currentScript.parentElement.setAttribute('data-js','')" }} />
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Organization", name: SITE.publisher, url: SITE.url, logo: `${SITE.url}/wordmark.png` },
          { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, description: SITE.description },
          {
            "@context": "https://schema.org", "@type": "Product", name: `${SITE.name} Core`, description: SITE.description, brand: { "@type": "Brand", name: SITE.publisher },
            offers: PLANS.filter((p) => p.monthly_gbp > 0).map((p) => ({ "@type": "Offer", name: p.name, price: p.monthly_gbp.toFixed(2), priceCurrency: "GBP", url: `${SITE.url}/pricing?plan=${p.id}`, availability: "https://schema.org/InStock" })),
          },
        ]}
      />
      <SiteHeader session={session} />
      <main className="flex-1">
        <ScrollStage className="relative isolate overflow-hidden" data-testid="landing-hero">
          <NeuralField className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]" />
          <div className="mx-auto flex w-full max-w-[880px] flex-col items-center px-6 pb-20 pt-20 text-center sm:pt-28" style={{ transform: "translateY(calc(var(--scroll-p, 0) * -24px))" }}>
            <Reveal as="p" className="text-[0.8rem] uppercase tracking-[0.2em] text-muted">Investment banking interview prep</Reveal>
            <Reveal as="h1" delay={80} className="mt-6 font-display text-[clamp(2.75rem,7.2vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.02em] text-fg [text-wrap:balance]" data-testid="hero-heading">
              Ask a mentor who got in.
            </Reveal>
            <Reveal as="p" delay={160} className="mt-7 max-w-xl text-[1.05rem] leading-relaxed text-muted [text-wrap:pretty] md:text-lg">
              Interview-framed technicals, a graded question bank, AI mocks — and a Mentor that answers the way a senior student would, citing their own material rather than the internet&apos;s. Built for UK undergrads going for spring weeks and summers.
            </Reveal>
            <Reveal delay={240} className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href={cta.href} className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-fg transition hover:brightness-110" data-testid="hero-cta">{cta.label}</Link>
              <Link href="/pricing" className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm text-fg transition hover:border-muted">See pricing</Link>
            </Reveal>
            <Reveal delay={360} y={10} className="mt-16 flex flex-col items-center">
              <Image src={portraitSrc(lead)} alt={lead.name} width={144} height={144} priority data-field-focus className="h-28 w-28 rounded-full object-cover ring-1 ring-accent/40 shadow-[0_0_48px_-8px_rgba(212,181,113,0.35)] md:h-32 md:w-32" />
              <p className="mt-5 font-display text-[1.35rem] font-medium leading-none tracking-[-0.01em] text-fg">{lead.name}</p>
              <p className="mt-2 max-w-md text-[0.7rem] uppercase tracking-[0.16em] text-muted [text-wrap:balance]">{credentialLine(lead)}</p>
            </Reveal>
          </div>
        </ScrollStage>

        <section className="mx-auto w-full max-w-[760px] px-6 pb-20">
          <Reveal>
            <p className="mb-4 text-center text-[0.7rem] uppercase tracking-[0.16em] text-muted">Try it — three questions a day, no account</p>
            <DemoChat />
          </Reveal>
        </section>

        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.015em] text-fg [text-wrap:balance]">The curriculum, in interview order</h2>
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
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.015em] text-fg [text-wrap:balance]">&ldquo;Couldn&apos;t I just ask AI?&rdquo;</h2>
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
            <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.015em] text-fg [text-wrap:balance]">Start free. Upgrade when you need the rest.</h2>
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
