"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/auth/current";
import { sealPayload, MFA_COOKIE, NOTICE_COOKIE, safeNextPath, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/auth/session";
import { beginSupabaseMfa, completeSupabasePassword, confirmSupabaseMfa, signInSupabase, signOutSupabase } from "@/lib/auth/supabase-session";
import { newMfaSecret, verifyTotp } from "@/lib/auth/totp";
import { getRepository, verifyPassword } from "@/lib/data/local-store";
import { isLocalMode } from "@/lib/site";
import { CONTACT_REASONS, USER_ROLES, type ContactReason, type UserRole } from "@/lib/domain/types";
import { scholarshipFromForm } from "@/lib/scholarships/form";
import { siteUrl } from "@/lib/site";

export type ActionState = { error?: string; errors?: string[]; message?: string } | null;

async function setSession(profileId: string, aal: "aal1" | "aal2") {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await sealPayload({ sub: profileId, aal, exp: Date.now() + SESSION_TTL_MS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

async function actor() {
  return currentProfile();
}

function destinationFor(role: string, next: string): string {
  if (role === "student" && next.startsWith("/admin")) return "/account";
  if ((role === "admin" || role === "super_admin") && (next === "/account" || next === "/login")) return "/admin";
  return next;
}

export async function signIn(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/account"));
  if (!isLocalMode()) {
    const result = await signInSupabase(email, password, String(formData.get("code") ?? ""));
    if ("error" in result) return result.mfa ? { error: result.error || undefined, message: "mfa" } : { error: result.error };
    redirect(destinationFor(result.role, next));
  }
  const profile = await getRepository().getProfileByEmail(email.trim());
  if (!profile || profile.status !== "active" || !verifyPassword(password, profile.passwordHash)) {
    return { error: "Email or password is not valid." };
  }
  if (profile.mfaEnabled) {
    if (!profile.mfaSecret) return { error: "Multi-factor authentication is not available for this account." };
    const code = String(formData.get("code") ?? "");
    if (!code) {
      const jar = await cookies();
      jar.set(MFA_COOKIE, await sealPayload({ sub: profile.id, aal: "aal1", exp: Date.now() + 5 * 60 * 1000 }), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 300,
      });
      return { message: "mfa" };
    }
    if (!verifyTotp(profile.mfaSecret, profile.email, code)) return { error: "That authentication code is not valid.", message: "mfa" };
    await setSession(profile.id, "aal2");
  } else {
    await setSession(profile.id, "aal1");
  }
  redirect(destinationFor(profile.role, next));
}

export async function signOut() {
  if (!isLocalMode()) await signOutSupabase();
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(MFA_COOKIE);
  redirect("/login");
}

export async function forgotPassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  await getRepository().requestPasswordReset(email.trim(), siteUrl());
  return {
    message: isLocalMode()
      ? "If an active account uses that email, a reset link is ready in the local mailbox."
      : "If an active account uses that email, a reset link is on its way.",
  };
}

export async function resetPassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    if (!isLocalMode()) await completeSupabasePassword(String(formData.get("password") ?? ""), "reset");
    else await getRepository().completePasswordReset(String(formData.get("token") ?? ""), String(formData.get("password") ?? ""));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The password could not be reset." };
  }
  if (!isLocalMode()) await signOutSupabase();
  redirect("/login?reason=reset");
}

export async function acceptInvite(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isLocalMode()) {
    let role = "student";
    try {
      const profile = await completeSupabasePassword(String(formData.get("password") ?? ""), "invite");
      role = profile.role;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "The invite could not be accepted." };
    }
    redirect(role === "student" ? "/account" : "/admin");
  }
  let profile: Awaited<ReturnType<ReturnType<typeof getRepository>["acceptInvite"]>>;
  try {
    profile = await getRepository().acceptInvite(String(formData.get("token") ?? ""), String(formData.get("password") ?? ""));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The invite could not be accepted." };
  }
  await setSession(profile.id, "aal1");
  redirect(profile.role === "student" ? "/account" : "/admin");
}

export async function updateProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await actor();
  if (!user) return { error: "Sign in again." };
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Enter your name." };
  const country = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const level = String(formData.get("educationLevel") ?? "");
  await getRepository().updateOwnProfile(user.id, {
    fullName,
    countryCode: /^[A-Z]{2}$/.test(country) ? country : null,
    educationLevel: level ? (level as never) : null,
    studyFieldIds: formData.getAll("studyFieldIds").map(String),
  });
  return { message: "Profile saved." };
}

export async function beginMfa() {
  const user = await actor();
  if (!user) redirect("/login?next=/account/security");
  if (!isLocalMode()) {
    try {
      await beginSupabaseMfa();
    } catch (error) {
      await rememberErrors("/account/security", [error instanceof Error ? error.message : "Enrollment could not be started."]);
    }
    redirect("/account/security");
  }
  await getRepository().setMfa(user.id, newMfaSecret(), false);
  redirect("/account/security");
}

export async function confirmMfa(formData: FormData) {
  const user = await actor();
  const code = String(formData.get("code") ?? "");
  if (!isLocalMode()) {
    try {
      await confirmSupabaseMfa(code);
    } catch (error) {
      await rememberErrors("/account/security", [error instanceof Error ? error.message : "That code does not match."]);
      redirect("/account/security");
    }
    redirect(user?.role === "super_admin" ? "/admin/users" : "/admin");
  }
  if (!user?.mfaSecret) {
    await rememberErrors("/account/security", ["Start enrollment first."]);
    redirect("/account/security");
  }
  if (!verifyTotp(user.mfaSecret, user.email, code)) {
    await rememberErrors("/account/security", ["That code does not match."]);
    redirect("/account/security");
  }
  await getRepository().setMfa(user.id, user.mfaSecret, true);
  await setSession(user.id, "aal2");
  redirect(user.role === "super_admin" ? "/admin/users" : "/admin");
}

async function rememberErrors(_pathname: string, errors: string[]) {
  const jar = await cookies();
  jar.set(NOTICE_COOKIE, errors.join("\n"), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 });
}

export async function saveScholarship(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await actor();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return { error: "You do not have access." };
  const existingId = String(formData.get("id") ?? "") || null;
  const result = await getRepository().saveScholarship(user.id, existingId, scholarshipFromForm(formData), formData.get("intent") === "publish");
  if (!result.ok) {
    if (result.id) {
      await rememberErrors(`/admin/scholarships/${result.id}`, result.errors);
      redirect(`/admin/scholarships/${result.id}`);
    }
    return { errors: result.errors };
  }
  redirect(`/admin/scholarships/${result.id}?saved=${result.published ? "published" : "draft"}`);
}

export async function transitionScholarship(formData: FormData) {
  const user = await actor();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "") as "unpublish" | "close" | "archive" | "feature" | "unfeature";
  try {
    await getRepository().transition(user.id, id, action);
  } catch (error) {
    await rememberErrors(`/admin/scholarships/${id}`, [error instanceof Error ? error.message : "The listing could not be updated."]);
  }
  redirect(`/admin/scholarships/${id}`);
}

export async function uploadCover(formData: FormData) {
  const user = await actor();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) redirect("/login");
  const scholarshipId = String(formData.get("id") ?? "");
  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) {
    await rememberErrors(`/admin/scholarships/${scholarshipId}`, ["Choose an image to upload."]);
    redirect(`/admin/scholarships/${scholarshipId}`);
  }
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/jpeg" ? "jpg" : "";
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    await getRepository().saveCover(user.id, scholarshipId, ext, bytes);
  } catch (error) {
    await rememberErrors(`/admin/scholarships/${scholarshipId}`, [error instanceof Error ? error.message : "The image could not be saved."]);
  }
  redirect(`/admin/scholarships/${scholarshipId}`);
}

export async function runDeadlineCheck() {
  const user = await actor();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) redirect("/login");
  await getRepository().closeExpired();
  redirect("/admin");
}

export async function inviteUser(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await actor();
  if (!user || user.role !== "super_admin" || user.aal !== "aal2") return { error: "Super admin verification is required." };
  const role = String(formData.get("role") ?? "student") as UserRole;
  if (!USER_ROLES.includes(role)) return { error: "Choose a role." };
  try {
    await getRepository().inviteUser(
      user.id,
      { email: String(formData.get("email") ?? ""), fullName: String(formData.get("fullName") ?? ""), role },
      siteUrl(),
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The invite could not be sent." };
  }
  return {
    message: isLocalMode()
      ? "Invite created. Open the local mailbox to copy the link."
      : "Invite sent. The person sets a password from that email.",
  };
}

export async function resendInvite(formData: FormData) {
  const user = await actor();
  if (!user || user.role !== "super_admin" || user.aal !== "aal2") redirect("/account/security");
  await getRepository().resendInvite(user.id, String(formData.get("id") ?? ""), siteUrl());
  redirect("/admin/users");
}

export async function changeAccount(formData: FormData) {
  const user = await actor();
  if (!user || user.role !== "super_admin" || user.aal !== "aal2") redirect("/account/security");
  try {
    await getRepository().changeAccount(
      user.id,
      String(formData.get("id") ?? ""),
      String(formData.get("role") ?? "student") as UserRole,
      String(formData.get("status") ?? "active") as "active" | "suspended" | "invited",
    );
  } catch (error) {
    await rememberErrors("/admin/users", [error instanceof Error ? error.message : "The account could not be changed."]);
  }
  redirect("/admin/users");
}

export async function deleteAccount(formData: FormData) {
  const user = await actor();
  if (!user || user.role !== "super_admin" || user.aal !== "aal2") redirect("/account/security");
  try {
    await getRepository().deleteAccount(user.id, String(formData.get("id") ?? ""), String(formData.get("confirmEmail") ?? ""));
  } catch (error) {
    await rememberErrors("/admin/users", [error instanceof Error ? error.message : "The account could not be deleted."]);
  }
  redirect("/admin/users");
}

export async function sendContact(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (String(formData.get("company_website") ?? "").trim()) return { message: "Message received. The team will read it soon." };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const reason = String(formData.get("reason") ?? "general") as ContactReason;
  const message = String(formData.get("message") ?? "").trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10 || !CONTACT_REASONS.includes(reason)) {
    return { error: "Add your name, a valid email, and a message of at least 10 characters." };
  }
  const { headers } = await import("next/headers");
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const pepper = process.env.RATE_LIMIT_PEPPER || "local-dev-pepper";
  const bucketKey = createHash("sha256").update(`${pepper}|${ip}|contact`).digest("hex");
  const result = await getRepository().createContact({ name, email, reason, message, bucketKey });
  if (result === "limited") return { error: "Too many messages from this network. Try again later." };
  return { message: "Message received. The team will read it soon." };
}

export async function setInquiryStatus(formData: FormData) {
  const user = await actor();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) redirect("/login");
  const status = String(formData.get("status") ?? "") === "closed" ? "closed" : "read";
  await getRepository().setContactStatus(user.id, String(formData.get("id") ?? ""), status);
  redirect("/admin/inquiries");
}

export async function takeNotice(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(NOTICE_COOKIE)?.value;
  if (!raw) return [];
  jar.set(NOTICE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return raw.split("\n").filter(Boolean);
}
