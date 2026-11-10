import { siteUrl } from "@/lib/site";

export function GET() {
  const contact = process.env.SECURITY_EMAIL ?? "security@example.com";
  const body = `Contact: mailto:${contact}
Expires: 2027-11-10T00:00:00.000Z
Preferred-Languages: en
Canonical: ${siteUrl()}/.well-known/security.txt
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
