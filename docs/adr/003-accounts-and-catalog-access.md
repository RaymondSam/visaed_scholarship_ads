# ADR 003: Accounts and catalog access

- Status: Build baseline
- Date: 2026-11-10

## Context

Two facts were specified:

- A super admin registers admin users and student users.
- Students check scholarship details. Applying inside the product comes later.

A scholarship advertising site also has to be shareable. People send links in chat. Search engines and social apps need a real page, and they will not sign in.

Those goals pull in different directions if every detail page requires a student account.

## Decision

1. Published listings, including their detail pages, are public.
2. There is no public sign-up. Supabase public sign-up is disabled.
3. The super admin invites every admin and every student.
4. A student account is the place for a profile, saved programs later, and applications later. It is not the gate to reading a published listing.
5. Drafts, internal notes, and unpublished records are staff-only. Admins can open a noindex preview of a draft.
6. The contact form includes the reason “I need an account” so a person can ask to be invited. That request does not create an account.

Closed listings stay public with a clear Closed status so shared links and annual programs do not 404. Archived listings return 404 to the public and drop out of the sitemap.

## Consequences

- Advertising, search, and chat previews work without a student login.
- The user-management feature still ships in v1, because invites, roles, and profiles are required before applications exist.
- Anyone on the internet can read a published listing. Publishing is an editorial act, and the trust checklist in the security doc is part of publishing.
- If a later decision hides detail pages behind login, those URLs must be removed from the sitemap and marked noindex. The route protection is a small change. The loss is distribution. That tradeoff should be explicit before it is made.

## Options considered

| Option | Why it was set aside for v1 |
| --- | --- |
| Login required to open a detail page | Matches a strict reading of “registered users check the details”. It blocks search and makes shared links land on a login wall, which works against advertising. |
| Public self-registration for students | Familiar on modern sites. It was not asked for, and it widens spam, age, and moderation questions. The invite model can grow a self-serve path later without changing the catalog. |
| Institutions register themselves and post | A different product (a marketplace). V1 is a staff-curated catalog. |
