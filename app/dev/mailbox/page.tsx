import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data/local-store";

export const metadata = { title: "Local mailbox", robots: { index: false, follow: false } };

export default async function MailboxPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const messages = await getRepository().listMailbox();
  return (
    <article>
      <h1 className="text-3xl font-semibold">Local mailbox</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Invite and password-reset messages land here because email is not connected. This page is available only while the app is running in development.
      </p>
      <div className="mt-6 space-y-4">
        {messages.length === 0 ? <p>No messages yet. Invite a user or request a password reset.</p> : null}
        {messages.map((message) => (
          <article key={message.id} className="rounded-lg border border-line bg-card p-4">
            <p className="text-sm text-muted">
              To {message.to} · {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(message.createdAt))}
            </p>
            <h2 className="mt-1 font-semibold">{message.subject}</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm">{message.body}</pre>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm">
        <Link className="underline" href="/login">
          Back to log in
        </Link>
      </p>
    </article>
  );
}
