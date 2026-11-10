import type { MetadataRoute } from "next";
import { getRepository } from "@/lib/data/local-store";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const staticPaths = ["", "/scholarships", "/about", "/how-it-works", "/faq", "/contact", "/privacy", "/terms", "/cookies", "/accessibility"];
  const listings = await getRepository().sitemapItems();
  return [
    ...staticPaths.map((path) => ({ url: `${origin}${path || "/"}` })),
    ...listings.map((item) => ({ url: `${origin}/scholarships/${item.slug}` })),
  ];
}
