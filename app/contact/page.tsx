import { ContactForm } from "@/components/contact-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Contact" };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div>
        <PageHeader
          eyebrow="Write to the team"
          title="Contact"
          lede="Use this form for corrections, privacy requests, partnership notes, and account requests. In this local preview the message is stored on this computer. It is not emailed until an inbox provider is connected."
        />
        <div className="mt-8 rounded-[1.75rem] border border-line bg-card p-5 shadow-[0_16px_40px_-34px_rgb(20_34_31)] md:p-7">
          <ContactForm initialReason={reason} />
        </div>
      </div>
      <aside className="rounded-[1.75rem] bg-pine p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">What to include</p>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/80">
          <li>The listing URL, if you are reporting a mistake.</li>
          <li>The mailbox on the account, if you are asking for access or deletion.</li>
          <li>Do not send an application essay here. Applications stay on the provider’s site.</li>
        </ul>
      </aside>
    </article>
  );
}
