// /home/flashcards — one deck per topic that has approved cards, with due / mastered counts.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { listDecks } from "@/lib/practice/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSessionEntitlement } from "@/lib/billing/session";
import { can } from "@/lib/billing/entitlements";
import { UpgradeCard } from "@/components/billing/upgrade-card";

export const metadata: Metadata = { title: "Flashcards — A* Apply", robots: { index: false, follow: false } };

export default async function FlashcardsPage() {
  await verifySession("/home/flashcards");
  const db = await createClient();
  const [decks, ent] = await Promise.all([listDecks(db), getSessionEntitlement()]);
  const due = decks.reduce((n, d) => n + d.due, 0);
  const analytics = can(ent, "srs_analytics");
  const total = decks.reduce((n, d) => n + d.total, 0);
  const mastered = decks.reduce((n, d) => n + d.mastered, 0);
  const started = decks.reduce((n, d) => n + d.started, 0);
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold" data-testid="flashcards-heading">Flashcards</h1>
        <p className="mt-1 text-sm text-muted">
          Spaced repetition (FSRS). Flip, then &quot;Got it&quot; or &quot;Still learning&quot;. Two &quot;Got it&quot; in a row = mastered; a miss resets.
          {due > 0 && <> <span className="text-fg" data-testid="due-total">{due} due now.</span></>}
        </p>
      </div>
      {/* Loop 10: SRS mastery analytics are an AI-plan feature. */}
      {analytics ? (
        <section className="grid gap-4 sm:grid-cols-3" data-testid="srs-analytics">
          <Card><CardTitle>Retention</CardTitle><p className="mt-2 text-2xl font-semibold tabular-nums">{started ? Math.round((mastered / started) * 100) : 0}%</p><CardDescription>{mastered} mastered of {started} started</CardDescription></Card>
          <Card><CardTitle>Coverage</CardTitle><p className="mt-2 text-2xl font-semibold tabular-nums">{total ? Math.round((started / total) * 100) : 0}%</p><CardDescription>{started} of {total} cards seen</CardDescription></Card>
          <Card><CardTitle>Due now</CardTitle><p className="mt-2 text-2xl font-semibold tabular-nums">{due}</p><CardDescription>across {decks.filter((d) => d.due > 0).length} deck{decks.filter((d) => d.due > 0).length === 1 ? "" : "s"}</CardDescription></Card>
        </section>
      ) : (
        <UpgradeCard feature="srs_analytics" compact />
      )}
      {decks.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">No decks yet — cards are derived from approved questions.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="deck-list">
          {decks.map((d) => (
            <Link key={d.topic.id} href={`/home/flashcards/${d.topic.slug}`} data-testid="deck-card">
              <Card className="h-full hover:border-muted">
                <div className="flex items-center gap-2">
                  <CardTitle>{d.topic.title}</CardTitle>
                  {d.topic.is_free ? <Badge tone="accent">Free</Badge> : !can(ent, "flashcards_all") && <Badge data-testid="deck-locked">Core</Badge>}
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
