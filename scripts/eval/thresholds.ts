// Eval thresholds (docs/loops/CONTRACTS.md § Eval harness). Change only by editing CONTRACTS.md.
export const THRESHOLDS = {
  retrieval: { recall_at_5: 0.8, recall_at_5_local: 0.7 },
  chat: { correctness: 3.8, faithfulness: 4.2, citation_rate: 0.95 },
  // Loop 04
  lessons: { schema_rate: 1, readability: 4, overlap_hits: 0 },
  questions: { schema_rate: 1, mix_max_abs_diff: 0.15, mix_min_n: 40, overlap_hits: 0 },
} as const;
