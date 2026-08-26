"use server";

// /admin/pulse decisions (Loop 08): approve (publish to /home/pulse), reject, or send back to
// generated. Staff only; service role after verifyStaff().
import { revalidatePath } from "next/cache";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FirmSaveState } from "@/app/admin/firms/actions";

const STATUSES = ["generated", "in_review", "approved", "rejected", "archived"] as const;

export async function setDigestStatus(_prev: FirmSaveState, formData: FormData): Promise<FirmSaveState> {
  await verifyStaff();
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "") as (typeof STATUSES)[number];
  if (!id || !STATUSES.includes(to)) return { ok: false, errors: ["bad request"] };
  const db = createAdminClient();
  const { data, error } = await db.from("pulse_digests").update({ status: to }).eq("id", id).select("week_start").maybeSingle();
  if (error) return { ok: false, errors: [error.message] };
  if (!data) return { ok: false, errors: ["digest not found"] };
  revalidatePath("/admin/pulse");
  revalidatePath("/home/pulse");
  revalidatePath(`/home/pulse/${data.week_start}`);
  return { ok: true, errors: [], savedAt: new Date().toISOString(), message: to };
}
