// `npm run eval -- --suite <name>` — eval harness entry point (docs/loops/CONTRACTS.md § Eval harness).
// Suites arrive with Loop 02 (retrieval, chat). Until then this exits 0 and says so, so CI wiring
// can land early.
const args = process.argv.slice(2);
const suiteIdx = args.indexOf("--suite");
const suite = suiteIdx >= 0 ? args[suiteIdx + 1] : "all";
console.log(`eval: suite "${suite}" — no suites registered yet (Loop 02 adds retrieval + chat).`);
if (!process.env.EVAL_HIDDEN_DIR) console.log("eval: HIDDEN SET MISSING (EVAL_HIDDEN_DIR unset)");
