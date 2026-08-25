// Seed 02 — one demo thread for e2e-student@astar.test built by running the real pipeline in
// fixture mode (retrieval is real, the answer is deterministic). Idempotent: keyed by thread title.
// Requires `npm run seed -- 00 01`.
import { adminClient } from "./env";

export const DEMO_TITLE = "Demo: equity value vs enterprise value";
const STUDENT_EMAIL = "e2e-student@astar.test";
const QUESTIONS = ["What is the difference between equity value and enterprise value?", "When should I start applying for spring weeks?"];

export async function seedChat() {
  process.env.CHAT_MODE = "fixture";
  const { runPipeline, loadMentorNames } = await import("../../src/lib/chat/pipeline");
  const admin = adminClient();
  const { data: users, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (uErr) throw uErr;
  const student = users.users.find((u) => u.email === STUDENT_EMAIL);
  if (!student) throw new Error(`${STUDENT_EMAIL} missing — run \`npm run seed -- 00\` first`);

  const { data: existing } = await admin.from("chat_threads").select("id").eq("user_id", student.id).eq("title", DEMO_TITLE).maybeSingle();
  let threadId = existing?.id as string | undefined;
  if (!threadId) {
    const { data, error } = await admin.from("chat_threads").insert({ user_id: student.id, title: DEMO_TITLE }).select("id").single();
    if (error || !data) throw error ?? new Error("thread insert failed");
    threadId = data.id;
  } else {
    const { error } = await admin.from("chat_messages").delete().eq("thread_id", threadId);
    if (error) throw error;
  }
  const mentorNames = await loadMentorNames(admin);
  const history: { role: "user" | "assistant"; text: string }[] = [];
  for (const q of QUESTIONS) {
    const { error: e1 } = await admin.from("chat_messages").insert({ thread_id: threadId, role: "user", content: { text: q } });
    if (e1) throw e1;
    let done: Extract<Awaited<ReturnType<typeof runPipeline>> extends AsyncGenerator<infer E> ? E : never, { type: "done" }> | null = null;
    for await (const ev of runPipeline({ db: admin, message: q, history, mode: "fixture", mentorNames })) if (ev.type === "done") done = ev;
    if (!done) throw new Error("pipeline produced no done event");
    const { error: e2 } = await admin.from("chat_messages").insert({
      thread_id: threadId, role: "assistant", content: done.content, retrieval: done.retrieval,
      prompt_version: done.prompt_version, model: done.content.model, usage: done.content.usage, latency_ms: done.latency_ms,
    });
    if (e2) throw e2;
    history.push({ role: "user", text: q }, { role: "assistant", text: done.content.text });
    console.log(`ok "${q.slice(0, 50)}" → ${done.content.citations.length} citation(s), rung ${done.content.rung}`);
  }
  const { error: e3 } = await admin.from("chat_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
  if (e3) throw e3;
  console.log(`seed 02: demo thread ${threadId} with ${QUESTIONS.length * 2} messages`);
}
