"use client";

import { useActionState } from "react";
import { sendContact, type ActionState } from "@/lib/actions";
import { CONTACT_REASONS, REASON_LABELS, type ContactReason } from "@/lib/domain/types";
import { fieldClass, primaryButtonClass } from "@/components/ui";

export function ContactForm({ initialReason }: { initialReason?: string }) {
  const [state, action, pending] = useActionState(sendContact, null as ActionState);
  const reason = CONTACT_REASONS.includes(initialReason as ContactReason) ? initialReason : "general";
  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state?.message ? (
        <p role="status" className="rounded-md border border-ok/30 bg-ok/5 px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      <label className="block text-sm font-semibold">
        Name
        <input name="name" required className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold">
        Email
        <input name="email" type="email" required autoComplete="email" className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold">
        Reason
        <select name="reason" defaultValue={reason} className={fieldClass}>
          {CONTACT_REASONS.map((item) => (
            <option key={item} value={item}>
              {REASON_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Message
        <textarea name="message" required minLength={10} rows={6} className={fieldClass} />
      </label>
      <div className="hp-field" aria-hidden="true">
        <label>
          Company website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button disabled={pending} className={primaryButtonClass} type="submit">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
