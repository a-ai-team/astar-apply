import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, expectedToken } from "@/lib/access";
import { establishTeamSession } from "@/lib/team-session";
import { teamEntryTarget } from "./target";

/**
 * Re-establish the shared team session for a browser that still holds a valid access-key
 * cookie but whose Supabase session has expired (src/proxy.ts sends it here). Without a valid
 * access cookie this is just a bounce to /unlock — the key is the only credential.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get("next");

  const expected = await expectedToken();
  const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!expected || cookie !== expected) {
    return NextResponse.redirect(teamEntryTarget(origin, next, "no-key"));
  }

  const session = await establishTeamSession();
  return NextResponse.redirect(teamEntryTarget(origin, next, session.ok ? "ok" : "session-failed"));
}
