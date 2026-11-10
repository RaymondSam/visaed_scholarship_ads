import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { openPayload, SESSION_COOKIE, type Assurance } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/local-store";
import type { SessionProfile } from "@/lib/data/local-store";

export async function readAssurance(): Promise<{ sub: string; aal: Assurance } | null> {
  const jar = await cookies();
  return openPayload(jar.get(SESSION_COOKIE)?.value);
}

export async function currentProfile(): Promise<(SessionProfile & { aal: Assurance }) | null> {
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
