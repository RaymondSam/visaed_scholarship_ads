import type { AccountStatus, Profile, UserRole } from "@/lib/domain/types";

export function activeSuperAdminCount(profiles: Pick<Profile, "id" | "role" | "status">[], exceptId?: string): number {
  return profiles.filter(
    (profile) => profile.role === "super_admin" && profile.status === "active" && profile.id !== exceptId,
  ).length;
}

export function accountChangeError(
  profiles: Pick<Profile, "id" | "role" | "status">[],
  actor: Pick<Profile, "id" | "role" | "status"> | null,
  target: Pick<Profile, "id" | "role" | "status"> | null,
  nextRole: UserRole,
  nextStatus: AccountStatus,
): string | null {
  if (!actor || actor.role !== "super_admin" || actor.status !== "active") return "You do not have access.";
  if (!target) return "Account not found.";
  const removesLastSuperAdmin =
    target.role === "super_admin" &&
    target.status === "active" &&
    (nextRole !== "super_admin" || nextStatus !== "active") &&
    activeSuperAdminCount(profiles, target.id) === 0;
  if (removesLastSuperAdmin) return "The last active super admin cannot be removed.";
  return null;
}

export function registerHit(
  buckets: { key: string; windowStart: string; hits: number }[],
  key: string,
  now: Date,
  limit = 5,
  windowMs = 60 * 60 * 1000,
): { allowed: boolean; buckets: { key: string; windowStart: string; hits: number }[] } {
  const fresh = buckets.filter((bucket) => now.getTime() - new Date(bucket.windowStart).getTime() < 48 * 60 * 60 * 1000);
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs).toISOString();
  const existing = fresh.find((bucket) => bucket.key === key && bucket.windowStart === windowStart);
  if (!existing) {
    return { allowed: true, buckets: [...fresh, { key, windowStart, hits: 1 }] };
  }
  if (existing.hits >= limit) return { allowed: false, buckets: fresh };
  return {
    allowed: true,
    buckets: fresh.map((bucket) =>
      bucket === existing ? { ...bucket, hits: bucket.hits + 1 } : bucket,
    ),
  };
}
