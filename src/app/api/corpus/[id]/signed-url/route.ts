// GET /api/corpus/[id]/signed-url — 1-hour signed download URL for the source's original file
// (private bucket). Staff only.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { isStaff } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { CORPUS_BUCKET } from "@/lib/corpus/types";

export async function GET(_req: Request, ctx: RouteContext<"/api/corpus/[id]/signed-url">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!isStaff(session.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: source } = await admin.from("corpus_sources").select("storage_path, mime").eq("id", id).maybeSingle();
  if (!source?.storage_path) return NextResponse.json({ error: "no file" }, { status: 404 });
  const { data, error } = await admin.storage.from(CORPUS_BUCKET).createSignedUrl(source.storage_path, 3600);
  if (error || !data) return NextResponse.json({ error: error?.message ?? "sign failed" }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl, mime: source.mime });
}
