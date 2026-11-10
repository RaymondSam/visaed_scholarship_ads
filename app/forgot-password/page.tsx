import Link from "next/link";
import { ForgotForm } from "@/components/account-forms";

export const metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <article>
      <h1 className="text-3xl font-semibold">Forgot password</h1>
      <p className="mt-2 max-w-xl text-muted">If the email belongs to an active account, reset instructions are created. Unknown addresses get the same response.</p>
      <ForgotForm />
      <p className="mt-4 text-sm">
        <Link className="underline" href="/login">
          Back to log in
        </Link>
      </p>
    </article>
  );
}
