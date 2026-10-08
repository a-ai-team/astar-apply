// GET /home/technicals/guide/pdf — the complete technicals guide as a file (Loop 21). Built by
// `npm run packs:build -- --guide` into the private `packs` bucket. No stored PDF yet → the guide
// page with its print dialog open, so the link always ends in something a student can save.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { GUIDE_DOWNLOAD_NAME, GUIDE_OBJECT_PATH, PACKS_BUCKET } from "@/lib/content/pack-files";

export async function GET(req: Request) {
  // The proxy has already gated /home; this is the DAL check every handler repeats.
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL(`/auth/team?next=${encodeURIComponent("/home/technicals/guide/pdf")}`, req.url));

  const { data, error } = await createAdminClient().storage.from(PACKS_BUCKET).download(GUIDE_OBJECT_PATH);
  if (error || !data) return NextResponse.redirect(new URL("/home/technicals/guide?print=1", req.url));
  return new Response(data.stream(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(data.size),
      "Content-Disposition": `attachment; filename="${GUIDE_DOWNLOAD_NAME}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
