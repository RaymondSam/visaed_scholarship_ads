# ADR 001: Next.js on Vercel

- Status: Build baseline
- Date: 2026-11-10

## Context

The product is a public scholarship advertising site plus a private admin. Pages have to be fast, shareable, and understandable to search engines and chat apps. The team asked for a React application deployed on Vercel.

A client-only React app can be hosted on Vercel. Its HTML for a listing is thin until JavaScript runs, which is a weak default for a site whose job is to advertise pages that people share.

## Decision

Build one Next.js application using the App Router, React, and TypeScript. Deploy it to Vercel.

Use Server Components for public pages so listing and detail HTML is rendered on the server. Use Server Actions for staff mutations so validation, authorization, and cache invalidation happen in one place.

Style the interface with Tailwind CSS. Use accessible, themeable primitives (the shadcn/ui pattern) rather than a heavy component platform. Keep brand colors and type in one theme module so an unconfirmed brand can be swapped without a redesign.

## Consequences

- The team maintains one web codebase. There is no separate frontend repository in v1.
- SEO, Open Graph tags, sitemap, and the scholarship feed are part of the same app.
- Server-only secrets live in Vercel environment variables and in local `.env` files that are never committed.
- Preview deployments exist for every branch Vercel builds.
- A later native mobile app is out of scope. The public site still needs to work well on a phone, because that is how many visitors will open a shared link.

## Options considered

| Option | Why it was set aside for v1 |
| --- | --- |
| Vite React SPA with client-side routing | Fits “a React app” and is simpler to host. Public listing HTML, metadata, and share previews need extra prerender machinery that Next.js already provides on Vercel. |
| Next.js frontend plus a required Railway API | Splits every feature across two deploys before there is a workload that needs a long-running process. See ADR 002. |
| A hosted CMS for the marketing pages and the listings | Adds a vendor and a second content model. Legal pages belong in git. Listings belong in Supabase so they can grow into applications later. |
