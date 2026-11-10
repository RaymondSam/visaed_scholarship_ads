# Site map and UX

## Public pages

| Path | Page | Index |
| --- | --- | --- |
| `/` | Home | Yes |
| `/scholarships` | Catalog | Yes |
| `/scholarships/[slug]` | Listing detail | Yes while published or closed. No after archive |
| `/scholarships/feed.xml` | RSS or Atom feed of current published listings | Not an HTML page |
| `/about` | About the organization | Yes |
| `/how-it-works` | How a listing is chosen, checked, and updated | Yes |
| `/faq` | Questions students and partners actually ask | Yes |
| `/contact` | Contact form and published contact details | Yes |
| `/privacy` | Privacy notice | Yes |
| `/terms` | Terms of use | Yes |
| `/cookies` | Cookie notice | Yes |
| `/accessibility` | Accessibility statement | Yes |
| `/login` | Email and password | No |
| `/forgot-password` | Request a reset | No |
| `/auth/callback` | Supabase session exchange | No |
| `/auth/invite` | Set a password from an invite | No |
| `/.well-known/security.txt` | Vulnerability contact | Yes |

There is no `/signup` route.

## Signed-in pages

| Path | Who | Purpose |
| --- | --- | --- |
| `/account` | Any signed-in user | Name, optional country, study interests, sign out, link to request deletion |
| `/admin` | Staff | Counts, closing soon, needs re-check, recent inquiries |
| `/admin/scholarships` | Staff | Filterable table of every status |
| `/admin/scholarships/new` | Staff | Create a draft |
| `/admin/scholarships/[id]` | Staff | Edit, including internal notes |
| `/admin/scholarships/[id]/preview` | Staff | Public layout, noindex, works for drafts |
| `/admin/inquiries` | Staff | Contact inbox |
| `/admin/users` | Super admin | Directory, invite, suspend, role, delete |
| `/admin/audit` | Super admin | Filterable audit log |

A student who opens `/admin` gets a not-found response, so the admin URL is not a discovery guide. A signed-out visitor who opens `/admin` or `/account` goes to login and returns to the requested path afterward.

## Header, footer, and small pages

Header, public:

- Wordmark linking home
- Scholarships, About, How it works, FAQ, Contact
- Log in, or the person’s name and Account when a session exists
- Staff also see Admin

A student does not see a Sign up button. Contact is the path for an account request.

Footer:

- Short sentence about what the site is
- The same wayfinding links
- Privacy, Terms, Cookies, Accessibility
- Contact
- Copyright line with the legal name once [D-20](07-gaps-and-decisions.md) is known
- Placeholder social links only after real profiles exist ([D-12](07-gaps-and-decisions.md))

Also ship:

- Skip to content
- `404` with a search or a link back to the catalog
- `500` that does not dump an exception
- Favicon, app icon, default social image
- `sitemap.xml` and `robots.txt`
- Breadcrumbs on the detail page and on admin screens

Phase 2 can add a blog at `/guides` and a newsletter field in the footer. They are absent in v1 so the footer does not collect emails the privacy notice does not cover.

## Home page

Sections, in order:

1. Hero. One sentence on who the catalog is for, a search box, and a link into the catalog. Secondary link to How it works.
2. Trust strip. Staff-reviewed listings, last-checked dates, no fee charged by this site.
3. Featured programs. Up to six published listings marked featured.
4. Closing soon. Published listings with a deadline inside 30 days.
5. Latest. Recently published.
6. Three steps: find a program, read the checked facts, apply on the provider’s site.
7. Short FAQ with a link to the full FAQ.
8. Closing prompt to browse the catalog or contact the team.

Empty database: the home page still renders. Featured and latest sections explain that listings are being prepared and link to About and Contact.

## Catalog

Controls:

- Keyword across title, summary, provider, and description
- Study level
- Field of study
- Host country
- Remote only
- Funding type
- Deadline window: any, 7 days, 30 days, 90 days, rolling
- Sort: deadline soonest, newest, featured first

The page uses query parameters (`q`, `level`, `field`, `country`, `remote`, `funding`, `deadline`, `sort`, `page`) so a filtered view can be shared. Page size is 12.

Each card shows title, provider, one-line funding summary, deadline or Rolling, host country or Remote, study levels, and a Featured or Sponsored badge when those flags are true. A sponsored badge is visible text, not only color.

The empty filter result tells the visitor how to clear filters. It does not pretend there are no scholarships in the system.

Closed listings are excluded from the default catalog and included with a status filter or a direct link. Default view is published and still open, including rolling programs.

## Detail page

Layout:

- Breadcrumb: Home / Scholarships / Title
- Title, provider, status badge
- Summary
- Fact list: deadline in the listing timezone and in the viewer’s local timezone, funding, levels, fields, delivery mode, location, nationality eligibility, last checked
- Description, eligibility, benefits
- Documents the provider typically requires
- Apply panel
- Share: copy link, and the platform share sheet where the browser offers one
- Up to three related published listings, chosen by shared field, then shared host country

Apply panel states:

| `application_mode` | What the visitor sees |
| --- | --- |
| `external` | A link, “Apply on the provider’s site”, opening in a new tab, with the hostname visible |
| `coming_soon` | “Applications through this site are not open for this program.” If an external URL also exists, the external link remains available |

Beside every outbound application link: this site does not charge a fee to view or apply, and the provider’s site is a separate organization.

Nationality copy:

| Data | Copy |
| --- | --- |
| `open_to_all_nationalities` | Open to all nationalities, according to the last check |
| One or more country codes | Eligible nationalities listed by name |
| Neither | Eligibility by nationality was not specified. Check the provider before you apply |

Funding copy follows the same honesty rule: a range, “up to”, “amount varies”, or “amount not specified”.

Closed pages keep the facts and replace the apply panel with the closed date. They use a noindex robots directive only after archival, not merely because the deadline passed. A closed page can still help someone who bookmarked last year’s cycle.

## Account

The invite collects email, full name, and role. Everything else is optional and edited by the person after login:

- Full name
- Country of residence
- Highest study level of interest
- Fields of interest

Email is shown and is changed through the auth email-change flow, not by typing over it in this form. Phone is omitted until there is a reason to have it.

The page includes “Request account deletion”, which goes to the contact form with the privacy reason preselected. Self-serve deletion is a fast follow once the super-admin delete path has been used in production at least once and the privacy process is agreed. See [D-36](07-gaps-and-decisions.md) and the privacy section of [06-security-privacy-and-trust.md](06-security-privacy-and-trust.md).

There is no apply button on the account page in v1.

## Admin listing editor

The editor is one page with clear groups, saved as a draft at any time:

1. Title, slug, summary
2. Provider, provider URL, application URL, application mode
3. Description, eligibility, benefits, required documents
4. Levels, fields, delivery, host country, remote
5. Nationality
6. Funding
7. Deadline, timezone, rolling flag
8. Cover image
9. SEO title and description, with defaults taken from the title and summary
10. Internal notes and source notes
11. Checklist and actions: Save draft, Preview, Publish, Unpublish, Close, Archive, Feature

Slug:

- Generated from the title while the listing is a draft
- Editable until the first publish
- Locked after publish so shared URLs stay stable
- A mistaken slug is a super-admin data fix, with a redirect row added at that time. V1 has no redirect manager UI

Publish stays disabled until the checklist in [04-data-model.md](04-data-model.md) passes. The server enforces the same rules as the form.

Preview shows the public template, a draft banner, and `noindex`.

Cover images are optional. If present, they are used for the card, the detail header, and the social preview.

## Admin operations

Dashboard cards link into a filtered scholarship table:

- Drafts
- Published
- Closing within 14 days
- Review due (review date before today, still published)
- Closed this month

The inquiry inbox shows name, email, reason, date, and status. Staff can mark a message read or closed. V1 does not send a reply from the admin UI. Replies are sent from the normal mailbox so the first release does not grow a helpdesk.

## Super-admin users

The invite form asks for full name, email, and role (`admin` or `student`). It does not ask for a password. The person sets their own password from the invite email.

The directory shows name, email, role, status, and invited date. Actions:

- Resend invite, when status is still invited
- Suspend and reactivate
- Change role between student, admin, and super admin
- Delete, with the person’s email typed to confirm

The UI refuses to suspend, demote, or delete the last active super admin. The server refuses it as well.

## Content outlines

These are outlines for the writers. They are not legal advice and they are not final copy.

### About

- Who operates the site (legal name, once known)
- Who the catalog is for
- The difference between a listing and an award
- How the team is funded, in plain language, including whether featured placement is paid
- How to correct a listing

Until [D-04](07-gaps-and-decisions.md) is decided, About should not claim that listings are never paid for, and it should not sell advertising.

### How it works

- A staff member prepares a listing from the provider’s public materials
- A second look at the checklist happens at publish time
- The page shows the last-checked date
- The visitor applies on the provider’s site
- How to send a correction

### FAQ

Seed at least:

- Does it cost anything to use this site?
- Does a listing mean I will get the scholarship?
- How do I apply?
- Why do some programs not show an amount or a nationality rule?
- How do I get an account?
- How do I report a program that looks like a scam?
- How do I ask you to fix or remove a listing?
- Do you offer scholarships yourselves, or list other organizations’ programs?

The last question needs a true answer from the organization. See [D-08](07-gaps-and-decisions.md).

### Contact reasons

`general`, `correction`, `privacy`, `partnership`, `account_help`

The form asks for name, email, reason, and message. It shows a confirmation that does not echo the message back into the URL. It uses a honeypot field and a server rate limit.

### Privacy, terms, cookies, accessibility

Section lists live in [06-security-privacy-and-trust.md](06-security-privacy-and-trust.md). Each page shows “Last updated”.

## SEO and share previews

| Page | Title pattern | Structured data |
| --- | --- | --- |
| Home | `{Brand} — scholarships you can verify` | `Organization`, `WebSite` with a `SearchAction` for the catalog |
| Catalog | `Scholarships — {Brand}` | `ItemList` of the current page |
| Detail | `{Scholarship title} — {Brand}` | `MonetaryGrant` and `BreadcrumbList` |
| FAQ | `FAQ — {Brand}` | `FAQPage` |
| Other static pages | `{Page} — {Brand}` | None required |

`MonetaryGrant` is the closest schema.org type. Map title, summary, provider URL, host, and amount when the amount exists. Omit amount when it was not stated.

Every HTML page sets a canonical URL, a description, and Open Graph and Twitter card tags. Detail pages use the cover image when they have one, otherwise the default social image.

WhatsApp, iMessage, Slack, and X all use these tags. The default image should be 1200×630 and readable when small, because a shared scholarship link is a primary way this site gets visitors.

The feed contains currently published listings with title, summary, absolute URL, and published date.

## Interface quality bar

- Works at 360px wide and at a typical laptop width
- Text and controls meet WCAG 2.2 AA contrast
- Every control has a visible focus state and an accessible name
- Forms show errors on the field and in a summary
- Status is never communicated by color alone
- Deadline timezone is text, not a hover-only tooltip
- The catalog and detail pages are usable with JavaScript limited to progressive enhancement where the server already rendered the content
- Motion is limited to small state changes. Respect `prefers-reduced-motion`
- Placeholder brand: one theme module, a neutral educational palette, system or a single hosted font with `font-display: swap`. Replace it when [D-06](07-gaps-and-decisions.md) lands

## Content that staff cannot edit in v1

About, FAQ, legal pages, and the home-page explanation are files in the repo (`content/` as MDX or a single messages module). A change is a reviewed deploy. This is deliberate: legal text keeps a git history, and v1 does not need a CMS.

Listings, which change every week, live in Supabase.
