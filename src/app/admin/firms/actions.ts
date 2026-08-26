"use server";

// /admin/firms actions (Loop 08). Every action verifies a staff session first (Server Actions
// bypass the proxy) and writes with the service-role client. `saveFirm` validates the dossier JSON
// against FirmSchema; `setFirmQuestionsStatus` bulk-moves a firm's questions (approve/unapprove);
// `setFirmQuestionStatus` moves one. Approving a firm does not approve its questions — both must be
// approved for a question to reach students (RLS on firm_questions checks the firm's status).
import { revalidatePath } from "next/cache";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateFirm } from "@/lib/firms/schema";

export type FirmSaveState = { ok: boolean; errors: string[]; savedAt?: string; message?: string };

const STATUSES = ["draft", "generated", "in_review", "approved", "rejected", "archived"] as const;
type Status = (typeof STATUSES)[number];

function asStatus(s: unknown): Status | null {
  return STATUSES.includes(s as Status) ? (s as Status) : null;
}

export async function saveFirm(_prev: FirmSaveState, formData: FormData): Promise<FirmSaveState> {
  await verifyStaff();
  const id = String(formData.get("id") ?? "");
  const status = asStatus(String(formData.get("status") ?? ""));
  const raw = String(formData.get("body") ?? "");
  if (!id) return { ok: false, errors: ["id is required"] };
  if (!status) return { ok: false, errors: ["unknown status"] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, errors: [`JSON parse error: ${(e as Error).message}`] };
  }
  const v = validateFirm(parsed);
  if (!v.ok) return { ok: false, errors: v.errors };
  const db = createAdminClient();
  const { data: existing, error: getErr } = await db.from("firms").select("id, slug").eq("id", id).maybeSingle();
  if (getErr || !existing) return { ok: false, errors: [getErr?.message ?? "firm not found"] };
  const f = v.value;
  const { error } = await db.from("firms").update({ slug: f.slug, name: f.name, type: f.type, founded: f.founded, hq: f.hq, headcount: f.headcount, scale_note: f.scale_note, divisions: f.divisions, values: f.values, process: f.process, sources: f.sources, status }).eq("id", id);
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath("/admin/firms");
  revalidatePath(`/admin/firms/${f.slug}`);
  revalidatePath("/home/interviews/firms");
  revalidatePath(`/home/interviews/firms/${f.slug}`);
  return { ok: true, errors: [], savedAt: new Date().toISOString(), message: f.slug !== existing.slug ? `Saved; slug is now ${f.slug}` : undefined };
}

export async function setFirmQuestionsStatus(_prev: FirmSaveState, formData: FormData): Promise<FirmSaveState> {
  await verifyStaff();
  const firmId = String(formData.get("firm_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const to = asStatus(String(formData.get("to") ?? ""));
  const fromRaw = String(formData.get("from") ?? "");
  const from = fromRaw ? fromRaw.split(",").map((s) => asStatus(s.trim())).filter((s): s is Status => Boolean(s)) : null;
  if (!firmId || !to) return { ok: false, errors: ["bad request"] };
  const db = createAdminClient();
  let q = db.from("firm_questions").update({ status: to }).eq("firm_id", firmId);
  if (from?.length) q = q.in("status", from);
  const { data, error } = await q.select("id");
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath(`/admin/firms/${slug}`);
  revalidatePath(`/home/interviews/firms/${slug}`);
  revalidatePath("/home/interviews/firms");
  return { ok: true, errors: [], savedAt: new Date().toISOString(), message: `${data?.length ?? 0} question${data?.length === 1 ? "" : "s"} → ${to}` };
}

export async function setFirmQuestionStatus(_prev: FirmSaveState, formData: FormData): Promise<FirmSaveState> {
  await verifyStaff();
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const to = asStatus(String(formData.get("to") ?? ""));
  if (!id || !to) return { ok: false, errors: ["bad request"] };
  const db = createAdminClient();
  const { error } = await db.from("firm_questions").update({ status: to }).eq("id", id);
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath(`/admin/firms/${slug}`);
  revalidatePath(`/home/interviews/firms/${slug}`);
  return { ok: true, errors: [], savedAt: new Date().toISOString(), message: to };
}
