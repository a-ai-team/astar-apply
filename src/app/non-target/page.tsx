// /non-target — the Non-Target playbook (Loop 10): 7 original sections + interactive checklist.
// Public and indexable (free with or without an account; progress saves when signed in).
import type { Metadata } from "next";
import { getSession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { loadPlaybook, type PlaybookBlock } from "@/lib/playbook/content";
import { isTableMissing } from "@/lib/billing/entitlements";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Checklist } from "@/components/playbook/checklist";
import { Markdown } from "@/components/lesson/markdown";
import { JsonLd } from "@/components/site/json-ld";
import { SITE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Non-Target playbook",
  description: "How to get into investment banking from a non-target university: the reality, a networking playbook with templates, CV positioning, alternative routes, and a month-by-month checklist.",
  alternates: { canonical: "/non-target" },
};

export default async function NonTargetPage() {
  const session = await getSession();
  const sections = loadPlaybook();
  let progress: Record<string, boolean> = {};
  if (session) {
    const db = await createClient();
    const { data, error } = await db.from("playbook_progress").select("item_key, done").eq("user_id", session.userId);
    if (error) { if (!isTableMissing(error)) console.warn("playbook: progress read failed", error.message); }
    else progress = Object.fromEntries((data ?? []).map((r) => [r.item_key as string, Boolean(r.done)]));
  }
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "The Non-Target playbook", description: metadata.description, author: { "@type": "Organization", name: SITE.publisher }, publisher: { "@type": "Organization", name: SITE.publisher }, url: `${SITE.url}/non-target` }} />
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Free</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl" data-testid="playbook-heading">The Non-Target playbook</h1>
        <p className="mt-3 text-muted">Seven short sections on getting into banking without the university on the list. {session ? "Your checklist saves to your account." : "Sign in to save your checklist across devices; otherwise it stays in this browser."}</p>
        <nav className="mt-8 rounded-lg border border-border bg-surface p-4 text-sm" aria-label="Sections" data-testid="playbook-toc">
          <ol className="grid gap-1 sm:grid-cols-2">
            {sections.map((s) => <li key={s.slug}><a href={`#${s.slug}`} className="hover:underline">{s.ordinal}. {s.title}</a></li>)}
          </ol>
        </nav>
        {sections.map((s) => (
          <section key={s.slug} id={s.slug} className="mt-14 scroll-mt-8" data-testid="playbook-section">
            <h2 className="text-2xl font-semibold">{s.ordinal}. {s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.summary}</p>
            <div className="mt-5 flex flex-col gap-5">
              {s.blocks.map((b, i) => <Block key={i} block={b} progress={progress} signedIn={Boolean(session)} />)}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}

function Block({ block, progress, signedIn }: { block: PlaybookBlock; progress: Record<string, boolean>; signedIn: boolean }) {
  if (block.type === "md") return <div className="prose-lesson text-sm"><Markdown md={block.md} /></div>;
  if (block.type === "template") {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Template · {block.title}</p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">{block.md}</pre>
      </div>
    );
  }
  const initial = Object.fromEntries(block.items.map((i) => [i.key, Boolean(progress[i.key])]));
  return <Checklist title={block.title} items={block.items} initial={initial} signedIn={signedIn} />;
}
