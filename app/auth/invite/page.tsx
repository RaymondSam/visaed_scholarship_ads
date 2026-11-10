import { PasswordTokenForm } from "@/components/account-forms";

export const metadata = { title: "Accept invite", robots: { index: false, follow: false } };

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <article>
      <h1 className="text-3xl font-semibold">Accept your invite</h1>
      <p className="mt-2 text-muted">Choose a password for the role that was assigned when the invite was created. The link cannot change that role.</p>
      {token ? <PasswordTokenForm token={token} mode="invite" /> : <p className="mt-4">This invite link is missing a token.</p>}
    </article>
  );
}
