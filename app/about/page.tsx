import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article>
      <PageHeader
        eyebrow="The catalog"
        title="About Visaed Scholarships"
        lede="A catalog of scholarship programs prepared by staff and published for students to read and share."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["Hand entered", "Staff write each listing from the provider’s public materials. Nothing is scraped into the catalog."],
          ["Checked facts", "Publishing asks for the official URL, the deadline, and confirmation that there is no upfront fee."],
          ["Plain gaps", "If a source leaves out an amount or a nationality rule, the page says so."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-line bg-card p-5">
            <h2 className="text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 max-w-3xl space-y-4 text-lg leading-relaxed text-muted">
        <p>The working name is Visaed Scholarships. The legal entity, address, and public brand are still to be confirmed before launch.</p>
        <p>A listing describes a program run by another organization. It is not an offer from this site, and it is not a promise that an applicant will be awarded funding.</p>
        <p>Whether featured placement will ever be paid for has not been decided. Until that decision is written down, this page does not claim that listings are never paid for, and it does not sell advertising.</p>
        <p>
          See a mistake?{" "}
          <Link className="font-semibold text-teal underline decoration-teal/30 underline-offset-4" href="/contact">
            Send a correction
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
