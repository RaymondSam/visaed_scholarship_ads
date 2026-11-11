import { redirect } from "next/navigation";
import { PasswordTokenForm } from "@/components/account-forms";
import { SupabasePasswordGate } from "@/components/auth-link";
import { isLocalMode } from "@/lib/site";

export const metadata = { title: "Accept invite", robots: { index: false, follow: false } };

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (!isLocalMode()) {
    const code = typeof params.code === "string" ? params.code : "";
    const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
    const type = typeof params.type === "string" ? params.type : "";
    if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/auth/invite`);
    if (tokenHash && type) {
      redirect(`/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=/auth/invite`);
    }
    return (
      <article>
        <h1 className="text-3xl font-semibold">Accept your invite</h1>
        <p className="mt-2 text-muted">Choose a password for the role that was assigned when the invite was created. The link cannot change that role.</p>
        <SupabasePasswordGate mode="invite" />
      </article>
    );
  }
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <article>
      <h1 className="text-3xl font-semibold">Accept your invite</h1>
      <p className="mt-2 text-muted">Choose a password for the role that was assigned when the invite was created. The link cannot change that role.</p>
      {token ? <PasswordTokenForm token={token} mode="invite" /> : <p className="mt-4">This invite link is missing a token.</p>}
    </article>
  );
}
