# Engineering and operations

## Repository

One app. Suggested layout once implementation starts:

```text
app/                      routes, as in the architecture doc
components/               layout, catalog, forms
content/                  about, faq, legal copy
lib/                      supabase clients, validation, rendering
emails/
supabase/migrations/      schema history
supabase/seed.sql         study fields and dev-only listings
tests/                    unit and RLS
e2e/                      browser tests
```

Package manager: pnpm. Node.js: the current Active LTS. Language: TypeScript in strict mode.

Initial dependencies, versions pinned at install time:

- `next`, `react`, `react-dom`
- `tailwindcss`
- `@supabase/supabase-js`, `@supabase/ssr`
- `zod`
- `react-markdown` and a sanitizer plugin such as `rehype-sanitize`
- a test runner (`vitest`) and Playwright for end-to-end tests

UI primitives can be added with the shadcn/ui approach (components copied into the repo) so the team owns the code.

Add the usual ignore rules when the app exists: `node_modules`, `.next`, `.env`, `.env.local`, Supabase `.branches`, OS junk. Commit `.env.example` only, with blanks.

## Environment variables

```bash
# Public
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server only
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
CONTACT_INBOX_EMAIL=
EMAIL_FROM=
RESEND_API_KEY=
RATE_LIMIT_PEPPER=
```

`RESEND_API_KEY` stands in for whichever provider D-21 picks. Locally the contact route may log the message instead of sending, behind an explicit `EMAIL_DISABLE_SEND=true` that is forbidden in production.

Vercel environments:

| Variable | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production origin | Preview origin, or the stable dev site URL | `http://localhost:3000` |
| Supabase URL and keys | Production project | Dev project | Local or dev project |
| `CRON_SECRET` | Unique | Unique | Any local value |
| Email | Real | A mailbox the team controls, or disabled | Disabled or local catcher |

Preview and production secrets are different. A preview deploy that holds the production service-role key is a production incident waiting to happen.

## Local development

1. Install the Supabase CLI and Docker, then `supabase start`.
2. Apply migrations. The CLI prints the local API URL, anon key, and service-role key. Local mail is captured by the bundled mail interface (Inbucket).
3. Copy keys into `.env.local`.
4. Create the first super admin with the break-glass SQL against the local database.
5. `pnpm dev`.

Seed listings are clearly fake and live only in the seed script that local and preview run. Production does not run that seed.

## Supabase projects

| Project | Used by | Contains |
| --- | --- | --- |
| Local | One developer | Disposable data |
| Dev | Vercel previews and shared testing | Fake users and fake listings |
| Production | The public domain | Real accounts and real listings |

Auth dashboard checklist for each remote project is in [05-auth-and-authorization.md](05-auth-and-authorization.md). Migrations are the only way tables change. If someone hot-fixes production SQL, they backfill a migration in the same day.

Region is chosen when the production project is created and then treated as fixed, because moving later is a migration project. Write the chosen region into the privacy notice.

## Migrations

- `supabase/migrations` is append-only
- The first file is the proposed schema, adjusted only for anything the CLI requires
- After that, [proposed-schema.sql](proposed-schema.sql) is historical. Update the data-model doc when behavior changes, and leave the proposed file as the original design or replace its header with a pointer to `supabase/migrations`. Do not let the two drift silently while both claim to be current

## Email

| Message | Sender path |
| --- | --- |
| Invite, password reset, email change | Supabase Auth, custom SMTP in production |
| New contact message | Server route to `CONTACT_INBOX_EMAIL` |
| Deadline reminders to students | Not in v1 |

From-address is on a domain the organization controls, with SPF, DKIM, and DMARC in place before the first production invite. Send a test to an external provider (not only the inbox on the same host) and confirm it lands in the inbox.

Templates name the product, say that the recipient was invited, and link to the exact origin in the allow-list.

## Cron

Vercel Cron, once per day, `POST /api/cron/close-scholarships`.

The route checks `CRON_SECRET`, calls `close_expired_scholarships()`, then `revalidateTag('scholarships')`.

A second daily call can purge `rate_limit_buckets` older than 48 hours. That can be the same route or a second one. Keep each route narrow.

If the team moves off Vercel’s cron limits, that job is a candidate for Railway. The SQL function stays the same.

## CI

On pull requests:

- Typecheck
- Lint
- Unit tests
- RLS tests when a local Supabase service is available in CI. If that is too heavy at the start, run RLS tests nightly and on migrations, and say so in the README of the app

Vercel builds previews. Playwright can target the preview URL after the first slices exist. Do not block the first migration on a full browser suite, and do not launch without at least the signed-out catalog test and the publish test.

## Code rules that protect the architecture

- Client components import the browser Supabase client only. They never import the service-role module. Structure `lib/supabase/service.ts` so a client component cannot import it without pulling `server-only`.
- Server Actions that write listings use the user-scoped server client.
- The actor id passed into `list_accounts` and `apply_account_change` is taken from the session on the server, never from the request body.
- Validation schemas for a listing live in one module used by the form and the action.
- Public copy for money, nationality, and deadlines lives in one module with unit tests, so the UI does not invent a second meaning.
- Redirect targets after login are relative paths.

## Backups and restore

- Enable backups on the production plan (point-in-time recovery if the chosen plan includes it)
- Before launch, restore a backup into a scratch project and sign in. A backup that has never been restored is a hope
- Know who is allowed to download a backup. A backup contains every email and every inquiry

## Logging and errors

- Log action name, user id, and a request id
- Do not log emails, passwords, tokens, contact bodies, or listing markdown
- User-facing errors are sentences a person can act on. Database errors stay on the server
- 404 for a missing public listing, including drafts, so existence of a draft slug is not confirmed

## Names, copy, and themes

- Product string and support email live in `lib/site.ts` (or similar), not scattered in components
- Colors and radius live in the theme file
- Do not add a second visual language for admin. The same header, type, and focus states apply. Admin can be denser

## Release

1. Migration applies to dev and the preview is checked.
2. Migration applies to production before or as the production deploy goes out. A new app against an old schema is a failed release. Prefer expanding changes (add a column, deploy code, backfill, then enforce) when a change is not backward compatible.
3. Auth setting changes are manual and listed in the pull request when they are required.

## What “done” means for this documentation set

Implementation starts from these docs. When a slice lands, update the doc that the slice proved wrong. The decision log stays the place where a baseline gets promoted to confirmed or replaced.
