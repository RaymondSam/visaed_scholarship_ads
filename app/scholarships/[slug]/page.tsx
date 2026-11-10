import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScholarshipView } from "@/components/scholarship-view";
import { displayStatus, formatAmount } from "@/lib/domain/format";
import { getRepository } from "@/lib/data/local-store";
import { siteUrl } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = await getRepository().getPublicBySlug(slug);
  if (!scholarship) return { title: "Not found" };
  const title = scholarship.seoTitle || scholarship.title;
  const description = scholarship.seoDescription || scholarship.summary;
  return {
    title,
    description,
    robots: displayStatus(scholarship) === "closed" && scholarship.status === "archived" ? { index: false } : undefined,
    openGraph: {
      title,
      description,
      url: `/scholarships/${slug}`,
      images: scholarship.coverExt ? [`/media/${scholarship.id}`] : undefined,
    },
  };
}

export default async function ScholarshipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scholarship = await getRepository().getPublicBySlug(slug);
  if (!scholarship) notFound();
  const related = await getRepository().related(scholarship.id);
  const amount = formatAmount(scholarship);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MonetaryGrant",
    name: scholarship.title,
    description: scholarship.summary,
    url: `${siteUrl()}/scholarships/${slug}`,
    funder: {
      "@type": "Organization",
      name: scholarship.providerName,
      url: scholarship.providerUrl ?? undefined,
    },
  };
  if (amount && scholarship.currency && scholarship.amountMin != null && scholarship.amountMax != null && scholarship.amountMin === scholarship.amountMax) {
    data.amount = { "@type": "MonetaryAmount", currency: scholarship.currency, value: scholarship.amountMin };
  }
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Scholarships", item: `${siteUrl()}/scholarships` },
      { "@type": "ListItem", position: 3, name: scholarship.title, item: `${siteUrl()}/scholarships/${slug}` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ScholarshipView scholarship={scholarship} related={related} />
    </>
  );
}
