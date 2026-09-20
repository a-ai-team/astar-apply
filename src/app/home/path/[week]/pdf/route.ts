// GET /home/path/[week]/pdf — the week pack as a file (Loop 20). PDFs are built by
// `npm run packs:build` into the private `packs` bucket (never committed — the repo is public and
// the content is gated). No stored PDF yet → the pack page with its print dialog open, so the link
// always ends in something a student can save or print.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { PACKS_BUCKET, packDownloadName, packObjectPath } from "@/lib/content/pack-files";
import { DEFAULT_PATH } from "@/lib/content/taxonomy";

export async function GET(req: Request, ctx: RouteContext<"/home/path/[week]/pdf">) {
  const { week } = await ctx.params;
  const n = Number(week);
  if (!DEFAULT_PATH.weeks.some((w) => w.week === n)) return NextResponse.json({ error: "no such week" }, { status: 404 });
  // The proxy has already gated /home; this is the DAL check every handler repeats.
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL(`/auth/team?next=${encodeURIComponent(`/home/path/${n}/pdf`)}`, req.url));

  const { data, error } = await createAdminClient().storage.from(PACKS_BUCKET).download(packObjectPath(n));
  if (error || !data) return NextResponse.redirect(new URL(`/home/path/${n}/pack?print=1`, req.url));
  return new Response(data.stream(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(data.size),
      "Content-Disposition": `attachment; filename="${packDownloadName(n)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
