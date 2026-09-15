# V1 architecture and implementation plan

## System shape

Popup Generator is a single Next.js application backed by Supabase PostgreSQL,
Auth, and Storage, plus a
separately compiled, framework-free widget. The application owns the public
landing page, authenticated dashboard, JSON APIs, Beehiiv proxy, and analytics.
The widget is built from `widget/index.ts` into the independently cacheable
`public/widget.js`; it never imports React or the dashboard bundle.

Production is intended to run on a serverless Node host (Vercel, Fly.io, or a
small container) with a managed Supabase project. A practical starting footprint
is a free/low-cost web tier plus Supabase's free or Pro tier. The likely cost
drivers are image storage/optimization and event volume. V1 therefore stores
optimized public Storage URLs and narrow event rows. Daily
rollups can be added when raw-event retention becomes material.

## Data and tenancy

The SQL migration defines users, workspaces, memberships, sites, encrypted
integrations, campaigns, variants, events, and visitor assignments. Every
dashboard query starts from the authenticated user's workspace membership and
joins through that workspace. Public endpoints accept opaque public IDs, never
workspace IDs, and expose a strict allow-list of published presentation data.

Authentication uses Supabase Auth email/password accounts, verified server-side
with `getUser`. The SSR client refreshes secure sessions through cookies. A
database trigger provisions each Auth user an isolated workspace, and PostgreSQL
row-level-security policies provide defense in depth beneath application tenant
checks. Supabase sends confirmation and password-reset mail, so the application
never handles password hashes or reset tokens.

Beehiiv API keys are encrypted at rest with AES-256-GCM using
`INTEGRATION_ENCRYPTION_KEY`. They are decrypted only inside server code for
verification and subscription. They are never selected by public configuration
queries or returned to the browser.

## Public/widget protocol

1. An async sitewide script reads its `data-site` public ID.
2. It fetches `GET /api/public/sites/:siteId/config`; cache headers and a
   publication version allow inexpensive edge caching.
3. The widget detects URL, article-like markup, WordPress category/tag classes,
   referrer, and device class. It chooses the first eligible campaign by priority.
4. A stable first-party random visitor ID deterministically selects one active
   variant with equal allocation. The assignment is retained locally.
5. Only after the popup becomes visible does the widget send an impression by
   `sendBeacon` (with a fetch fallback).
6. Subscription posts email, site/campaign/variant IDs, and an idempotency key to
   the backend. The backend validates their relationship, applies rate limits,
   calls Beehiiv, and atomically records one conversion.
7. Dismissal and subscriber suppression are first-party local-storage records.

All widget work is delayed until after parsing; endpoint failures are caught and
discarded. No widget error escapes into the publisher page.

## Security, privacy, and scale notes

- API validation uses Zod; text is rendered with DOM text nodes/React escaping,
  and style values are schema constrained. Arbitrary HTML, CSS, and JavaScript
  are not accepted.
- In-memory rate limiting is sufficient for local/single-instance V1 but must be
  replaced with a shared Redis-compatible limiter before horizontally scaling.
- CORS permits public widget calls, while tenant APIs require Supabase sessions.
  Mutating dashboard requests also rely on same-site cookies and reject foreign
  origins in middleware.
- IP addresses are reduced to a one-way daily abuse hash; raw IPs and emails are
  not stored in analytics. Subscriber email is sent to Beehiiv and discarded.
- Installation verification performs a constrained HTTPS fetch. DNS rebinding
  and private-network destinations are rejected to reduce SSRF risk.
- At 100k monthly views/customer, edge-cached config and beacon-sized writes are
  inexpensive. Larger event volume should move ingestion to a queue and daily
  rollups without changing the widget contract.

## Milestones

1. **Foundation:** Next.js, environment validation, migration, Supabase Auth,
   registration, workspace bootstrap, and membership-scoped repository helpers.
2. **Sites/integrations:** site CRUD, opaque IDs, install instructions,
   verification, encrypted Beehiiv connection and server-side verification.
3. **Campaign model/builder:** status/priority, variants, trigger/frequency and
   targeting schemas, visual controls, responsive live preview, publishing.
4. **Delivery:** allow-listed public config, standalone widget, deterministic
   eligibility and assignment, graceful failure and suppression.
5. **Conversion/analytics:** server-side Beehiiv subscribe, idempotent events,
   dashboard totals/date filtering and per-variant conversion rates.
6. **Hardening:** isolation/eligibility/assignment/event/frequency/Beehiiv tests,
   accessibility and responsive review, lint, type-check, production build, and
   widget size budget.

## Explicit boundaries

V1 uses equal allocation and reporting only; it does not auto-select winners.
Inline rendering remains a supported enum for future use but is not exposed in
the V1 editor. Categories/tags are best-effort because WordPress has no universal
front-end metadata contract without a plugin. Billing, CRM, email creation,
teams/roles UI, provider expansion, and a WordPress plugin remain out of scope.
