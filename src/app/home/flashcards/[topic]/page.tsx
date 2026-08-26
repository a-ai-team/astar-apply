// /home/flashcards/[topic] — a review session over one deck (due first, then new, then the rest).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getDeckSession } from "@/lib/practice/queries";
import { FlashcardSession } from "@/components/practice/flashcard-session";
import { getSessionEntitlement } from "@/lib/billing/session";
import { can } from "@/lib/billing/entitlements";
import { UpgradeCard } from "@/components/billing/upgrade-card";

export async function generateMetadata({ params }: PageProps<"/home/flashcards/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  return { title: `${topic} deck — Flashcards — A* Apply`, robots: { index: false, follow: false } };
}

export default async function DeckPage({ params }: PageProps<"/home/flashcards/[topic]">) {
  await verifySession("/home/flashcards");
  const { topic } = await params;
  const db = await createClient();
  const deck = await getDeckSession(db, topic);
  if (!deck) notFound();
  const ent = await getSessionEntitlement();
  const unlocked = can(ent, "flashcards_all", { isFree: deck.topic.is_free });
  const cards = deck.cards.map((c) => ({ id: c.id, questionId: c.question_id, front: c.front, back_md: c.back_md, isNew: c.isNew, isDue: c.isDue, streak: c.state?.streak ?? 0 }));
  return (
    <>
      <div>
        <Link href="/home/flashcards" className="text-sm text-muted hover:text-fg">← Flashcards</Link>
        <h1 className="mt-2 text-2xl font-semibold" data-testid="deck-heading">{deck.topic.title}</h1>
        <p className="mt-1 text-sm text-muted" data-testid="deck-summary">
          {deck.total} cards · {deck.dueCount} due · {deck.newCount} new · this session {cards.length}
        </p>
      </div>
      <div className="max-w-2xl">
        {unlocked ? <FlashcardSession cards={cards} topicTitle={deck.topic.title} /> : <UpgradeCard feature="flashcards_all" />}
      </div>
    </>
  );
}
