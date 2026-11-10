import Link from "next/link";
import { ScholarshipCard } from "@/components/scholarship-card";
import { fieldClass, ghostButtonClass, PageHeader, primaryButtonClass } from "@/components/ui";
import { countryName } from "@/lib/domain/countries";
import { FUNDING_LABELS, FUNDING_TYPES, LEVEL_LABELS, STUDY_FIELDS, STUDY_LEVELS, type CatalogQuery } from "@/lib/domain/types";
import { getRepository } from "@/lib/data/local-store";

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function toQuery(params: Record<string, string | string[] | undefined>): CatalogQuery {
  const deadline = one(params, "deadline");
  const sort = one(params, "sort");
  const view = one(params, "view");
  return {
    q: one(params, "q") || undefined,
    level: one(params, "level") || undefined,
    field: one(params, "field") || undefined,
    country: one(params, "country") || undefined,
    remote: one(params, "remote") === "1",
    funding: one(params, "funding") || undefined,
    deadline: deadline === "7" || deadline === "30" || deadline === "90" || deadline === "rolling" ? deadline : "any",
    sort: sort === "newest" || sort === "featured" ? sort : "deadline",
    page: Number(one(params, "page") || "1"),
    view: view === "closed" ? "closed" : "open",
  };
}

export const metadata = { title: "Scholarships" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = toQuery(params);
  const result = await getRepository().listPublic(query);
  const countries = ["KE", "UG", "TZ", "GH", "DE", "FR", "GB", "US", "CA", "NG", "ZA"];
  const base = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const text = Array.isArray(value) ? value[0] : value;
    if (text && key !== "page") base.set(key, text);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Scholarships"
        lede="Open programs are shown first. Closed programs stay available when you ask for them."
      />
      <form action="/scholarships" className="mt-8 grid gap-4 rounded-[1.75rem] border border-line bg-card p-5 shadow-[0_16px_40px_-34px_rgb(20_34_31)] md:grid-cols-3">
        <label className="text-sm font-semibold">
          Keyword
          <input name="q" defaultValue={query.q ?? ""} className={fieldClass} />
        </label>
        <label className="text-sm font-semibold">
          Study level
          <select name="level" defaultValue={query.level ?? ""} className={fieldClass}>
            <option value="">Any</option>
            {STUDY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Field
          <select name="field" defaultValue={query.field ?? ""} className={fieldClass}>
            <option value="">Any</option>
            {STUDY_FIELDS.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Host country
          <select name="country" defaultValue={query.country ?? ""} className={fieldClass}>
            <option value="">Any</option>
            {countries.map((code) => (
              <option key={code} value={code}>
                {countryName(code)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Funding
          <select name="funding" defaultValue={query.funding ?? ""} className={fieldClass}>
            <option value="">Any</option>
            {FUNDING_TYPES.map((type) => (
              <option key={type} value={type}>
                {FUNDING_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Deadline
          <select name="deadline" defaultValue={query.deadline ?? "any"} className={fieldClass}>
            <option value="any">Any</option>
            <option value="7">Next 7 days</option>
            <option value="30">Next 30 days</option>
            <option value="90">Next 90 days</option>
            <option value="rolling">Rolling</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Sort
          <select name="sort" defaultValue={query.sort ?? "deadline"} className={fieldClass}>
            <option value="deadline">Deadline soonest</option>
            <option value="newest">Newest</option>
            <option value="featured">Featured first</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Status
          <select name="view" defaultValue={query.view ?? "open"} className={fieldClass}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="flex items-end gap-2 pb-3 text-sm font-semibold">
          <input type="checkbox" name="remote" value="1" defaultChecked={query.remote} className="h-4 w-4 accent-teal" />
          Remote only
        </label>
        <div className="flex items-end gap-3 md:col-span-3">
          <button className={primaryButtonClass} type="submit">
            Apply filters
          </button>
          <Link href="/scholarships" className={ghostButtonClass}>
            Clear
          </Link>
        </div>
      </form>
      <p className="mt-8 font-display text-3xl">
        {result.total} <span className="text-lg text-muted">{result.total === 1 ? "program" : "programs"}</span>
      </p>
      {result.items.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-line bg-card p-8">
          No scholarships match these filters.{" "}
          <Link className="font-semibold text-teal underline decoration-teal/30 underline-offset-4" href="/scholarships">
            Clear the filters
          </Link>
          .
        </p>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {result.items.map((item) => (
            <ScholarshipCard key={item.id} scholarship={item} />
          ))}
        </div>
      )}
      {result.pages > 1 ? (
        <nav className="mt-8 flex gap-2 text-sm" aria-label="Pagination">
          {Array.from({ length: result.pages }, (_, index) => {
            const page = index + 1;
            const search = new URLSearchParams(base);
            search.set("page", String(page));
            return (
              <Link
                key={page}
                href={`/scholarships?${search}`}
                className={page === result.page ? "grid h-10 w-10 place-items-center rounded-full bg-teal font-semibold text-white" : "grid h-10 w-10 place-items-center rounded-full border border-line bg-card font-semibold"}
                aria-current={page === result.page ? "page" : undefined}
              >
                {page}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
