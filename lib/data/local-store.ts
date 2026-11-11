import "server-only";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { accountChangeError, registerHit } from "@/lib/domain/accounts";
import { isValidSlug, slugify } from "@/lib/domain/format";
import {
  closingSoon,
  filterCatalog,
  needsReview,
  paginate,
  relatedScholarships,
  sortCatalog,
} from "@/lib/domain/query";
import { canTransition, draftShapeErrors, publishBlockers, type ScholarshipDraft } from "@/lib/domain/rules";
import type {
  AccountStatus,
  AuditEntry,
  ContactMessage,
  ContactReason,
  Database,
  InternalNote,
  MailMessage,
  Profile,
  Scholarship,
  UserRole,
} from "@/lib/domain/types";
import { createSeedDatabase } from "@/lib/data/seed";
import { supabaseRepository } from "@/lib/data/supabase-store";
import { dataProvider } from "@/lib/site";

const ALLOWED_COVERS: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function dbFile(): string {
  return process.env.LOCAL_DB_PATH ?? path.join(process.cwd(), "data", "local-db.json");
}

function uploadRoot(): string {
  return process.env.LOCAL_UPLOAD_PATH ?? path.join(process.cwd(), "data", "uploads");
}

let queue: Promise<unknown> = Promise.resolve();

function load(): Database {
  try {
    noStore();
  } catch {
    // Unit tests and scripts can use the store outside a request.
  }
  const file = dbFile();
  if (!existsSync(/* turbopackIgnore: true */ file)) return createSeedDatabase();
  try {
    const parsed = JSON.parse(readFileSync(/* turbopackIgnore: true */ file, "utf8")) as Database;
    if (parsed.schemaVersion !== 1) return createSeedDatabase();
    return parsed;
  } catch {
    return createSeedDatabase();
  }
}

function persist(db: Database) {
  const file = dbFile();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(db, null, 2));
}

function withDb<T>(fn: (db: Database) => T): Promise<T> {
  const run = queue.then(() => {
    const db = load();
    const result = fn(db);
    persist(db);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 32).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const previous = Buffer.from(hash, "base64url");
  return next.length === previous.length && timingSafeEqual(next, previous);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

function id(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function audit(
  db: Database,
  entry: Omit<AuditEntry, "id" | "createdAt"> & { createdAt?: string },
) {
  db.audit.unshift({
    id: id(),
    createdAt: entry.createdAt ?? nowIso(),
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata,
  });
}

function publicProfile(profile: Profile) {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    fullName: profile.fullName,
    countryCode: profile.countryCode,
    educationLevel: profile.educationLevel,
    studyFieldIds: profile.studyFieldIds,
    invitedBy: profile.invitedBy,
    mfaEnabled: profile.mfaEnabled,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export type SessionProfile = ReturnType<typeof publicProfile> & { mfaSecret: string | null };

function sessionProfile(profile: Profile): SessionProfile {
  return { ...publicProfile(profile), mfaSecret: profile.mfaSecret };
}

function requireStaff(db: Database, actorId: string): Profile {
  const actor = db.profiles.find((profile) => profile.id === actorId);
  if (!actor || actor.status !== "active" || (actor.role !== "admin" && actor.role !== "super_admin")) {
    throw new Error("You do not have access.");
  }
  return actor;
}

function requireSuper(db: Database, actorId: string): Profile {
  const actor = db.profiles.find((profile) => profile.id === actorId);
  if (!actor || actor.status !== "active" || actor.role !== "super_admin") {
    throw new Error("You do not have access.");
  }
  return actor;
}

function mail(db: Database, message: Omit<MailMessage, "id" | "createdAt">) {
  db.mailbox.unshift({ id: id(), createdAt: nowIso(), ...message });
}

function uniqueSlug(db: Database, base: string, currentId: string): string {
  const root = base || "listing";
  let candidate = root;
  let n = 2;
  while (db.scholarships.some((item) => item.slug === candidate && item.id !== currentId)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}

function applyDraft(scholarship: Scholarship, internal: InternalNote, input: ScholarshipDraft, actorId: string, stamp: string) {
  const slugLocked = scholarship.publishedAt != null;
  const requestedSlug = input.slug?.trim() || slugify(input.title);
  scholarship.title = input.title;
  scholarship.summary = input.summary;
  scholarship.descriptionMarkdown = input.descriptionMarkdown;
  scholarship.eligibilityMarkdown = input.eligibilityMarkdown;
  scholarship.benefitsMarkdown = input.benefitsMarkdown;
  scholarship.requiredDocuments = input.requiredDocuments;
  scholarship.providerName = input.providerName;
  scholarship.providerUrl = input.providerUrl;
  scholarship.applicationUrl = input.applicationUrl;
  scholarship.applicationMode = input.applicationMode;
  scholarship.isSponsored = input.isSponsored;
  scholarship.sponsorDisclosure = input.sponsorDisclosure;
  scholarship.studyLevels = input.studyLevels;
  scholarship.fundingType = input.fundingType;
  scholarship.amountMin = input.amountMin;
  scholarship.amountMax = input.amountMax;
  scholarship.currency = input.currency;
  scholarship.fundingNotes = input.fundingNotes;
  scholarship.hostCountryCode = input.hostCountryCode;
  scholarship.isRemote = input.isRemote;
  scholarship.deliveryMode = input.deliveryMode;
  scholarship.openToAllNationalities = input.openToAllNationalities;
  scholarship.eligibleCountryCodes = input.eligibleCountryCodes;
  scholarship.deadlineAt = input.isRolling ? null : input.deadlineAt;
  scholarship.deadlineTimezone = input.deadlineAt ? input.deadlineTimezone : null;
  scholarship.isRolling = input.isRolling;
  scholarship.seoTitle = input.seoTitle;
  scholarship.seoDescription = input.seoDescription;
  scholarship.studyFieldIds = input.studyFieldIds;
  scholarship.updatedBy = actorId;
  scholarship.updatedAt = stamp;
  if (!slugLocked && requestedSlug && isValidSlug(requestedSlug)) {
    scholarship.slug = requestedSlug;
  }
  if (input.isFeatured && scholarship.status === "published") scholarship.isFeatured = true;
  if (!input.isFeatured) scholarship.isFeatured = false;
  internal.sourceNotes = input.sourceNotes;
  internal.editorialNotes = input.editorialNotes;
  internal.upfrontFeeAbsentConfirmed = input.upfrontFeeAbsentConfirmed;
  if (input.verifiedToday) {
    scholarship.lastVerifiedAt = stamp;
    internal.verifiedBy = actorId;
  }
}

export const localRepository = {
  async getProfileById(profileId: string) {
    return withDb((db) => {
      const profile = db.profiles.find((item) => item.id === profileId);
      return profile ? sessionProfile(profile) : null;
    });
  },

  async getProfileByEmail(email: string) {
    return withDb((db) => {
      const profile = db.profiles.find((item) => item.email.toLowerCase() === email.toLowerCase());
      if (!profile) return null;
      return { ...sessionProfile(profile), passwordHash: profile.passwordHash };
    });
  },

  async updateOwnProfile(
    profileId: string,
    input: { fullName: string; countryCode: string | null; educationLevel: Profile["educationLevel"]; studyFieldIds: string[] },
  ) {
    return withDb((db) => {
      const profile = db.profiles.find((item) => item.id === profileId && item.status === "active");
      if (!profile) throw new Error("Account not found.");
      profile.fullName = input.fullName.trim();
      profile.countryCode = input.countryCode;
      profile.educationLevel = input.educationLevel;
      profile.studyFieldIds = input.studyFieldIds;
      profile.updatedAt = nowIso();
      return publicProfile(profile);
    });
  },

  async acceptInvite(token: string, password: string) {
    return withDb((db) => {
      const tokenHash = hashToken(token);
      const profile = db.profiles.find((item) => item.inviteTokenHash === tokenHash);
      if (!profile || !profile.inviteExpires || new Date(profile.inviteExpires).getTime() < Date.now()) {
        throw new Error("This invite link is not valid. Ask a super admin to send a new one.");
      }
      if (password.length < 12) throw new Error("Use at least 12 characters.");
      profile.passwordHash = hashPassword(password);
      profile.inviteTokenHash = null;
      profile.inviteExpires = null;
      profile.status = "active";
      profile.updatedAt = nowIso();
      return sessionProfile(profile);
    });
  },

  async requestPasswordReset(email: string, origin: string) {
    return withDb((db) => {
      const profile = db.profiles.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.status === "active");
      if (!profile) return;
      const token = newToken();
      profile.resetTokenHash = hashToken(token);
      profile.resetExpires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      mail(db, {
        to: profile.email,
        subject: "Reset your Visaed Scholarships password",
        body: `Reset your password:\n${origin}/auth/reset?token=${token}\n\nIf you did not ask for this, you can ignore this message. The link expires in two hours.`,
      });
    });
  },

  async completePasswordReset(token: string, password: string) {
    return withDb((db) => {
      const profile = db.profiles.find((item) => item.resetTokenHash === hashToken(token));
      if (!profile || !profile.resetExpires || new Date(profile.resetExpires).getTime() < Date.now()) {
        throw new Error("This reset link is not valid.");
      }
      if (password.length < 12) throw new Error("Use at least 12 characters.");
      profile.passwordHash = hashPassword(password);
      profile.resetTokenHash = null;
      profile.resetExpires = null;
      profile.updatedAt = nowIso();
    });
  },

  async setMfa(profileId: string, secret: string | null, enabled: boolean) {
    return withDb((db) => {
      const profile = db.profiles.find((item) => item.id === profileId && item.status === "active");
      if (!profile) throw new Error("Account not found.");
      profile.mfaSecret = secret;
      profile.mfaEnabled = enabled;
      profile.updatedAt = nowIso();
    });
  },

  async listAccounts(actorId: string) {
    return withDb((db) => {
      requireSuper(db, actorId);
      return db.profiles
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(publicProfile);
    });
  },

  async inviteUser(actorId: string, input: { email: string; fullName: string; role: UserRole }, origin: string) {
    return withDb((db) => {
      const actor = requireSuper(db, actorId);
      const email = input.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
      if (!input.fullName.trim()) throw new Error("Enter the person's name.");
      if (db.profiles.some((item) => item.email.toLowerCase() === email)) {
        throw new Error("An account with that email already exists.");
      }
      const token = newToken();
      const profile: Profile = {
        id: id(),
        email,
        passwordHash: null,
        role: input.role,
        status: "invited",
        fullName: input.fullName.trim(),
        countryCode: null,
        educationLevel: null,
        studyFieldIds: [],
        invitedBy: actor.id,
        inviteTokenHash: hashToken(token),
        inviteExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        resetTokenHash: null,
        resetExpires: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.profiles.push(profile);
      mail(db, {
        to: email,
        subject: "You are invited to Visaed Scholarships",
        body: `${actor.fullName} invited you to Visaed Scholarships as a ${input.role.replaceAll("_", " ")}.\n\nSet your password:\n${origin}/auth/invite?token=${token}\n\nThis link expires in 7 days.`,
      });
      audit(db, {
        actorId: actor.id,
        action: "user.invited",
        entityType: "profile",
        entityId: profile.id,
        metadata: { role: input.role },
      });
    });
  },

  async resendInvite(actorId: string, targetId: string, origin: string) {
    return withDb((db) => {
      const actor = requireSuper(db, actorId);
      const profile = db.profiles.find((item) => item.id === targetId);
      if (!profile || profile.status !== "invited") throw new Error("That account is not waiting on an invite.");
      const token = newToken();
      profile.inviteTokenHash = hashToken(token);
      profile.inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      mail(db, {
        to: profile.email,
        subject: "Your Visaed Scholarships invite",
        body: `Set your password:\n${origin}/auth/invite?token=${token}\n\nThis link expires in 7 days.`,
      });
      audit(db, {
        actorId: actor.id,
        action: "user.invited",
        entityType: "profile",
        entityId: profile.id,
        metadata: { role: profile.role, resent: true },
      });
    });
  },

  async changeAccount(actorId: string, targetId: string, role: UserRole, status: AccountStatus) {
    return withDb((db) => {
      const actor = requireSuper(db, actorId);
      const target = db.profiles.find((item) => item.id === targetId);
      const error = accountChangeError(db.profiles, actor, target ?? null, role, status);
      if (error || !target) throw new Error(error ?? "Account not found.");
      const previous = { role: target.role, status: target.status };
      target.role = role;
      target.status = status;
      target.updatedAt = nowIso();
      const action =
        previous.role !== role
          ? "user.role_changed"
          : status === "suspended"
            ? "user.suspended"
            : previous.status === "suspended" && status === "active"
              ? "user.reactivated"
              : "user.updated";
      audit(db, {
        actorId: actor.id,
        action,
        entityType: "profile",
        entityId: target.id,
        metadata: { fromRole: previous.role, toRole: role, fromStatus: previous.status, toStatus: status },
      });
    });
  },

  async deleteAccount(actorId: string, targetId: string, confirmEmail: string) {
    return withDb((db) => {
      const actor = requireSuper(db, actorId);
      const target = db.profiles.find((item) => item.id === targetId);
      if (!target) throw new Error("Account not found.");
      if (target.email.toLowerCase() !== confirmEmail.trim().toLowerCase()) {
        throw new Error("Type the account email to confirm deletion.");
      }
      const lastSuperAdminError = accountChangeError(db.profiles, actor, target, "student", "suspended");
      if (target.role === "super_admin" && target.status === "active" && lastSuperAdminError) {
        throw new Error(lastSuperAdminError);
      }
      audit(db, {
        actorId: actor.id,
        action: "user.deleted",
        entityType: "profile",
        entityId: target.id,
        metadata: { role: target.role },
      });
      db.profiles = db.profiles.filter((item) => item.id !== target.id);
      for (const scholarship of db.scholarships) {
        if (scholarship.createdBy === target.id) scholarship.createdBy = null;
        if (scholarship.updatedBy === target.id) scholarship.updatedBy = null;
      }
    });
  },

  async listPublic(query: Parameters<typeof filterCatalog>[1]) {
    return withDb((db) => {
      const now = new Date();
      const filtered = sortCatalog(filterCatalog(db.scholarships, query, now), query.sort, now);
      return paginate(filtered, query.page);
    });
  },

  async getPublicBySlug(slug: string) {
    return withDb((db) => {
      const scholarship = db.scholarships.find((item) => item.slug === slug);
      if (!scholarship || (scholarship.status !== "published" && scholarship.status !== "closed")) return null;
      return scholarship;
    });
  },

  async related(scholarshipId: string) {
    return withDb((db) => {
      const current = db.scholarships.find((item) => item.id === scholarshipId);
      if (!current) return [];
      return relatedScholarships(db.scholarships, current);
    });
  },

  async listManaged(actorId: string, query: { status?: string; closing?: boolean; reviewDue?: boolean; closedThisMonth?: boolean }) {
    return withDb((db) => {
      requireStaff(db, actorId);
      const now = new Date();
      return db.scholarships
        .filter((item) => {
          if (query.status && item.status !== query.status) return false;
          if (query.closing && !closingSoon(item, 14, now)) return false;
          if (query.reviewDue && !needsReview(item, now)) return false;
          if (query.closedThisMonth) {
            if (!item.closedAt) return false;
            const closed = new Date(item.closedAt);
            if (closed.getUTCFullYear() !== now.getUTCFullYear() || closed.getUTCMonth() !== now.getUTCMonth()) return false;
          }
          return true;
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
  },

  async getManaged(actorId: string, scholarshipId: string) {
    return withDb((db) => {
      requireStaff(db, actorId);
      const scholarship = db.scholarships.find((item) => item.id === scholarshipId);
      if (!scholarship) return null;
      const internal = db.internals.find((item) => item.scholarshipId === scholarshipId) ?? {
        scholarshipId,
        sourceNotes: "",
        editorialNotes: "",
        upfrontFeeAbsentConfirmed: false,
        verifiedBy: null,
      };
      return { scholarship, internal };
    });
  },

  async saveScholarship(actorId: string, scholarshipId: string | null, input: ScholarshipDraft, publish: boolean) {
    return withDb((db) => {
      const actor = requireStaff(db, actorId);
      const shapeErrors = draftShapeErrors(input);
      if (shapeErrors.length) return { ok: false as const, errors: shapeErrors };
      const stamp = nowIso();
      let scholarship = scholarshipId ? db.scholarships.find((item) => item.id === scholarshipId) : undefined;
      let created = false;
      if (!scholarship) {
        created = true;
        scholarship = {
          id: id(),
          slug: null,
          title: "",
          summary: "",
          descriptionMarkdown: "",
          eligibilityMarkdown: "",
          benefitsMarkdown: "",
          requiredDocuments: [],
          providerName: "",
          providerUrl: null,
          applicationUrl: null,
          applicationMode: "external",
          status: "draft",
          isFeatured: false,
          isSponsored: false,
          sponsorDisclosure: null,
          studyLevels: [],
          fundingType: null,
          amountMin: null,
          amountMax: null,
          currency: null,
          fundingNotes: null,
          hostCountryCode: null,
          isRemote: false,
          deliveryMode: null,
          openToAllNationalities: false,
          eligibleCountryCodes: [],
          deadlineAt: null,
          deadlineTimezone: null,
          isRolling: false,
          coverExt: null,
          seoTitle: null,
          seoDescription: null,
          publishedAt: null,
          closedAt: null,
          lastVerifiedAt: null,
          createdBy: actor.id,
          updatedBy: actor.id,
          createdAt: stamp,
          updatedAt: stamp,
          studyFieldIds: [],
        };
        db.scholarships.push(scholarship);
        db.internals.push({
          scholarshipId: scholarship.id,
          sourceNotes: "",
          editorialNotes: "",
          upfrontFeeAbsentConfirmed: false,
          verifiedBy: null,
        });
      }
      if (scholarship.status === "archived") {
        return { ok: false as const, errors: ["Archived listings stay archived."], id: scholarship.id };
      }
      const internal = db.internals.find((item) => item.scholarshipId === scholarship!.id)!;
      applyDraft(scholarship, internal, input, actor.id, stamp);
      if (scholarship.slug) scholarship.slug = uniqueSlug(db, scholarship.slug, scholarship.id);
      audit(db, {
        actorId: actor.id,
        action: created ? "scholarship.created" : "scholarship.updated",
        entityType: "scholarship",
        entityId: scholarship.id,
        metadata: { titleChanged: true },
      });
      if (!publish) return { ok: true as const, id: scholarship.id, slug: scholarship.slug, published: false };
      const blockers = publishBlockers(scholarship, internal);
      if (!input.verifiedToday) blockers.unshift("Confirm that you checked this listing today.");
      if (blockers.length) return { ok: false as const, errors: blockers, id: scholarship.id };
      if (!canTransition(scholarship.status, "published") && scholarship.status !== "published") {
        return { ok: false as const, errors: ["This listing cannot be published from its current status."], id: scholarship.id };
      }
      const wasPublished = scholarship.status === "published";
      scholarship.status = "published";
      scholarship.publishedAt = stamp;
      scholarship.closedAt = null;
      if (!scholarship.isFeatured && input.isFeatured) scholarship.isFeatured = true;
      audit(db, {
        actorId: actor.id,
        action: "scholarship.published",
        entityType: "scholarship",
        entityId: scholarship.id,
        metadata: { fromStatus: wasPublished ? "published" : "draft", toStatus: "published" },
      });
      return { ok: true as const, id: scholarship.id, slug: scholarship.slug, published: true };
    });
  },

  async transition(actorId: string, scholarshipId: string, action: "unpublish" | "close" | "archive" | "feature" | "unfeature") {
    return withDb((db) => {
      const actor = requireStaff(db, actorId);
      const scholarship = db.scholarships.find((item) => item.id === scholarshipId);
      if (!scholarship) throw new Error("Listing not found.");
      const stamp = nowIso();
      if (action === "feature" || action === "unfeature") {
        if (scholarship.status !== "published") throw new Error("Only a published listing can be featured.");
        scholarship.isFeatured = action === "feature";
        scholarship.updatedAt = stamp;
        scholarship.updatedBy = actor.id;
        audit(db, {
          actorId: actor.id,
          action: "scholarship.updated",
          entityType: "scholarship",
          entityId: scholarship.id,
          metadata: { featured: scholarship.isFeatured },
        });
        return scholarship;
      }
      const nextStatus = action === "unpublish" ? "draft" : action === "close" ? "closed" : "archived";
      if (!canTransition(scholarship.status, nextStatus)) throw new Error("That status change is not allowed.");
      const from = scholarship.status;
      scholarship.status = nextStatus;
      scholarship.updatedAt = stamp;
      scholarship.updatedBy = actor.id;
      scholarship.isFeatured = false;
      if (nextStatus === "closed") scholarship.closedAt = stamp;
      const auditAction =
        nextStatus === "draft" ? "scholarship.unpublished" : nextStatus === "closed" ? "scholarship.closed" : "scholarship.archived";
      audit(db, {
        actorId: actor.id,
        action: auditAction,
        entityType: "scholarship",
        entityId: scholarship.id,
        metadata: { fromStatus: from, toStatus: nextStatus },
      });
      return scholarship;
    });
  },

  async dashboard(actorId: string) {
    return withDb((db) => {
      requireStaff(db, actorId);
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      return {
        drafts: db.scholarships.filter((item) => item.status === "draft").length,
        published: db.scholarships.filter((item) => item.status === "published").length,
        closing: db.scholarships.filter((item) => closingSoon(item, 14, now)).length,
        reviewDue: db.scholarships.filter((item) => needsReview(item, now)).length,
        closedThisMonth: db.scholarships.filter((item) => item.closedAt && item.closedAt >= monthStart).length,
        newInquiries: db.contacts.filter((item) => item.status === "new").length,
      };
    });
  },

  async closeExpired() {
    return withDb((db) => {
      const now = new Date();
      let count = 0;
      for (const scholarship of db.scholarships) {
        if (scholarship.status !== "published" || scholarship.isRolling || !scholarship.deadlineAt) continue;
        if (new Date(scholarship.deadlineAt).getTime() >= now.getTime()) continue;
        scholarship.status = "closed";
        scholarship.closedAt = now.toISOString();
        scholarship.isFeatured = false;
        scholarship.updatedAt = now.toISOString();
        count += 1;
        audit(db, {
          actorId: null,
          action: "scholarship.closed",
          entityType: "scholarship",
          entityId: scholarship.id,
          metadata: { source: "cron", fromStatus: "published", toStatus: "closed" },
        });
      }
      return count;
    });
  },

  async createContact(input: { name: string; email: string; reason: ContactReason; message: string; bucketKey: string }) {
    return withDb((db) => {
      const decision = registerHit(db.rateBuckets, input.bucketKey, new Date());
      db.rateBuckets = decision.buckets;
      if (!decision.allowed) return "limited" as const;
      const message: ContactMessage = {
        id: id(),
        name: input.name.trim(),
        email: input.email.trim(),
        reason: input.reason,
        message: input.message.trim(),
        status: "new",
        handledBy: null,
        readAt: null,
        createdAt: nowIso(),
      };
      db.contacts.unshift(message);
      return "stored" as const;
    });
  },

  async listContacts(actorId: string) {
    return withDb((db) => {
      requireStaff(db, actorId);
      return db.contacts;
    });
  },

  async setContactStatus(actorId: string, contactId: string, status: "read" | "closed") {
    return withDb((db) => {
      const actor = requireStaff(db, actorId);
      const contact = db.contacts.find((item) => item.id === contactId);
      if (!contact) throw new Error("Message not found.");
      contact.status = status;
      contact.handledBy = actor.id;
      if (status === "read") contact.readAt = nowIso();
      audit(db, {
        actorId: actor.id,
        action: status === "read" ? "contact.read" : "contact.closed",
        entityType: "contact_message",
        entityId: contact.id,
        metadata: {},
      });
    });
  },

  async listAudit(actorId: string) {
    return withDb((db) => {
      requireSuper(db, actorId);
      return db.audit.slice(0, 200);
    });
  },

  async listMailbox() {
    return withDb((db) => db.mailbox.slice(0, 50));
  },

  async saveCover(actorId: string, scholarshipId: string, ext: string, bytes: Buffer) {
    return withDb((db) => {
      requireStaff(db, actorId);
      const scholarship = db.scholarships.find((item) => item.id === scholarshipId);
      if (!scholarship) throw new Error("Listing not found.");
      if (!ALLOWED_COVERS[ext]) throw new Error("Use a JPEG, PNG, or WebP image.");
      if (bytes.length > 2 * 1024 * 1024) throw new Error("Images must be 2 MB or smaller.");
      const folder = path.join(/* turbopackIgnore: true */ uploadRoot(), scholarshipId);
      mkdirSync(folder, { recursive: true });
      for (const existing of Object.keys(ALLOWED_COVERS)) {
        rmSync(path.join(folder, `cover.${existing}`), { force: true });
      }
      writeFileSync(path.join(folder, `cover.${ext}`), bytes);
      scholarship.coverExt = ext;
      scholarship.updatedAt = nowIso();
      scholarship.updatedBy = actorId;
    });
  },

  readCover(scholarshipId: string, ext: string) {
    if (!/^[0-9a-f-]{36}$/i.test(scholarshipId) || !ALLOWED_COVERS[ext]) return null;
    const file = path.join(uploadRoot(), scholarshipId, `cover.${ext}`);
    if (!existsSync(file)) return null;
    return { bytes: readFileSync(file), contentType: ALLOWED_COVERS[ext] };
  },

  async resolveCover(scholarshipId: string) {
    for (const ext of ["webp", "png", "jpg", "jpeg"]) {
      const file = this.readCover(scholarshipId, ext);
      if (file) return { kind: "bytes" as const, bytes: file.bytes, contentType: file.contentType };
    }
    return null;
  },

  async homeRails() {
    return withDb((db) => {
      const now = new Date();
      const open = db.scholarships.filter((item) => item.status === "published" && !(item.deadlineAt && !item.isRolling && new Date(item.deadlineAt).getTime() < now.getTime()));
      return {
        featured: open.filter((item) => item.isFeatured).slice(0, 6),
        closing: open
          .filter((item) => closingSoon(item, 30, now))
          .sort((a, b) => (a.deadlineAt ?? "").localeCompare(b.deadlineAt ?? ""))
          .slice(0, 6),
        latest: [...open].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")).slice(0, 6),
      };
    });
  },

  async feedItems() {
    return withDb((db) => {
      const now = new Date();
      return db.scholarships
        .filter((item) => item.status === "published" && !(item.deadlineAt && !item.isRolling && new Date(item.deadlineAt).getTime() < now.getTime()))
        .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
    });
  },

  async sitemapItems() {
    return withDb((db) => {
      const now = new Date();
      return db.scholarships.filter(
        (item) => item.status === "published" && item.slug && !(item.deadlineAt && !item.isRolling && new Date(item.deadlineAt).getTime() < now.getTime()),
      );
    });
  },
};

export function getRepository() {
  if (dataProvider() === "supabase") return supabaseRepository;
  return localRepository;
}
