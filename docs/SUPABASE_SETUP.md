# Supabase setup checkpoint

The code is ready for a real Supabase project, but no production credentials are
included. A project owner must complete these steps before database-backed local
development or deployment can continue:

1. Create a project at Supabase and save its database password in a password
   manager.
2. Open **Project Settings → Database → Connection string**. Copy the transaction
   pooler URL into `DATABASE_URL` and the session/direct URL into `DIRECT_URL` in
   a local `.env.local` file. Do not commit that file.
3. Open **Project Settings → API**. Copy the project URL into
   `NEXT_PUBLIC_SUPABASE_URL` and the public anon key into
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These two values identify the public project;
   never substitute the `service_role` key.
4. Generate the server-only Beehiiv encryption key with
   `openssl rand -base64 32` and put it in `INTEGRATION_ENCRYPTION_KEY`.
5. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` locally. In production, use
   the final HTTPS application origin (for example,
   `https://popupgenerator.vercel.app`). The sitewide install snippet loads
   `/widget.js` from this application origin, never from the Supabase project URL.
6. Run `npm install`, `npx prisma generate`, and `npm run db:migrate`. The checked-in
   migration creates the application tables, Auth workspace trigger, RLS policies,
   and `popup-images` Storage bucket.
7. In **Authentication → URL Configuration**, set the production Site URL. Add
   `http://localhost:3000/auth/callback` and the production `/auth/callback` URL
   to Redirect URLs.
8. In **Authentication → Email Templates**, keep confirmation and password-reset
   templates enabled. Configure custom SMTP before production if dependable mail
   delivery is required.
9. Start with `npm run dev`, create two accounts, and confirm each sees a different
   workspace. Upload an image and check that it appears in the `popup-images`
   bucket beneath that account's workspace folder.

Beehiiv credentials are entered later in the authenticated site screen. They are
verified against Beehiiv and AES-GCM encrypted before database storage. Do not put
a Beehiiv key in any `NEXT_PUBLIC_*` variable.
