export const metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <article className="legal-page max-w-3xl space-y-4">
      <h1 className="text-3xl font-semibold">Cookies</h1>
      <p className="text-sm text-muted">Last updated 10 November 2026</p>
      <p>This preview uses one cookie, <code>visaed_session</code>, to keep you signed in. It is strictly necessary for account pages and is not used for advertising.</p>
      <p>A short-lived cookie may also be set while a super admin confirms a sign-in code, and another short-lived cookie carries a form error back to the editor. Analytics cookies are not set. There is no cookie banner because there is nothing optional to accept.</p>
      <p>When analytics is added later, it will stay off until a person accepts it, and this page will list the new cookie before that tag is allowed to run.</p>
    </article>
  );
}
