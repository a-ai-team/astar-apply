import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, expectedToken } from "@/lib/access";

// Gate everything under /home behind the shared access key. See docs/PRIVATE_AREA.md.
export async function proxy(request: NextRequest) {
  const expected = await expectedToken();
  const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
  if (expected && cookie === expected) return NextResponse.next();

  const url = new URL("/unlock", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: "/home/:path*",
};
