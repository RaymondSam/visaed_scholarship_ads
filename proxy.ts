import { NextResponse, type NextRequest } from "next/server";
import { openPayload, SESSION_COOKIE, safeNextPath } from "@/lib/auth/session";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", safeNextPath(request.nextUrl.pathname, "/account"));
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsAuth = path.startsWith("/admin") || path.startsWith("/account");

  if (process.env.DATA_PROVIDER === "supabase") {
    const { response, user } = await refreshSupabaseSession(request);
    if (needsAuth && !user) {
      const redirect = loginRedirect(request);
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
      return redirect;
    }
    return response;
  }

  if (!needsAuth) return NextResponse.next();
  const session = await openPayload(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();
  return loginRedirect(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
