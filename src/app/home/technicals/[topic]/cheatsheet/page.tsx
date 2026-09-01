// /home/technicals/[topic]/cheatsheet — the printable takeaway for a chapter (Loop 11).
// Content comes from content/cheatsheets/<topic>.json in the repo, not the DB.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getTopic } from "@/lib/content/queries";
import { getCheatSheet } from "@/lib/content/cheatsheets";
import { Markdown } from "@/components/lesson/markdown";

export async function generateMetadata({ params }: PageProps<"/home/technicals/[topic]/cheatsheet">): Promise<Metadata> {
  const { topic } = await params;
  return { title: `${topic} cheat sheet — Technicals — A* Apply`, robots: { index: false, follow: false } };
}

export default async function CheatSheetPage({ params }: PageProps<"/home/technicals/[topic]/cheatsheet">) {
  await verifySession("/home/technicals");
  const { topic: topicSlug } = await params;
  const db = await createClient();
  const topic = await getTopic(db, topicSlug);
  const sheet = getCheatSheet(topicSlug);
  if (!topic || !sheet) notFound();

  return (
    <article className="w-full" data-testid="cheatsheet">
      <nav className="text-sm text-muted print:hidden">
        <Link href="/home/technicals" className="hover:text-fg">Technicals</Link>
        <span className="mx-1">/</span>
        <Link href={`/home/technicals/${topic.slug}`} className="hover:text-fg">{topic.title}</Link>
      </nav>
      <header className="mt-2 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold print:text-2xl">{topic.title} — cheat sheet</h1>
        <p className="text-xs text-muted print:hidden">Print this (⌘P) and keep it with you.</p>
      </header>

      <section className="mt-8" data-testid="cheatsheet-formulas">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Formulas you write from memory</h2>
        <dl className="mt-3 grid gap-3">
          {sheet.formulas.map((f) => (
            <div key={f.name} className="rounded-lg border border-border p-3 print:break-inside-avoid">
              <dt className="text-sm font-medium">{f.name}</dt>
              <dd className="mt-1">
                <Markdown md={`$$${f.latex}$$`} />
                <p className="mt-1 text-sm text-muted">{f.note}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8" data-testid="cheatsheet-canonical">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">The answers, trimmed to their spine</h2>
        <dl className="mt-3 grid gap-3">
          {sheet.canonical.map((c) => (
            <div key={c.q} className="print:break-inside-avoid">
              <dt className="text-sm font-medium">{c.q}</dt>
              <dd className="mt-0.5 text-sm text-muted">{c.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section data-testid="cheatsheet-traps">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Traps</h2>
          <ul className="mt-3 grid list-disc gap-1.5 pl-5 text-sm">
            {sheet.traps.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">One-liners</h2>
          <ul className="mt-3 grid list-disc gap-1.5 pl-5 text-sm">
            {sheet.one_liners.map((o) => <li key={o}>{o}</li>)}
          </ul>
        </section>
      </div>

      {sheet.you_may_hear.length > 0 && (
        <section className="mt-8 rounded-lg border border-border bg-surface p-4 print:break-inside-avoid" data-testid="cheatsheet-you-may-hear">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">You may hear it — you do not need to compute it</h2>
          <p className="mt-1 text-xs text-muted">Full-time and associate-level material. Know the name and roughly what it does; say so honestly if it comes up.</p>
          <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm">
            {sheet.you_may_hear.map((y) => <li key={y}>{y}</li>)}
          </ul>
        </section>
      )}
    </article>
  );
}
