"use client";

// One flashcard session: flip (tap / Space), then "Still learning" (Again) or "Got it" (Good).
// Keys: Space flips, 1 = Still learning, 2 = Got it — plain keys only, so ⌘K/Ctrl+K still opens
// the palette and typing in inputs is ignored. Scheduling happens server-side in `reviewCard`.
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { reviewCard } from "@/app/home/practice/actions";
import { Rating } from "@/lib/practice/srs";
import { Markdown } from "@/components/lesson/markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export type SessionCardView = { id: string; front: string; back_md: string; isNew: boolean; isDue: boolean; streak: number };

export function FlashcardSession({ cards, topicTitle }: { cards: SessionCardView[]; topicTitle: string }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<{ good: number; again: number; mastered: number }>({ good: 0, again: 0, mastered: 0 });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const card = cards[i];
  const finished = i >= cards.length;

  const rate = useCallback(
    (rating: typeof Rating.Again | typeof Rating.Good) => {
      if (!card || pending) return;
      setError(null);
      startTransition(async () => {
        const res = await reviewCard(card.id, rating);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setDone((d) => ({ good: d.good + (rating === Rating.Good ? 1 : 0), again: d.again + (rating === Rating.Again ? 1 : 0), mastered: d.mastered + (res.mastered ? 1 : 0) }));
        setFlipped(false);
        setI((n) => n + 1);
      });
    },
    [card, pending],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return; // never hijack ⌘K
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (finished) return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && e.key === "1") rate(Rating.Again);
      else if (flipped && e.key === "2") rate(Rating.Good);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [flipped, finished, rate]);

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted" data-testid="session-empty">
        No cards in this deck yet.
      </div>
    );
  }

  if (finished) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6" data-testid="session-summary">
        <h2 className="text-lg font-semibold">Session complete</h2>
        <p className="mt-1 text-sm text-muted">
          {cards.length} reviewed · {done.good} got it · {done.again} still learning · {done.mastered} newly mastered
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/home/flashcards"><Button type="button" variant="secondary" size="sm">All decks</Button></Link>
          <Link href="/home/progress" data-testid="session-progress-link"><Button type="button" size="sm">See progress</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="flashcard-session">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span data-testid="session-position">{i + 1} / {cards.length}</span>
        <span>·</span>
        <span>{topicTitle}</span>
        {card.isNew ? <Badge>new</Badge> : card.isDue ? <Badge tone="accent">due</Badge> : <Badge>ahead of schedule</Badge>}
        {card.streak > 0 && <Badge>streak {card.streak}</Badge>}
      </div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn("min-h-56 w-full rounded-xl border border-border bg-surface p-6 text-left transition hover:border-muted focus-visible:outline-2 focus-visible:outline-accent", flipped && "border-accent/50")}
        aria-pressed={flipped}
        data-testid="flashcard"
      >
        <span className="text-xs uppercase tracking-wide text-muted">{flipped ? "Answer" : "Question — tap or press Space to flip"}</span>
        {flipped ? (
          <div className="mt-3" data-testid="flashcard-back"><Markdown md={card.back_md} /></div>
        ) : (
          <p className="mt-3 text-lg font-medium" data-testid="flashcard-front">{card.front}</p>
        )}
      </button>
      <div className="flex flex-wrap gap-2">
        {flipped ? (
          <>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => rate(Rating.Again)} data-testid="rate-again">
              Still learning <kbd className="ml-1 text-xs text-muted">1</kbd>
            </Button>
            <Button type="button" disabled={pending} onClick={() => rate(Rating.Good)} data-testid="rate-good">
              Got it <kbd className="ml-1 text-xs opacity-70">2</kbd>
            </Button>
          </>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setFlipped(true)} data-testid="flip">
            Flip <kbd className="ml-1 text-xs text-muted">Space</kbd>
          </Button>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
