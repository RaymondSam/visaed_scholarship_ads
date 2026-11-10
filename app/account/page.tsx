import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account-forms";
import { currentProfile } from "@/lib/auth/current";

export const metadata = { title: "Account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await currentProfile();
  if (!user) redirect("/login?next=/account");
  return (
    <article>
      <h1 className="text-3xl font-semibold">Account</h1>
      <p className="mt-2 text-muted">
        Signed in as {user.email}. Role: {user.role.replaceAll("_", " ")}.
      </p>
      <ProfileForm
        fullName={user.fullName}
        countryCode={user.countryCode}
        educationLevel={user.educationLevel}
        studyFieldIds={user.studyFieldIds}
      />
      <p className="mt-8 text-sm">
        <Link className="font-semibold text-teal underline" href="/account/security">
          Security and multi-factor authentication
        </Link>
      </p>
      <p className="mt-3 text-sm">
        To ask for account deletion, use the{" "}
        <Link className="font-semibold text-teal underline" href="/contact?reason=privacy">
          privacy contact form
        </Link>
        .
      </p>
    </article>
  );
}
