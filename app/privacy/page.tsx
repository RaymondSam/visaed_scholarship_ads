import { DraftBanner } from "@/components/chrome";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="legal-page max-w-3xl space-y-4">
      <h1 className="text-3xl font-semibold">Privacy</h1>
      <p className="text-sm text-muted">Last updated 10 November 2026</p>
      <DraftBanner />
      <p>This draft describes the local preview and the processors planned for production. It is not the final notice.</p>
      <h2 className="text-xl font-semibold">Who is responsible</h2>
      <p>The legal name and address are not confirmed. Until they are, do not treat this page as naming a controller.</p>
      <h2 className="text-xl font-semibold">What this preview stores</h2>
      <p>On this computer the app stores account names, email addresses, password hashes, optional profile details, scholarship listings, contact messages, and an audit log in a local file. Sample accounts and sample listings are fictional.</p>
      <h2 className="text-xl font-semibold">What production is expected to store</h2>
      <p>Account data in Supabase Auth, listings and messages in Supabase Postgres, cover images in Supabase Storage, and the site on Vercel. Transactional email will use a provider on a domain the organization controls. Analytics is off.</p>
      <h2 className="text-xl font-semibold">Accounts</h2>
      <p>The baseline is that account holders are 18 or older. Date of birth is not collected. Public pages may still describe programs for younger students.</p>
      <h2 className="text-xl font-semibold">Retention</h2>
      <p>The intended production baseline is to keep contact messages and the audit log for 24 months, and to delete an account when the person asks. In this preview, deleting the local database file removes the data on this machine.</p>
      <h2 className="text-xl font-semibold">Requests</h2>
      <p>Use the contact form and choose “Privacy request” to ask for a copy or deletion. A person still has to verify that the mailbox matches the account.</p>
    </article>
  );
}
