import { countryName } from "@/lib/domain/countries";
import { FUNDING_LABELS, type FundingType } from "@/lib/domain/types";

type MoneyInput = {
  amountMin: number | null;
  amountMax: number | null;
  currency: string | null;
  fundingNotes?: string | null;
  fundingType?: FundingType | null;
};

export function formatAmount(input: MoneyInput): string | null {
  if (input.amountMin == null && input.amountMax == null) return null;
  if (!input.currency || !/^[A-Z]{3}$/.test(input.currency)) return null;
  const format = new Intl.NumberFormat("en", {
    style: "currency",
    currency: input.currency,
    maximumFractionDigits: 0,
  });
  if (input.amountMin != null && input.amountMax != null && input.amountMin !== input.amountMax) {
    return `${format.format(input.amountMin)}–${format.format(input.amountMax)}`;
  }
  if (input.amountMin != null && input.amountMax != null) return format.format(input.amountMin);
  if (input.amountMax != null) return `Up to ${format.format(input.amountMax)}`;
  if (input.amountMin != null) return `From ${format.format(input.amountMin)}`;
  return null;
}

export function fundingSummary(input: MoneyInput): string {
  const amount = formatAmount(input);
  const type = input.fundingType ? FUNDING_LABELS[input.fundingType] : null;
  if (type && amount) return `${type} · ${amount}`;
  if (amount) return amount;
  if (type) return `${type} · amount not specified`;
  return "Amount not specified";
}

export function nationalitySummary(input: {
  openToAllNationalities: boolean;
  eligibleCountryCodes: string[];
}): string {
  if (input.openToAllNationalities) {
    return "Open to all nationalities, according to the last check.";
  }
  if (input.eligibleCountryCodes.length > 0) {
    const names = input.eligibleCountryCodes.map((code) => countryName(code));
    return `Eligible nationalities: ${names.join(", ")}.`;
  }
  return "Eligibility by nationality was not specified. Check the provider before you apply.";
}

export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function isHttpsUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function hostnameOf(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

export function isPastDeadline(
  input: { isRolling: boolean; deadlineAt: string | null },
  now = new Date(),
): boolean {
  if (input.isRolling || !input.deadlineAt) return false;
  return new Date(input.deadlineAt).getTime() < now.getTime();
}

export function displayStatus<T extends { status: "draft" | "published" | "closed" | "archived"; isRolling: boolean; deadlineAt: string | null }>(
  input: T,
  now = new Date(),
): T["status"] {
  if (input.status === "published" && isPastDeadline(input, now)) return "closed";
  return input.status;
}

export function isEffectivelyOpen(
  input: { status: string; isRolling: boolean; deadlineAt: string | null },
  now = new Date(),
): boolean {
  return input.status === "published" && !isPastDeadline(input, now);
}

export function isPublicRecord(status: string): boolean {
  return status === "published" || status === "closed";
}
