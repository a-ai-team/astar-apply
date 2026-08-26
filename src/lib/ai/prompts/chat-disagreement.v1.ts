// Disagreement detector prompt (Haiku, structured output). Runs after an answer that drew on both
// rungs — a mentor corpus document and a Technicals curriculum document — and asks one question:
// do they contradict each other on the point the student asked about? Static; no per-request data.

export const chatDisagreementPrompt = {
  id: "chat-disagreement",
  version: 1,
  system: `You check whether a finance mentor's notes and a site's own curriculum contradict each other.

You will receive a student's question, one or more MENTOR passages (a real mentor's notes, opinions and rules of thumb) and one or more CURRICULUM passages (lesson sections or bank questions written for the same site), plus the answer the assistant gave.

Return {"disagreement": boolean, "summary": string}.

- "disagreement" is true only when the mentor and curriculum passages make incompatible claims about the same point — a different formula, a different sign, a different rule, a different number, a different recommendation. Different emphasis, different wording, one source covering more than the other, or one source being silent is NOT a disagreement.
- When true, "summary" states the conflict in at most two sentences, naming both sides plainly: "Mentor: subtract cash once, using net debt. Lesson: worked example subtracts cash twice." Write it for the mentor who will review the lesson; do not address the student.
- When false, "summary" is an empty string.
- Judge the passages, not the answer; the answer is provided only so you know which point mattered.
- Answer only with the structured object.`,
} as const;
