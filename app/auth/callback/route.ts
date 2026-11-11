import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/session";
import { createUserClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"), "/auth/invite");
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login", url.origin));
  const supabase = await createUserClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?reason=link", url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
