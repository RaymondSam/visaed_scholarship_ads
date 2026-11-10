"use client";

import { useActionState } from "react";
import { acceptInvite, forgotPassword, resetPassword, signIn, updateProfile, type ActionState } from "@/lib/actions";
import { LEVEL_LABELS, STUDY_FIELDS, STUDY_LEVELS } from "@/lib/domain/types";
import { fieldClass, primaryButtonClass } from "@/components/ui";

export function LoginForm({ nextPath, showDevHints }: { nextPath: string; showDevHints: boolean }) {
  const [state, action, pending] = useActionState(signIn, null as ActionState);
  return (
    <form action={action} className="mt-6 max-w-md space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      {state?.error ? (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm font-semibold">
        Email
        <input name="email" type="email" autoComplete="username" required className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={fieldClass} />
      </label>
      {state?.message === "mfa" ? (
        <label className="block text-sm font-semibold">
          Authentication code
          <input name="code" inputMode="numeric" autoComplete="one-time-code" required className={fieldClass} />
        </label>
      ) : null}
      <button disabled={pending} className={primaryButtonClass} type="submit">
        {state?.message === "mfa" ? "Verify and sign in" : "Sign in"}
      </button>
      {showDevHints ? (
        <div className="rounded-md border border-line bg-card p-3 text-sm">
          <p className="font-semibold">Local development accounts</p>
          <p className="mt-1">Password for all three: local-dev-pass-12</p>
          <ul className="mt-2 list-disc pl-5">
            <li>super@visaed.local — super admin</li>
            <li>editor@visaed.local — admin</li>
            <li>student@visaed.local — student</li>
          </ul>
          <p className="mt-2">Invites and password resets appear in the local mailbox.</p>
        </div>
      ) : null}
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPassword, null as ActionState);
  return (
    <form action={action} className="mt-6 max-w-md space-y-4">
      {state?.message ? <p role="status">{state.message}</p> : null}
      <label className="block text-sm font-semibold">
        Email
        <input name="email" type="email" required className={fieldClass} />
      </label>
      <button disabled={pending} className={primaryButtonClass} type="submit">
        Send reset link
      </button>
    </form>
  );
}

export function PasswordTokenForm({ token, mode }: { token: string; mode: "invite" | "reset" }) {
  const [state, action, pending] = useActionState(mode === "invite" ? acceptInvite : resetPassword, null as ActionState);
  return (
    <form action={action} className="mt-6 max-w-md space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm font-semibold">
        New password
        <input name="password" type="password" minLength={12} required autoComplete="new-password" className={fieldClass} />
      </label>
      <p className="text-sm text-muted">Use at least 12 characters.</p>
      <button disabled={pending} className={primaryButtonClass} type="submit">
        {mode === "invite" ? "Activate account" : "Save password"}
      </button>
    </form>
  );
}

export function ProfileForm({
  fullName,
  countryCode,
  educationLevel,
  studyFieldIds,
}: {
  fullName: string;
  countryCode: string | null;
  educationLevel: string | null;
  studyFieldIds: string[];
}) {
  const [state, action, pending] = useActionState(updateProfile, null as ActionState);
  return (
    <form action={action} className="mt-6 max-w-xl space-y-4">
      {state?.error ? <p role="alert" className="text-sm text-danger">{state.error}</p> : null}
      {state?.message ? <p role="status" className="text-sm">{state.message}</p> : null}
      <label className="block text-sm font-semibold">
        Name
        <input name="fullName" defaultValue={fullName} required className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold">
        Country of residence
        <input name="countryCode" defaultValue={countryCode ?? ""} maxLength={2} placeholder="KE" className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold">
        Study level of interest
        <select name="educationLevel" defaultValue={educationLevel ?? ""} className={fieldClass}>
          <option value="">Not specified</option>
          {STUDY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">Fields of interest</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {STUDY_FIELDS.map((field) => (
            <label key={field.id} className="flex gap-2 text-sm">
              <input type="checkbox" name="studyFieldIds" value={field.id} defaultChecked={studyFieldIds.includes(field.id)} />
              {field.name}
            </label>
          ))}
        </div>
      </fieldset>
      <button disabled={pending} className={primaryButtonClass} type="submit">
        Save profile
      </button>
    </form>
  );
}
