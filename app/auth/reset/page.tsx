import { redirect } from "next/navigation";
import { PasswordTokenForm } from "@/components/account-forms";
import { SupabasePasswordGate } from "@/components/auth-link";
import { isLocalMode } from "@/lib/site";

export const metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (!isLocalMode()) {
    const code = typeof params.code === "string" ? params.code : "";
    const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
    const type = typeof params.type === "string" ? params.type : "";
    if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/auth/reset`);
    if (tokenHash && type) {
      redirect(`/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=/auth/reset`);
    }
    return (
      <article>
        <h1 className="text-3xl font-semibold">Choose a new password</h1>
        <SupabasePasswordGate mode="reset" />
      </article>
    );
  }
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <article>
      <h1 className="text-3xl font-semibold">Choose a new password</h1>
      {token ? <PasswordTokenForm token={token} mode="reset" /> : <p className="mt-4">This reset link is missing a token.</p>}
    </article>
  );
}
