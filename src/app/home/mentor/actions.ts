"use server";

// Thread actions for /home/mentor. Server Actions bypass the proxy → every action verifies the
// session first, then uses the service-role client scoped by user_id.
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f-]{36}$/i;

export async function renameThread(threadId: string, title: string): Promise<void> {
  const session = await verifySession("/home/mentor");
  if (!UUID.test(threadId)) throw new Error("bad thread id");
  const clean = title.replace(/\s+/g, " ").trim().slice(0, 80);
  if (!clean) throw new Error("title required");
  const { error } = await createAdminClient().from("chat_threads").update({ title: clean }).eq("id", threadId).eq("user_id", session.userId);
  if (error) throw error;
  refresh();
}

export async function deleteThread(threadId: string): Promise<void> {
  const session = await verifySession("/home/mentor");
  if (!UUID.test(threadId)) throw new Error("bad thread id");
  const { error } = await createAdminClient().from("chat_threads").delete().eq("id", threadId).eq("user_id", session.userId);
  if (error) throw error;
  redirect("/home/mentor");
}
