// /home/flashcards — one deck per topic that has approved cards, with due / mastered counts.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { listDecks } from "@/lib/practice/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Flashcards — A* Apply", robots: { index: false, follow: false } };

export default async function FlashcardsPage() {
  await verifySession("/home/flashcards");
  const db = await createClient();
  const decks = await listDecks(db);
  const due = decks.reduce((n, d) => n + d.due, 0);
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold" data-testid="flashcards-heading">Flashcards</h1>
        <p className="mt-1 text-sm text-muted">
          Spaced repetition (FSRS). Flip, then &quot;Got it&quot; or &quot;Still learning&quot;. Two &quot;Got it&quot; in a row = mastered; a miss resets.
          {due > 0 && <> <span className="text-fg" data-testid="due-total">{due} due now.</span></>}
        </p>
      </div>
      {decks.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">No decks yet — cards are derived from approved questions.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="deck-list">
          {decks.map((d) => (
            <Link key={d.topic.id} href={`/home/flashcards/${d.topic.slug}`} data-testid="deck-card">
              <Card className="h-full hover:border-muted">
                <div className="flex items-center gap-2">
                  <CardTitle>{d.topic.title}</CardTitle>
                  {d.topic.is_free && <Badge tone="accent">Free</Badge>}
                </div>
                <CardDescription>{d.total} card{d.total === 1 ? "" : "s"} · {d.mastered} mastered · {d.due} due</CardDescription>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                  <div className="h-full bg-accent" style={{ width: `${d.total ? Math.round((d.mastered / d.total) * 100) : 0}%` }} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
