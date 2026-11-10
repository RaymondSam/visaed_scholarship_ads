import { describe, expect, it } from "vitest";
import { accountChangeError, registerHit } from "@/lib/domain/accounts";
import { fundingSummary, nationalitySummary } from "@/lib/domain/format";
import { filterCatalog } from "@/lib/domain/query";
import { publishBlockers } from "@/lib/domain/rules";
import { zonedLocalToUtc } from "@/lib/domain/time";
import type { Scholarship } from "@/lib/domain/types";

const now = new Date("2026-06-01T12:00:00.000Z");

function listing(overrides: Partial<Scholarship> = {}): Scholarship {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    slug: "sample",
    title: "Sample",
    summary: "A summary that is long enough to satisfy the publish rule for tests.",
    descriptionMarkdown: "Description",
    eligibilityMarkdown: "",
    benefitsMarkdown: "",
    requiredDocuments: [],
    providerName: "Example",
    providerUrl: "https://example.com",
    applicationUrl: "https://example.com/apply",
    applicationMode: "external",
    status: "published",
    isFeatured: false,
    isSponsored: false,
    sponsorDisclosure: null,
    studyLevels: ["bachelor"],
    fundingType: "partial",
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
    isRolling: true,
    coverExt: null,
    seoTitle: null,
    seoDescription: null,
    publishedAt: now.toISOString(),
    closedAt: null,
    lastVerifiedAt: now.toISOString(),
    createdBy: null,
    updatedBy: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    studyFieldIds: ["law"],
    ...overrides,
  };
}

describe("public copy", () => {
  it("does not invent an amount", () => {
    expect(fundingSummary({ amountMin: null, amountMax: null, currency: null, fundingType: "full" })).toBe(
      "Full funding · amount not specified",
    );
  });

  it("does not treat a missing nationality as open to everyone", () => {
    expect(nationalitySummary({ openToAllNationalities: false, eligibleCountryCodes: [] })).toMatch(/not specified/i);
    expect(nationalitySummary({ openToAllNationalities: true, eligibleCountryCodes: [] })).toMatch(/all nationalities/i);
  });
});

describe("deadlines", () => {
  it("converts Nairobi wall time to UTC", () => {
    const utc = zonedLocalToUtc("2026-06-01T12:00", "Africa/Nairobi");
    expect(utc?.toISOString()).toBe("2026-06-01T09:00:00.000Z");
  });
});

describe("catalog", () => {
  it("hides drafts and passed deadlines from the open view", () => {
    const items = [
      listing(),
      listing({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", slug: "draft", status: "draft" }),
      listing({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
        slug: "past",
        isRolling: false,
        deadlineAt: "2026-05-01T00:00:00.000Z",
        deadlineTimezone: "UTC",
      }),
    ];
    const open = filterCatalog(items, { view: "open" }, now);
    expect(open.map((item) => item.slug)).toEqual(["sample"]);
  });
});

describe("publish rules", () => {
  it("requires the fee confirmation", () => {
    const errors = publishBlockers(listing({ isRolling: false, deadlineAt: null }), { upfrontFeeAbsentConfirmed: false });
    expect(errors.some((error) => /upfront fee/i.test(error))).toBe(true);
  });
});

describe("accounts", () => {
  const profiles = [
    { id: "1", role: "super_admin" as const, status: "active" as const },
    { id: "2", role: "admin" as const, status: "active" as const },
  ];

  it("refuses to remove the last super admin", () => {
    expect(accountChangeError(profiles, profiles[0], profiles[0], "admin", "active")).toMatch(/last active super admin/i);
  });

  it("rejects a student caller", () => {
    expect(accountChangeError(profiles, { id: "3", role: "student", status: "active" }, profiles[1], "admin", "active")).toMatch(
      /do not have access/i,
    );
  });
});

describe("contact rate limit", () => {
  it("blocks the sixth hit in a window", () => {
    let buckets: { key: string; windowStart: string; hits: number }[] = [];
    for (let count = 0; count < 5; count += 1) {
      const result = registerHit(buckets, "ip", now);
      expect(result.allowed).toBe(true);
      buckets = result.buckets;
    }
    expect(registerHit(buckets, "ip", now).allowed).toBe(false);
  });
});
