# Visaed Scholarships

Working title for a scholarship advertising site. Admins publish programs. Registered students read them. A super admin creates every admin and student account. Applications inside the product come later.

## Run the local MVP

With `DATA_PROVIDER=local` (the default), the app stores listings in `data/local-db.json` and does not need Supabase.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Sample listings are fictional. Development accounts and the production setup are in [docs/10-next-steps-after-phase-1.md](docs/10-next-steps-after-phase-1.md).

```bash
npm test
npm run typecheck
npm run db:reset
```

## Run against Supabase

Apply `supabase/migrations`, put the URL and keys in `.env.local`, and set `DATA_PROVIDER=supabase`. Vercel must use this mode. The file database is refused there because the serverless filesystem cannot create `data/`.

Allow these redirect paths on the Supabase project: `/auth/callback`, `/auth/confirm`, `/auth/invite`, and `/auth/reset`. Create the first super admin with the break-glass SQL in [docs/05-auth-and-authorization.md](docs/05-auth-and-authorization.md).

The architecture below is the build baseline. Local development can keep the file database. Vercel uses Supabase.

The public brand, domain, and legal entity are still unconfirmed. The folder name `visaed_scholarship_ads` and the parent folder `satasol` are recorded as-is and are not treated as a confirmed company structure.

## Build baseline

These choices are the baseline for the first build. Each one is written up as an ADR or a numbered decision. Change the decision before coding if the baseline is wrong.

| Area | Baseline |
| --- | --- |
| Web app | Next.js (App Router), React, TypeScript, deployed on Vercel |
| Data, auth, files | Supabase Postgres, Supabase Auth, Supabase Storage |
| Backend | Next.js server code on Vercel. Supabase Row Level Security is the safety net |
| Extra server | Railway is reserved until a job cannot run on Vercel. No Railway service in v1 |
| Accounts | Invite only. The super admin creates admin and student users. Public self-signup stays off |
| Catalog | Published scholarships are public, including detail pages, so the listings can be shared and indexed |
| Editing | Staff save scholarships through Server Actions. The service-role key is limited to user administration, the contact form, and the deadline job |

## V1 does include

- Marketing site: home, about, how it works, FAQ, contact, privacy, terms, cookies, accessibility
- Public scholarship catalog with search, filters, shareable URLs, and a feed
- Admin drafting, preview, publishing, closing, and archiving
- Super-admin invites, suspend, reactivate, role change, and deletion on request
- Student sign-in, password reset, and a profile the student completes after the first login
- Trust basics: editorial checklist, “last checked” date, stale-listing queue, scam warning beside outbound apply links
- SEO, sitemap, social preview tags, JSON-LD, security contact, and an audit log

## V1 leaves out

- In-product applications and student document uploads
- Payments, sponsored-checkout, and paid placement management
- Public registration, comments, ratings, chat, and a recommendation engine
- A blog, a newsletter, and a multi-language interface
- Automated scraping or importing of scholarships from other sites
- Institution accounts where a university posts its own programs
- A separate Railway service

Applying later is allowed for in the data model so that work does not require a rewrite. See [docs/04-data-model.md](docs/04-data-model.md).

## Start here

1. Read [docs/README.md](docs/README.md) for the map.
2. Read [docs/07-gaps-and-decisions.md](docs/07-gaps-and-decisions.md) and resolve anything marked **Before build** that you do not accept.
3. Treat [docs/proposed-schema.sql](docs/proposed-schema.sql) as the draft database contract.
4. Build in the order in [docs/08-roadmap-and-acceptance.md](docs/08-roadmap-and-acceptance.md).

The first coding slice is a Next.js app, a Supabase project with this schema, the public shell, invite-only sign-in, and scholarship publish plus public read.
