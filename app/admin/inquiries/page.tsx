import { redirect } from "next/navigation";
import { setInquiryStatus } from "@/lib/actions";
import { currentProfile } from "@/lib/auth/current";
import { REASON_LABELS } from "@/lib/domain/types";
import { getRepository } from "@/lib/data/local-store";

export const metadata = { title: "Inquiries" };

export default async function InquiriesPage() {
  const user = await currentProfile();
  if (!user) redirect("/login");
  const messages = await getRepository().listContacts(user.id);
  return (
    <div>
      <h1 className="text-4xl">Inquiries</h1>
      <div className="mt-6 space-y-4">
        {messages.length === 0 ? <p className="rounded-3xl border border-dashed border-line px-5 py-8 text-muted">No messages yet.</p> : null}
        {messages.map((message) => (
          <article key={message.id} className="rounded-3xl border border-line bg-card p-5">
            <p className="text-sm text-muted">
              {REASON_LABELS[message.reason]} · {message.status} · {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(message.createdAt))}
            </p>
            <h2 className="mt-1 font-semibold">
              {message.name} · {message.email}
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">{message.message}</p>
            <div className="mt-3 flex gap-3">
              <form action={setInquiryStatus}>
                <input type="hidden" name="id" value={message.id} />
                <input type="hidden" name="status" value="read" />
                <button className="text-sm font-semibold underline" type="submit">
                  Mark read
                </button>
              </form>
              <form action={setInquiryStatus}>
                <input type="hidden" name="id" value={message.id} />
                <input type="hidden" name="status" value="closed" />
                <button className="text-sm font-semibold underline" type="submit">
                  Close
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
