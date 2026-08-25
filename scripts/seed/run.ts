// `npm run seed -- <loop>` → runs scripts/seed/<loop>-*.ts. Each seed exports a default-ish
// async function named seed<Thing>; we just import the module and call its first export.
import { readdirSync } from "node:fs";
import path from "node:path";

const loop = process.argv[2];
if (!loop) {
  console.error("usage: npm run seed -- <loop>   e.g. npm run seed -- 00");
  process.exit(1);
}
const dir = __dirname;
const file = readdirSync(dir).find((f) => f.startsWith(`${loop}-`) && f.endsWith(".ts"));
if (!file) {
  console.error(`no seed found for loop ${loop} in scripts/seed/`);
  process.exit(1);
}

import(path.join(dir, file)).then(async (mod: Record<string, unknown>) => {
  const fn = Object.values(mod).find((v) => typeof v === "function") as (() => Promise<void>) | undefined;
  if (!fn) throw new Error(`${file} exports no seed function`);
  await fn();
  console.log(`seed ${loop} done`);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
