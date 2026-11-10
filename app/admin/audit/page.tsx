import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/auth/current";
import { getRepository } from "@/lib/data/local-store";

export const metadata = { title: "Audit" };

export default async function AuditPage() {
  const user = await currentProfile();
  if (!user || user.role !== "super_admin") redirect("/admin");
  if (user.aal !== "aal2") redirect("/account/security");
  const entries = await getRepository().listAudit(user.id);
  return (
    <div>
      <h1 className="text-3xl font-semibold">Audit log</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3 font-semibold">When</th>
              <th className="py-2 pr-3 font-semibold">Action</th>
              <th className="py-2 pr-3 font-semibold">Entity</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-line">
                <td className="py-2 pr-3">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))}</td>
                <td className="py-2 pr-3">{entry.action}</td>
                <td className="py-2 pr-3">
                  {entry.entityType}
                  {entry.entityId ? ` ${entry.entityId.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 ? <p className="mt-4 text-muted">No audit events yet.</p> : null}
      </div>
    </div>
  );
}
