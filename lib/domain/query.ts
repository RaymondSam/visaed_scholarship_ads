import { isEffectivelyOpen, isPastDeadline } from "@/lib/domain/format";
import { PAGE_SIZE, reviewDueAt, type CatalogQuery, type Scholarship } from "@/lib/domain/types";

export function isOpenListing(scholarship: Scholarship, now = new Date()): boolean {
  return isEffectivelyOpen(scholarship, now);
}

export function isClosedListing(scholarship: Scholarship, now = new Date()): boolean {
  if (scholarship.status === "archived" || scholarship.status === "draft") return false;
  if (scholarship.status === "closed") return true;
  return scholarship.status === "published" && isPastDeadline(scholarship, now);
}

function matchesText(scholarship: Scholarship, q: string): boolean {
  const haystack = [
    scholarship.title,
    scholarship.summary,
    scholarship.providerName,
    scholarship.descriptionMarkdown,
  ]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function filterCatalog(items: Scholarship[], query: CatalogQuery, now = new Date()): Scholarship[] {
  const view = query.view === "closed" ? "closed" : "open";
  return items.filter((item) => {
    if (view === "open" && !isOpenListing(item, now)) return false;
    if (view === "closed" && !isClosedListing(item, now)) return false;
    if (query.q && !matchesText(item, query.q)) return false;
    if (query.level && !item.studyLevels.includes(query.level as Scholarship["studyLevels"][number])) return false;
    if (query.field && !item.studyFieldIds.includes(query.field)) return false;
    if (query.country && item.hostCountryCode !== query.country) return false;
    if (query.remote && !item.isRemote) return false;
    if (query.funding && item.fundingType !== query.funding) return false;
    if (query.deadline === "rolling" && !item.isRolling) return false;
    if (query.deadline === "7" || query.deadline === "30" || query.deadline === "90") {
      if (item.isRolling || !item.deadlineAt) return false;
      const ms = Number(query.deadline) * 24 * 60 * 60 * 1000;
      const when = new Date(item.deadlineAt).getTime();
      if (when < now.getTime() || when > now.getTime() + ms) return false;
    }
    return true;
  });
}

export function sortCatalog(items: Scholarship[], sort: CatalogQuery["sort"], now = new Date()): Scholarship[] {
  const copy = [...items];
  if (sort === "newest") {
    return copy.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  }
  if (sort === "featured") {
    return copy.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  }
  return copy.sort((a, b) => {
    const aRolling = a.isRolling || !a.deadlineAt;
    const bRolling = b.isRolling || !b.deadlineAt;
    if (aRolling && bRolling) return 0;
    if (aRolling) return 1;
    if (bRolling) return -1;
    return new Date(a.deadlineAt!).getTime() - new Date(b.deadlineAt!).getTime() || (now ? 0 : 0);
  });
}

export function paginate<T>(items: T[], page = 1): { items: T[]; total: number; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pages);
  const start = (current - 1) * PAGE_SIZE;
  return { items: items.slice(start, start + PAGE_SIZE), total: items.length, page: current, pages };
}

export function relatedScholarships(items: Scholarship[], current: Scholarship, now = new Date()): Scholarship[] {
  const open = items.filter((item) => item.id !== current.id && isOpenListing(item, now));
  const sameField = open.filter((item) => item.studyFieldIds.some((id) => current.studyFieldIds.includes(id)));
  const sameCountry = open.filter(
    (item) => current.hostCountryCode && item.hostCountryCode === current.hostCountryCode && !sameField.includes(item),
  );
  return [...sameField, ...sameCountry].slice(0, 3);
}

export function needsReview(scholarship: Scholarship, now = new Date()): boolean {
  if (scholarship.status !== "published") return false;
  const due = reviewDueAt(scholarship.lastVerifiedAt);
  if (!due) return true;
  return new Date(due).getTime() < now.getTime();
}

export function closingSoon(scholarship: Scholarship, days: number, now = new Date()): boolean {
  if (!isOpenListing(scholarship, now) || scholarship.isRolling || !scholarship.deadlineAt) return false;
  const when = new Date(scholarship.deadlineAt).getTime();
  return when <= now.getTime() + days * 24 * 60 * 60 * 1000;
}
