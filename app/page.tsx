import Link from "next/link";
import { ScholarshipCard } from "@/components/scholarship-card";
import { primaryButtonClass } from "@/components/ui";
import { getRepository } from "@/lib/data/local-store";

export default async function HomePage() {
  const repository = getRepository();
  const [rails, open] = await Promise.all([repository.homeRails(), repository.listPublic({ view: "open", page: 1 })]);
  return (
    <div className="space-y-16">
      <section className="bleed relative -mt-8 min-h-[34rem] overflow-hidden text-white">
        <img src="/hero-campus.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_35%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/92 via-navy/80 to-navy/55" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-bright" aria-hidden="true" />
              Staff-checked catalog
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl leading-[1.02] text-white md:text-7xl">
              Find the deadline,
              <span className="block text-gold-bright">the funding &amp;</span>
              the last check.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
              Staff publish listings from the provider’s own materials. You read them here, then apply on the provider’s site. Looking is free.
            </p>
            <form action="/scholarships" className="mt-8 flex max-w-xl flex-col items-start gap-3 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="home-q">
                Search scholarships
              </label>
              <input
                id="home-q"
                name="q"
                placeholder="Subject, country, or provider"
                className="w-full rounded-lg border border-white/15 bg-white px-5 py-3 text-ink shadow-sm outline-none placeholder:text-muted focus:ring-4 focus:ring-gold-bright/40"
              />
              <button className={primaryButtonClass} type="submit">
                Search
              </button>
            </form>
            <p className="mt-5 text-sm text-white/75">
              <Link className="font-semibold text-gold-bright underline decoration-gold-bright/40 underline-offset-4" href="/how-it-works">
                How a listing gets onto this site
              </Link>
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-navy/40 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-bright">Open right now</p>
            <p className="mt-2 font-display text-6xl leading-none">{open.total}</p>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-white/85">
              <li>Prepared by staff, not scraped.</li>
              <li>Every public page shows when the facts were last checked.</li>
              <li>Missing amounts and nationality rules stay labeled, not guessed.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["01", "Search", "Filter by level, field, place, funding, and deadline."],
          ["02", "Read the checked facts", "Compare the provider, the award, who can apply, and when it closes."],
          ["03", "Apply with the provider", "Follow the official link. Applications inside Visaed come later."],
        ].map(([step, title, body]) => (
          <article key={title} className="rounded-3xl border border-line bg-card p-5 shadow-[0_16px_40px_-34px_rgb(20_34_31)]">
            <p className="font-display text-3xl text-gold">{step}</p>
            <h2 className="mt-3 text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </article>
        ))}
      </section>

      <Rail title="Featured" kicker="Selected by staff" empty="Featured programs will appear here once staff publish them." items={rails.featured} />
      <Rail title="Closing soon" kicker="Deadline inside 30 days" empty="No published programs close in the next 30 days." items={rails.closing} />
      <Rail title="Latest" kicker="Recently published" empty="New listings will show up here." items={rails.latest} />

      <section className="grid gap-8 rounded-[2rem] border border-line bg-card p-6 md:grid-cols-[1fr_1fr] md:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Before you apply</p>
          <h2 className="mt-3 text-4xl">A listing is not an award.</h2>
        </div>
        <dl className="space-y-5">
          <div>
            <dt className="font-semibold">Does it cost anything to use this site?</dt>
            <dd className="mt-1 text-muted">No. Viewing a listing and following an application link are free.</dd>
          </div>
          <div>
            <dt className="font-semibold">Does a listing mean I will get the scholarship?</dt>
            <dd className="mt-1 text-muted">No. A listing describes another organization’s program. The provider decides.</dd>
          </div>
          <p>
            <Link className="font-semibold text-teal underline decoration-teal/30 underline-offset-4" href="/faq">
              Read the FAQ
            </Link>
          </p>
        </dl>
      </section>

      <section className="bleed overflow-hidden bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="text-4xl text-white">Start with the catalog</h2>
            <p className="mt-2 max-w-xl text-white/80">Or tell us if a listing needs a correction.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/scholarships" className={primaryButtonClass}>
              Browse scholarships
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              Contact the team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Rail({
  title,
  kicker,
  empty,
  items,
}: {
  title: string;
  kicker: string;
  empty: string;
  items: Parameters<typeof ScholarshipCard>[0]["scholarship"][];
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{kicker}</p>
          <h2 className="mt-2 text-4xl">{title}</h2>
        </div>
        <Link href="/scholarships" className="text-sm font-semibold text-teal underline decoration-teal/30 underline-offset-4">
          All scholarships
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-line px-5 py-8 text-muted">{empty}</p>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ScholarshipCard key={item.id} scholarship={item} />
          ))}
        </div>
      )}
    </section>
  );
}
