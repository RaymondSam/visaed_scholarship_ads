import Link from "next/link";
import { countryName } from "@/lib/domain/countries";
import { displayStatus, fundingSummary } from "@/lib/domain/format";
import { formatInZone } from "@/lib/domain/time";
import { LEVEL_LABELS, type Scholarship } from "@/lib/domain/types";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "published"
      ? "bg-ok/10 text-ok"
      : status === "closed"
        ? "bg-gold-soft text-gold"
        : status === "draft"
          ? "bg-paper text-ink"
          : "bg-ink/10 text-muted";
  const label = status === "published" ? "Open" : status[0].toUpperCase() + status.slice(1);
  return <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${tone}`}>{label}</span>;
}

function Meta({ children }: { children: React.ReactNode }) {
  return <p className="flex items-start gap-2 text-sm leading-snug text-muted">{children}</p>;
}

export function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  const shown = displayStatus(scholarship);
  const deadline = scholarship.isRolling
    ? "Rolling deadline"
    : scholarship.deadlineAt && scholarship.deadlineTimezone
      ? formatInZone(scholarship.deadlineAt, scholarship.deadlineTimezone)
      : "Deadline not specified";
  return (
    <article className="lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-[0_16px_40px_-32px_rgb(20_34_31)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_50px_-28px_rgb(20_34_31)]">
      <div className={`h-1.5 ${scholarship.isFeatured ? "bg-gold" : "bg-teal"}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={shown} />
          {scholarship.isFeatured && shown === "published" ? (
            <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-teal">Featured</span>
          ) : null}
          {scholarship.isSponsored ? (
            <span className="rounded-full border border-ink/20 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]">Sponsored</span>
          ) : null}
        </div>
        <h2 className="mt-4 text-[1.45rem] leading-tight">
          <Link href={`/scholarships/${scholarship.slug}`} className="after:absolute after:inset-0">
            {scholarship.title}
          </Link>
        </h2>
        <p className="mt-2 text-sm font-medium text-teal-dark">{scholarship.providerName}</p>
        <div className="mt-5 space-y-2">
          <Meta>{fundingSummary(scholarship)}</Meta>
          <Meta>{deadline}</Meta>
          <Meta>
            {scholarship.isRemote ? "Remote" : countryName(scholarship.hostCountryCode)}
            {scholarship.studyLevels.length ? ` · ${scholarship.studyLevels.map((level) => LEVEL_LABELS[level]).join(", ")}` : ""}
          </Meta>
        </div>
        <p className="mt-auto pt-5 text-sm font-semibold text-teal">Read the listing</p>
      </div>
    </article>
  );
}
