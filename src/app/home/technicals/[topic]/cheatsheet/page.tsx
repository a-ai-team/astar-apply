// /home/technicals/[topic]/cheatsheet — the printable takeaway for a chapter (Loop 11).
// Content comes from content/cheatsheets/<topic>.json in the repo, not the DB.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getTopic } from "@/lib/content/queries";
import { getCheatSheet } from "@/lib/content/cheatsheets";
import { CheatSheetBody } from "@/components/lesson/cheatsheet-body";

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

      <CheatSheetBody sheet={sheet} />
    </article>
  );
}
