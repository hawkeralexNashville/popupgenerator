# Popup Generator

A multi-tenant newsletter popup and conversion platform. See [the architecture](docs/ARCHITECTURE.md), [Supabase setup checkpoint](docs/SUPABASE_SETUP.md), and authoritative [product requirements](PRODUCT_REQUIREMENTS.md).

## Local setup

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Copy the pooled and direct PostgreSQL URLs, project URL, and public anon key
   from Supabase into `.env.local`. Generate `INTEGRATION_ENCRYPTION_KEY` with
   `openssl rand -base64 32`. Never expose the database password or encryption key.
3. Run `npm ci`, `npm run db:migrate`, and `npm run dev`.
4. In Supabase Auth URL Configuration, set the Site URL and add
   `http://localhost:3000/auth/callback` as a development redirect URL.
5. Put a Beehiiv publication ID and V2 API key into a site's integration form.

The migration provisions workspaces from Supabase Auth, enables tenant RLS, and
creates the public `popup-images` Storage bucket with member-only writes. The
public snippet is generated per site. `npm run build` compiles the standalone
widget before the Next.js application. Production must use HTTPS and a shared
rate limiter when more than one application process is deployed.
