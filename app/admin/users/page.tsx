import { redirect } from "next/navigation";
import { InviteForm } from "@/components/invite-form";
import { changeAccount, deleteAccount, resendInvite, takeNotice } from "@/lib/actions";
import { currentProfile } from "@/lib/auth/current";
import { ROLE_LABELS } from "@/lib/domain/types";
import { getRepository } from "@/lib/data/local-store";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await currentProfile();
  if (!user || user.role !== "super_admin") redirect("/admin");
  if (user.aal !== "aal2") redirect("/account/security");
  const accounts = await getRepository().listAccounts(user.id);
  const notices = await takeNotice();
  return (
    <div>
      <h1 className="text-3xl font-semibold">Users</h1>
      <p className="mt-2 text-sm text-muted">Invites are delivered to the local mailbox until email is connected.</p>
      {notices.length ? <p className="mt-4 text-sm text-danger">{notices.join(" ")}</p> : null}
      <div className="mt-6">
        <InviteForm />
      </div>
      <div className="mt-8 space-y-4">
        {accounts.map((account) => (
          <article key={account.id} className="rounded-lg border border-line bg-card p-4">
            <h2 className="font-semibold">{account.fullName}</h2>
            <p className="text-sm text-muted">
              {account.email} · {ROLE_LABELS[account.role]} · {account.status}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {account.status === "invited" ? (
                <form action={resendInvite}>
                  <input type="hidden" name="id" value={account.id} />
                  <button className="text-sm font-semibold text-teal underline" type="submit">
                    Resend invite
                  </button>
                </form>
              ) : null}
              <form action={changeAccount} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={account.id} />
                <label className="text-sm">
                  <span className="sr-only">Role for {account.fullName}</span>
                  <select name="role" defaultValue={account.role} className="rounded-md border border-line bg-white px-2 py-1">
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super admin</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="sr-only">Status for {account.fullName}</span>
                  <select name="status" defaultValue={account.status} className="rounded-md border border-line bg-white px-2 py-1">
                    <option value="invited">Invited</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
                <button className="text-sm font-semibold underline" type="submit">
                  Update
                </button>
              </form>
              <form action={deleteAccount} className="flex items-center gap-2">
                <input type="hidden" name="id" value={account.id} />
                <label className="text-sm">
                  <span className="sr-only">Type email to delete {account.fullName}</span>
                  <input name="confirmEmail" placeholder={account.email} className="rounded-md border border-line px-2 py-1" />
                </label>
                <button className="text-sm font-semibold text-danger" type="submit">
                  Delete
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
