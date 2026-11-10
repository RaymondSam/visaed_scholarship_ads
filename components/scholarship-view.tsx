import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { DeadlineFacts, ShareBar } from "@/components/listing-extras";
import { StatusBadge } from "@/components/scholarship-card";
import { primaryButtonClass } from "@/components/ui";
import { countryName } from "@/lib/domain/countries";
import { displayStatus, fundingSummary, hostnameOf, nationalitySummary } from "@/lib/domain/format";
import { DELIVERY_LABELS, LEVEL_LABELS, STUDY_FIELDS, type Scholarship } from "@/lib/domain/types";

export function ScholarshipView({
  scholarship,
  related,
  preview = false,
}: {
  scholarship: Scholarship;
  related: Scholarship[];
  preview?: boolean;
}) {
  const shown = displayStatus(scholarship);
  const fields = STUDY_FIELDS.filter((field) => scholarship.studyFieldIds.includes(field.id)).map((field) => field.name);
  const checked = scholarship.lastVerifiedAt
    ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(scholarship.lastVerifiedAt))
    : null;
  return (
    <article>
      {preview ? (
        <p className="mb-4 rounded-2xl border border-gold/30 bg-gold-soft px-4 py-3 text-sm text-gold">
          Staff preview. This page is not public and should not be indexed.
        </p>
      ) : null}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-teal">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/scholarships" className="hover:text-teal">
          Scholarships
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{scholarship.title}</span>
      </nav>
      <div className="mt-6 overflow-hidden rounded-[2rem] border border-line bg-card shadow-[0_20px_50px_-40px_rgb(20_34_31)]">
        {scholarship.coverExt ? (
          // Local uploads are served from this app, not a remote optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/media/${scholarship.id}`} alt="" className="max-h-96 w-full object-cover" />
        ) : (
          <div className="h-28 bg-gradient-to-r from-pine via-teal-dark to-teal" />
        )}
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={shown} />
            {scholarship.isFeatured && shown === "published" ? (
              <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-teal">Featured</span>
            ) : null}
            {scholarship.isSponsored ? (
              <span className="rounded-full border border-ink/20 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]">Sponsored</span>
            ) : null}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] md:text-5xl">{scholarship.title}</h1>
          <p className="mt-3 text-lg text-teal-dark">{scholarship.providerName}</p>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink/90">{scholarship.summary}</p>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-10">
          <section>
            <h2 className="text-3xl">About this program</h2>
            <Markdown source={scholarship.descriptionMarkdown} />
          </section>
          {scholarship.eligibilityMarkdown ? (
            <section>
              <h2 className="text-3xl">Eligibility</h2>
              <Markdown source={scholarship.eligibilityMarkdown} />
            </section>
          ) : null}
          {scholarship.benefitsMarkdown ? (
            <section>
              <h2 className="text-3xl">Benefits</h2>
              <Markdown source={scholarship.benefitsMarkdown} />
            </section>
          ) : null}
          {scholarship.requiredDocuments.length ? (
            <section>
              <h2 className="text-3xl">Documents the provider asks for</h2>
              <ul className="mt-4 grid gap-2">
                {scholarship.requiredDocuments.map((document) => (
                  <li key={document} className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
                    {document}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <aside className="h-fit rounded-[1.75rem] border border-line bg-card p-5 shadow-[0_18px_40px_-32px_rgb(20_34_31)] lg:sticky lg:top-24">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Key facts</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {scholarship.isRolling ? (
              <Fact label="Deadline" value="Rolling" />
            ) : scholarship.deadlineAt && scholarship.deadlineTimezone ? (
              <DeadlineFacts iso={scholarship.deadlineAt} timeZone={scholarship.deadlineTimezone} />
            ) : (
              <Fact label="Deadline" value="Not specified" />
            )}
            <Fact label="Funding" value={fundingSummary(scholarship)} />
            <Fact label="Study level" value={scholarship.studyLevels.map((level) => LEVEL_LABELS[level]).join(", ") || "Not specified"} />
            <Fact label="Fields" value={fields.join(", ") || "Not specified"} />
            <Fact label="Delivery" value={scholarship.deliveryMode ? DELIVERY_LABELS[scholarship.deliveryMode] : "Not specified"} />
            <Fact
              label="Location"
              value={[
                scholarship.isRemote ? "Remote" : null,
                scholarship.hostCountryCode ? countryName(scholarship.hostCountryCode) : scholarship.isRemote ? null : "Not specified",
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            <Fact label="Nationality" value={nationalitySummary(scholarship)} />
            {checked ? <Fact label="Information checked" value={checked} /> : null}
          </dl>
          <div className="mt-5 border-t border-line pt-5">
            {shown === "closed" ? (
              <p className="text-sm font-semibold">
                This program is closed
                {scholarship.closedAt ? ` as of ${new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(scholarship.closedAt))}` : ""}.
              </p>
            ) : scholarship.applicationMode === "coming_soon" ? (
              <p className="text-sm">Applications through this site are not open for this program.</p>
            ) : null}
            {scholarship.applicationUrl && shown !== "closed" ? (
              <p className="mt-3">
                <a className={`${primaryButtonClass} w-full`} href={scholarship.applicationUrl} target="_blank" rel="noopener noreferrer">
                  Apply on the provider’s site
                </a>
                <span className="mt-2 block text-sm text-muted">You will leave this site for {hostnameOf(scholarship.applicationUrl)}.</span>
              </p>
            ) : null}
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Visaed Scholarships does not charge a fee to view a listing or to follow an application link. The provider’s site is a separate organization. If a page asks you to pay an upfront fee to apply, stop and tell us.
            </p>
            {scholarship.isSponsored && scholarship.sponsorDisclosure ? (
              <p className="mt-3 rounded-2xl bg-gold-soft px-3 py-2 text-sm text-gold">
                <span className="font-semibold">Sponsored. </span>
                {scholarship.sponsorDisclosure}
              </p>
            ) : null}
          </div>
          {!preview && scholarship.slug ? (
            <div className="mt-4">
              <ShareBar title={scholarship.title} path={`/scholarships/${scholarship.slug}`} />
            </div>
          ) : null}
        </aside>
      </div>
      {related.length ? (
        <section className="mt-14">
          <h2 className="text-3xl">Related programs</h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <Link href={`/scholarships/${item.slug}`} className="lift block h-full rounded-3xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-teal">
                  <span className="font-display text-xl">{item.title}</span>
                  <span className="mt-2 block text-sm text-muted">{item.providerName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 leading-snug">{value}</dd>
    </div>
  );
}
