import { normalizeCountryCode, parseCountryList } from "@/lib/domain/countries";
import {
  APPLICATION_MODES,
  DELIVERY_MODES,
  FUNDING_TYPES,
  STUDY_FIELDS,
  STUDY_LEVELS,
} from "@/lib/domain/types";
import type { ScholarshipDraft } from "@/lib/domain/rules";
import { zonedLocalToUtc } from "@/lib/domain/time";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullable(value: string): string | null {
  return value ? value : null;
}

function money(value: string): number | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function scholarshipFromForm(formData: FormData): ScholarshipDraft {
  const studyLevels = formData
    .getAll("studyLevels")
    .map(String)
    .filter((level): level is ScholarshipDraft["studyLevels"][number] =>
      STUDY_LEVELS.includes(level as ScholarshipDraft["studyLevels"][number]),
    );
  const studyFieldIds = formData
    .getAll("studyFieldIds")
    .map(String)
    .filter((fieldId) => STUDY_FIELDS.some((field) => field.id === fieldId));
  const isRolling = formData.get("isRolling") === "on";
  const timezone = nullable(text(formData, "deadlineTimezone"));
  const localDeadline = text(formData, "deadlineLocal");
  const deadline = !isRolling && localDeadline && timezone ? zonedLocalToUtc(localDeadline, timezone) : null;
  const mode = text(formData, "applicationMode");
  const delivery = text(formData, "deliveryMode");
  const funding = text(formData, "fundingType");

  return {
    title: text(formData, "title"),
    slug: nullable(text(formData, "slug").toLowerCase()),
    summary: text(formData, "summary"),
    descriptionMarkdown: text(formData, "descriptionMarkdown"),
    eligibilityMarkdown: text(formData, "eligibilityMarkdown"),
    benefitsMarkdown: text(formData, "benefitsMarkdown"),
    requiredDocuments: text(formData, "requiredDocuments")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    providerName: text(formData, "providerName"),
    providerUrl: nullable(text(formData, "providerUrl")),
    applicationUrl: nullable(text(formData, "applicationUrl")),
    applicationMode: APPLICATION_MODES.includes(mode as ScholarshipDraft["applicationMode"])
      ? (mode as ScholarshipDraft["applicationMode"])
      : "external",
    isFeatured: formData.get("isFeatured") === "on",
    isSponsored: formData.get("isSponsored") === "on",
    sponsorDisclosure: nullable(text(formData, "sponsorDisclosure")),
    studyLevels,
    fundingType: (FUNDING_TYPES as readonly string[]).includes(funding)
      ? (funding as ScholarshipDraft["fundingType"])
      : null,
    amountMin: money(text(formData, "amountMin")),
    amountMax: money(text(formData, "amountMax")),
    currency: nullable(text(formData, "currency").toUpperCase()),
    fundingNotes: nullable(text(formData, "fundingNotes")),
    hostCountryCode: normalizeCountryCode(text(formData, "hostCountryCode")),
    isRemote: formData.get("isRemote") === "on",
    deliveryMode: (DELIVERY_MODES as readonly string[]).includes(delivery)
      ? (delivery as ScholarshipDraft["deliveryMode"])
      : null,
    openToAllNationalities: formData.get("openToAllNationalities") === "on",
    eligibleCountryCodes: parseCountryList(text(formData, "eligibleCountryCodes")),
    deadlineAt: deadline ? deadline.toISOString() : null,
    deadlineTimezone: timezone,
    isRolling,
    seoTitle: nullable(text(formData, "seoTitle")),
    seoDescription: nullable(text(formData, "seoDescription")),
    studyFieldIds,
    sourceNotes: text(formData, "sourceNotes"),
    editorialNotes: text(formData, "editorialNotes"),
    upfrontFeeAbsentConfirmed: formData.get("upfrontFeeAbsentConfirmed") === "on",
    verifiedToday: formData.get("verifiedToday") === "on",
  };
}
