import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account-forms";
import { PageHeader } from "@/components/ui";
import { currentProfile } from "@/lib/auth/current";
import { isLocalMode } from "@/lib/site";
import { safeNextPath } from "@/lib/auth/session";

export const metadata = { title: "Log in", robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentProfile();
  const params = await searchParams;
  const nextPath = safeNextPath(typeof params.next === "string" ? params.next : "/account");
  if (user) redirect(user.role === "student" ? (nextPath.startsWith("/admin") ? "/account" : nextPath) : nextPath.startsWith("/admin") ? nextPath : "/admin");
  const reason = typeof params.reason === "string" ? params.reason : "";
  return (
    <article className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="rounded-[1.75rem] border border-line bg-card p-6 shadow-[0_18px_40px_-32px_rgb(20_34_31)] md:p-8">
        <PageHeader eyebrow="Invite only" title="Log in" lede="Accounts are created by a super admin. There is no public registration." />
        {reason === "reset" ? <p className="mt-4 rounded-2xl bg-ok/10 px-4 py-3 text-sm text-ok">Password saved. Sign in with the new password.</p> : null}
        {reason === "link" ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">That link is not valid or has expired.</p> : null}
        {reason === "suspended" ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">This account is suspended.</p> : null}
        <LoginForm nextPath={nextPath} showDevHints={process.env.NODE_ENV !== "production" && isLocalMode()} />
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <Link className="font-semibold text-teal underline decoration-teal/30 underline-offset-4" href="/forgot-password">
            Forgot password
          </Link>
          {process.env.NODE_ENV !== "production" && isLocalMode() ? (
            <Link className="font-semibold text-teal underline decoration-teal/30 underline-offset-4" href="/dev/mailbox">
              Open the local mailbox
            </Link>
          ) : null}
        </div>
      </div>
      <aside className="rounded-[1.75rem] bg-pine p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">Why an account</p>
        <p className="mt-4 font-display text-3xl leading-tight">Reading the catalog stays public.</p>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          An account is for your profile and for staff work. Applying still happens on the provider’s site.
        </p>
      </aside>
    </article>
  );
}
