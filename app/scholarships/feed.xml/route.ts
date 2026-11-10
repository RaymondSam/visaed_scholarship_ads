import { getRepository } from "@/lib/data/local-store";
import { siteUrl } from "@/lib/site";

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function GET() {
  const items = await getRepository().feedItems();
  const origin = siteUrl();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Visaed Scholarships</title>
    <link>${origin}/scholarships</link>
    <description>Published scholarship listings.</description>
    ${items
      .map((item) => {
        const link = `${origin}/scholarships/${item.slug}`;
        return `<item><title>${escapeXml(item.title)}</title><link>${link}</link><guid>${link}</guid><description>${escapeXml(item.summary)}</description>${item.publishedAt ? `<pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>` : ""}</item>`;
      })
      .join("")}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
