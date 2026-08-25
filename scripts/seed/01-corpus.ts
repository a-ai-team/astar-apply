// Seed 01 — synthetic mentor corpus (docs/loops/01-mentor-corpus.md § Scripts). Idempotent:
// sources are upserted on their natural key (the title, per fixture), chunks are rebuilt by
// processSource, then everything is approved + embedded. Requires `npm run seed -- 00` first
// (creates e2e-mentor@astar.test, used as the placeholder "Tesleem" mentor row).
import { readFileSync } from "node:fs";
import path from "node:path";
import { adminClient } from "./env";
import { approveSource, processSource } from "../../src/lib/corpus/ingest";

const FIXTURES = path.join(process.cwd(), "fixtures", "corpus");
export const MENTOR_EMAIL = "e2e-mentor@astar.test";

type Fixture = { kind: "qa" | "text"; title: string; raw_text: string };

function loadFixtures(): Fixture[] {
  const qa = JSON.parse(readFileSync(path.join(FIXTURES, "qa.json"), "utf8")) as { pairs: { question: string; answer: string }[] };
  const out: Fixture[] = qa.pairs.map((p) => ({ kind: "qa", title: p.question.slice(0, 120), raw_text: `Q: ${p.question}\n\nA: ${p.answer}` }));
  for (const f of ["application-timeline.md", "technicals-cheatsheet.md", "voice-guide.md"]) {
    const text = readFileSync(path.join(FIXTURES, f), "utf8");
    const title = text.match(/^# (.+)$/m)?.[1] ?? f;
    out.push({ kind: "text", title, raw_text: text });
  }
  return out;
}

export async function seedCorpus() {
  const admin = adminClient();
  const { data: users, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (uErr) throw uErr;
  const mentorUser = users.users.find((u) => u.email === MENTOR_EMAIL);
  if (!mentorUser) throw new Error(`${MENTOR_EMAIL} missing — run \`npm run seed -- 00\` first`);
  // TODO(james): swap the placeholder mentor for Tesleem's real account once he has signed in.
  const { error: mErr } = await admin
    .from("mentors")
    .upsert({ id: mentorUser.id, headline: "PLACEHOLDER — Tesleem (synthetic seed mentor)", is_public: false }, { onConflict: "id" });
  if (mErr) throw mErr;

  let chunks = 0;
  for (const f of loadFixtures()) {
    const { data: existing } = await admin.from("corpus_sources").select("id").eq("title", f.title).eq("kind", f.kind).maybeSingle();
    let id = existing?.id as string | undefined;
    if (id) {
      const { error } = await admin.from("corpus_sources").update({ raw_text: f.raw_text, mentor_id: mentorUser.id }).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await admin
        .from("corpus_sources")
        .insert({ kind: f.kind, title: f.title, raw_text: f.raw_text, mentor_id: mentorUser.id, uploaded_by: mentorUser.id, status: "draft" })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("insert failed");
      id = data.id;
    }
    const r = await processSource(admin, id!);
    const { embedded } = await approveSource(admin, id!);
    chunks += r.chunks;
    console.log(`ok ${f.kind.padEnd(4)} ${r.chunks} chunk(s), ${embedded} embedded — ${f.title.slice(0, 60)}`);
  }
  const { count } = await admin.from("corpus_chunks").select("id", { count: "exact", head: true }).eq("status", "approved").not("embedding", "is", null);
  console.log(`seed 01: ${chunks} chunks processed this run; ${count} approved+embedded chunks in total`);
  if ((count ?? 0) < 40) throw new Error(`expected ≥ 40 approved embedded chunks, found ${count}`);
}
