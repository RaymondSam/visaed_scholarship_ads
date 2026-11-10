# Auth and authorization

## Roles

| Role | Assigned by | Session behaves as |
| --- | --- | --- |
| `super_admin` | Break-glass SQL for the first account, then by another super admin | Staff, plus user administration and audit |
| `admin` | Super admin invite or role change | Staff |
| `student` | Super admin invite or role change | Account and public site |

A person has one role. There is no mixed “admin who is also a student applicant” in v1. When applications exist, an admin who wants to apply uses a separate student account. That avoids a staff session holding an application.

More than one super admin is allowed and recommended, so one lost mailbox is not a company outage. The last active super admin cannot be suspended, demoted, or deleted.

## Where the role lives

| Store | Purpose |
| --- | --- |
| `auth.users.raw_app_meta_data.role` | Set only by the Auth admin API or by a SQL operator. Users cannot edit `app_metadata` from the client |
| `profiles.role` | What RLS reads. Inserted from `app_metadata` on user creation. Later updated only by the super-admin server path |

The server updates both in one flow. A trigger rejects any role change where the database role is not the service role and the JWT role is not `service_role`. Staff editing their profile cannot promote themselves by posting a modified row.

Do not read authorization decisions from `user_metadata`. That object is user-editable in Supabase.

## Account lifecycle

| Status | Meaning |
| --- | --- |
| `invited` | Auth user exists, the person has not finished setting a password |
| `active` | Can sign in, subject to role |
| `suspended` | Profile is suspended and the auth user is banned so existing refresh tokens stop |

Invite expiry follows the Supabase invite link lifetime. A super admin can resend. There is no public “email me a new invite” form, because that would let anyone probe addresses. A person whose link died uses Contact with the reason `account_help`.

Password reset exists for active users through the normal forgot-password page. Suspended users see the same generic response as unknown emails, so the form does not reveal account state.

Deletion:

- Removes the auth user
- Cascades the profile and study-interest rows
- Sets `created_by` / `updated_by` / `invited_by` / `handled_by` / audit `actor_id` null where those foreign keys say `on delete set null`
- Writes `user.deleted` before the profile disappears, with metadata that holds the role and not a copy of the profile’s optional fields
- Does not delete scholarships

The baseline is a soft operational control (suspend) for day-to-day moderation, and a real delete when the person asks or when the account was created in error.

## First super admin

Public sign-up cannot create this account. Public sign-up is off, and the new-user trigger creates a profile only when `app_metadata.role` is already a known role. A dashboard user created with no role is an auth user with no profile. That person cannot pass a staff or student check.

Procedure, run once per environment by someone with dashboard access, and recorded in the operator notes:

1. In the Supabase dashboard, create the user with email confirmed and a long random password delivered out of band. Leave `app_metadata` empty at this step so the trigger does not also insert an invited profile.
2. Run, with the new user’s UUID:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"super_admin"}'::jsonb
where id = '<uuid>';

insert into public.profiles (id, role, status, full_name)
values ('<uuid>', 'super_admin', 'active', '<full name>')
on conflict (id) do update
set role = 'super_admin', status = 'active', full_name = excluded.full_name;
```

3. Sign in, turn on MFA, and invite a second super admin before launch.

The security property is: an auth user with no `app_metadata.role` does not become staff, and does not become a student either.

## Invite flow

Server action `inviteUser`:

1. Require an active super-admin session. Check the profile row, not only the JWT, in case of a stale token.
2. Validate email, non-empty name, and role in `admin | student`. Creating a super admin through this form is allowed for the same role list extended to `super_admin`, because the only caller is already a super admin. Log it.
3. Call `auth.admin.inviteUserByEmail` with the display name in user metadata and `app_metadata: { role }`. The redirect is `${SITE_URL}/auth/invite`, which is on the Supabase redirect allow-list for that environment.
4. The new-user trigger inserts `profiles` with status `invited` from `app_metadata.role`. It does not know who sent the invite.
5. The server then calls `mark_invited_by(actor, target)` with the service role. The actor id is the session user, not a form field. That function sets `invited_by` and writes the `user.invited` audit row.

The invite page exchanges the link for a session and asks for a password that meets the project policy. On success the profile moves from `invited` to `active`. That single transition is allowed by the protection trigger for the signed-in user. Every other status change is refused.

## Sessions

- Cookie session via `@supabase/ssr`, httpOnly, Secure in production, SameSite Lax
- Access token lifetime left at the Supabase default (1 hour) unless a pentest says otherwise
- Refresh token rotation enabled
- Sign-out revokes the local session and calls Supabase sign-out
- Admin layouts re-read the profile on each request so a suspend takes effect on the next navigation, not only after the access token expires. The ban on the auth user covers the refresh

Password policy baseline: minimum length 12, and Supabase leaked-password protection turned on (Have I Been Pwned check in the Auth settings).

## MFA

Launch criterion: every super admin enrolls TOTP before production launch. The admin layout checks the authenticator assurance level. A super admin at AAL1 is sent to enrollment and cannot open `/admin/users` or `/admin/audit` until AAL2.

Admin MFA is recommended at launch and can slip one increment if schedule forces it. Compensating controls: 12-character minimum, invite-only, audit log, no shared mailboxes for super-admin invites.

Students are not asked for MFA in v1.

## Route checks

| Area | Rule |
| --- | --- |
| `(public)` catalog and marketing | None |
| `(auth)` login and recovery | Redirect to `/account` or `/admin` if a session already exists |
| `/account` | Signed in and status `active` |
| `/admin` except users and audit | Profile role in `admin`, `super_admin` and status `active` |
| `/admin/users`, `/admin/audit`, invite and role actions | `super_admin`, `active`, AAL2 |
| `/api/cron/close-scholarships` | Bearer token equals `CRON_SECRET` using a constant-time compare |
| `/api/contact` | No session. Rate limit and validation instead |

Middleware refreshes the Supabase session. Middleware is not the only authorization check. Server Actions repeat the role check because middleware can be skipped by a misrouted call.

## Row Level Security

Helpers, security definer, `search_path = public`, execute granted to `anon` and `authenticated`:

- `is_active_staff()` true when `auth.uid()` matches a profile with status `active` and role `admin` or `super_admin`
- `is_active_super_admin()` the same for `super_admin` only

These helpers return booleans and do not leak row contents. They bypass RLS as the function owner, which avoids a policy recursion. Do not enable `FORCE ROW LEVEL SECURITY` on `profiles` without rewriting the helpers.

### profiles

| Action | Who | Constraint |
| --- | --- | --- |
| select | the user | own row |
| select | active staff | rows whose role is `admin` or `super_admin`, so the UI can show editor names without exposing students |
| update | the user | own row, and the trigger blocks role, invited_by, and illegal status changes |
| insert / delete | nobody via the API | trigger and service role only |

The super-admin directory is loaded by calling `list_accounts(actor)` with the service role after the AAL2 check. Student rows are not covered by the staff select policy, so an admin session cannot dump them through the public API. The function itself checks that `actor` is an active super admin. The route passes the session id and ignores any id in the request body. `apply_account_change(actor, target, role, status)` is the same pattern for role and status changes, and it refuses to remove the last active super admin. Suspending also bans the auth user through the Auth admin API, and the ban is applied before the profile update so a failed database write does not leave a usable session. Reactivation clears the ban after the profile update succeeds.

### study_fields

| Action | Who |
| --- | --- |
| select | public, where `active` |
| write | nobody via the API |

### scholarships

| Action | Who | Rows |
| --- | --- | --- |
| select | anon and authenticated | `published` or `closed` |
| select | active staff | all statuses |
| insert | active staff | `created_by` must equal `auth.uid()` |
| update | active staff | any listing |
| delete | nobody via the API | archive instead |

### scholarship_study_fields

Staff can write. Public can select rows whose parent listing is published or closed. Implement that with a policy that exists-subqueries the parent, or with a security-invoker view. Prefer the policy so there is one object to grant.

### scholarship_internal

Active staff: select, insert, update. No anon grant.

### audit_logs

Active super admin: select. Inserts come from security-definer triggers and from the service role. No update, no delete, through the API.

### contact_messages

Active staff: select and update. No insert policy. The contact route uses the service role.

### rate_limit_buckets

No policies for `anon` or `authenticated`. Service role only.

### Storage `scholarship-media`

| Action | Who |
| --- | --- |
| select | public |
| insert, update, delete | active staff, path prefix `scholarships/` |

## Trigger summary

| Trigger | Behavior |
| --- | --- |
| `on auth.users insert` | Insert profile from `app_metadata.role`. Fail if the role is missing or not a known role |
| `profiles before update` | Reject role and `invited_by` changes unless called as service role. Allow status `invited` → `active` for the owner. Reject other status changes unless service role |
| `scholarships before insert/update` | Enforce status machine, publish checklist, featured flag, slug immutability after `published_at` has ever been set, stamp `updated_by`, set `published_at` / `closed_at` |
| `scholarships after insert/update` | Write an audit row. Metadata lists changed columns, old status, new status. Omit markdown bodies |
| `profiles after update` | When role or status changes, write an audit row |

Slug immutability: once `published_at` is non-null, `slug` cannot change through the API. A super-admin SQL fix is still possible as the table owner if it disables the trigger for that transaction. That is an incident procedure, not a feature. Record a redirect in the application when that procedure is eventually needed. V1 has no redirect table.

## Auth settings checklist

Apply in every Supabase project:

- Email provider on, public sign-ups off
- Site URL set to that environment’s origin
- Redirect allow-list includes `/auth/callback` and `/auth/invite`
- Minimum password length 12
- Leaked-password protection on
- Confirm email on for any future self-serve path. Invited users are confirmed by the invite flow
- Custom SMTP using the same sender domain as product email, before production launch. Default Supabase mail is acceptable in local and dev
- Email templates rewritten so the invite says who invited them and which site they are joining
- MFA TOTP enabled

## Open authorization questions

Recorded with defaults in the gaps list:

- [D-14](07-gaps-and-decisions.md) multiple super admins (baseline: yes)
- [D-15](07-gaps-and-decisions.md) any staff member edits any listing (baseline: yes)
- [D-03](07-gaps-and-decisions.md) admins publish without a second approver (baseline: yes)
- [D-29](07-gaps-and-decisions.md) minimum age for an account (baseline: 18, no under-18 accounts)
