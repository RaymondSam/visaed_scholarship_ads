# Roadmap and acceptance

Build in slices. A slice is done when its acceptance checks pass, not when the screens merely exist. Decisions marked before launch in [07-gaps-and-decisions.md](07-gaps-and-decisions.md) can stay open during Slice 0 and Slice 1. They are required before Slice 6.

## Slice 0 — Foundations

- Next.js, TypeScript, Tailwind, theme module, lint, and format
- Supabase local stack and the first migration taken from [proposed-schema.sql](proposed-schema.sql)
- Environment variables from [09-engineering-operations.md](09-engineering-operations.md)
- CI runs typecheck and unit tests
- Seed study fields and a dev-only set of listings

**Acceptance**

- A new developer can run the app and the local database from the engineering doc
- The anon key cannot select a draft, a contact message, or `scholarship_internal`
- An authenticated student cannot update `profiles.role`

## Slice 1 — Public shell

- Header, footer, skip link, 404, 500
- Home, about, how it works, FAQ, contact page (form can be non-functional until Slice 5), privacy, terms, cookies, accessibility
- Draft banner on legal pages until D-20 is approved
- Sitemap, robots, security.txt, default social image

**Acceptance**

- Every footer link resolves
- Home renders with an empty catalog and with seed listings
- Keyboard user can reach the main content and the footer
- Legal pages show a last-updated date

## Slice 2 — Catalog

- `/scholarships` with the filters and sorts in the site map, backed by the query string
- Detail page with honest amount, nationality, and deadline copy
- Related listings, share button, outbound apply panel, closed state
- JSON-LD, canonical URLs, Open Graph, feed
- Tagged cache and revalidation hook ready for staff writes

**Acceptance**

- A published seed listing is visible to a signed-out visitor and in the initial HTML
- A draft slug returns 404 to a signed-out visitor
- A listing with no amount does not say it is fully funded
- A listing with no nationality does not say it is open to everyone
- Deadline text includes the listing timezone
- A closed listing keeps its URL, shows Closed, and is absent from the default catalog and from the sitemap
- The feed contains the published listing and not the draft

## Slice 3 — Accounts

- Break-glass super admin in the dev project
- Invite, accept invite, sign in, sign out, forgot password, reset password
- Account profile edit
- Suspend, reactivate, role change, last-super-admin protection, delete
- Super-admin MFA gate
- Branded auth templates in dev, even if SMTP is still the local mail catcher

**Acceptance**

- Public sign-up is off. There is no sign-up screen
- An invite for a student cannot be altered into an admin invite by editing the link
- A student opening `/admin` gets 404
- A student calling the role-change function is rejected
- Suspending a user stops the next admin request
- The directory of students is not readable with a staff user’s anon-key session
- Resetting a password for an unknown email and a known email looks the same
- Demoting the only super admin is rejected

## Slice 4 — Staff publishing

- Dashboard counts
- Create, autosave-as-draft or explicit save, edit, preview
- Cover upload
- Publish checklist in the form and in the database
- Unpublish, close, archive, feature
- Stale-review filter
- Audit log screen for super admins

**Acceptance**

- Publish is rejected when the fee confirmation, provider URL, or deadline shape is missing, including when the client skips the form and calls the action directly
- Preview of a draft is noindex and is impossible for a signed-out visitor
- After publish, the public URL shows the new listing without a manual cache purge
- Slug cannot be changed after publish through the editor
- Internal notes never appear in the public HTML or in a public API response
- A featured listing that gets closed is no longer featured
- The audit log shows the publisher and the status change

## Slice 5 — Operations

- Contact form stores a message and emails the inbox
- Honeypot and rate limit
- Inquiry inbox with read and closed
- Cron closes expired listings and revalidates the cache
- security.txt points at a real mailbox
- Basic incident note from the security doc filed with the operators

**Acceptance**

- A visitor cannot insert into `contact_messages` with the anon key
- The 6th contact submission from the same address inside the window is rejected
- A listing whose deadline is in the past shows as closed on the public page even if cron has not run, and is `closed` in the database after cron runs
- Cron without the secret does not change rows
- Failed inbox email still leaves a stored inquiry

## Slice 6 — Launch

- Production Supabase project, region, backups, and a restore drill
- Production Vercel project, domain, redirect allow-list
- Custom SMTP and a test invite to an external mailbox
- Two super admins with MFA
- Counsel-approved privacy and terms, cookie page matching real cookies
- Editorial one-pager acknowledged by whoever publishes
- Accessibility pass on home, catalog, detail, contact, and login
- Empty-state copy replaced with real about and FAQ copy
- Remove draft banners from legal pages only after approval

**Acceptance**

- The launch checklist in [06-security-privacy-and-trust.md](06-security-privacy-and-trust.md) is checked
- A phone on a normal network can open a shared detail link and see a correct preview in the chat app
- An admin can publish, a visitor can open the page, and the super admin can see the audit row, all on production

## Phase 2

After the catalog has real listings and real readers:

- Save a scholarship, visible on the account page
- Email alerts for saved searches or fields of interest, with double opt-in
- Guides section if someone is actually going to write them
- CSV import that creates drafts and still uses the publish checklist
- Admin MFA required, if it slipped from v1
- Self-serve account export and deletion
- Optional analytics behind a real consent banner

## Phase 3 — Applications

Start only after D-25 is decided.

- `application_mode = in_app`
- `applications` and private `application_files` as sketched in the data model
- Student draft, submit, and withdraw
- Staff view of submissions
- File type and size limits, retention, and a malware-scanning approach
- This is the first workload likely to justify Railway, if scanning or other slow processing cannot finish inside a Vercel function

## Phase 4 — Only if the product earns it

- Paid featuring, with disclosure already supported by the schema, plus whatever billing and consumer rules D-04 requires
- A second interface language
- Institution accounts
- Hosted search beyond Postgres
- A public API

## Explicitly unscheduled

Scraping third-party catalogs, comments, ratings, chat support inside the app, native mobile apps, and a general-purpose CMS.

## Test layers

| Layer | What it covers |
| --- | --- |
| Unit | Zod schemas, deadline and money and nationality copy, status-transition helper if one exists beside the trigger |
| Database | RLS and triggers against local Supabase: anon, student, admin, super admin, and service role |
| End to end | Sign out and read a listing, admin publish, super-admin invite using the local mail catcher, contact rate limit |
| Manual at launch | Keyboard and screen reader on the five pages named in Slice 6, chat-app link preview, restore drill |

Automate the database tests. They are the ones most likely to pass in the UI and fail through the public API.
