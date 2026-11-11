# Next steps after phase 1

Phase 1 can still run on this machine with `DATA_PROVIDER=local`. That mode writes `data/local-db.json` and does not talk to Supabase. Vercel cannot host that file. Production sets `DATA_PROVIDER=supabase` and uses the migration in `supabase/migrations`.

Do not set `DATA_PROVIDER=local` on Vercel. The function filesystem is read-only, so creating `data/` fails and the public pages error.

## What already works locally

- Public pages: home, catalog, listing detail, about, how it works, FAQ, contact, privacy, terms, cookies, accessibility
- Search, filters, shareable query strings, RSS feed, sitemap, robots, and `security.txt`
- Sample listings that show open, closed, past-deadline, draft, and sponsored states
- Sign-in, invite, password reset, profile editing, and TOTP enrollment
- Staff drafting, preview, publish checklist, cover upload, close, archive, and feature
- Super-admin user management after authenticator enrollment
- Contact form with a honeypot and a rate limit
- Deadline check from the admin dashboard and from `POST /api/cron/close-scholarships`

Development accounts, password `local-dev-pass-12`:

| Email | Role |
| --- | --- |
| super@visaed.local | Super admin |
| editor@visaed.local | Admin |
| student@visaed.local | Student |

Reset the sample data with `npm run db:reset`, then restart the app.

## Seam

`getRepository()` in `lib/data/local-store.ts` returns the file store when `DATA_PROVIDER` is `local`. It returns `lib/data/supabase-store.ts` when `DATA_PROVIDER` is `supabase`. Listing reads and staff edits use the signed-in Supabase client, so row level security still applies. The service role is limited to account administration, contact insert, rate limits, and `close_expired_scholarships()`.

Apply `supabase/migrations` before pointing an environment at that project. Create the first super admin with the break-glass SQL in `docs/05-auth-and-authorization.md`. Authorization checks in server actions stay in place alongside the policies.

## 1. Connect Supabase

1. Create two projects, dev and production, on a plan that will not pause. Choose the region deliberately and write it down for the privacy notice.
2. `supabase/config.toml` is in the repo. Install the Supabase CLI and Docker, then run `supabase start` for a local stack.
3. Apply `supabase/migrations/20261111120000_init.sql` to dev. Do not edit production tables from the dashboard.
4. In Auth settings for each project: turn public sign-up off, set the site URL and redirect allow-list (`/auth/callback`, `/auth/confirm`, `/auth/invite`, `/auth/reset`), set the minimum password length to 12, and turn on leaked-password protection.
5. The migration creates the `scholarship-media` bucket. Confirm it exists after the migration.
6. Set `DATA_PROVIDER=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Never prefix the service-role key with `NEXT_PUBLIC_`.
7. Create the first super admin with the break-glass SQL in `docs/05-auth-and-authorization.md`.
8. Sessions, invites, and password reset already use `@supabase/ssr` when `DATA_PROVIDER=supabase`. Do not import the local password hashes. Re-invite real people.
9. Scholarship reads and writes already use the signed-in user client. The service role stays limited to `list_accounts`, `apply_account_change`, contact insert, and `close_expired_scholarships`.
10. Cover uploads already go to Storage at `scholarships/{id}/cover.{ext}`.
11. Against a running project, confirm the anon key cannot read a draft, a contact message, or `scholarship_internal`.
12. Remove the development account box and the `/dev/mailbox` page once Auth email is delivering to a real inbox. The box is already hidden when `DATA_PROVIDER` is not `local`.

## 2. Connect email

1. Put SPF, DKIM, and DMARC on the sending domain.
2. Configure Supabase custom SMTP for invite, reset, and email-change messages.
3. Send contact notifications to `CONTACT_INBOX_EMAIL` from the contact route.
4. Rewrite the invite template so it names Visaed and the inviter.
5. Send a test to an external mailbox and confirm it arrives.

## 3. Deploy to Vercel

1. Push the repository to the git host Vercel will watch.
2. Create a Vercel project. Production uses the production Supabase project. Preview deployments use the dev project only.
3. Set `NEXT_PUBLIC_SITE_URL`, the Supabase keys, `AUTH_SECRET` or the Supabase session secret, `CRON_SECRET`, `CONTACT_INBOX_EMAIL`, `EMAIL_FROM`, the email API key, and `RATE_LIMIT_PEPPER`.
4. Add the production origin to the Supabase redirect allow-list. Do not use a wildcard.
5. Add a daily cron for `POST /api/cron/close-scholarships`.
6. Remove `export const dynamic = "force-dynamic"` from the root layout once public pages use the `scholarships` cache tag and staff writes call `revalidateTag`.
7. Confirm `DATA_PROVIDER` is not `local` in production.

## 4. Before the first real invite

Settle the launch items in `docs/07-gaps-and-decisions.md`, especially:

- Legal name, contact, and counsel-approved privacy and terms (D-20)
- Brand and domain (D-06, D-22)
- One-page editorial policy (D-07)
- Whether anyone pays for placement (D-04)
- Whether this organization also awards its own funds (D-08)
- Confirm accounts are 18+ (D-29)
- Inbox owner and security contact (D-24)
- Two super admins, both enrolled in MFA

Then walk the launch checklist in `docs/06-security-privacy-and-trust.md`.

## 5. After launch

Phase 2 in `docs/08-roadmap-and-acceptance.md`: saved scholarships, alerts, guides, CSV import, self-serve deletion, and optional analytics behind consent.

Phase 3 is in-product applications. Decide what “apply” means (D-25) before creating those tables. A file scanner that cannot finish inside a Vercel function is the first reason to add Railway.
