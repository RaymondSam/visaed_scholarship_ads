import { redirect } from "next/navigation";
import { beginMfa, confirmMfa, takeNotice } from "@/lib/actions";
import { currentProfile } from "@/lib/auth/current";
import { totpFor } from "@/lib/auth/totp";

export const metadata = { title: "Security", robots: { index: false, follow: false } };

export default async function SecurityPage() {
  const user = await currentProfile();
  if (!user) redirect("/login?next=/account/security");
  const uri = user.mfaSecret && !user.mfaEnabled ? totpFor(user.mfaSecret, user.email).toString() : null;
  const notices = await takeNotice();
  return (
    <article className="max-w-xl">
      <h1 className="text-3xl font-semibold">Security</h1>
      {notices.length ? <p className="mt-4 text-sm text-danger">{notices.join(" ")}</p> : null}
      <p className="mt-2 text-muted">
        Super admins need an authenticator code before they can open user management. Admins can enroll as well.
      </p>
      {user.mfaEnabled ? (
        <p className="mt-4 rounded-md border border-ok/30 bg-ok/5 px-3 py-2 text-sm">Multi-factor authentication is on for this account.</p>
      ) : (
        <>
          <form action={beginMfa} className="mt-4">
            <button className="rounded-md bg-teal px-4 py-2 font-semibold text-white" type="submit">
              {user.mfaSecret ? "Generate a new secret" : "Start enrollment"}
            </button>
          </form>
          {user.mfaSecret && uri ? (
            <div className="mt-6 space-y-3 text-sm">
              <p>Add this account to an authenticator app, then enter a code.</p>
              <p className="break-all rounded-md border border-line bg-card p-3 font-mono">{user.mfaSecret}</p>
              <p className="break-all text-muted">{uri}</p>
              <form action={confirmMfa} className="space-y-3">
                <label className="block font-semibold">
                  Code
                  <input name="code" inputMode="numeric" required className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 font-normal" />
                </label>
                <button className="rounded-md bg-teal px-4 py-2 font-semibold text-white" type="submit">
                  Confirm code
                </button>
              </form>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
