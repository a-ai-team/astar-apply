"use server";

// Server actions for /admin/lessons. Every action verifies a staff session first (Server Actions
// bypass the proxy). Bodies are validated with the shared zod contract; `approved` additionally
// requires assertApprovable(). After a save the lesson tag is revalidated (stale-while-revalidate)
// and the current route refreshed.
import { refresh, revalidateTag } from "next/cache";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { approvalProblems, validateLessonBody } from "@/lib/content/lesson-schema";
import { findSubtopic } from "@/lib/content/taxonomy";
import { indexLesson } from "@/lib/content/index-content";

export type SaveState = { ok: boolean; errors: string[]; savedAt?: string };

const STATUSES = ["draft", "generated", "in_review", "approved", "rejected", "archived"] as const;

export async function saveLesson(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await verifyStaff();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") as (typeof STATUSES)[number];
  const raw = String(formData.get("body") ?? "");
  if (!id || !title) return { ok: false, errors: ["id and title are required"] };
  if (!STATUSES.includes(status)) return { ok: false, errors: [`unknown status ${status}`] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, errors: [`JSON parse error: ${(e as Error).message}`] };
  }
  const v = validateLessonBody(parsed);
  if (!v.ok) return { ok: false, errors: v.errors };

  const admin = createAdminClient();
  const { data: existing, error: getErr } = await admin.from("lessons").select("slug, subtopic:subtopics(slug)").eq("id", id).maybeSingle();
  if (getErr || !existing) return { ok: false, errors: [getErr?.message ?? "lesson not found"] };
  const subtopicSlug = (existing.subtopic as unknown as { slug: string } | null)?.slug ?? "";
  if (status === "approved") {
    const problems = approvalProblems(v.value, { walkthrough: findSubtopic(subtopicSlug)?.subtopic.walkthrough });
    if (problems.length) return { ok: false, errors: problems.map((p) => `not approvable: ${p}`) };
  }

  const { error } = await admin
    .from("lessons")
    .update({ title, status, body: v.value, body_version: v.value.version, reading_minutes: v.value.reading_minutes })
    .eq("id", id);
  if (error) return { ok: false, errors: [error.message] };

  revalidateTag(`lesson:${existing.slug}`, "max");
  // Loop 06: content_chunks follow the status (approved → indexed, else removed).
  try { await indexLesson(admin, id); } catch (e) { console.warn("content_chunks: reindex failed", e); }
  refresh();
  return { ok: true, errors: [], savedAt: new Date().toISOString() };
}
