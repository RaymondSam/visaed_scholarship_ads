import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { enrollmentSecret } from "@/lib/auth/supabase-session";
import { openPayload, SESSION_COOKIE, type Assurance } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/local-store";
import type { SessionProfile } from "@/lib/data/local-store";
import { isLocalMode } from "@/lib/site";
import { createUserClient } from "@/lib/supabase/server";

export async function readAssurance(): Promise<{ sub: string; aal: Assurance } | null> {
  if (!isLocalMode()) {
    const supabase = await createUserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return { sub: data.user.id, aal: assurance.data?.currentLevel === "aal2" ? "aal2" : "aal1" };
  }
  const jar = await cookies();
  return openPayload(jar.get(SESSION_COOKIE)?.value);
}

export async function currentProfile(): Promise<(SessionProfile & { aal: Assurance }) | null> {
  if (!isLocalMode()) {
    const supabase = await createUserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const profile = await getRepository().getProfileById(data.user.id);
    if (!profile || profile.status !== "active") return null;
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const factors = await supabase.auth.mfa.listFactors();
    const mfaEnabled = (factors.data?.totp?.length ?? 0) > 0;
    return {
      ...profile,
      email: data.user.email ?? profile.email,
      mfaEnabled,
      mfaSecret: mfaEnabled ? null : await enrollmentSecret(),
      aal: assurance.data?.currentLevel === "aal2" ? "aal2" : "aal1",
    };
  }
  const session = await readAssurance();
  if (!session) return null;
  const profile = await getRepository().getProfileById(session.sub);
  if (!profile || profile.status !== "active") return null;
  return { ...profile, aal: session.aal };
}

export async function requireUser() {
  const profile = await currentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireStaff() {
  const profile = await requireUser();
  if (profile.role !== "admin" && profile.role !== "super_admin") redirect("/account");
  return profile;
}

export async function requireSuperAdmin() {
  const profile = await requireStaff();
  if (profile.role !== "super_admin" || profile.aal !== "aal2") redirect("/account/security");
  return profile;
}
