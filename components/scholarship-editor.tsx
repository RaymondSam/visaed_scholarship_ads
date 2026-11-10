"use client";

import { useActionState } from "react";
import { saveScholarship, type ActionState } from "@/lib/actions";
import { TIMEZONES } from "@/lib/domain/time";
import {
  DELIVERY_LABELS,
  DELIVERY_MODES,
  FUNDING_LABELS,
  FUNDING_TYPES,
  LEVEL_LABELS,
  STUDY_FIELDS,
  STUDY_LEVELS,
  type InternalNote,
  type Scholarship,
} from "@/lib/domain/types";
import { utcToZonedLocalInput } from "@/lib/domain/time";

const field = "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-normal text-ink shadow-sm outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/10";

export function ScholarshipEditor({
  scholarship,
  internal,
}: {
  scholarship: Scholarship | null;
  internal: InternalNote | null;
}) {
  const [state, action, pending] = useActionState(saveScholarship, null as ActionState);
  const deadlineLocal =
    scholarship?.deadlineAt && scholarship.deadlineTimezone
      ? utcToZonedLocalInput(scholarship.deadlineAt, scholarship.deadlineTimezone)
      : "";
  const zones = scholarship?.deadlineTimezone && !TIMEZONES.includes(scholarship.deadlineTimezone)
    ? [scholarship.deadlineTimezone, ...TIMEZONES]
    : TIMEZONES;

  return (
    <form action={action} className="space-y-8">
      {scholarship ? <input type="hidden" name="id" value={scholarship.id} /> : null}
      {state?.errors?.length ? (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <p className="font-semibold">The listing was not published.</p>
          <ul className="mt-2 list-disc pl-5">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Basics</h2>
        <label className="block text-sm font-semibold">Title<input name="title" defaultValue={scholarship?.title ?? ""} className={field} /></label>
        <label className="block text-sm font-semibold">
          Slug
          <input name="slug" defaultValue={scholarship?.slug ?? ""} className={field} disabled={Boolean(scholarship?.publishedAt)} />
        </label>
        {scholarship?.publishedAt ? <p className="text-sm text-muted">The slug is locked because this listing has been published.</p> : <p className="text-sm text-muted">Leave blank to build a slug from the title. It locks on first publish.</p>}
        <label className="block text-sm font-semibold">
          Summary
          <textarea name="summary" rows={3} defaultValue={scholarship?.summary ?? ""} className={field} />
        </label>
        <p className="text-sm text-muted">40 to 280 characters are required to publish.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Provider</h2>
        <label className="block text-sm font-semibold">Provider name<input name="providerName" defaultValue={scholarship?.providerName ?? ""} className={field} /></label>
        <label className="block text-sm font-semibold">Provider URL<input name="providerUrl" defaultValue={scholarship?.providerUrl ?? ""} placeholder="https://" className={field} /></label>
        <label className="block text-sm font-semibold">
          Application mode
          <select name="applicationMode" defaultValue={scholarship?.applicationMode ?? "external"} className={field}>
            <option value="external">External application link</option>
            <option value="coming_soon">Applications on this site are not open</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">Application URL<input name="applicationUrl" defaultValue={scholarship?.applicationUrl ?? ""} placeholder="https://" className={field} /></label>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Description</h2>
        <label className="block text-sm font-semibold">Description<textarea name="descriptionMarkdown" rows={6} defaultValue={scholarship?.descriptionMarkdown ?? ""} className={field} /></label>
        <label className="block text-sm font-semibold">Eligibility<textarea name="eligibilityMarkdown" rows={4} defaultValue={scholarship?.eligibilityMarkdown ?? ""} className={field} /></label>
        <label className="block text-sm font-semibold">Benefits<textarea name="benefitsMarkdown" rows={4} defaultValue={scholarship?.benefitsMarkdown ?? ""} className={field} /></label>
        <label className="block text-sm font-semibold">
          Required documents
          <textarea name="requiredDocuments" rows={4} defaultValue={(scholarship?.requiredDocuments ?? []).join("\n")} className={field} />
        </label>
        <p className="text-sm text-muted">One document per line. Markdown is allowed in the longer fields. Raw HTML is stripped when the page is shown.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Who it is for</h2>
        <fieldset>
          <legend className="text-sm font-semibold">Study levels</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {STUDY_LEVELS.map((level) => (
              <label key={level} className="flex gap-2 text-sm">
                <input type="checkbox" name="studyLevels" value={level} defaultChecked={scholarship?.studyLevels.includes(level)} />
                {LEVEL_LABELS[level]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Fields of study</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {STUDY_FIELDS.map((item) => (
              <label key={item.id} className="flex gap-2 text-sm">
                <input type="checkbox" name="studyFieldIds" value={item.id} defaultChecked={scholarship?.studyFieldIds.includes(item.id)} />
                {item.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold">
          Delivery
          <select name="deliveryMode" defaultValue={scholarship?.deliveryMode ?? ""} className={field}>
            <option value="">Not specified</option>
            {DELIVERY_MODES.map((mode) => (
              <option key={mode} value={mode}>{DELIVERY_LABELS[mode]}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">Host country code<input name="hostCountryCode" defaultValue={scholarship?.hostCountryCode ?? ""} maxLength={2} placeholder="KE" className={field} /></label>
        <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="isRemote" defaultChecked={scholarship?.isRemote} /> Remote</label>
        <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="openToAllNationalities" defaultChecked={scholarship?.openToAllNationalities} /> Open to all nationalities</label>
        <label className="block text-sm font-semibold">
          Eligible country codes
          <input name="eligibleCountryCodes" defaultValue={(scholarship?.eligibleCountryCodes ?? []).join(", ")} placeholder="KE, UG, TZ" className={field} />
        </label>
        <p className="text-sm text-muted">Leave nationality blank if the source does not say. The public page will say it was not specified.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Funding and deadline</h2>
        <label className="block text-sm font-semibold">
          Funding type
          <select name="fundingType" defaultValue={scholarship?.fundingType ?? ""} className={field}>
            <option value="">Not specified</option>
            {FUNDING_TYPES.map((type) => (
              <option key={type} value={type}>{FUNDING_LABELS[type]}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">Minimum<input name="amountMin" defaultValue={scholarship?.amountMin ?? ""} inputMode="decimal" className={field} /></label>
          <label className="text-sm font-semibold">Maximum<input name="amountMax" defaultValue={scholarship?.amountMax ?? ""} inputMode="decimal" className={field} /></label>
          <label className="text-sm font-semibold">Currency<input name="currency" defaultValue={scholarship?.currency ?? ""} maxLength={3} placeholder="USD" className={field} /></label>
        </div>
        <label className="block text-sm font-semibold">Funding note<input name="fundingNotes" defaultValue={scholarship?.fundingNotes ?? ""} className={field} /></label>
        <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="isRolling" defaultChecked={scholarship?.isRolling} /> Rolling deadline</label>
        <label className="block text-sm font-semibold">Deadline<input type="datetime-local" name="deadlineLocal" defaultValue={deadlineLocal} className={field} /></label>
        <label className="block text-sm font-semibold">
          Deadline timezone
          <select name="deadlineTimezone" defaultValue={scholarship?.deadlineTimezone ?? "Africa/Nairobi"} className={field}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </label>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Search and placement</h2>
        <label className="block text-sm font-semibold">SEO title<input name="seoTitle" defaultValue={scholarship?.seoTitle ?? ""} className={field} /></label>
        <label className="block text-sm font-semibold">SEO description<textarea name="seoDescription" rows={2} defaultValue={scholarship?.seoDescription ?? ""} className={field} /></label>
        <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="isFeatured" defaultChecked={scholarship?.isFeatured} /> Feature on the home page</label>
        <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="isSponsored" defaultChecked={scholarship?.isSponsored} /> Sponsored placement</label>
        <label className="block text-sm font-semibold">Sponsor disclosure<textarea name="sponsorDisclosure" rows={2} defaultValue={scholarship?.sponsorDisclosure ?? ""} className={field} /></label>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Internal notes</h2>
        <label className="block text-sm font-semibold">Source notes<textarea name="sourceNotes" rows={3} defaultValue={internal?.sourceNotes ?? ""} className={field} /></label>
        <label className="block text-sm font-semibold">Editorial notes<textarea name="editorialNotes" rows={3} defaultValue={internal?.editorialNotes ?? ""} className={field} /></label>
        <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="upfrontFeeAbsentConfirmed" defaultChecked={internal?.upfrontFeeAbsentConfirmed} /> I confirm this program does not require an upfront payment from applicants</label>
        <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="verifiedToday" /> I verified this against the provider’s materials today</label>
      </section>
      <div className="flex flex-wrap gap-3">
        <button name="intent" value="save" disabled={pending} className="rounded-md border border-line bg-white px-4 py-2 font-semibold" type="submit">
          Save draft
        </button>
        <button name="intent" value="publish" disabled={pending} className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" type="submit">
          Publish
        </button>
      </div>
    </form>
  );
}
