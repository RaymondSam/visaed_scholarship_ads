import { NextResponse, type NextRequest } from "next/server";
import { openPayload, SESSION_COOKIE, safeNextPath } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const session = await openPayload(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", safeNextPath(request.nextUrl.pathname, "/account"));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
