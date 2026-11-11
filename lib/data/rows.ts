import type { Scholarship } from "@/lib/domain/types";

export type ScholarshipFieldLink = { study_field_id: string };

export type ScholarshipRow = {
  id: string;
  slug: string | null;
  title: string;
  summary: string;
  description_markdown: string;
  eligibility_markdown: string;
  benefits_markdown: string;
  required_documents: string[] | null;
  provider_name: string;
  provider_url: string | null;
  application_url: string | null;
  application_mode: Scholarship["applicationMode"];
  status: Scholarship["status"];
  is_featured: boolean;
  is_sponsored: boolean;
  sponsor_disclosure: string | null;
  study_levels: Scholarship["studyLevels"] | null;
  funding_type: Scholarship["fundingType"];
  amount_min: number | string | null;
  amount_max: number | string | null;
  currency: string | null;
  funding_notes: string | null;
  host_country_code: string | null;
  is_remote: boolean;
  delivery_mode: Scholarship["deliveryMode"];
  open_to_all_nationalities: boolean;
  eligible_country_codes: string[] | null;
  deadline_at: string | null;
  deadline_timezone: string | null;
  is_rolling: boolean;
  cover_image_path: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  closed_at: string | null;
  last_verified_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  scholarship_study_fields?: ScholarshipFieldLink[] | null;
};

function trimmed(value: string | null | undefined): string | null {
  if (value == null) return null;
  const next = value.trim();
  return next ? next : null;
}

function money(value: number | string | null): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function coverExtFromPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const match = path.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!match) return null;
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  return ext === "jpg" || ext === "png" || ext === "webp" ? ext : null;
}

export function mapScholarship(row: ScholarshipRow): Scholarship {
  return {
    id: row.id,
    slug: row.slug ? row.slug.toLowerCase() : null,
    title: row.title ?? "",
    summary: row.summary ?? "",
    descriptionMarkdown: row.description_markdown ?? "",
    eligibilityMarkdown: row.eligibility_markdown ?? "",
    benefitsMarkdown: row.benefits_markdown ?? "",
    requiredDocuments: row.required_documents ?? [],
    providerName: row.provider_name ?? "",
    providerUrl: trimmed(row.provider_url),
    applicationUrl: trimmed(row.application_url),
    applicationMode: row.application_mode,
    status: row.status,
    isFeatured: row.is_featured,
    isSponsored: row.is_sponsored,
    sponsorDisclosure: trimmed(row.sponsor_disclosure),
    studyLevels: row.study_levels ?? [],
    fundingType: row.funding_type,
    amountMin: money(row.amount_min),
    amountMax: money(row.amount_max),
    currency: trimmed(row.currency),
    fundingNotes: trimmed(row.funding_notes),
    hostCountryCode: trimmed(row.host_country_code),
    isRemote: row.is_remote,
    deliveryMode: row.delivery_mode,
    openToAllNationalities: row.open_to_all_nationalities,
    eligibleCountryCodes: (row.eligible_country_codes ?? []).map((code) => code.trim()).filter(Boolean),
    deadlineAt: row.deadline_at,
    deadlineTimezone: trimmed(row.deadline_timezone),
    isRolling: row.is_rolling,
    coverExt: coverExtFromPath(row.cover_image_path),
    seoTitle: trimmed(row.seo_title),
    seoDescription: trimmed(row.seo_description),
    publishedAt: row.published_at,
    closedAt: row.closed_at,
    lastVerifiedAt: row.last_verified_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    studyFieldIds: (row.scholarship_study_fields ?? []).map((link) => link.study_field_id),
  };
}
