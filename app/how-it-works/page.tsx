import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "How it works" };

const steps = [
  ["A person on staff prepares the listing", "The source is the provider’s own website or announcement."],
  ["The publish check has to pass", "The listing needs a provider name, an https link, a deadline or a rolling schedule, a funding type, and a confirmation that applicants are not asked for an upfront fee. The checker’s date is stored and shown on the page."],
  ["You continue on the provider’s site", "If the program is open and has an external application link, that is where you apply. Applications collected inside Visaed are planned for later and are not available yet."],
  ["Listings are checked again", "Published listings are reviewed about 90 days after the last check. Overdue listings stay visible and are flagged for staff, so a holiday does not empty the catalog."],
];

export default function HowItWorksPage() {
  return (
    <article>
      <PageHeader eyebrow="Process" title="How a listing is chosen, checked, and updated" lede="The public page is only as current as the last time a person confirmed it." />
      <ol className="mt-10 max-w-3xl space-y-4">
        {steps.map(([title, body], index) => (
          <li key={title} className="grid gap-4 rounded-3xl border border-line bg-card p-5 sm:grid-cols-[4rem_1fr]">
            <span className="font-display text-3xl text-teal">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="text-2xl">{title}</h2>
              <p className="mt-2 leading-relaxed text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-lg">
        If a fact is wrong, use the{" "}
        <Link className="font-semibold text-teal underline decoration-teal/30 underline-offset-4" href="/contact">
          correction form
        </Link>
        .
      </p>
    </article>
  );
}
