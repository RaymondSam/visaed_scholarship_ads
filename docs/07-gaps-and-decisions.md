# Gaps and decisions

The brief specified a Vercel React site, Supabase as the database, Railway if a backend is needed, staff-posted scholarships, student viewing, super-admin registration of admins and students, and a normal public website. Everything in the table is either that brief, or a gap the brief did not cover.

**Build baseline** means implementation will follow it if nobody changes the decision first. **Before launch** means coding can start, and production should not. **Later** means it is acknowledged and scheduled or parked.

The highest-impact gaps are the ones that change trust, privacy, or distribution: D-01, D-04, D-07, D-20, D-25, and D-29.

## What was already specified

| Topic | What was specified |
| --- | --- |
| Product | Advertise scholarship opportunities. Admins post programs. Students view details. Applications come later |
| Users | A super admin registers admin users and student users |
| Web | React, deployed on Vercel, with the pages a modern site is expected to have |
| Data | Supabase is the primary database |
| Backend | Railway is available when a separate backend is actually needed |

## Decision log

| ID | Topic | Why it matters | Baseline | Status |
| --- | --- | --- | --- | --- |
| D-01 | Who can read a listing | Login-walled details cannot be indexed or previewed in chat. That fights an advertising site | Published and closed pages are public. Drafts are staff-only. See [ADR 003](adr/003-accounts-and-catalog-access.md) | Build baseline |
| D-02 | How students get accounts | Public sign-up changes spam, age checks, and moderation | Super admin invites every student and every admin. Contact reason `account_help` collects requests. No `/signup` | Confirmed, with the contact path as baseline |
| D-03 | Publish approval | A review queue doubles the schema workflow and the admin UI | Any admin may publish. Super admin can unpublish. Audit log records who did it | Build baseline |
| D-04 | Business model | About text, the Sponsored badge, and tax/consumer rules depend on this | No payments in v1. A listing can be marked sponsored only with a public disclosure sentence. Do not claim “we never take payment” in About until this is decided | Before launch |
| D-05 | Audience and language | Search configuration, examples, currency, and support hours | Interface copy in English. Listings may describe programs anywhere. Postgres text search uses the English configuration | Build baseline |
| D-06 | Brand | Name, logo, colors, tone, and domain appear on every page and email | Working title “Visaed Scholarships”. One replaceable theme module. No fake social icons | Before launch |
| D-07 | Editorial policy | What you refuse to list matters as much as the database | Publish checklist is technical (source, deadline, no upfront fee, last-checked date). The human policy (countries, degree levels, loans, contests, partial scholarships) is still unwritten | Before launch |
| D-08 | Are you the funder or only the publisher | FAQ and terms change | Treat every listing as a third-party program until the organization says it also funds awards | Before launch |
| D-09 | Closed listings | Shared links from last month | Closed pages stay public and show Closed. Archived pages 404 and leave the sitemap | Build baseline |
| D-10 | What the invite collects | Less data is easier to explain in the privacy notice | Email, full name, and role. The person may later add country, level, and fields. No phone | Build baseline |
| D-11 | Public contact details | The footer and the privacy notice need a real channel | Contact form plus `CONTACT_INBOX_EMAIL`. Physical address and phone wait until the organization wants them published | Before launch |
| D-12 | Social accounts | Empty icons look unfinished | Omit social links until the accounts exist | Before launch |
| D-13 | Analytics | Cookies and the privacy notice | Launch with no analytics and no banner beyond a cookie page that says only the session cookie is used. Add a privacy-oriented product later under consent | Build baseline |
| D-14 | Number of super admins | One super admin is a single point of failure | At least two, both with MFA, before production | Build baseline |
| D-15 | Who can edit a listing | Ownership rules add UI and policies | Any active staff member can edit any listing. Audit records the editor | Build baseline |
| D-16 | Deadlines that are not a single timestamp | Many programs are rolling or “opens in March” | `is_rolling` or a real timestamp plus an IANA timezone. Both are shown, listing zone and visitor zone | Build baseline |
| D-17 | Saved scholarships | Expected on modern catalog sites | Phase 2, after accounts have been used for real | Later |
| D-18 | Blog or guides | Useful for search, easy to let overshadow the catalog | Phase 2, file-based, same brand | Later |
| D-19 | Newsletter | A footer email box is a new data purpose | Not in v1. No email field in the footer | Later |
| D-20 | Legal entity and governing law | Privacy, terms, copyright line, and processor contracts need a name and a place | Pages ship with a clearly marked draft banner in non-production. Production launch waits for counsel-approved text, the legal name, and the venue | Before launch |
| D-21 | Transactional email | Invite mail from the default Supabase sender looks like phishing | Supabase Auth mail in local and dev. Production uses custom SMTP on a domain the organization controls. Contact notifications use the same domain | Before launch |
| D-22 | DNS and domain owner | Vercel, Supabase redirect URLs, and email all follow the domain | Set `NEXT_PUBLIC_SITE_URL` per environment. Production domain is an open choice | Before launch |
| D-23 | Supabase plan and region | Free projects can pause. Region belongs in the privacy notice | Production on a plan that does not pause, with backups someone has restored once in a drill. Region chosen on purpose and written into the notice | Before launch |
| D-24 | Who answers mail | Contact, privacy, and security.txt are useless without an owner | Name an owner for `CONTACT_INBOX_EMAIL` and for the security contact, with a backup person | Before launch |
| D-25 | What “apply” will mean | Changes Phase 3 a lot: are you a form in front of a provider, or the organization that decides awards | Keep `application_mode` of `external` or `coming_soon`. A later `in_app` mode is reserved. Do not start the application build until this is chosen | Later |
| D-26 | Application files | Sensitive documents, malware, retention | No student uploads in v1. Private bucket, type allow-list, size cap, and a scanning decision are Phase 3 prerequisites | Later |
| D-27 | Provider logos | Trademark and broken hotlinks | Optional cover image the staff uploads. No remote hotlinking of provider logos in v1 | Build baseline |
| D-28 | Money display | A bare number is ambiguous | ISO currency plus a formatted range, or the words “amount not specified” | Build baseline |
| D-29 | Age of account holders | Under-18 accounts pull in children’s privacy rules | Accounts are 18+. The public site may still describe programs for younger students. No date of birth collected. If you need minor accounts, stop and redesign before invites | Before launch |
| D-30 | Support promise | A contact form implies someone answers | No SLA in the UI. Internally, aim to read new inquiries on business days. Say nothing stronger on the site | Build baseline |
| D-31 | Language of a listing’s own content | A program announced in another language | Store the language the editor actually wrote. The interface stays English. Do not machine-translate listings in v1 | Build baseline |
| D-32 | Programs that repeat every year | Two slugs for one program confuse visitors | Update the same row and keep the slug when it is the same program. Archive and create a new row when the provider treats it as a new program | Build baseline |
| D-33 | Partner and funder logos on the home page | Implies a relationship | No logo wall until each organization has agreed | Before launch |
| D-34 | Low-bandwidth visitors | Shared links often open on a phone | Performance budget in the architecture doc. Server-rendered catalog. No required third-party tags | Build baseline |
| D-35 | Chat-app previews | A large share of scholarship links travel through WhatsApp and similar apps | Open Graph images at 1200×630, absolute URLs, and a real summary on every listing | Build baseline |
| D-36 | How long operational records live | Privacy and debugging want different answers | Contact messages and audit logs: 24 months. Rate-limit rows: 48 hours. Self-serve account deletion is a fast follow after the manual delete path works | Build baseline |
| D-37 | Expired invite links | People miss the first email | Super admin can resend. There is no public resend, so the form cannot be used to probe who has an account | Build baseline |
| D-38 | Lock admin to an office IP | Travelling staff and a small team make this brittle | MFA for super admins instead of an IP allow-list | Build baseline |
| D-39 | Staging | A shared dev database will get messy, and a third production-like project costs money | Local Supabase, one shared dev project for previews, one production project | Build baseline |
| D-40 | Who edits About and FAQ | A CMS is a second product | Files in git for v1. Developers deploy copy changes | Build baseline |
| D-41 | Rights to photographs | A random campus photo is often not yours to use | Covers are original, licensed, or a simple graphic made for the listing. Record the source in internal notes when it is not obvious | Before launch |
| D-42 | SEO of closed programs | A closed page can still be useful, or it can look like a live offer | Public, indexable, with a visible Closed status and the apply panel removed. The sitemap lists published listings only, not closed ones, so the main catalog stays fresh | Build baseline |
| D-43 | Stale facts | An old deadline or a changed award amount breaks trust | `review_due_at` is 90 days after the last check. Dashboard flags overdue published listings. V1 does not auto-unpublish | Build baseline |
| D-44 | Framework | The brief said React. It did not say how the HTML is produced | Next.js App Router on Vercel. See [ADR 001](adr/001-nextjs-on-vercel.md) | Build baseline |
| D-45 | Railway in v1 | An empty second backend still needs secrets, deploys, and monitoring | Do not create a Railway service until a job exceeds Vercel’s short-task model. See [ADR 002](adr/002-server-boundary-and-railway.md) | Build baseline |
| D-46 | Rich text | WYSIWYG HTML is a common XSS source | Markdown, sanitized at render | Build baseline |
| D-47 | First super admin | Somebody has to exist before invites work | Break-glass SQL in the auth doc, then that person invites the next super admin and enrolls MFA | Build baseline |
| D-48 | Scraping and bulk entry | Fast catalogs are often copied catalogs | Manual entry in v1. CSV import is Phase 2 and still passes the same publish checklist. Automated collection from other sites is out of scope until a rights review says otherwise | Build baseline |
| D-49 | Comments, ratings, Q&A | Common on modern sites, expensive to moderate, risky on scholarship claims | Not in v1 | Later |
| D-50 | Multi-factor for ordinary admins | Staff accounts can publish public claims | Required for super admins at launch. Recommended for admins, and allowed to slip one increment | Build baseline |
| D-51 | Cookie banner vendor | A consent platform is another processor | Hand-built banner only when analytics is added. No vendor in v1 | Build baseline |
| D-52 | Error tracking | Production debugging | Optional at first deploy (Sentry or similar). Not a schema dependency. If added, name it in the privacy notice | Before launch |
| D-53 | WhatsApp as a support channel | Visitors will ask | Use the contact form until someone commits to monitoring a number. Do not print a number that is a personal phone | Before launch |
| D-54 | Listing languages and translation workflow | Editors may paste untranslated eligibility rules | Show the listing in the language it was written. The “last checked” line does not imply the team translated it | Build baseline |
| D-55 | How featured placement is chosen | Featured is an editorial boost and can look like an ad | Featured means “staff chose to highlight this”. It is not for sale until D-04 says so. Cap the home page at six | Build baseline |

## Gaps that are easy to miss during build

These are the omissions most likely to show up as rework if they stay implicit.

1. **Timezone on the deadline.** A date without a zone will close a day early for someone in another country. The schema requires an IANA zone whenever a deadline exists, and the page shows both zones.
2. **“Not specified” is different from “everyone”.** Empty nationality and empty amount need explicit copy.
3. **Column-level secrets.** Postgres RLS hides rows, not columns. Internal notes are a separate table.
4. **Role stored in the wrong JWT field.** `user_metadata` is editable by the user. Only `app_metadata` is authoritative.
5. **The service-role key is a root password.** It stays in server env vars. User listing and role changes go through SQL functions that check the actor, so a route bug has a second gate.
6. **Auth email deliverability.** Production invites need custom SMTP before real users are invited.
7. **Supabase free-tier pause.** A paused production database looks like an outage.
8. **Children.** A secondary-school scholarship on a public page is fine. An account for a 16-year-old is a different product.
9. **Scam programs.** The checkbox is not a policy. Someone still has to define what the organization refuses to publish.
10. **Share previews.** The advertising loop is “see a listing, send it to a friend”. Open Graph tags are a feature.
11. **Stale listings.** Without `review_due_at`, the catalog slowly becomes a liability.
12. **Slug stability.** Changing a slug after people have shared it throws away the advertising. Slugs lock at first publish.
13. **Closed versus deleted.** Taking down a bad listing is archive or unpublish. Closing on the deadline keeps the URL honest.
14. **Legal identity.** Footer, privacy, and email From-name cannot be invented by the implementation.
15. **Application files are not covers.** The public image bucket must stay free of passports and transcripts when applications arrive.
16. **Preview deployments against production data.** They will email real users or edit real listings. Previews use the dev project.
17. **The last super admin.** The app has to refuse to lock the team out.
18. **Generic auth errors.** “That email is not registered” on the reset form is an account oracle.
19. **Markdown is still active content.** Sanitize at render time, including links.
20. **Cache after publish.** A server-rendered page that stays stale for an hour will make staff think publish failed. Mutations revalidate the scholarship tag, and so does the deadline job.

## Suggested order to settle the open items

Settle these before the first production invite, not necessarily before the first commit:

1. D-20 legal name, contact, and who approves the privacy notice and terms
2. D-06 and D-22 brand and domain
3. D-07 editorial policy, even as a one-page internal note
4. D-04 one sentence on whether anybody pays for placement
5. D-08 whether this organization also awards its own funds
6. D-21 email domain and D-24 inbox owner
7. D-29 confirm the 18+ account rule in writing
8. D-23 Supabase plan and region

D-25 can wait until Phase 3 is actually about to start. It should be decided before any application table is migrated.
