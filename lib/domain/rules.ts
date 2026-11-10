import { isHttpsUrl, isPastDeadline, isValidSlug } from "@/lib/domain/format";
import { isValidTimeZone } from "@/lib/domain/time";
import {
  STUDY_LEVELS,
  type InternalNote,
  type Scholarship,
  type ScholarshipStatus,
} from "@/lib/domain/types";

export type ScholarshipDraft = {
  title: string;
  slug: string | null;
  summary: string;
  descriptionMarkdown: string;
  eligibilityMarkdown: string;
  benefitsMarkdown: string;
  requiredDocuments: string[];
  providerName: string;
  providerUrl: string | null;
  applicationUrl: string | null;
  applicationMode: Scholarship["applicationMode"];
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorDisclosure: string | null;
  studyLevels: Scholarship["studyLevels"];
  fundingType: Scholarship["fundingType"];
  amountMin: number | null;
  amountMax: number | null;
  currency: string | null;
  fundingNotes: string | null;
  hostCountryCode: string | null;
  isRemote: boolean;
  deliveryMode: Scholarship["deliveryMode"];
  openToAllNationalities: boolean;
  eligibleCountryCodes: string[];
  deadlineAt: string | null;
  deadlineTimezone: string | null;
  isRolling: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  studyFieldIds: string[];
  sourceNotes: string;
  editorialNotes: string;
  upfrontFeeAbsentConfirmed: boolean;
  verifiedToday: boolean;
};

export function publishBlockers(
  scholarship: Pick<
    Scholarship,
    | "slug"
    | "title"
    | "summary"
    | "descriptionMarkdown"
    | "providerName"
    | "providerUrl"
    | "applicationUrl"
    | "applicationMode"
    | "studyLevels"
    | "fundingType"
    | "amountMin"
    | "amountMax"
    | "currency"
    | "deadlineAt"
    | "deadlineTimezone"
    | "isRolling"
    | "isSponsored"
    | "sponsorDisclosure"
    | "lastVerifiedAt"
    | "studyFieldIds"
  >,
  internal: Pick<InternalNote, "upfrontFeeAbsentConfirmed"> | null,
): string[] {
  const errors: string[] = [];
  if (!scholarship.slug || !isValidSlug(scholarship.slug)) errors.push("Add a valid slug before publishing.");
  if (!scholarship.title.trim()) errors.push("Add a title.");
  const summaryLength = scholarship.summary.trim().length;
  if (summaryLength < 40 || summaryLength > 280) {
    errors.push("Write a summary between 40 and 280 characters.");
  }
  if (!scholarship.descriptionMarkdown.trim()) errors.push("Add a description.");
  if (!scholarship.providerName.trim() || !isHttpsUrl(scholarship.providerUrl)) {
    errors.push("Add the provider name and an https provider URL.");
  }
  if (scholarship.applicationMode === "external" && !isHttpsUrl(scholarship.applicationUrl)) {
    errors.push("An external application needs an https URL.");
  }
  if (scholarship.studyLevels.length < 1) errors.push("Choose at least one study level.");
  if (scholarship.studyFieldIds.length < 1) errors.push("Choose at least one field of study.");
  if (!scholarship.fundingType) errors.push("Choose a funding type.");
  if ((scholarship.amountMin != null || scholarship.amountMax != null) && !scholarship.currency) {
    errors.push("Add an ISO currency code when an amount is set.");
  }
  if (scholarship.amountMin != null && scholarship.amountMax != null && scholarship.amountMin > scholarship.amountMax) {
    errors.push("The minimum amount cannot be higher than the maximum.");
  }
  if (!scholarship.isRolling && (!scholarship.deadlineAt || !scholarship.deadlineTimezone)) {
    errors.push("Set a deadline and timezone, or mark the listing as rolling.");
  }
  if (scholarship.deadlineTimezone && !isValidTimeZone(scholarship.deadlineTimezone)) {
    errors.push("Choose a valid timezone.");
  }
  if (!scholarship.lastVerifiedAt) errors.push("Confirm that you checked this listing today.");
  if (scholarship.isSponsored && !scholarship.sponsorDisclosure?.trim()) {
    errors.push("A sponsored listing needs a public disclosure sentence.");
  }
  if (!internal?.upfrontFeeAbsentConfirmed) {
    errors.push("Confirm that applicants are not charged an upfront fee.");
  }
  return errors;
}

const ALLOWED: Record<ScholarshipStatus, ScholarshipStatus[]> = {
  draft: ["published", "archived"],
  published: ["draft", "closed", "archived"],
  closed: ["published", "archived"],
  archived: [],
};

export function canTransition(from: ScholarshipStatus, to: ScholarshipStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function draftShapeErrors(input: ScholarshipDraft): string[] {
  const errors: string[] = [];
  if (input.title.length > 180) errors.push("Title is too long.");
  if (input.summary.length > 280) errors.push("Summary is too long.");
  if (input.slug && !isValidSlug(input.slug)) {
    errors.push("Slug can use lowercase letters, numbers, and hyphens.");
  }
  if (input.amountMin != null && input.amountMin < 0) errors.push("Amounts cannot be negative.");
  if (input.amountMax != null && input.amountMax < 0) errors.push("Amounts cannot be negative.");
  if (input.amountMin != null && input.amountMax != null && input.amountMin > input.amountMax) {
    errors.push("The minimum amount cannot be higher than the maximum.");
  }
  if ((input.amountMin != null || input.amountMax != null) && input.currency && !/^[A-Z]{3}$/.test(input.currency)) {
    errors.push("Currency must be a three-letter ISO code.");
  }
  if (input.isRolling && input.deadlineAt) errors.push("A rolling listing cannot also have a deadline.");
  if (input.deadlineAt && !input.deadlineTimezone) errors.push("A deadline needs a timezone.");
  for (const level of input.studyLevels) {
    if (!STUDY_LEVELS.includes(level)) errors.push("A study level is not recognized.");
  }
  if (input.descriptionMarkdown.length > 20000) errors.push("Description is too long.");
  return errors;
}

export function isStaffRole(role: string | undefined): boolean {
  return role === "admin" || role === "super_admin";
}
