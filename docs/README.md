# Documentation map

Plan for the Visaed Scholarships web app. Written on 10 November 2026. The audience is the people who will design, build, and operate it.

If a later migration disagrees with [proposed-schema.sql](proposed-schema.sql), the migration in git is the database that actually shipped, and these docs should be updated in the same change.

## Read in this order

| Doc | What it settles |
| --- | --- |
| [01-product-scope.md](01-product-scope.md) | Who it is for, what v1 ships, what is postponed |
| [02-site-map-and-ux.md](02-site-map-and-ux.md) | Pages, flows, catalog UX, admin UX, content outlines |
| [03-system-architecture.md](03-system-architecture.md) | Vercel, Supabase, browser, jobs, caching, environments |
| [04-data-model.md](04-data-model.md) | Entities, rules, search, files, and the future application tables |
| [05-auth-and-authorization.md](05-auth-and-authorization.md) | Roles, invites, sessions, policies, bootstrap of the first super admin |
| [06-security-privacy-and-trust.md](06-security-privacy-and-trust.md) | Threats, privacy outline, editorial trust, launch checklist |
| [07-gaps-and-decisions.md](07-gaps-and-decisions.md) | What was specified, what was omitted, and the default for each gap |
| [08-roadmap-and-acceptance.md](08-roadmap-and-acceptance.md) | Build order and testable acceptance criteria |
| [09-engineering-operations.md](09-engineering-operations.md) | Repo shape, environments, email, CI, backups, local dev |
| [10-next-steps-after-phase-1.md](10-next-steps-after-phase-1.md) | How to connect Supabase, email, and Vercel after the local MVP |
| [proposed-schema.sql](proposed-schema.sql) | Normative draft schema, RLS, triggers, storage |
| [adr/](adr/) | Architecture decision records |

## Decision records

| ADR | Decision |
| --- | --- |
| [001-nextjs-on-vercel.md](adr/001-nextjs-on-vercel.md) | Next.js App Router on Vercel |
| [002-server-boundary-and-railway.md](adr/002-server-boundary-and-railway.md) | Vercel server plus Supabase is the v1 backend. Railway waits |
| [003-accounts-and-catalog-access.md](adr/003-accounts-and-catalog-access.md) | Invite-only accounts. Published listings are public |

## Glossary

| Term | Meaning |
| --- | --- |
| Visitor | Anyone who is not signed in |
| Student | A registered reader. In v1 a student views programs and maintains a profile |
| Admin | A staff user who creates and publishes scholarship listings |
| Super admin | The only role that can create accounts and change roles |
| Staff | An admin or a super admin |
| Program / listing / scholarship | One advertised scholarship opportunity |
| Provider | The organization that funds or runs the scholarship. Providers do not log in during v1 |
| Catalog | The public set of published listings |
| Invite | An email that lets a person set a password and activate an account the super admin created |
| Service role | The Supabase key that bypasses Row Level Security. Server-only |
| RLS | Row Level Security policies in Postgres |

## Status labels used in these docs

| Label | Meaning |
| --- | --- |
| Confirmed | Stated for this product |
| Build baseline | A recommended default. Implementation follows it unless the decision is changed first |
| Before launch | Can be deferred while coding starts, and must be settled before production |
| Later | Intentionally out of v1 |
