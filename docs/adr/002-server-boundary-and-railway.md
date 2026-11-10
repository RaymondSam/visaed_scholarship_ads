# ADR 002: Server boundary and Railway

- Status: Build baseline
- Date: 2026-11-10

## Context

Supabase is the system of record for accounts, listings, files, and authorization. Some actions cannot run in the browser: creating users, sending the contact inbox mail, and closing listings after their deadline. The team has Railway available for backend processes.

The Supabase service-role key bypasses Row Level Security. Any design that ships that key to the browser is unsafe.

## Decision

The v1 backend is Next.js server code on Vercel, backed by Supabase.

- The browser uses the Supabase anon key and the signed-in user's session.
- Public reads use the anon key on the server.
- Scholarship create and edit use the signed-in staff session on the server, and RLS still applies.
- The service-role key is used only inside specific server routes: account administration, contact-message insert, and the deadline cron.
- A daily Vercel Cron job closes published listings whose deadline has passed.

Do not provision Railway for v1.

Add a Railway service when a concrete workload shows up that Vercel Cron and short serverless functions cannot host:

- a task that regularly exceeds the Vercel function duration limit
- a queue that needs durable retries (bulk CSV import, image pipelines, malware scanning of future application files)
- a long-lived worker or a protocol a serverless function cannot hold open

When that happens, Railway receives its own credentials and the minimum database privilege that job needs. It does not become a second place to implement ordinary page logic.

## Consequences

- User creation, which depends on the Auth admin API, lives in this repo under a super-admin server route.
- Local development does not require Railway.
- Operational complexity stays at two vendors (Vercel and Supabase) plus an email provider.
- The cron schedule and the function duration limit are documented operating constraints. Hitting them is the signal to introduce Railway, not a reason to introduce it on day one.

## Options considered

| Option | Why it was set aside for v1 |
| --- | --- |
| Supabase Edge Functions for every privileged call | Works, and it keeps the service role inside Supabase. It also splits application logic across two deploy paths. Edge Functions remain a valid home for a single function later if a route needs to sit next to the database. |
| Railway API from the start | Extra service to secure, log, and pay for before any long-running job exists. |
| Privileged operations from the browser with the service-role key | Exposes full database bypass to every visitor who can read the bundle. Rejected. |
