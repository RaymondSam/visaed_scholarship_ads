"use client";

import { useActionState } from "react";
import { inviteUser, type ActionState } from "@/lib/actions";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteUser, null as ActionState);
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-line bg-card p-4 md:grid-cols-4">
      {state?.error ? <p className="text-sm text-danger md:col-span-4">{state.error}</p> : null}
      {state?.message ? <p className="text-sm md:col-span-4">{state.message}</p> : null}
      <label className="text-sm font-semibold">
        Name
        <input name="fullName" required className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 font-normal" />
      </label>
      <label className="text-sm font-semibold">
        Email
        <input name="email" type="email" required className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 font-normal" />
      </label>
      <label className="text-sm font-semibold">
        Role
        <select name="role" defaultValue="student" className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 font-normal">
          <option value="student">Student</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
      </label>
      <div className="flex items-end">
        <button disabled={pending} className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" type="submit">
          Send invite
        </button>
      </div>
    </form>
  );
}
