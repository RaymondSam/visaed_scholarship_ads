import "server-only";
import { cookies } from "next/headers";
import { createUserClient } from "@/lib/supabase/server";

export const MFA_FACTOR_COOKIE = "visaed_mfa_factor";
export const MFA_SECRET_COOKIE = "visaed_mfa_secret";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 600,
};

export async function signOutSupabase() {
  const supabase = await createUserClient();
  await supabase.auth.signOut();
}

export async function signInSupabase(email: string, password: string, code: string): Promise<{ role: string } | { error: string; mfa?: boolean }> {
  const supabase = await createUserClient();
  const signed = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (signed.error || !signed.data.user) return { error: "Email or password is not valid." };

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", signed.data.user.id).maybeSingle();
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: "Email or password is not valid." };
  }

  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.data?.nextLevel === "aal2" && assurance.data.currentLevel !== "aal2") {
    if (!code) {
      await supabase.auth.signOut();
      return { error: "", mfa: true };
    }
    const factors = await supabase.auth.mfa.listFactors();
    const factor = factors.data?.totp?.[0];
    if (!factor) {
      await supabase.auth.signOut();
      return { error: "Multi-factor authentication is not available for this account." };
    }
    const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challenge.error || !challenge.data) {
      await supabase.auth.signOut();
      return { error: "That authentication code is not valid.", mfa: true };
    }
    const verified = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.data.id, code });
    if (verified.error) {
      await supabase.auth.signOut();
      return { error: "That authentication code is not valid.", mfa: true };
    }
  }

  return { role: String(profile.role) };
}

export async function completeSupabasePassword(password: string, mode: "invite" | "reset") {
  if (password.length < 12) throw new Error("Use at least 12 characters.");
  const supabase = await createUserClient();
  const { data: auth } = await supabase.auth.getUser();
  const invalid = mode === "invite" ? "This invite link is not valid. Ask a super admin to send a new one." : "This reset link is not valid.";
  if (!auth.user) throw new Error(invalid);
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, status").eq("id", auth.user.id).maybeSingle();
  if (profileError || !profile || profile.status === "suspended") {
    await supabase.auth.signOut();
    throw new Error(invalid);
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error("The password could not be saved. Use at least 12 characters that are not a known leaked password.");
  if (mode === "invite" && profile.status === "invited") {
    const { error: statusError } = await supabase.from("profiles").update({ status: "active" }).eq("id", auth.user.id);
    if (statusError) throw new Error("The password was saved, but the account could not be activated.");
  }
  return { role: String(profile.role) };
}

export async function beginSupabaseMfa() {
  const supabase = await createUserClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in again.");
  const factors = await supabase.auth.mfa.listFactors();
  for (const factor of factors.data?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
  const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator" });
  if (enrolled.error || !enrolled.data.totp?.secret) throw new Error("Enrollment could not be started.");
  const jar = await cookies();
  jar.set(MFA_FACTOR_COOKIE, enrolled.data.id, cookieOptions);
  jar.set(MFA_SECRET_COOKIE, enrolled.data.totp.secret, cookieOptions);
}

export async function confirmSupabaseMfa(code: string) {
  const jar = await cookies();
  const factorId = jar.get(MFA_FACTOR_COOKIE)?.value;
  if (!factorId) throw new Error("Start enrollment first.");
  const supabase = await createUserClient();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error || !challenge.data) throw new Error("That code does not match.");
  const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: code.replace(/\s/g, "") });
  if (verified.error) throw new Error("That code does not match.");
  jar.set(MFA_FACTOR_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  jar.set(MFA_SECRET_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export async function enrollmentSecret(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(MFA_SECRET_COOKIE)?.value ?? null;
}
