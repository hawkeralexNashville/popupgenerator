# Newsletter Popup & Conversion Platform

> **Authoritative build specification for Codex**
>
> Build the product described in this file. Treat this document as the
> source of truth for product scope. Do not silently remove,
> reinterpret, or add major features. If a requirement conflicts with
> the current repository or another requirement, stop and explain the
> conflict before making a destructive architectural decision.

## Codex Operating Instructions

Before implementing the product:

1.  Read this entire file before editing code.
2.  Inspect the existing repository, package manager, environment files,
    migrations, tests, and deployment configuration.
3.  Produce a short implementation plan that maps the requirements below
    to concrete components, routes, database tables, APIs, and
    milestones.
4.  Prefer the simplest production-sensible architecture. Do not
    over-engineer V1.
5.  Keep the embedded website widget separate from the dashboard
    application bundle. The widget must be tiny, asynchronous,
    cacheable, and fail silently.
6.  Enforce multi-tenant authorization server-side on every tenant-owned
    resource. Never rely on a client-supplied account ID as
    authorization.
7.  Keep Beehiiv credentials server-side only. Never expose a private
    Beehiiv API key in the embed snippet or browser bundle.
8.  Add database migrations and seed/example data where useful.
9.  Add tests for critical paths: tenant isolation, campaign
    eligibility, variant assignment, impression tracking, conversion
    tracking, frequency suppression, and Beehiiv subscription handling.
10. After each milestone, run the relevant lint, type-check, test, and
    build commands and fix failures before proceeding.
11. Do not add billing, CRM, email sending, or other out-of-scope
    systems unless explicitly requested later.
12. If an external service choice is not fixed by this document, choose
    a sensible default but isolate it behind a clean interface so it can
    be replaced later.

## Definition of Done for V1

V1 is done only when a new user can create an account, add a site,
connect Beehiiv, create and visually customize a popup campaign with
multiple A/B variants, configure basic targeting/trigger/frequency
rules, publish it, install one sitewide snippet on WordPress, receive
real Beehiiv subscriptions, and view per-variant impressions, signups,
and conversion rates in the dashboard. The embedded widget must not
block or break the publisher site if the application backend is
unavailable.

------------------------------------------------------------------------

  -----------------------------------------------------------------------
  Core flow: Design popup → create variants → configure targeting →
  publish → install one sitewide snippet → collect subscribers → measure
  conversions → optimize.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

## 1. Product Overview

Build a lightweight, multi-user web application that allows website
owners to create, customize, deploy, A/B test, and analyze email
newsletter signup popups without requiring a paid WordPress popup
plugin.

The primary initial use case is a high-traffic WordPress content website
receiving 100,000+ monthly page views and using Beehiiv as its
newsletter platform.

The website owner should never need to edit individual WordPress posts.
The application should be architected as a genuine multi-tenant product
so multiple independent users can manage their own websites, campaigns,
Beehiiv integrations, and analytics without seeing one another's data.

## 2. Core Product Principles

-   Extremely lightweight on the publisher's website.
-   Easy enough for a nontechnical user.
-   Visually polished but simple.
-   Multi-tenant from the beginning.
-   Secure and mobile responsive.
-   Built to handle at least 100,000+ monthly page views per customer.
-   Independent of WordPress except for the installation snippet.
-   Able to change popup designs and behavior without modifying
    WordPress.
-   Designed around newsletter conversion, not generic marketing
    automation.
-   Free or extremely inexpensive to operate initially.

Performance is a hard requirement. Failure of the popup service must
never prevent or materially delay the publisher's website from loading.

## 3. User Journey

Landing Page → Sign Up → Create Account → Dashboard → Add Website →
Connect Beehiiv → Create Campaign → Design Popup → Create A/B Variants →
Configure Display Rules → Publish Campaign → Copy Installation Snippet →
Install once in WordPress → Popup operates across eligible posts →
Dashboard records impressions/signups/conversion rates → User improves
variants based on results.

## 4. Public Landing Page

Create an extremely simple public landing page. Do not create an
elaborate SaaS marketing website.

### Headline

Turn Website Traffic Into Email Subscribers

### Supporting copy

Create, test, and optimize newsletter signup popups without another
expensive WordPress plugin.

### CTAs

-   Sign Up
-   Log In

Keep the page clean, modern, responsive, and intentionally minimal. No
giant marketing site, testimonials, pricing tables, stock photography,
or unnecessary sections are required for V1.

## 5. Authentication

-   Sign up
-   Log in
-   Log out
-   Password reset or passwordless authentication
-   Persistent secure sessions

Prefer a proven authentication provider/library rather than creating
authentication/security infrastructure from scratch. Each user must have
an isolated workspace.

## 6. Multi-Tenant Architecture

Design the application as multi-tenant from the beginning. One user's
sites, campaigns, Beehiiv credentials, subscriber information,
analytics, and configuration must never be accessible to another user.

Conceptual relationship: User/Account → Sites → Campaigns → Variants →
Events.

Do not build the application around one hard-coded website.

## 7. Website Management

Users can add one or more websites. Each website should contain: -
Website name - Website URL/domain - Unique site ID - Installation
status - Beehiiv connection - Campaigns - Analytics

## 8. Installation Snippet

Each website receives ONE lightweight JavaScript installation snippet,
installed once sitewide. The exact implementation can differ if a better
architecture is appropriate.

``` text
<script async src="https://APP-DOMAIN.com/widget.js" data-site="UNIQUE_SITE_ID"></script>
```

For WordPress, provide simple instructions for installing the snippet
globally using Code Snippets, WPCode, a theme script insertion
mechanism, or a future dedicated plugin. Newly published posts should
automatically be eligible without additional installation.

## 9. WordPress Detection

-   Current URL
-   Page title
-   Whether the page appears to be an article/post
-   WordPress categories/tags where reliably available
-   Referrer
-   Device class
-   Campaign eligibility

Allow campaigns to target or exclude URLs/categories. V1 does not
require a dedicated WordPress plugin.

## 10. Popup Campaigns

A campaign contains campaign name, status, website, variants, trigger
rules, targeting rules, frequency rules, Beehiiv destination, and A/B
testing configuration.

Statuses: Draft / Active / Paused / Archived.

## 11. Visual Popup Builder

The user must be able to design the popup without writing code. The
editor should contain a live preview.

### Content

-   Image
-   Headline
-   Subheadline/body copy
-   Email field
-   Email placeholder
-   CTA button
-   Optional small supporting text
-   Close button

### Typography

-   Font family
-   Headline font
-   Body font
-   Font size
-   Font weight
-   Bold text
-   Alignment
-   Line spacing where appropriate

### Colors

-   Background
-   Text
-   Headline
-   Button background
-   Button text
-   Input
-   Border

### Button

-   Button text
-   Font
-   Font size
-   Font weight
-   Border radius
-   Button size/padding
-   Full-width or natural-width
-   Alignment

### Image

-   Upload image
-   Remove image
-   Position image
-   Control basic sizing
-   Hide image on mobile if desired

Images must be optimized appropriately.

## 12. Layouts

-   Vertical: image, headline, subheadline, email, button.
-   Horizontal: image beside signup content.
-   No Image: headline, subheadline, email, button.
-   Wide / Banner: wider presentation designed for desktop screens.

Use predefined layouts rather than a full drag-and-drop page builder in
V1. All layouts must adapt intelligently to mobile.

## 13. Popup Presentation

-   Modal: centered over the page.
-   Slide-Up: enters from the bottom of the screen.
-   Focus / Blur Modal: visually lifts above the page while the
    background receives a tasteful blur/dim effect.
-   Inline: architecture should permit an inline signup component in the
    future or V1 if straightforward.

Animations must use lightweight CSS transitions rather than heavy
animation libraries.

## 14. Trigger Rules

### Scroll Depth

-   25%
-   50%
-   75%
-   Custom percentage

Default recommendation: 50%.

### Time

Optionally show after X seconds.

### Exit Intent

Desktop-only if reliably implementable.

### Trigger Logic

Where multiple triggers are enabled, allow simple ANY or ALL logic. Do
not over-engineer the rules engine in V1.

## 15. Frequency Controls

After a popup is dismissed, allow the user to suppress it for: -
Session - 1 day - 7 days - 30 days - Custom duration

Default: 7 days. Use appropriate first-party browser storage/cookies.

## 16. Subscriber Suppression

After a successful subscription, stop displaying newsletter signup
campaigns to that browser for an appropriate duration using first-party
state. This is best-effort suppression because storage can be deleted,
blocked, or differ across devices.

## 17. Beehiiv Integration

Beehiiv is the initial newsletter provider. Connect publications using
the supported Beehiiv API/integration mechanism and store credentials
securely server-side. Never expose private Beehiiv API credentials
inside the WordPress/browser snippet.

On signup: validate email → submit securely → add subscriber to
configured Beehiiv publication → record successful conversion → display
success state → store local subscribed status → close or transform
popup. Handle errors gracefully.

## 18. A/B Testing

A campaign can contain unlimited variants, subject to reasonable
technical safeguards. Each variant can independently customize headline,
subheadline, image, layout, colors, button, typography, CTA, and
presentation style.

## 19. Traffic Allocation

Initial A/B tests should distribute traffic evenly. With four variants,
each receives 25%. Variant assignment should remain consistent during an
appropriate visitor/session period.

## 20. A/B Analytics

Record legitimate impressions, successful conversions, and conversion
rate for each variant. Do not count loading widget.js as an impression.

  Variant   Impressions   Signups   Conversion
  --------- ------------- --------- ------------
  A         1,000         31        3.10%
  B         1,020         51        5.00%
  C         990           19        1.92%

## 21. Additional Analytics

-   Total impressions
-   Total signups
-   Overall conversion rate
-   Impressions by variant
-   Signups by variant
-   Conversion rate by variant
-   Campaign performance
-   Date ranges

Useful additional dimensions, if inexpensive to collect: desktop vs
mobile, URL/page, referrer, and date. Avoid collecting unnecessary
personal data.

## 22. Analytics Definitions

-   Impression: popup successfully becomes visible to the visitor.
-   Signup: Beehiiv confirms a successful subscription operation or
    another explicitly defined successful outcome.
-   Conversion Rate: successful signups divided by valid impressions.

Avoid inflating statistics through page loads where the popup never
appeared.

## 23. Automatic Optimization

Architect for future manual A/B testing and optional auto-optimization.
Do not declare a winner after a handful of conversions. V1 may use equal
allocation and clear reporting only. If auto-optimization is
implemented, use a statistically defensible algorithm such as a
multi-armed bandit or confidence mechanism and explain insufficient-data
states.

## 24. Targeting

Support basic include/exclude targeting for all eligible posts, URL
patterns, categories, and tags where reliably detectable. This should
enable contextual campaigns such as food, things-to-do, local news, or
general newsletter pitches without changing WordPress code.

## 25. Campaign Priority

If multiple campaigns qualify for one page, use deterministic campaign
priority. Only one modal popup should appear during a page experience.

## 26. Performance Requirements

-   Load asynchronously/deferred.
-   Never block initial page rendering.
-   Keep the embedded widget very small.
-   Avoid large JavaScript frameworks in the embedded widget.
-   Avoid unnecessary third-party dependencies.
-   Cache campaign configuration.
-   Optimize images.
-   Minimize API requests.
-   Batch/non-block analytics requests where appropriate.
-   Use sendBeacon or equivalent where appropriate.
-   Avoid layout shift.
-   Avoid materially affecting Core Web Vitals.

If the popup service is unavailable, fail silently and do nothing. The
underlying website must continue to work normally.

## 27. Architecture

### GitHub

Source control.

### Frontend Application

Modern web framework such as Next.js/React or an equivalent selected by
the coding agent, used for landing page, authentication, dashboard,
popup designer, and analytics.

### Backend

Authentication/authorization, campaign configuration, analytics, Beehiiv
requests, secure credentials, and tenant isolation.

### Database

Managed relational database such as PostgreSQL; Supabase or equivalent
is acceptable.

### Widget

A separate tiny vanilla JavaScript/TypeScript bundle. Do not ship the
dashboard's React/Next.js bundle onto publisher websites.

## 28. Suggested Data Model

``` text
users
accounts/workspaces
account_members
sites
integrations
campaigns
variants
campaign_rules
visitor_assignments
events
daily_analytics
```

Every relevant database query must enforce tenant ownership.

## 29. Security

-   Never expose Beehiiv secrets client-side.
-   Encrypt/protect integration credentials appropriately.
-   Validate API input.
-   Sanitize user-generated styling/content.
-   Prevent arbitrary JavaScript injection through the popup editor.
-   Rate-limit subscription endpoints.
-   Rate-limit analytics abuse where practical.
-   Validate site IDs.
-   Enforce authorization server-side.
-   Protect against cross-tenant access.
-   Use HTTPS.
-   Use secure authentication.
-   Implement appropriate CSRF/XSS protections.
-   Never trust a user/account ID merely because the browser supplied
    it.

## 30. Bot and Analytics Protection

-   Avoid recording impressions from known crawlers where practical.
-   Rate-limit abusive event submissions.
-   Prevent easy duplicate signup-event inflation.
-   Distinguish page/script loads from genuine popup impressions.

Do not build an enormous fraud-detection system for V1.

## 31. Dashboard

Keep the dashboard simple. Show sites, a 30-day performance summary,
campaign status, variant count, and conversion rate. Primary actions:
Create Campaign, Manage Site, View Analytics. Do not overwhelm the user
with enterprise analytics.

## 32. Popup Builder UX

Use controls on the left and a live popup preview on the right. Group
controls into Content, Design, Layout, Behavior, Targeting, A/B Test,
Integration, and Publish. Include desktop/mobile preview toggles.

## 33. Publishing

When the user presses Publish, save campaign configuration to the
backend. The installed website snippet should automatically retrieve the
new configuration within the configured cache window. No WordPress code
changes, reinstallation, post edits, or manual cache clearing should be
required.

## 34. Installation Verification

Provide a Verify Installation action that attempts to detect the script
on the specified website and displays Installed or Not detected. This is
strongly preferred for easier onboarding.

## 35. V1 Scope

1.  Authentication
2.  Multi-user architecture
3.  Site creation
4.  Beehiiv integration
5.  One global installation snippet
6.  Popup visual editor
7.  Images/headlines/subheads/email/button
8.  Fonts/colors/sizing
9.  Vertical/horizontal layouts
10. Modal/blur/slide presentation
11. Scroll trigger
12. Frequency capping
13. Subscriber suppression
14. Unlimited practical A/B variants
15. Equal traffic allocation
16. Impression tracking
17. Conversion tracking
18. Conversion-rate analytics
19. URL/category targeting where reliable
20. Campaign management
21. Mobile responsiveness
22. Performance safeguards
23. Minimal public landing page

## 36. Explicitly NOT Required for V1

Do not turn this into HubSpot. V1 does not need: - CRM - Email sending -
Newsletter creation - Full drag-and-drop Canva-style editor - AI
copywriting - Billing - Stripe - Team permissions beyond basic
architecture - Heatmaps - Session recordings - Push notifications -
SMS - Marketing automation - Hundreds of templates - Enterprise
reporting - WordPress plugin - Custom domains - Complex attribution -
Full statistical experimentation platform

Beehiiv sends the emails. This product gets people onto the Beehiiv
list.

## 37. Future Architecture

-   Kit/ConvertKit integration
-   Mailchimp integration
-   Substack-compatible workflows if APIs permit
-   Multiple newsletters per account
-   Team members
-   Additional popup templates
-   Inline forms
-   Sticky signup bars
-   AI-generated copy variants
-   Automatic A/B optimization
-   Revenue attribution
-   SaaS billing
-   WordPress plugin
-   Shopify integration
-   Other CMS platforms

## 38. Primary Success Metric

The product exists to maximize email subscribers generated per 1,000
eligible website visitors - not popup impressions, clicks, or
engagement. - 1% conversion = 1,000 signups per 100,000 impressions - 2%
= 2,000 signups - 3% = 3,000 signups

This is why experimentation is central to the product.

## 39. Example Nashville To Do Configuration

-   Site: NashvilleToDo.com
-   Newsletter Provider: Beehiiv
-   Campaign: General Nashville Newsletter
-   Eligibility: WordPress blog posts
-   Trigger: 50% scroll depth
-   Presentation: centered modal with dim/blur background
-   Dismissal Rule: do not display again for 7 days
-   Successful Signup: suppress future newsletter popups on that
    browser.

### Variant A

Headline: Required Nashville Reading Subhead: News, nostalgia, gossip,
debates, and things actually worth doing - three times a week. CTA: Sign
Me Up

### Variant B

Headline: Nashville Is Never Boring Subhead: Get the stories, places,
debates, and things worth knowing delivered to your inbox. CTA: Get the
Newsletter

### Variant C

Headline: You're Already Reading Nashville Subhead: Get the good stuff
delivered straight to your inbox three times a week. CTA: I'm In

Traffic begins approximately 33.3% / 33.3% / 33.3%, and the dashboard
measures actual performance.

## 40. Instructions to the Coding AI

Treat this document as the product specification. Before writing large
amounts of code: 1. Propose the technical architecture. 1. Define the
database schema. 1. Define authentication and tenant isolation. 1.
Define how the lightweight embedded widget communicates with the
backend. 1. Define Beehiiv integration. 1. Define
event/impression/conversion tracking. 1. Define deployment architecture
and estimated operating costs. 1. Identify any requirement that
introduces significant cost, security, privacy, performance, or
scalability concerns. 1. Separate V1 requirements from future
enhancements. 1. Create an implementation plan divided into small,
testable milestones.

Do not prematurely build features outside this specification. When
choosing between architectural sophistication and simplicity, favor the
simplest reliable architecture capable of safely serving multiple
customers and high-traffic websites.

Most importantly: the embedded widget must remain extremely lightweight
and must never become a meaningful performance burden on the websites
using it.

------------------------------------------------------------------------

## Codex Implementation Sequence

Use this order unless the existing repository strongly justifies another
sequence:

1.  **Foundation:** project setup, environment validation,
    authentication, database connection, account/workspace model, tenant
    authorization helpers.
2.  **Sites & integrations:** site CRUD, unique public site IDs, Beehiiv
    connection storage and server-side verification.
3.  **Campaign model:** campaigns, variants, targeting rules, trigger
    rules, frequency settings, statuses, and priority.
4.  **Visual builder:** live preview plus
    content/design/layout/presentation controls defined in this
    specification.
5.  **Public widget configuration API:** safe public configuration
    payload keyed by site ID; no secrets.
6.  **Embedded widget:** tiny framework-free or near-framework-free
    bundle, asynchronous load, eligibility evaluation, variant
    assignment, popup rendering, suppression, and graceful failure.
7.  **Subscription API:** validate requests, rate-limit, call Beehiiv
    server-side, record successful conversion, return safe success/error
    states.
8.  **Analytics:** impression and conversion events, aggregation, date
    filtering, per-campaign and per-variant reporting.
9.  **Publishing & verification:** publish/pause flow, cache
    invalidation/versioning, installation snippet, installation
    verification.
10. **Hardening:** security review, tenant isolation tests,
    bot/duplicate protection, responsive QA, accessibility, performance
    testing, production build.

## Required Final Verification

Before declaring V1 complete, demonstrate or test all of the following:

-   Two separate user accounts cannot access each other's sites,
    campaigns, analytics, integrations, or secrets.
-   A user can create at least three variants and traffic is allocated
    approximately evenly for a new equal-weight test.
-   An impression is recorded only when a popup is actually shown, not
    merely when the script loads.
-   A successful Beehiiv subscription records exactly one attributable
    conversion under normal operation.
-   Closing a popup suppresses it for the configured duration.
-   Successful signup suppresses future newsletter popups in that
    browser according to the product rules.
-   Targeting/exclusion and campaign priority behave deterministically.
-   Editing and republishing a campaign does not require changing the
    WordPress snippet.
-   The publisher page remains usable when the widget configuration
    endpoint, analytics endpoint, or subscription service is
    unavailable.
-   The widget loads asynchronously and does not import the dashboard's
    application bundle.
-   No Beehiiv private credential appears in browser source, public
    configuration responses, logs intended for clients, or the
    installation snippet.
-   Mobile and desktop layouts are usable and the modal has an obvious
    close mechanism.
-   Lint, type-check, automated tests, and production build pass.

When implementation decisions remain open, document them in the
repository rather than silently inventing product behavior.
