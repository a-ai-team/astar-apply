// `npm run eval -- --suite <names>` entry point; the harness lives in ./index.ts.
import { main } from "./index";

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
