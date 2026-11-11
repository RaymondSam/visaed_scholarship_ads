import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNextPath } from "@/lib/auth/session";
import { createUserClient } from "@/lib/supabase/server";

const OTP_TYPES = new Set<EmailOtpType>(["invite", "recovery", "email", "signup", "magiclink"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNextPath(url.searchParams.get("next"), "/auth/invite");
  if (!tokenHash || !type || !OTP_TYPES.has(type as EmailOtpType)) {
    return NextResponse.redirect(new URL("/login?reason=link", url.origin));
  }
  const supabase = await createUserClient();
  const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
  if (error) return NextResponse.redirect(new URL("/login?reason=link", url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
