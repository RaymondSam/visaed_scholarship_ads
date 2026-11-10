import { PasswordTokenForm } from "@/components/account-forms";

export const metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <article>
      <h1 className="text-3xl font-semibold">Choose a new password</h1>
      {token ? <PasswordTokenForm token={token} mode="reset" /> : <p className="mt-4">This reset link is missing a token.</p>}
    </article>
  );
}
