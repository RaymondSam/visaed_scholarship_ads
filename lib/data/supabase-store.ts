import "server-only";
import type { User } from "@supabase/supabase-js";
import { registerHit } from "@/lib/domain/accounts";
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
  ContactReason,
  InternalNote,
  Scholarship,
  StudyLevel,
  UserRole,
} from "@/lib/domain/types";
import { revalidateScholarships } from "@/lib/data/cache";
import { mapScholarship, type ScholarshipRow } from "@/lib/data/rows";
import type { SessionProfile } from "@/lib/data/local-store";
import { notifyAuthLink, notifyContactInbox } from "@/lib/email/notify";
import { coverPublicUrl, requireSupabasePublicEnv } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";
import { createUserClient } from "@/lib/supabase/server";

const SCHOLARSHIP_COLUMNS = [
  "id",
  "slug",
  "title",
  "summary",
  "description_markdown",
  "eligibility_markdown",
  "benefits_markdown",
  "required_documents",
  "provider_name",
  "provider_url",
  "application_url",
  "application_mode",
  "status",
  "is_featured",
  "is_sponsored",
  "sponsor_disclosure",
  "study_levels",
  "funding_type",
  "amount_min",
  "amount_max",
  "currency",
  "funding_notes",
  "host_country_code",
  "is_remote",
  "delivery_mode",
  "open_to_all_nationalities",
  "eligible_country_codes",
  "deadline_at",
  "deadline_timezone",
  "is_rolling",
  "cover_image_path",
  "seo_title",
  "seo_description",
  "published_at",
  "closed_at",
  "last_verified_at",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at",
].join(", ");

const WITH_FIELDS = `${SCHOLARSHIP_COLUMNS}, scholarship_study_fields(study_field_id)`;

const COVER_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

type QueryError = { message: string; code?: string } | null;

function dbError(error: QueryError, fallback = "The change could not be saved."): Error {
  const message = error?.message ?? fallback;
  if (/duplicate key/i.test(message) && /slug/i.test(message)) return new Error("That slug is already in use.");
  if (/permission|not allowed|row-level security/i.test(message)) return new Error("You do not have access.");
  if (/violates|column |relation |syntax/i.test(message)) return new Error(fallback);
  return new Error(message || fallback);
}

function assertOk(error: QueryError, fallback?: string) {
  if (error) throw dbError(error, fallback);
}

async function requireSession(actorId: string, superOnly = false) {
  const supabase = await createUserClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || data.user.id !== actorId) throw new Error("You do not have access.");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, status, full_name")
    .eq("id", actorId)
    .maybeSingle();
  assertOk(error, "You do not have access.");
  const role = profile?.role as UserRole | undefined;
  const staff = role === "admin" || role === "super_admin";
  if (!profile || profile.status !== "active" || !staff || (superOnly && role !== "super_admin")) {
    throw new Error("You do not have access.");
  }
  return { supabase, profile: { id: profile.id as string, role, fullName: profile.full_name as string } };
}

async function visibleScholarships(): Promise<Scholarship[]> {
  const supabase = await createUserClient();
  const { data, error } = await supabase.from("scholarships").select(WITH_FIELDS).in("status", ["published", "closed"]);
  assertOk(error, "The catalog could not be loaded.");
  return ((data ?? []) as unknown as ScholarshipRow[]).map(mapScholarship);
}

async function managedScholarships(): Promise<Scholarship[]> {
  const supabase = await createUserClient();
  const { data, error } = await supabase.from("scholarships").select(WITH_FIELDS);
  assertOk(error, "The listings could not be loaded.");
  return ((data ?? []) as unknown as ScholarshipRow[]).map(mapScholarship);
}

function profileFromRow(
  row: {
    id: string;
    role: UserRole;
    status: AccountStatus;
    full_name: string;
    country_code: string | null;
    education_level: StudyLevel | null;
    invited_by: string | null;
    created_at: string;
    updated_at: string;
    profile_study_fields?: { study_field_id: string }[] | null;
  },
  email: string,
): SessionProfile {
  return {
    id: row.id,
    email,
    role: row.role,
    status: row.status,
    fullName: row.full_name,
    countryCode: row.country_code?.trim() || null,
    educationLevel: row.education_level,
    studyFieldIds: (row.profile_study_fields ?? []).map((link) => link.study_field_id),
    invitedBy: row.invited_by,
    mfaEnabled: false,
    mfaSecret: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findAuthUserByEmail(email: string): Promise<User | null> {
  const service = createServiceClient();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error("The account could not be looked up.");
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function inviteAuthUser(email: string, fullName: string, role: UserRole, origin: string): Promise<User> {
  const service = createServiceClient();
  const { url } = requireSupabasePublicEnv();
  const endpoint = new URL("/auth/v1/invite", url);
  endpoint.searchParams.set("redirect_to", `${origin}/auth/invite`);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, data: { full_name: fullName } }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { msg?: string; message?: string; error_description?: string } | null;
    const detail = body?.msg || body?.message || body?.error_description || "";
    if (/already|registered|exists/i.test(detail)) throw new Error("An account with that email already exists.");
    throw new Error("The invite could not be sent.");
  }
  const payload = (await response.json()) as { id?: string; user?: User };
  const userId = payload.id ?? payload.user?.id;
  if (!userId) throw new Error("The invite could not be sent.");
  const existing = payload.user ?? (await service.auth.admin.getUserById(userId)).data.user;
  if (!existing) throw new Error("The invite could not be sent.");
  const { error } = await service.auth.admin.updateUserById(existing.id, {
    app_metadata: { ...(existing.app_metadata ?? {}), role },
    user_metadata: { ...(existing.user_metadata ?? {}), full_name: fullName },
  });
  if (error) throw new Error("The invite could not be sent.");
  return { ...existing, app_metadata: { ...(existing.app_metadata ?? {}), role } };
}

function draftColumns(input: ScholarshipDraft, slug: string | null, actorId: string, verifiedAt: string | null) {
  return {
    slug,
    title: input.title,
    summary: input.summary,
    description_markdown: input.descriptionMarkdown,
    eligibility_markdown: input.eligibilityMarkdown,
    benefits_markdown: input.benefitsMarkdown,
    required_documents: input.requiredDocuments,
    provider_name: input.providerName,
    provider_url: input.providerUrl,
    application_url: input.applicationUrl,
    application_mode: input.applicationMode,
    is_sponsored: input.isSponsored,
    sponsor_disclosure: input.sponsorDisclosure,
    study_levels: input.studyLevels,
    funding_type: input.fundingType,
    amount_min: input.amountMin,
    amount_max: input.amountMax,
    currency: input.currency,
    funding_notes: input.fundingNotes,
    host_country_code: input.hostCountryCode,
    is_remote: input.isRemote,
    delivery_mode: input.deliveryMode,
    open_to_all_nationalities: input.openToAllNationalities,
    eligible_country_codes: input.eligibleCountryCodes,
    deadline_at: input.isRolling ? null : input.deadlineAt,
    deadline_timezone: input.deadlineAt && !input.isRolling ? input.deadlineTimezone : null,
    is_rolling: input.isRolling,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
    last_verified_at: verifiedAt,
    updated_by: actorId,
  };
}

export const supabaseRepository = {
  async getProfileById(profileId: string) {
    const supabase = await createUserClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, status, full_name, country_code, education_level, invited_by, created_at, updated_at, profile_study_fields(study_field_id)")
      .eq("id", profileId)
      .maybeSingle();
    assertOk(error, "The account could not be loaded.");
    if (!data) return null;
    const email = auth.user?.id === profileId ? (auth.user.email ?? "") : "";
    return profileFromRow(data as never, email);
  },

  async getProfileByEmail(email: string) {
    const user = await findAuthUserByEmail(email.trim().toLowerCase());
    if (!user) return null;
    const profile = await this.getProfileById(user.id);
    return profile ? { ...profile, email: user.email ?? email, passwordHash: null } : null;
  },

  async updateOwnProfile(
    profileId: string,
    input: { fullName: string; countryCode: string | null; educationLevel: StudyLevel | null; studyFieldIds: string[] },
  ) {
    const supabase = await createUserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || auth.user.id !== profileId) throw new Error("You do not have access.");
    const { data: account, error: accountError } = await supabase.from("profiles").select("status").eq("id", profileId).maybeSingle();
    assertOk(accountError, "Account not found.");
    if (!account || account.status !== "active") throw new Error("Account not found.");
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: input.fullName.trim(),
        country_code: input.countryCode,
        education_level: input.educationLevel,
      })
      .eq("id", profileId);
    assertOk(error, "The profile could not be saved.");
    const { error: clearError } = await supabase.from("profile_study_fields").delete().eq("profile_id", profileId);
    assertOk(clearError, "The profile could not be saved.");
    if (input.studyFieldIds.length) {
      const { error: insertError } = await supabase.from("profile_study_fields").insert(
        input.studyFieldIds.map((studyFieldId) => ({ profile_id: profileId, study_field_id: studyFieldId })),
      );
      assertOk(insertError, "The profile could not be saved.");
    }
    const profile = await this.getProfileById(profileId);
    if (!profile) throw new Error("Account not found.");
    return profile;
  },

  async acceptInvite(_token: string, _password: string): Promise<SessionProfile> {
    throw new Error("Open the invite link and choose a password while that session is active.");
  },

  async requestPasswordReset(email: string, origin: string) {
    const supabase = await createUserClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` });
  },

  async completePasswordReset(_token: string, _password: string) {
    throw new Error("Open the reset link from your email, then choose a password.");
  },

  async setMfa(_profileId: string, _secret: string | null, _enabled: boolean) {
    throw new Error("Use the authenticator enrollment on the security page.");
  },

  async listAccounts(actorId: string) {
    await requireSession(actorId, true);
    const service = createServiceClient();
    const { data, error } = await service.rpc("list_accounts", { actor: actorId });
    assertOk(error, "The directory could not be loaded.");
    return ((data ?? []) as {
      id: string;
      email: string;
      full_name: string;
      role: UserRole;
      status: AccountStatus;
      invited_by: string | null;
      created_at: string;
    }[]).map((row) =>
      profileFromRow(
        {
          id: row.id,
          role: row.role,
          status: row.status,
          full_name: row.full_name,
          country_code: null,
          education_level: null,
          invited_by: row.invited_by,
          created_at: row.created_at,
          updated_at: row.created_at,
        },
        row.email,
      ),
    );
  },

  async inviteUser(actorId: string, input: { email: string; fullName: string; role: UserRole }, origin: string) {
    await requireSession(actorId, true);
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (!fullName) throw new Error("Enter the person's name.");
    if (!["super_admin", "admin", "student"].includes(input.role)) throw new Error("Choose a role.");
    if (await findAuthUserByEmail(email)) throw new Error("An account with that email already exists.");

    const user = await inviteAuthUser(email, fullName, input.role, origin);
    const service = createServiceClient();
    const { data: existing } = await service.from("profiles").select("id, status").eq("id", user.id).maybeSingle();
    if (existing && existing.status !== "invited") throw new Error("An account with that email already exists.");
    if (!existing) {
      const { error } = await service.from("profiles").insert({
        id: user.id,
        role: input.role,
        status: "invited",
        full_name: fullName,
      });
      assertOk(error, "The invite could not be sent.");
    }
    const { error } = await service.rpc("mark_invited_by", { actor: actorId, target: user.id });
    assertOk(error, "The invite could not be sent.");
  },

  async resendInvite(actorId: string, targetId: string, origin: string) {
    await requireSession(actorId, true);
    const service = createServiceClient();
    const { data: profile, error } = await service.from("profiles").select("id, status, role, full_name").eq("id", targetId).maybeSingle();
    assertOk(error, "That account is not waiting on an invite.");
    if (!profile || profile.status !== "invited") throw new Error("That account is not waiting on an invite.");
    const { data: userData, error: userError } = await service.auth.admin.getUserById(targetId);
    if (userError || !userData.user?.email) throw new Error("That account is not waiting on an invite.");
    const email = userData.user.email;
    const link = await service.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo: `${origin}/auth/invite`, data: { full_name: profile.full_name } },
    });
    if (link.error || !link.data.properties?.action_link) throw new Error("The invite could not be sent.");
    const sent = await notifyAuthLink({
      to: email,
      subject: "Your Visaed Scholarships invite",
      body: `Set your password:\n${link.data.properties.action_link}\n\nIf you did not expect this, you can ignore the message.`,
    });
    await service.from("audit_logs").insert({
      actor_id: actorId,
      action: "user.invited",
      entity_type: "profile",
      entity_id: targetId,
      metadata: { role: profile.role, resent: true },
    });
    if (!sent) {
      throw new Error("Email is not configured, so the invite was not resent. Set RESEND_API_KEY and EMAIL_FROM, or send a new invite.");
    }
  },

  async changeAccount(actorId: string, targetId: string, role: UserRole, status: AccountStatus) {
    await requireSession(actorId, true);
    const service = createServiceClient();
    const { data: previous, error: readError } = await service.from("profiles").select("status").eq("id", targetId).maybeSingle();
    assertOk(readError, "The account could not be changed.");
    if (!previous) throw new Error("Account not found.");
    if (status === "suspended" && previous.status !== "suspended") {
      const banned = await service.auth.admin.updateUserById(targetId, { ban_duration: "876000h" });
      if (banned.error) throw new Error("The account could not be changed.");
    }
    const { error } = await service.rpc("apply_account_change", {
      actor: actorId,
      target: targetId,
      new_role: role,
      new_status: status,
    });
    if (error) {
      if (status === "suspended" && previous.status !== "suspended") {
        await service.auth.admin.updateUserById(targetId, { ban_duration: "none" });
      }
      throw dbError(error, "The account could not be changed.");
    }
    if (previous.status === "suspended" && status === "active") {
      const cleared = await service.auth.admin.updateUserById(targetId, { ban_duration: "none" });
      if (cleared.error) throw new Error("The account is active, but the sign-in ban could not be cleared.");
    }
  },

  async deleteAccount(actorId: string, targetId: string, confirmEmail: string) {
    await requireSession(actorId, true);
    const service = createServiceClient();
    const { data: userData, error: userError } = await service.auth.admin.getUserById(targetId);
    if (userError || !userData.user?.email) throw new Error("Account not found.");
    if (userData.user.email.toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      throw new Error("Type the account email to confirm deletion.");
    }
    const { data: target, error: targetError } = await service.from("profiles").select("role, status").eq("id", targetId).maybeSingle();
    assertOk(targetError, "The account could not be deleted.");
    if (!target) throw new Error("Account not found.");
    if (target.role === "super_admin" && target.status === "active") {
      const { count, error: countError } = await service
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "super_admin")
        .eq("status", "active")
        .neq("id", targetId);
      assertOk(countError, "The account could not be deleted.");
      if ((count ?? 0) === 0) throw new Error("The last active super admin cannot be removed.");
    }
    const { error: auditError } = await service.from("audit_logs").insert({
      actor_id: actorId,
      action: "user.deleted",
      entity_type: "profile",
      entity_id: targetId,
      metadata: { role: target.role },
    });
    assertOk(auditError, "The account could not be deleted.");
    const removed = await service.auth.admin.deleteUser(targetId);
    if (removed.error) throw new Error("The account could not be deleted.");
  },

  async listPublic(query: Parameters<typeof filterCatalog>[1]) {
    const now = new Date();
    const filtered = sortCatalog(filterCatalog(await visibleScholarships(), query, now), query.sort, now);
    return paginate(filtered, query.page);
  },

  async getPublicBySlug(slug: string) {
    const supabase = await createUserClient();
    const { data, error } = await supabase.from("scholarships").select(WITH_FIELDS).eq("slug", slug).maybeSingle();
    assertOk(error, "The listing could not be loaded.");
    if (!data) return null;
    const scholarship = mapScholarship(data as unknown as ScholarshipRow);
    if (scholarship.status !== "published" && scholarship.status !== "closed") return null;
    return scholarship;
  },

  async related(scholarshipId: string) {
    const items = await visibleScholarships();
    const current = items.find((item) => item.id === scholarshipId);
    if (!current) return [];
    return relatedScholarships(items, current);
  },

  async listManaged(actorId: string, query: { status?: string; closing?: boolean; reviewDue?: boolean; closedThisMonth?: boolean }) {
    await requireSession(actorId);
    const now = new Date();
    return (await managedScholarships())
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
  },

  async getManaged(actorId: string, scholarshipId: string) {
    const { supabase } = await requireSession(actorId);
    const { data, error } = await supabase.from("scholarships").select(WITH_FIELDS).eq("id", scholarshipId).maybeSingle();
    assertOk(error, "The listing could not be loaded.");
    if (!data) return null;
    const { data: internal, error: internalError } = await supabase
      .from("scholarship_internal")
      .select("scholarship_id, source_notes, editorial_notes, upfront_fee_absent_confirmed, verified_by")
      .eq("scholarship_id", scholarshipId)
      .maybeSingle();
    assertOk(internalError, "The listing could not be loaded.");
    const note: InternalNote = {
      scholarshipId,
      sourceNotes: internal?.source_notes ?? "",
      editorialNotes: internal?.editorial_notes ?? "",
      upfrontFeeAbsentConfirmed: internal?.upfront_fee_absent_confirmed ?? false,
      verifiedBy: internal?.verified_by ?? null,
    };
    return { scholarship: mapScholarship(data as unknown as ScholarshipRow), internal: note };
  },

  async saveScholarship(actorId: string, scholarshipId: string | null, input: ScholarshipDraft, publish: boolean) {
    const shapeErrors = draftShapeErrors(input);
    if (shapeErrors.length) return { ok: false as const, errors: shapeErrors };
    const { supabase } = await requireSession(actorId);
    let id = scholarshipId;
    let current: ScholarshipRow | null = null;
    if (id) {
      const { data, error } = await supabase.from("scholarships").select(WITH_FIELDS).eq("id", id).maybeSingle();
      assertOk(error);
      current = (data as unknown as ScholarshipRow | null) ?? null;
    }
    if (current?.status === "archived") {
      return { ok: false as const, errors: ["Archived listings stay archived."], id: current.id };
    }

    const requested = input.slug?.trim() || slugify(input.title);
    let slug = current?.published_at ? current.slug : requested && isValidSlug(requested) ? requested : current?.slug ?? null;
    if (slug && !current?.published_at) {
      let suffix = 2;
      const root = slug;
      while (suffix < 50) {
        const { data: clash } = await supabase.from("scholarships").select("id").eq("slug", slug).maybeSingle();
        if (!clash || clash.id === id) break;
        slug = `${root}-${suffix}`;
        suffix += 1;
      }
    }

    const verifiedAt = input.verifiedToday ? new Date().toISOString() : (current?.last_verified_at ?? null);
    const columns = draftColumns(input, slug, actorId, verifiedAt);

    if (!current) {
      const { data, error } = await supabase
        .from("scholarships")
        .insert({ ...columns, status: "draft", is_featured: false, created_by: actorId })
        .select("id")
        .single();
      assertOk(error);
      if (!data?.id) throw new Error("The listing could not be saved.");
      id = data.id as string;
    } else {
      const { error } = await supabase
        .from("scholarships")
        .update({ ...columns, is_featured: current.status === "published" ? input.isFeatured : false })
        .eq("id", current.id);
      assertOk(error);
      id = current.id;
    }

    const { error: clearError } = await supabase.from("scholarship_study_fields").delete().eq("scholarship_id", id);
    assertOk(clearError);
    if (input.studyFieldIds.length) {
      const { error: fieldError } = await supabase.from("scholarship_study_fields").insert(
        input.studyFieldIds.map((studyFieldId) => ({ scholarship_id: id, study_field_id: studyFieldId })),
      );
      assertOk(fieldError);
    }
    const note: {
      scholarship_id: string;
      source_notes: string;
      editorial_notes: string;
      upfront_fee_absent_confirmed: boolean;
      verified_by?: string;
    } = {
      scholarship_id: id!,
      source_notes: input.sourceNotes,
      editorial_notes: input.editorialNotes,
      upfront_fee_absent_confirmed: input.upfrontFeeAbsentConfirmed,
    };
    if (input.verifiedToday) note.verified_by = actorId;
    const { error: noteError } = await supabase.from("scholarship_internal").upsert(note);
    assertOk(noteError);

    if (!publish) {
      revalidateScholarships();
      return { ok: true as const, id: id!, slug, published: false };
    }

    const blockers = publishBlockers(
      {
        ...input,
        slug,
        studyFieldIds: input.studyFieldIds,
        lastVerifiedAt: verifiedAt,
        deadlineAt: input.isRolling ? null : input.deadlineAt,
      },
      { upfrontFeeAbsentConfirmed: input.upfrontFeeAbsentConfirmed },
    );
    if (!input.verifiedToday) blockers.unshift("Confirm that you checked this listing today.");
    if (blockers.length) return { ok: false as const, errors: blockers, id };
    const previousStatus = current?.status ?? "draft";
    if (previousStatus !== "published" && !canTransition(previousStatus, "published")) {
      return { ok: false as const, errors: ["This listing cannot be published from its current status."], id };
    }
    const { error: publishError } = await supabase
      .from("scholarships")
      .update({ status: "published", is_featured: input.isFeatured })
      .eq("id", id);
    if (publishError) return { ok: false as const, errors: [dbError(publishError).message], id };
    revalidateScholarships();
    return { ok: true as const, id: id!, slug, published: true };
  },

  async transition(actorId: string, scholarshipId: string, action: "unpublish" | "close" | "archive" | "feature" | "unfeature") {
    const { supabase } = await requireSession(actorId);
    const { data, error } = await supabase.from("scholarships").select("id, status").eq("id", scholarshipId).maybeSingle();
    assertOk(error, "Listing not found.");
    if (!data) throw new Error("Listing not found.");
    if (action === "feature" || action === "unfeature") {
      if (data.status !== "published") throw new Error("Only a published listing can be featured.");
      const { error: featureError } = await supabase.from("scholarships").update({ is_featured: action === "feature" }).eq("id", scholarshipId);
      assertOk(featureError, "The listing could not be updated.");
      revalidateScholarships();
      return;
    }
    const nextStatus = action === "unpublish" ? "draft" : action === "close" ? "closed" : "archived";
    if (!canTransition(data.status as Scholarship["status"], nextStatus)) throw new Error("That status change is not allowed.");
    const { error: transitionError } = await supabase.from("scholarships").update({ status: nextStatus }).eq("id", scholarshipId);
    assertOk(transitionError, "The listing could not be updated.");
    revalidateScholarships();
  },

  async dashboard(actorId: string) {
    await requireSession(actorId);
    const items = await managedScholarships();
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const supabase = await createUserClient();
    const { count, error } = await supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new");
    assertOk(error, "The dashboard could not be loaded.");
    return {
      drafts: items.filter((item) => item.status === "draft").length,
      published: items.filter((item) => item.status === "published").length,
      closing: items.filter((item) => closingSoon(item, 14, now)).length,
      reviewDue: items.filter((item) => needsReview(item, now)).length,
      closedThisMonth: items.filter((item) => item.closedAt && item.closedAt >= monthStart).length,
      newInquiries: count ?? 0,
    };
  },

  async closeExpired() {
    const service = createServiceClient();
    const { data, error } = await service.rpc("close_expired_scholarships");
    assertOk(error, "Expired listings could not be closed.");
    await service.rpc("purge_rate_limit_buckets");
    revalidateScholarships();
    return typeof data === "number" ? data : 0;
  },

  async createContact(input: { name: string; email: string; reason: ContactReason; message: string; bucketKey: string }) {
    const service = createServiceClient();
    const now = new Date();
    const { data: rows, error: readError } = await service
      .from("rate_limit_buckets")
      .select("bucket_key, window_start, hit_count")
      .eq("bucket_key", input.bucketKey);
    assertOk(readError, "The message could not be saved.");
    const decision = registerHit(
      (rows ?? []).map((row) => ({
        key: row.bucket_key as string,
        windowStart: new Date(row.window_start as string).toISOString(),
        hits: row.hit_count as number,
      })),
      input.bucketKey,
      now,
    );
    if (!decision.allowed) return "limited" as const;
    const current = decision.buckets.find((bucket) => bucket.key === input.bucketKey);
    if (current) {
      const { error: bucketError } = await service.from("rate_limit_buckets").upsert({
        bucket_key: current.key,
        window_start: current.windowStart,
        hit_count: current.hits,
      });
      assertOk(bucketError, "The message could not be saved.");
    }
    const { error } = await service.from("contact_messages").insert({
      name: input.name.trim(),
      email: input.email.trim(),
      reason: input.reason,
      message: input.message.trim(),
    });
    assertOk(error, "The message could not be saved.");
    try {
      await notifyContactInbox(input);
    } catch {
      console.error("contact notification failed");
    }
    return "stored" as const;
  },

  async listContacts(actorId: string) {
    const { supabase } = await requireSession(actorId);
    const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    assertOk(error, "Messages could not be loaded.");
    return (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      reason: row.reason as ContactReason,
      message: row.message as string,
      status: row.status as "new" | "read" | "closed",
      handledBy: (row.handled_by as string | null) ?? null,
      readAt: (row.read_at as string | null) ?? null,
      createdAt: row.created_at as string,
    }));
  },

  async setContactStatus(actorId: string, contactId: string, status: "read" | "closed") {
    const { supabase } = await requireSession(actorId);
    const patch: { status: "read" | "closed"; handled_by: string; read_at?: string } = {
      status,
      handled_by: actorId,
    };
    if (status === "read") patch.read_at = new Date().toISOString();
    const { data, error } = await supabase.from("contact_messages").update(patch).eq("id", contactId).select("id").maybeSingle();
    assertOk(error, "The message could not be updated.");
    if (!data) throw new Error("Message not found.");
    const service = createServiceClient();
    await service.from("audit_logs").insert({
      actor_id: actorId,
      action: status === "read" ? "contact.read" : "contact.closed",
      entity_type: "contact_message",
      entity_id: contactId,
      metadata: {},
    });
  },

  async listAudit(actorId: string) {
    const { supabase } = await requireSession(actorId, true);
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    assertOk(error, "The audit log could not be loaded.");
    return (data ?? []).map((row) => ({
      id: row.id as string,
      actorId: (row.actor_id as string | null) ?? null,
      action: row.action as string,
      entityType: row.entity_type as string,
      entityId: (row.entity_id as string | null) ?? null,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.created_at as string,
    }));
  },

  async listMailbox() {
    return [];
  },

  async resolveCover(scholarshipId: string) {
    if (!/^[0-9a-f-]{36}$/i.test(scholarshipId)) return null;
    const supabase = await createUserClient();
    const { data, error } = await supabase.from("scholarships").select("cover_image_path").eq("id", scholarshipId).maybeSingle();
    if (error || !data?.cover_image_path) return null;
    return { kind: "redirect" as const, url: coverPublicUrl(data.cover_image_path as string) };
  },

  async saveCover(actorId: string, scholarshipId: string, ext: string, bytes: Buffer) {
    const { supabase } = await requireSession(actorId);
    const contentType = COVER_TYPES[ext];
    if (!contentType) throw new Error("Use a JPEG, PNG, or WebP image.");
    if (bytes.length > 2 * 1024 * 1024) throw new Error("Images must be 2 MB or smaller.");
    const { data: existing, error } = await supabase.from("scholarships").select("id, cover_image_path").eq("id", scholarshipId).maybeSingle();
    assertOk(error, "Listing not found.");
    if (!existing) throw new Error("Listing not found.");
    const objectPath = `scholarships/${scholarshipId}/cover.${ext === "jpeg" ? "jpg" : ext}`;
    const { error: uploadError } = await supabase.storage.from("scholarship-media").upload(objectPath, bytes, {
      contentType,
      upsert: true,
    });
    if (uploadError) throw new Error("The image could not be saved.");
    const previous = existing.cover_image_path as string | null;
    if (previous && previous !== objectPath) {
      await supabase.storage.from("scholarship-media").remove([previous]);
    }
    const { error: pathError } = await supabase.from("scholarships").update({ cover_image_path: objectPath }).eq("id", scholarshipId);
    assertOk(pathError, "The image could not be saved.");
    revalidateScholarships();
  },

  async homeRails() {
    const now = new Date();
    const open = (await visibleScholarships()).filter(
      (item) => item.status === "published" && !(item.deadlineAt && !item.isRolling && new Date(item.deadlineAt).getTime() < now.getTime()),
    );
    return {
      featured: open.filter((item) => item.isFeatured).slice(0, 6),
      closing: open
        .filter((item) => closingSoon(item, 30, now))
        .sort((a, b) => (a.deadlineAt ?? "").localeCompare(b.deadlineAt ?? ""))
        .slice(0, 6),
      latest: [...open].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")).slice(0, 6),
    };
  },

  async feedItems() {
    const now = new Date();
    return (await visibleScholarships())
      .filter((item) => item.status === "published" && !(item.deadlineAt && !item.isRolling && new Date(item.deadlineAt).getTime() < now.getTime()))
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  },

  async sitemapItems() {
    const now = new Date();
    return (await visibleScholarships()).filter(
      (item) => item.status === "published" && item.slug && !(item.deadlineAt && !item.isRolling && new Date(item.deadlineAt).getTime() < now.getTime()),
    );
  },
};
