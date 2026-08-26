// Persistence helpers for chat_threads / chat_messages / chat_feedback / usage_daily. Always
// called with the service-role client *after* the session was verified (route handler / action),
// and every query is scoped by user_id so a user can never touch another user's thread.
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HistoryTurn, MessageContent, RetrievalRecord, ThreadContext } from "./types";
import { HISTORY_TURNS } from "./rewrite";

export type ThreadRow = { id: string; user_id: string; title: string; mentor_id: string | null; context: ThreadContext | null; last_message_at: string | null; created_at: string; updated_at: string };
export type MessageRow = {
  id: string; thread_id: string; role: "user" | "assistant"; content: MessageContent | { text: string };
  retrieval: RetrievalRecord | null; prompt_version: string | null; model: string | null; usage: unknown; latency_ms: number | null; created_at: string;
};

export async function getThread(db: SupabaseClient, userId: string, threadId: string): Promise<ThreadRow | null> {
  const { data, error } = await db.from("chat_threads").select("*").eq("id", threadId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data as ThreadRow | null) ?? null;
}

export async function listThreads(db: SupabaseClient, userId: string): Promise<ThreadRow[]> {
  const { data, error } = await db
    .from("chat_threads").select("*").eq("user_id", userId)
    .order("last_message_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as ThreadRow[];
}

export async function createThread(db: SupabaseClient, userId: string, firstMessage: string, context: ThreadContext | null = null): Promise<ThreadRow> {
  const { data, error } = await db.from("chat_threads").insert({ user_id: userId, title: titleFrom(firstMessage), context }).select("*").single();
  if (error || !data) throw error ?? new Error("thread insert failed");
  return data as ThreadRow;
}

export function titleFrom(message: string): string {
  const t = message.replace(/\s+/g, " ").trim();
  return t.length > 60 ? t.slice(0, 57).trimEnd() + "…" : t || "New thread";
}

export async function listMessages(db: SupabaseClient, threadId: string): Promise<MessageRow[]> {
  const { data, error } = await db.from("chat_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }).limit(500);
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

/** Last 6 turns (user+assistant) as plain text for the rewrite + answer prompts. */
export async function loadHistory(db: SupabaseClient, threadId: string): Promise<HistoryTurn[]> {
  const { data, error } = await db
    .from("chat_messages").select("role, content").eq("thread_id", threadId)
    .order("created_at", { ascending: false }).limit(HISTORY_TURNS * 2);
  if (error) throw error;
  return ((data ?? []) as { role: "user" | "assistant"; content: { text?: string } }[])
    .reverse()
    .map((m) => ({ role: m.role, text: m.content?.text ?? "" }))
    .filter((t) => t.text);
}

export async function insertUserMessage(db: SupabaseClient, threadId: string, text: string): Promise<string> {
  const { data, error } = await db.from("chat_messages").insert({ thread_id: threadId, role: "user", content: { text } }).select("id").single();
  if (error || !data) throw error ?? new Error("message insert failed");
  return data.id as string;
}

export async function insertAssistantMessage(
  db: SupabaseClient,
  threadId: string,
  m: { content: MessageContent; retrieval: RetrievalRecord; prompt_version: string; latency_ms: number },
): Promise<string> {
  const { data, error } = await db
    .from("chat_messages")
    .insert({
      thread_id: threadId, role: "assistant", content: m.content, retrieval: m.retrieval,
      prompt_version: m.prompt_version, model: m.content.model, usage: m.content.usage, latency_ms: m.latency_ms,
    })
    .select("id").single();
  if (error || !data) throw error ?? new Error("assistant insert failed");
  const { error: e2 } = await db.from("chat_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
  if (e2) throw e2;
  return data.id as string;
}

/** Bumps today's message count; returns the new count. */
export async function incrementUsage(db: SupabaseClient, userId: string, delta: { messages?: number; input_tokens?: number; output_tokens?: number }): Promise<number> {
  const { data, error } = await db.rpc("increment_usage", {
    p_user_id: userId, p_messages: delta.messages ?? 0, p_input_tokens: delta.input_tokens ?? 0, p_output_tokens: delta.output_tokens ?? 0,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function upsertFeedback(db: SupabaseClient, userId: string, messageId: string, vote: 1 | -1, comment: string | null): Promise<void> {
  const { error } = await db
    .from("chat_feedback")
    .upsert({ message_id: messageId, user_id: userId, vote, comment }, { onConflict: "message_id,user_id" });
  if (error) throw error;
}

/** Returns the thread id if this assistant message belongs to one of the user's threads. */
export async function messageOwnedBy(db: SupabaseClient, userId: string, messageId: string): Promise<boolean> {
  const { data, error } = await db.from("chat_messages").select("id, chat_threads!inner(user_id)").eq("id", messageId).eq("chat_threads.user_id", userId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function feedbackForThread(db: SupabaseClient, userId: string, threadId: string): Promise<Map<string, 1 | -1>> {
  const { data, error } = await db.from("chat_feedback").select("message_id, vote, chat_messages!inner(thread_id)").eq("user_id", userId).eq("chat_messages.thread_id", threadId);
  if (error) throw error;
  const map = new Map<string, 1 | -1>();
  for (const r of (data ?? []) as { message_id: string; vote: number }[]) map.set(r.message_id, r.vote as 1 | -1);
  return map;
}
