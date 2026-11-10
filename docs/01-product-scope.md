# Product scope

## Purpose

Visaed Scholarships is a curated catalog of scholarship opportunities. Staff research and publish listings. Students and the public read them, then continue on the provider’s own site. The product exists to advertise trustworthy programs and to give each program a stable, shareable page.

It is an advertising and information site. A listing is not an offer from this organization, and it is not an application form.

## People

| Person | Need in v1 |
| --- | --- |
| Visitor | Understand the organization, find a program, trust it, share it, and follow the provider’s application link |
| Student | Sign in with an invited account, keep a profile, and read the same catalog as a visitor |
| Admin | Draft a listing, preview it, publish it, update it, and close it when it ends |
| Super admin | Do everything an admin can do, and create, suspend, and retire user accounts |
| Operator | Receive contact messages, see stale listings, and recover from a bad publish |

Providers, parents, donors, and universities are audiences of the public site. They do not get accounts in v1.

## Confirmed product rules

- Admins post available scholarship programs.
- Registered students can view scholarship details. Under the build baseline, so can visitors. See [ADR 003](adr/003-accounts-and-catalog-access.md).
- A super admin registers admin and student users.
- In-product applications are later. V1 must not paint that shut.
- The site needs the pages a modern public website is expected to have, not only the catalog.

## Jobs the v1 site has to do

1. Explain what this organization does, how a program gets listed, and how to get help.
2. Let a visitor find open programs by keyword, level, field, place, funding, and deadline.
3. Show a detail page that can be shared, with the facts a student checks first: who funds it, how much, who can apply, when it closes, and where to apply.
4. Warn visitors that this site does not charge an application fee and that they are leaving for a third-party site.
5. Let staff publish only after a short editorial checklist, and show the date the listing was last checked.
6. Let a super admin invite a named person into exactly one role.
7. Let that person set a password, sign in, reset a password, and sign out.
8. Let a student complete an optional profile for later matching and applications.
9. Give staff a way to receive corrections, privacy requests, partnership notes, and account requests.
10. Leave a trail of who published, closed, invited, and changed a role.

## Listing facts a student should be able to see

Each published listing can show:

- Title, short summary, and a longer description
- Provider name and provider website
- Funding type, amount range, currency, and a funding note
- Study level and fields of study
- Where it is hosted, or that it is remote
- On campus, online, or hybrid
- Who it is open to, or a clear statement that nationality eligibility was not specified
- A fixed deadline with timezone, or a rolling deadline
- Eligibility notes, benefits, and documents the provider asks for
- How to apply: an external URL, or a notice that in-site applications are not open yet
- Whether the listing is featured
- When the information was last checked
- A sponsored label and a disclosure sentence, if the listing is ever marked sponsored

Amount, nationality, and deadline are often unknown or “varies”. The data model allows that, and the page must say “not specified” rather than inventing “open to everyone” or “fully funded”.

## Roles in one place

| Capability | Visitor | Student | Admin | Super admin |
| --- | --- | --- | --- | --- |
| Read published listings | Yes | Yes | Yes | Yes |
| Read drafts and previews | | | Yes | Yes |
| Create and edit listings | | | Yes | Yes |
| Publish, close, archive | | | Yes | Yes |
| Feature a published listing | | | Yes | Yes |
| Edit own profile | | Yes | Yes | Yes |
| Read the user directory | | | | Yes |
| Invite, suspend, change role, delete user | | | | Yes |
| Read the audit log | | | | Yes |
| Read and close contact messages | | | Yes | Yes |

Any staff member can edit any listing. The audit log records who did it. A per-admin ownership rule is an open product choice ([D-15](07-gaps-and-decisions.md)) and is not the baseline.

Admins publish without a second approval. The super admin can unpublish. A review queue is later ([D-03](07-gaps-and-decisions.md)).

## What “modern website” means here

In v1 the public site includes:

- A landing page aimed at first-time visitors, with featured and closing-soon programs
- About, how it works, and FAQ
- Contact, with a real inbox behind it
- Privacy, terms, cookies, and an accessibility statement
- A custom not-found page and a custom error page
- A header, a footer, and a way to skip to content
- Responsive layout that is usable on a phone
- Basic search and filters
- Shareable pages with titles, descriptions, and social images
- A machine-readable sitemap and a scholarship feed
- Visible focus, form errors, empty states, and loading states
- Cookie disclosure before non-essential analytics run
- A security contact file

These are real pages with drafted copy before launch, not placeholder links. Legal copy still needs a human review ([D-20](07-gaps-and-decisions.md)).

## Intentionally later

| Item | When | Why it can wait |
| --- | --- | --- |
| Apply on this site | Phase 3 | Explicitly postponed. The listing already stores the documents and eligibility text a form will need |
| Save a scholarship | Phase 2 | Useful, and it needs a student account, but the catalog is useful without it |
| Email alerts and a newsletter | Phase 2 | Needs a content cadence, double opt-in, and an audience decision |
| Blog or guides | Phase 2 | Good for search traffic. Not required to publish the first listings |
| CSV import | Phase 2 | Manual entry is the quality bar for the first catalog |
| Paid / sponsored workflow | After a business-model decision | The schema can mark a listing sponsored and require a disclosure. No checkout |
| Self-serve student sign-up | After an explicit decision | Invites are the specified model |
| Institution portals | Unscheduled | Changes who is allowed to publish |
| Scraping other scholarship sites | Unscheduled | Copyright, accuracy, and permission come first |
| More than one language in the interface | After an audience decision | User-facing copy stays in one module so a second language is extractable |
| Native apps | Unscheduled | The website is the product |

## Age boundary

Listings may describe programs for people leaving secondary school. Accounts are a separate question.

Build baseline: terms say an account holder must be at least 18. The public catalog can still describe programs for younger students. The product does not knowingly create accounts for children. Date of birth is not collected in v1, because the invite model has no public sign-up to verify and collecting it early adds sensitive data.

If the organization intends under-18 accounts, stop and redesign registration, privacy, and parental consent before any invite work. See [D-29](07-gaps-and-decisions.md).

## Editorial stance

Trust is the product. A scholarship board that publishes unverified or fee-seeking programs will harm students.

Every publish requires the staff member to confirm:

- The provider and the official URL were checked
- The deadline, or the fact that it is rolling, was checked
- The program does not require an upfront payment from the applicant in order to apply
- The date checked is saved and shown on the public page

The admin home shows listings whose review date has passed. V1 flags them. It does not auto-hide them, so a holiday does not wipe the catalog. See [D-43](07-gaps-and-decisions.md).

How the organization chooses what deserves a listing at all (country focus, degree focus, whether to list competitions, loans, or “scholarships” that are actually recruitment fees) is an editorial policy the team still needs to write. See [D-07](07-gaps-and-decisions.md).

## Success for the first release

The first release is done when a super admin can invite an admin, that admin can publish a complete listing, a visitor can find it from the home page and a shared link, the page shows honest gaps (“amount not specified”), and the visitor can leave for the provider without being asked to pay this site.
