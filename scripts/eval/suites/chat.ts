// Chat suite: runs the pipeline in-process (live mode) over fixtures/eval/chat-mentor.jsonl plus
// the hidden $EVAL_HIDDEN_DIR/.eval/chat-hidden.jsonl when present, judges each answer with Opus 5.
// Thresholds: correctness ≥ 3.8, faithfulness ≥ 4.2, corpus-citation rate ≥ 95 % where the
// fixture corpus covers the question. Skips (exit 0, warning) when the API has no credit/key.
import { existsSync } from "node:fs";
import path from "node:path";
import { adminClient } from "../../seed/env";
import { isCredentialFailure, probeApi } from "../../dev/api-probe";
import { loadMentorNames, runPipeline } from "../../../src/lib/chat/pipeline";
import { documentText } from "../../../src/lib/chat/cite";
import type { ChatEvent, RetrievedChunk } from "../../../src/lib/chat/types";
import { hiddenDir, readJsonl, type SuiteResult } from "../index";
import { judge } from "../judge";
import { THRESHOLDS } from "../thresholds";

type Item = { id: string; question: string; reference: string; expects_corpus?: boolean; expected_source?: string; hidden?: boolean };

export async function run({ limit }: { limit: number | null }): Promise<SuiteResult> {
  const t = THRESHOLDS.chat;
  const thresholds = { correctness: t.correctness, faithfulness: t.faithfulness, citation_rate: t.citation_rate };
  const items = readJsonl<Item>("fixtures/eval/chat-mentor.jsonl");
  const hidden = path.join(hiddenDir(), ".eval", "chat-hidden.jsonl");
  const notes: string[] = [];
  if (existsSync(hidden)) {
    const h = readJsonl<Item>(hidden).map((x) => ({ ...x, hidden: true, expects_corpus: false }));
    items.push(...h);
    notes.push(`hidden set: ${h.length} questions from ${hidden} (never printed)`);
  } else {
    notes.push("HIDDEN SET MISSING — run `npx tsx scripts/eval/extract-400q.ts` (needs the 400Q PDF in $EVAL_HIDDEN_DIR)");
  }
  const probe = await probeApi();
  if (!probe.ok) {
    const why = probe.reason === "billing" ? "NO API CREDIT" : probe.reason === "no-key" ? "NO API KEY" : `API ${probe.reason.toUpperCase()}`;
    console.warn(`  ${why} — chat suite skipped (${probe.message.slice(0, 120)})`);
    return {
      suite: "chat",
      passed: true,
      skipped: `${why} — chat suite skipped`,
      metrics: { n: items.length, judged: 0 },
      thresholds,
      items: [],
      notes: [...notes, isCredentialFailure(probe) ? "top up credit / set ANTHROPIC_API_KEY, then rerun `npm run eval -- --suite chat`" : "transient API error — rerun"],
    };
  }

  const db = adminClient();
  const mentorNames = await loadMentorNames(db);
  const selected = items.slice(0, limit ?? undefined);
  const scored: { id: string; hidden: boolean; correctness: number; faithfulness: number; voice: number; cited: boolean | null; notes: string }[] = [];
  for (const it of selected) {
    let chunks: RetrievedChunk[] = [];
    let done: Extract<ChatEvent, { type: "done" }> | null = null;
    const gen = runPipeline({ db, message: it.question, history: [], mode: "live", mentorNames });
    let r = await gen.next();
    while (!r.done) {
      if (r.value.type === "done") done = r.value;
      r = await gen.next();
    }
    if (!done) throw new Error(`pipeline produced no done event for ${it.id}`);
    // Re-run retrieval record → passages for the judge (labels + text).
    const ids = done.retrieval.reranked.map((x) => x.id);
    if (ids.length) {
      const { data } = await db.from("corpus_chunks").select("id, source_id, mentor_id, kind, ordinal, text, question, answer, page_ref, topic_tags, entities").in("id", ids);
      chunks = ids.map((id) => (data ?? []).find((d) => d.id === id)).filter(Boolean).map((d) => ({ ...(d as Omit<RetrievedChunk, "score" | "signals" | "label">), score: 0, signals: {}, label: done!.retrieval.reranked.find((x) => x.id === d!.id)!.label }));
    }
    const score = await judge({
      question: it.question,
      reference: it.reference,
      passages: chunks.map((c) => ({ label: c.label, text: documentText(c) })),
      answer: done.content.text,
      citations: done.content.citations.map((c) => ({ label: c.label, quote: c.quote })),
    });
    const cited = it.expects_corpus ? done.content.citations.length > 0 : null;
    scored.push({ id: it.id, hidden: Boolean(it.hidden), ...score, cited });
    // Hidden questions are never printed; public ones show the id and scores only.
    console.log(`  ${it.id}${it.hidden ? " (hidden)" : ""}: c=${score.correctness} f=${score.faithfulness} v=${score.voice}${cited === null ? "" : cited ? " cited" : " NOT CITED"}`);
  }
  const mean = (k: "correctness" | "faithfulness" | "voice") => (scored.length ? scored.reduce((s, x) => s + x[k], 0) / scored.length : 0);
  const withCorpus = scored.filter((s) => s.cited !== null);
  const citationRate = withCorpus.length ? withCorpus.filter((s) => s.cited).length / withCorpus.length : 1;
  const metrics = { n: scored.length, correctness: mean("correctness"), faithfulness: mean("faithfulness"), voice: mean("voice"), citation_rate: citationRate, citation_n: withCorpus.length };
  return {
    suite: "chat",
    passed: metrics.correctness >= t.correctness && metrics.faithfulness >= t.faithfulness && citationRate >= t.citation_rate,
    metrics,
    thresholds,
    // Hidden items keep only ids + scores (no question text) so .eval/ stays free of 400Q text.
    items: scored,
    notes,
  };
}
