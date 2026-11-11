import { describe, expect, it } from "vitest";
import { coverExtFromPath, mapScholarship, type ScholarshipRow } from "@/lib/data/rows";

const row: ScholarshipRow = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "Example-Award",
  title: "Example",
  summary: "A summary that is long enough to satisfy the publish rule for tests.",
  description_markdown: "Body",
  eligibility_markdown: "",
  benefits_markdown: "",
  required_documents: ["Passport"],
  provider_name: "Example",
  provider_url: "https://example.com",
  application_url: null,
  application_mode: "external",
  status: "published",
  is_featured: false,
  is_sponsored: false,
  sponsor_disclosure: null,
  study_levels: ["master"],
  funding_type: "partial",
  amount_min: "1500.00",
  amount_max: null,
  currency: "USD ",
  funding_notes: null,
  host_country_code: "KE",
  is_remote: false,
  delivery_mode: null,
  open_to_all_nationalities: true,
  eligible_country_codes: [" KE "],
  deadline_at: null,
  deadline_timezone: null,
  is_rolling: true,
  cover_image_path: "scholarships/11111111-1111-4111-8111-111111111111/cover.jpeg",
  seo_title: null,
  seo_description: null,
  published_at: "2026-06-01T00:00:00.000Z",
  closed_at: null,
  last_verified_at: "2026-06-01T00:00:00.000Z",
  created_by: null,
  updated_by: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  scholarship_study_fields: [{ study_field_id: "law" }],
};

describe("scholarship rows", () => {
  it("maps database columns onto the catalog shape", () => {
    const scholarship = mapScholarship(row);
    expect(scholarship.slug).toBe("example-award");
    expect(scholarship.amountMin).toBe(1500);
    expect(scholarship.currency).toBe("USD");
    expect(scholarship.coverExt).toBe("jpg");
    expect(scholarship.studyFieldIds).toEqual(["law"]);
    expect(scholarship.eligibleCountryCodes).toEqual(["KE"]);
    expect(scholarship.descriptionMarkdown).toBe("Body");
  });

  it("reads the cover extension from a storage path", () => {
    expect(coverExtFromPath("scholarships/id/cover.png")).toBe("png");
    expect(coverExtFromPath(null)).toBeNull();
  });
});
