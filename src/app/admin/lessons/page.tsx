// /admin/lessons — every lesson (all statuses) grouped by topic, for staff editing.
import Link from "next/link";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";

type Row = { id: string; slug: string; title: string; status: string; reading_minutes: number; updated_at: string; generated_by: string | null; subtopic: { title: string; topic: { title: string; ordinal: number } } | null };

export default async function AdminLessonsPage() {
  await verifyStaff();
  const db = createAdminClient();
  const { data, error } = await db.from("lessons").select("id, slug, title, status, reading_minutes, updated_at, generated_by, subtopic:subtopics(title, topic:topics(title, ordinal))").order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <h1 className="text-2xl font-semibold" data-testid="admin-lessons-heading">Lessons</h1>
      <p className="text-sm text-muted">{rows.length} lesson{rows.length === 1 ? "" : "s"}. Only <span className="font-mono">approved</span> lessons are visible to students.</p>
      {rows.length === 0 && <p className="text-sm text-muted">No lessons yet — run <span className="font-mono">npm run seed -- 03</span>.</p>}
      <ul className="flex flex-col gap-2" data-testid="admin-lesson-list">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3" data-testid="admin-lesson-row">
            <Link href={`/admin/lessons/${r.id}`} className="font-medium hover:underline" data-testid="admin-lesson-link">{r.title}</Link>
            <span className="text-xs text-muted">{r.subtopic?.topic.title} · {r.subtopic?.title} · {r.reading_minutes} min · {r.generated_by ?? "?"}</span>
            <span className="ml-auto flex items-center gap-2 text-xs text-muted">
              <Badge tone={r.status === "approved" ? "accent" : "neutral"}>{r.status}</Badge>
              {new Date(r.updated_at).toLocaleString("en-GB")}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
