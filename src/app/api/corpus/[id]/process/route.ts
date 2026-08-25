// POST /api/corpus/[id]/process — staff only, idempotent (re-runs extraction + chunking).
// Called by the upload flow after createSources, and by the "Re-extract" button.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { isStaff } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { processSource } from "@/lib/corpus/ingest";

export const maxDuration = 60;

export async function POST(_req: Request, ctx: RouteContext<"/api/corpus/[id]/process">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!isStaff(session.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  try {
    const result = await processSource(createAdminClient(), id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = /not found/.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
