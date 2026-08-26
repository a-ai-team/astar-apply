// Delivery metrics (Loop 07). Pure functions shared by the VoiceCapture client (speech transcripts,
// audio never leaves the browser) and the server (typed answers). Delivery /100 is a separate
// scale from the content /10 (plan default): pace band + filler rate + length.

export const FILLERS = ["um", "uh", "er", "erm", "ah", "like", "you know", "sort of", "kind of", "basically", "literally", "i mean", "okay so", "so yeah"] as const;

/** Ideal interview pace band (words per minute). */
export const PACE_BAND = { slow: 110, fast: 170 } as const;

export type SpeechMetrics = { words: number; wpm: number | null; filler_count: number; fillers: string[]; duration_s: number };

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Counts filler words/phrases (whole-word, case-insensitive). "like" only counts when not followed by a noun-ish word is too clever — we count it plainly and say so in the UI. */
export function countFillers(text: string): { count: number; fillers: string[] } {
  const t = ` ${text.toLowerCase().replace(/[^a-z'\s]/g, " ").replace(/\s+/g, " ")} `;
  const found: string[] = [];
  let count = 0;
  for (const f of FILLERS) {
    const n = t.split(` ${f} `).length - 1;
    if (n > 0) {
      count += n;
      found.push(f);
    }
  }
  return { count, fillers: found };
}

export function speechMetrics(transcript: string, durationS: number): SpeechMetrics {
  const words = wordCount(transcript);
  const { count, fillers } = countFillers(transcript);
  const wpm = durationS >= 3 && words > 0 ? Math.round((words / durationS) * 60) : null;
  return { words, wpm, filler_count: count, fillers, duration_s: Math.round(durationS * 10) / 10 };
}

/** For typed answers we still count fillers (people type "um") and estimate wpm from the server-side duration. */
export function typedMetrics(text: string, durationS: number): SpeechMetrics {
  return speechMetrics(text, durationS);
}

export type Delivery = { score: number; pace: "slow" | "good" | "fast" | "unknown"; filler_rate: number; notes: string[] };

/** Delivery /100: 60 for pace (full marks inside the band, tapering to 0 at ±60 wpm), 30 for fillers (−5 per filler per 100 words), 10 for saying enough (≥ 40 words). */
export function deliveryScore(m: Pick<SpeechMetrics, "words" | "wpm" | "filler_count">): Delivery {
  const notes: string[] = [];
  let pace: Delivery["pace"] = "unknown";
  let paceScore = 40;
  if (m.wpm != null) {
    if (m.wpm < PACE_BAND.slow) {
      pace = "slow";
      paceScore = Math.max(0, 60 - (PACE_BAND.slow - m.wpm));
      notes.push(`Pace ${m.wpm} wpm is on the slow side — aim for ${PACE_BAND.slow}–${PACE_BAND.fast}.`);
    } else if (m.wpm > PACE_BAND.fast) {
      pace = "fast";
      paceScore = Math.max(0, 60 - (m.wpm - PACE_BAND.fast));
      notes.push(`Pace ${m.wpm} wpm is quick — slow down for the numbers.`);
    } else {
      pace = "good";
      paceScore = 60;
    }
  }
  const fillerRate = m.words ? (m.filler_count / m.words) * 100 : 0;
  const fillerScore = Math.max(0, Math.round(30 - fillerRate * 5));
  if (m.filler_count > 0) notes.push(`${m.filler_count} filler${m.filler_count === 1 ? "" : "s"} in ${m.words} words.`);
  const lengthScore = m.words >= 40 ? 10 : m.words >= 15 ? 5 : 0;
  if (m.words < 40) notes.push("Short answer — interviewers expect 45–90 seconds.");
  return { score: Math.max(0, Math.min(100, paceScore + fillerScore + lengthScore)), pace, filler_rate: Math.round(fillerRate * 10) / 10, notes };
}
