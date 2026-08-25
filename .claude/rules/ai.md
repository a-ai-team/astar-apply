---
paths:
  - "src/lib/ai/**"
  - "src/lib/chat/**"
  - "src/lib/interviews/**"
  - "scripts/eval/**"
  - "scripts/content/**"
---

# Claude API rules (verified against the `/claude-api` skill, Aug 2026)

- Models: `claude-opus-5` for chat, generation, grading, judging; `claude-haiku-4-5` only for
  routing/classification/tagging. Never date-suffixed IDs. Read `src/lib/ai/client.ts` first.
- Thinking is adaptive by default on Opus 5 — **omit** `thinking`; `budget_tokens` is a 400.
  Control depth with `output_config.effort` (`low|medium|high|xhigh|max`).
- Every Opus 5 call goes through `client.beta.messages.*` with
  `betas: ["server-side-fallback-2026-07-01"]` and `fallbacks: "default"`; check
  `stop_reason === "refusal"` before reading `content`. Batches API calls omit `fallbacks`.
- Stream (`.stream()` + `finalMessage()`) whenever `max_tokens > 8000`. Default `max_tokens`:
  16000 non-streaming, 64000 streaming; 4096 for chat turns.
- Structured output: `client.messages.parse({ output_config: { format: zodOutputFormat(Schema) } })`.
  Never combine with `citations` (400). No assistant prefill (400).
- Citations: pass retrieved chunks as `document` blocks (`type: "content"`, `title`,
  `citations: { enabled: true }`) and map `content_block_location` back to `chunk_id`.
- Prompt caching: static system prompt first with `cache_control`, ≥ 1024 tokens; no dates,
  UUIDs, or per-request data before the breakpoint. Verify `usage.cache_read_input_tokens > 0`.
- Prompts live in `src/lib/ai/prompts/<name>.vN.ts` and export `{ id, version, system }`;
  bump `version` on any text change and record `prompt_version` on stored outputs.
- Embeddings only via `src/lib/ai/embeddings.ts` (1024-d; provider `voyage` or `local`).
- Bulk generation (Loops 04/09) uses the Batches API; run `--dry-run` first and abort if the
  estimate exceeds `CONTENT_MAX_BATCH_USD`.
- Evals are the gate: `npm run eval -- --suite …` must pass thresholds in `docs/loops/CONTRACTS.md`
  before a loop touching these paths is merged.
