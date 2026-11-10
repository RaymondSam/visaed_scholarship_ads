import { DraftBanner } from "@/components/chrome";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article className="legal-page max-w-3xl space-y-4">
      <h1 className="text-3xl font-semibold">Terms of use</h1>
      <p className="text-sm text-muted">Last updated 10 November 2026</p>
      <DraftBanner />
      <p>These draft terms explain how the preview is meant to be used. They are not a finished contract, and they do not choose a governing law.</p>
      <p>The catalog describes third-party programs. It does not award scholarships and it does not guarantee that a listing is complete or that an application will succeed. Check the provider before you apply.</p>
      <p>This site does not charge a fee to read a listing or to follow an application link. Providers may set their own conditions.</p>
      <p>Accounts are personal and invitation-only. The baseline age for an account is 18. Sharing a password, or trying to reach staff tools without a staff role, is not allowed.</p>
      <p>Provider names belong to those providers. Original writing on this site belongs to the operator once the legal entity is confirmed.</p>
      <p>External links leave this site. The operator is not the provider’s website.</p>
    </article>
  );
}
