# Next steps after phase 1

Phase 1 is a local MVP. It does not talk to Supabase or Vercel. Listings, accounts, messages, and the audit log live in `data/local-db.json`. Invite and reset mail is written to `/dev/mailbox` while `next dev` is running.

Do not deploy this build as a public site. The local database file is not a production database, the development accounts are printed on the login page in development, and `DATA_PROVIDER=local` is the only mode that works.

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

## Seam to replace

`getRepository()` in `lib/data/local-store.ts` returns the file store when `DATA_PROVIDER` is `local` or unset. Setting it to `supabase` currently throws, on purpose. The replacement should implement the same methods: public reads, staff writes, invites, audit, contact, and the deadline job.

Authorization in the local store is the stand-in for Row Level Security. When Supabase is connected, keep the same checks in server actions and also enable the policies in `docs/proposed-schema.sql`.

## 1. Connect Supabase

1. Create two projects, dev and production, on a plan that will not pause. Choose the region deliberately and write it down for the privacy notice.
2. Install the Supabase CLI and add `supabase/config.toml`.
3. Turn `docs/proposed-schema.sql` into `supabase/migrations/0001_init.sql`. Apply it to dev. Do not edit production tables from the dashboard.
4. In Auth settings for each project: turn public sign-up off, set the site URL and redirect allow-list (`/auth/callback`, `/auth/invite`), set the minimum password length to 12, and turn on leaked-password protection.
5. Create the `scholarship-media` bucket as specified in the schema file.
6. Add server-only env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Never prefix the service-role key with `NEXT_PUBLIC_`.
7. Create the first super admin with the break-glass SQL in `docs/05-auth-and-authorization.md`.
8. Replace local password sessions with `@supabase/ssr`. Map invites to `inviteUserByEmail` and `app_metadata.role`. Do not import the local password hashes. Re-invite real people.
9. Point scholarship reads and writes at Postgres through the signed-in user client so RLS still applies. Keep the service role for `list_accounts`, `apply_account_change`, contact insert, and `close_expired_scholarships`.
10. Move cover uploads to Storage. Delete the local `data/uploads` path from the running app.
11. Add a database test that the anon key cannot read a draft, a contact message, or `scholarship_internal`.
12. Remove the development account box and the `/dev/mailbox` page once Auth email is delivering to a real inbox.

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
