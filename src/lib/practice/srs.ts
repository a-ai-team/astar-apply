// FSRS wrapper (ts-fsrs 5.x) for flashcards. Pure: no DB, no React — the server action `reviewCard`
// loads a `card_state` row, calls `applyReview`, and writes back `next` + `log`.
//   Rating: 1 Again ("Still learning") · 3 Good ("Got it"). Hard/Easy are accepted but the UI only
//   exposes two buttons (financefluency parity). Mastery is *our* rule on top of FSRS: two
//   consecutive Good/Easy ratings → mastered; an Again resets the streak (and mastery).
import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from "ts-fsrs";

export { Rating, State };

/** Columns of `card_state` (0006_practice) that the scheduler reads/writes. */
export type CardStateRow = {
  due: string | Date;
  stability: number;
  difficulty: number;
  state: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  streak: number;
  mastered: boolean;
  last_review: string | Date | null;
};

/** Row appended to `reviews` (the FSRS review log). */
export type ReviewLogRow = {
  rating: number;
  state: number;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  reviewed_at: Date;
};

/** FSRS defaults per the plan: request_retention 0.9. Fuzz off so scheduling is deterministic (tests, e2e). */
export const SRS_PARAMS = { request_retention: 0.9, maximum_interval: 365, enable_fuzz: false } as const;
export const MASTERY_STREAK = 2; // TODO(james): confirm "two in a row" mastery rule (default taken, Loop 05)

const scheduler = fsrs(SRS_PARAMS);

export function isGrade(n: number): n is Grade {
  return n === Rating.Again || n === Rating.Hard || n === Rating.Good || n === Rating.Easy;
}

/** `card_state` row → ts-fsrs Card (a missing row is a brand-new card). */
export function toFsrsCard(row: CardStateRow | null | undefined, now = new Date()): Card {
  if (!row) return createEmptyCard(now);
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

/** Applies one rating: returns the next `card_state` row and the `reviews` log row. */
export function applyReview(row: CardStateRow | null | undefined, rating: Grade, now = new Date()): { next: CardStateRow; log: ReviewLogRow } {
  const card = toFsrsCard(row, now);
  const { card: c, log } = scheduler.next(card, now, rating);
  const streak = rating >= Rating.Good ? (row?.streak ?? 0) + 1 : 0;
  const next: CardStateRow = {
    due: c.due,
    stability: c.stability,
    difficulty: c.difficulty,
    state: c.state,
    reps: c.reps,
    lapses: c.lapses,
    learning_steps: c.learning_steps,
    streak,
    mastered: streak >= MASTERY_STREAK,
    last_review: c.last_review ?? now,
  };
  return {
    next,
    log: {
      rating: log.rating,
      state: log.state,
      due: log.due,
      stability: log.stability,
      difficulty: log.difficulty,
      elapsed_days: log.elapsed_days,
      scheduled_days: log.scheduled_days,
      reps: c.reps,
      lapses: c.lapses,
      reviewed_at: log.review,
    },
  };
}

/** Retrievability (0–1) of a stored card right now — used to sort "weakest first". */
export function retrievability(row: CardStateRow, now = new Date()): number {
  return scheduler.get_retrievability(toFsrsCard(row, now), now, false);
}

/** ISO date (UTC) for a timestamp — the unit of streaks and activity. */
export function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Day streak: consecutive active days ending today or yesterday (a streak survives until the end
 * of the day after the last activity). `days` are `YYYY-MM-DD` strings in any order.
 */
export function computeStreak(days: Iterable<string>, now = new Date()): number {
  const set = new Set(days);
  if (set.size === 0) return 0;
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!set.has(utcDay(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!set.has(utcDay(cursor))) return 0;
  }
  let n = 0;
  while (set.has(utcDay(cursor))) {
    n++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return n;
}
