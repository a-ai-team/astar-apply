"use server";

// Playbook checklist persistence (Loop 10): `playbook_progress` (0011) when present. Returns
// { stored: false } when the table is absent so the client keeps localStorage as the source.
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { isTableMissing } from "@/lib/billing/entitlements";

export async function togglePlaybookItem(itemKey: string, done: boolean): Promise<{ stored: boolean }> {
  const session = await verifySession("/non-target");
  if (!/^[a-z0-9-]{1,64}$/.test(itemKey)) throw new Error("bad key");
  const db = await createClient();
  const { error } = await db.from("playbook_progress").upsert({ user_id: session.userId, item_key: itemKey, done }, { onConflict: "user_id,item_key" });
  if (error) {
    if (isTableMissing(error)) return { stored: false }; // TODO(james): apply 0011 → server-side progress
    throw error;
  }
  return { stored: true };
}
