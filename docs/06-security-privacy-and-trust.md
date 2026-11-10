# Security, privacy, and trust

This document is an engineering and product checklist. The privacy and terms outlines are agendas for a qualified reviewer. They are not a privacy notice and they are not legal advice.

## Trust model

Visitors will treat a listing on this domain as an endorsement. The controls below are part of the product, not a polish pass.

| Control | Where it lives |
| --- | --- |
| Only invited staff can publish | Auth and RLS |
| Publish is blocked until the provider URL, deadline shape, and fee confirmation are stored | Database trigger |
| Public page shows “Information checked on {date}” | `last_verified_at` |
| Admin home lists published listings past `review_due_at` (90 days) | Dashboard |
| Sponsored listings must show a disclosure | Constraint plus UI badge |
| Apply links display the destination hostname and a no-fee warning | Detail page |
| Corrections have a contact path | Contact reason `correction` |
| Who changed what is reconstructable | Audit log |

The editorial policy still needs a human decision: which countries, which study levels, and which kinds of “scholarship” are in bounds. A fee-charging recruitment offer is out of bounds even if the technical checklist is ticked. See [D-07](07-gaps-and-decisions.md).

Suggested public sentence, to be edited once the policy exists:

> We list programs we have checked against the provider’s own materials. We do not charge you to read a listing or to follow an application link. A listing is not a promise that you will be awarded the scholarship. If a page asks you to pay an upfront fee to apply, stop and tell us.

## Threats and responses

| Threat | Response in this design |
| --- | --- |
| Visitor self-promotes to admin | Public sign-up disabled. Role comes from `app_metadata`. Trigger blocks role updates from the user JWT |
| Service-role key in the client bundle | Key is server-only. Code review and a CI grep for `SERVICE_ROLE` inside client components |
| Staff session reads every student’s profile | Student rows are excluded from the staff RLS select. The directory uses a super-admin server route |
| Draft listing fetched by guessing a slug | Public RLS is `published` or `closed` only. Preview is a separate staff route by id |
| Internal notes selected from the public table | Notes are a different table with staff-only RLS |
| XSS through a listing | Markdown with an allow-list, raw HTML stripped, link protocols restricted |
| Open redirect after login | Next redirect parameter must be a relative path on this origin |
| Invite or reset used as an account oracle | Generic responses. Resend invite is super-admin only |
| Contact form spam | Honeypot, rate limit, no public insert grant, server-side validation |
| Compromised admin publishes a scam | MFA for super admins, audit log, checklist, fast unpublish, no shared staff passwords |
| Cover bucket used for personal documents | Bucket policy and code allow images under `scholarships/` only. Application files are a later private bucket |
| Cron endpoint abused to flip rows | Shared secret, constant-time compare, route does only the close-expired update |
| CSRF on a Server Action | Framework origin checks, SameSite cookies |
| IDOR on another user’s profile update | RLS `id = auth.uid()` plus the column trigger |
| Stale JWT after suspend | Auth ban plus a profile read on admin requests |
| Dependency or supply-chain compromise | Lockfile, pinned major versions, Dependabot or equivalent, no unreviewed postinstall secrets |
| Scraping of the catalog | Acceptable. The catalog is public. Do not add contact emails to the HTML. Rate-limit the contact endpoint, not the catalog, in v1 |
| Misleading structured data | JSON-LD omits amount and nationality when they are unknown |

Out of scope for v1 and worth a later review: a formal penetration test, bug-bounty program, WAF rules, and IP allow-lists for admin. MFA and the audit log are the chosen controls instead of an IP allow-list, because staff may travel. See [D-38](07-gaps-and-decisions.md).

## Privacy

### Data the product holds

| Data | Who it is about | Why | Where |
| --- | --- | --- | --- |
| Email, password hash, MFA factor | Account holders | Sign-in | Supabase Auth |
| Name, role, account status | Account holders | Access control and display | `profiles` |
| Country, study level, fields of interest | Account holders who choose to enter them | Profile for later alerts and applications | `profiles`, `profile_study_fields` |
| Listing content and cover images | Providers, as published facts | The catalog | `scholarships`, storage |
| Internal source notes | Staff work product | Editorial memory | `scholarship_internal` |
| Contact name, email, message | The sender | Respond to the request | `contact_messages` |
| Audit events | Staff | Accountability | `audit_logs` |
| Hashed IP bucket | Contact senders | Short-lived abuse control | `rate_limit_buckets` |
| Analytics events | Visitors who opt in | Audience measurement | Analytics vendor, only after consent |

The product does not collect date of birth, national ID, transcripts, or payment cards in v1.

### Processors to name in the notice

Once contracts exist, the notice should name at least: the hosting provider (Vercel), the database and auth provider (Supabase), the email provider, and the analytics provider if analytics is on. If Railway is added later, add it before it processes any personal data.

Regions matter. Supabase and Vercel regions should be chosen deliberately when the projects are created, then described accurately in the notice. See [D-20](07-gaps-and-decisions.md) and [D-23](07-gaps-and-decisions.md).

### Retention baseline

| Data | Baseline |
| --- | --- |
| Account | Kept while the account exists. Deleted on a verified request |
| Contact messages | 24 months, then delete |
| Audit log | 24 months, then delete |
| Rate-limit buckets | 48 hours |
| Server logs | The host’s default, and avoid writing personal data into them |
| Published listings | Kept while they remain a public record. Archive hides them. A provider takedown deletes or archives on request |
| Backups | Follow the Supabase plan’s backup window, and say so in the notice |

### Rights requests

V1 process: the person emails via the privacy contact reason, the super admin verifies the mailbox matches the account, and the super admin deletes the account or exports the profile fields manually. Build a self-serve export and delete action once that manual process has been done for real and the steps are boring enough to automate.

If the organization is in a jurisdiction with statutory deadlines (for example GDPR’s one month), the inbox needs an owner. See [D-24](07-gaps-and-decisions.md).

### Children

Baseline: accounts are for adults 18 and over. Do not invite a minor. Public pages may describe programs for younger students without creating an account for them.

A different age rule is a product change, not a copy change. It needs a lawful basis and, in many places, a parent.

### Cookies

| Cookie | Type | Before consent |
| --- | --- | --- |
| Supabase auth session | Strictly necessary when the person signs in | Yes, on authenticated pages |
| Cookie preference | Strictly necessary | Yes |
| Analytics | Optional | No |

The cookie page lists each cookie. The banner offers accept and reject for analytics with equal weight. Rejecting leaves the site fully usable.

If the team launches with no analytics, the banner can stay off and the cookie page says only the necessary session cookie is used. That is a good launch default. See [D-13](07-gaps-and-decisions.md).

### Notice outline

For counsel to turn into the real privacy page:

1. Who is responsible (legal name, address, email)
2. Who this notice covers (visitors, students, staff)
3. Data collected, purposes, and lawful bases
4. Who receives it (processors, inbox operators)
5. International transfers and the regions actually used
6. How long data is kept
7. Rights and how to exercise them, including account deletion
8. Cookies
9. Children
10. Changes to the notice and the last-updated date

## Terms outline

For counsel:

1. Who may use the site, including the account age rule
2. Listings are information about third-party programs, not offers or awards from this organization
3. No guarantee that a listing is complete, current, or that an application will succeed
4. The visitor is responsible for confirming facts with the provider before applying
5. This site does not charge an application fee. Providers may have their own conditions
6. Acceptable use: no scraping that degrades the service, no attempts to access staff functions, no uploading of unlawful content by staff
7. Accounts are personal and invite-only. The operator may suspend an account
8. Intellectual property in the site design and original writing. Provider names and marks remain the providers’
9. External links
10. Liability limits, as far as local law allows
11. Governing law and venue
12. Contact and last-updated date

Staff also need an internal rule: cover images must be original, licensed, or a simple branded graphic the team has the right to use. See [D-41](07-gaps-and-decisions.md).

## Accessibility statement outline

- Target: WCAG 2.2 level AA
- Known gaps, updated when they exist rather than claiming a perfect score
- Contact method for a barrier
- Date of the last review

The statement is only published after someone has actually checked the home page, catalog, detail page, contact form, and login with a keyboard and a screen reader. That check is a launch task in [08-roadmap-and-acceptance.md](08-roadmap-and-acceptance.md).

## security.txt

Serve `/.well-known/security.txt` (RFC 9116) with a contact mailbox, a preferred language, and an expiry. Use a mailbox that a human reads. Do not invite vulnerability reports to a personal address that leaves the company.

## Launch security checklist

- [ ] Public sign-up disabled in production
- [ ] Service-role key present only in server env vars
- [ ] Redirect allow-list contains the production origin and no wildcard
- [ ] Password length 12 and leaked-password protection on
- [ ] Custom SMTP and branded invite template
- [ ] At least two super admins, both enrolled in MFA
- [ ] Super-admin routes require AAL2
- [ ] RLS enabled on every public table, verified by a test that uses the anon key
- [ ] Storage bucket contains no personal files
- [ ] Cron secret set and the route rejects a missing header
- [ ] Contact rate limit verified
- [ ] `security.txt` published
- [ ] Privacy and terms reviewed by a person who is allowed to approve them
- [ ] Cookie banner matches the tags that actually load
- [ ] Error pages do not show stack traces
- [ ] Dependabot or an equivalent is on
- [ ] Production Supabase project is on a plan that will not pause for inactivity, with backups the team knows how to restore

## Incident basics

Write the short version before launch and keep it with the operator notes:

1. Who can unpublish a listing, and the path: admin edit, status to draft or archived.
2. Who can suspend a staff account, and the backup if the actor is the person compromised: the second super admin, then the Supabase dashboard.
3. How to rotate the service-role key, the cron secret, and the email API key.
4. Who tells users if contact messages or accounts were exposed.

A one-page version of this is enough for v1.
