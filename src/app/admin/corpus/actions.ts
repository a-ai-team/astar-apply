"use server";

// Server actions for /admin/corpus. Every action verifies a staff session before touching the
// service-role client (Server Actions bypass the proxy — .claude/rules/nextjs.md).
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveSource, processSource, setSourceStatus } from "@/lib/corpus/ingest";
import { CORPUS_BUCKET, type SourceKind } from "@/lib/corpus/types";
import { isTopicSlug } from "@/lib/content/taxonomy";

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME: Record<string, SourceKind> = {
  "image/png": "photo",
  "image/jpeg": "photo",
  "image/webp": "photo",
  "image/gif": "photo",
  "application/pdf": "pdf",
};

async function mentorIdFor(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("mentors").select("id").eq("id", userId).maybeSingle();
  return data?.id ?? null;
}

export type PreparedUpload = { sourceId: string; path: string; token: string };

/**
 * Step 1 of a file upload: create draft source rows + signed upload URLs (bucket is private;
 * the browser PUTs straight to Storage so Vercel's 4.5 MB body limit never applies).
 */
export async function prepareUploads(
  files: { name: string; type: string; size: number }[],
): Promise<{ uploads: PreparedUpload[]; errors: string[] }> {
  const session = await verifyStaff();
  const admin = createAdminClient();
  const mentorId = await mentorIdFor(session.userId);
  const uploads: PreparedUpload[] = [];
  const errors: string[] = [];
  for (const f of files) {
    const kind = ALLOWED_MIME[f.type];
    if (!kind) {
      errors.push(`${f.name}: unsupported type ${f.type || "unknown"}`);
      continue;
    }
    if (f.size > MAX_BYTES) {
      errors.push(`${f.name}: over 50 MB`);
      continue;
    }
    const { data: source, error } = await admin
      .from("corpus_sources")
      .insert({ kind, title: f.name.replace(/\.[^.]+$/, ""), mime: f.type, bytes: f.size, uploaded_by: session.userId, mentor_id: mentorId, status: "draft" })
      .select("id")
      .single();
    if (error || !source) {
      errors.push(`${f.name}: ${error?.message ?? "insert failed"}`);
      continue;
    }
    const ext = f.name.includes(".") ? f.name.slice(f.name.lastIndexOf(".")).toLowerCase() : "";
    const path = `${session.userId}/${source.id}${ext}`;
    const { data: signed, error: signError } = await admin.storage.from(CORPUS_BUCKET).createSignedUploadUrl(path);
    if (signError || !signed) {
      errors.push(`${f.name}: ${signError?.message ?? "could not sign upload"}`);
      continue;
    }
    await admin.from("corpus_sources").update({ storage_path: path }).eq("id", source.id);
    uploads.push({ sourceId: source.id, path, token: signed.token });
  }
  return { uploads, errors };
}

/** Q&A tab: one atomic chunk. Processes synchronously (no API call needed) and redirects. */
export async function createQaSource(formData: FormData) {
  const session = await verifyStaff();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) throw new Error("Question and answer are both required");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("corpus_sources")
    .insert({ kind: "qa", title: question.slice(0, 120), raw_text: `Q: ${question}\n\nA: ${answer}`, uploaded_by: session.userId, mentor_id: await mentorIdFor(session.userId), status: "draft" })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insert failed");
  await processSource(admin, data.id);
  redirect(`/admin/corpus/${data.id}`);
}

/** Text tab: pasted notes → heading-aware chunks. */
export async function createTextSource(formData: FormData) {
  const session = await verifyStaff();
  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  if (!title || !text) throw new Error("Title and text are both required");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("corpus_sources")
    .insert({ kind: "text", title, raw_text: text, uploaded_by: session.userId, mentor_id: await mentorIdFor(session.userId), status: "draft" })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insert failed");
  await processSource(admin, data.id);
  redirect(`/admin/corpus/${data.id}`);
}

export async function approveSourceAction(sourceId: string) {
  await verifyStaff();
  await approveSource(createAdminClient(), sourceId);
  refresh();
}

export async function rejectSourceAction(sourceId: string) {
  await verifyStaff();
  await setSourceStatus(createAdminClient(), sourceId, "rejected");
  refresh();
}

/** Re-extract = re-run the whole pipeline (extraction + chunking + tagging). Re-chunk = same, extraction reused for text/qa. */
export async function reprocessSourceAction(sourceId: string) {
  await verifyStaff();
  await processSource(createAdminClient(), sourceId);
  refresh();
}

export async function updateChunkAction(chunkId: string, patch: { text?: string; question?: string | null; answer?: string | null; topic_tags?: string[] }) {
  await verifyStaff();
  const admin = createAdminClient();
  const clean: Record<string, unknown> = {};
  if (patch.text !== undefined) clean.text = patch.text;
  if (patch.question !== undefined) clean.question = patch.question;
  if (patch.answer !== undefined) clean.answer = patch.answer;
  if (patch.topic_tags) clean.topic_tags = patch.topic_tags.filter(isTopicSlug);
  // Edited text invalidates the embedding; approve (or `npm run reembed`) restores it.
  if (patch.text !== undefined || patch.question !== undefined) {
    clean.embedding = null;
    clean.embedding_model = null;
  }
  const { error } = await admin.from("corpus_chunks").update(clean).eq("id", chunkId);
  if (error) throw new Error(error.message);
  refresh();
}

export async function setChunkStatusAction(chunkId: string, status: "approved" | "rejected") {
  await verifyStaff();
  const admin = createAdminClient();
  if (status === "approved") {
    const { data } = await admin.from("corpus_chunks").select("id, text, question").eq("id", chunkId).single();
    if (data) {
      const { embedChunks } = await import("@/lib/corpus/ingest");
      await embedChunks(admin, [data]);
    }
  }
  const { error } = await admin.from("corpus_chunks").update({ status }).eq("id", chunkId);
  if (error) throw new Error(error.message);
  refresh();
}
