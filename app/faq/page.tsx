import { PageHeader } from "@/components/ui";
import { siteUrl } from "@/lib/site";

export const metadata = { title: "FAQ" };

const faqs = [
  ["Does it cost anything to use this site?", "No. Reading a listing and following an application link are free. This site does not collect an application fee."],
  ["Does a listing mean I will get the scholarship?", "No. The provider decides who receives the award. A listing is a description, not an offer from Visaed."],
  ["How do I apply?", "Use the provider link on the listing when the program is open. In-site applications are not available yet."],
  ["Why do some programs not show an amount or a nationality rule?", "If the source did not state it, the page says so. We do not fill the gap with “fully funded” or “open to everyone.”"],
  ["How do I get an account?", "Accounts are invitation-only. A super admin creates student and staff accounts. Use the contact form and choose “I need an account.”"],
  ["How do I report a program that looks like a scam?", "Contact us with the correction reason and include the listing URL. If anyone asks you to pay an upfront fee to apply, do not pay."],
  ["How do I ask you to fix or remove a listing?", "Use the contact form and choose “Correct or remove a listing.”"],
  ["Do you offer scholarships yourselves?", "This preview treats every listing as another organization’s program. Whether Visaed also awards its own funds is not decided."],
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader eyebrow="Questions" title="FAQ" lede={`Answers students and partners actually ask. Canonical site: ${siteUrl()}`} />
      <div className="mt-8 max-w-3xl space-y-3">
        {faqs.map(([question, answer]) => (
          <details key={question} className="faq-item rounded-3xl border border-line bg-card px-5 py-4">
            <summary className="flex cursor-pointer items-center gap-4 font-semibold">{question}</summary>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">{answer}</p>
          </details>
        ))}
      </div>
    </article>
  );
}
