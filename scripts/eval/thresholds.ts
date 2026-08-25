// Eval thresholds (docs/loops/CONTRACTS.md § Eval harness). Change only by editing CONTRACTS.md.
export const THRESHOLDS = {
  retrieval: { recall_at_5: 0.8, recall_at_5_local: 0.7 },
  chat: { correctness: 3.8, faithfulness: 4.2, citation_rate: 0.95 },
} as const;
