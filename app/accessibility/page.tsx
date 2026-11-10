import Link from "next/link";

export const metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <article className="legal-page max-w-3xl space-y-4">
      <h1 className="text-3xl font-semibold">Accessibility</h1>
      <p className="text-sm text-muted">Last updated 10 November 2026</p>
      <p>The target for the public site is WCAG 2.2 level AA. This statement will list known gaps after a keyboard and screen-reader pass of the home page, catalog, a listing, the contact form, and sign-in.</p>
      <p>Pages use text for status, not color alone. Filters and the contact form have visible labels. A skip link goes to the main content.</p>
      <p>
        If a page blocks you, <Link className="font-semibold text-teal underline" href="/contact">contact the team</Link> and describe the page and what you use to browse.
      </p>
    </article>
  );
}
