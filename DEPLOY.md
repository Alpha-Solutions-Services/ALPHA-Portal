# Deploy checklist — Alpha Portal

## Git (first time)

From the `PORTAL/` folder:

```bash
git init
git remote add origin https://github.com/Alpha-Solutions-Services/ALPHA-Portal.git
git add .
git commit -m "Initial Alpha Portal app"
git branch -M main
git push -u origin main
```

## DNS
- [ ] Create CNAME `portal.alphasolutions.software` → your host (Vercel/Netlify)
- [ ] SSL certificate issued for the subdomain

## Hosting (fixes `404: NOT_FOUND` on portal.alphasolutions.software)

DNS already points at Vercel. The 404 means **no Vercel project owns that domain yet**.

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → **Add New… → Project**
2. Import **`Alpha-Solutions-Services/ALPHA-Portal`** (Framework: Next.js, Root Directory: `.`)
3. Add env vars from `.env.example` (Production + Preview)
4. Deploy
5. Project → **Settings → Domains** → Add `portal.alphasolutions.software`
   - If Vercel says the domain is used elsewhere, remove it from that other project first, then add it here
6. Wait for SSL / “Valid Configuration”

CLI alternative (from `PORTAL/` after `vercel login`):

```bash
npx vercel --prod
npx vercel domains add portal.alphasolutions.software
```

## Environment variables (hosting)
Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`
- `SMTP_*`, `AUTH_OPS_NOTIFY_EMAIL`
- `GROQ_API_KEY` (+ optional `GROQ_MODEL`)
- `NEXT_PUBLIC_PORTAL_URL=https://portal.alphasolutions.software`
- `NEXT_PUBLIC_SITE_URL=https://www.alphasolutions.software`
- `ADMIN_EMAILS`

## CRM SQL (required for tickets + projects)
- [ ] Run `supabase/portal-crm.sql` in Supabase SQL Editor
- [ ] If CRM was already applied earlier, also run `supabase/portal-crm-project-comments.sql` (client comments RLS)

## Supabase (required for Google login)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication**
2. **Providers → Google** → Enabled (same Client ID/Secret as the main site)
3. **URL Configuration** → add these **Redirect URLs** (keep existing www ones):
   - `https://portal.alphasolutions.software/auth/callback`
   - `https://portal.alphasolutions.software/**`
   - `http://localhost:3001/auth/callback`
4. Save, then try **Continue with Google** again on the portal

Also run SQL if not done:
- [ ] `supabase/schema-admin-portal.sql` if tables missing
- [ ] `supabase/portal-chat-ai.sql` (attachments, edit/delete, AI, storage, realtime)

## Sanity
- [ ] CORS origins: add `https://portal.alphasolutions.software` and `http://localhost:3001`

## Smoke tests
- [ ] Client login → dashboard cards load
- [ ] Messages: send text + image, edit, soft-delete
- [ ] Admin receives email on client DM
- [ ] Admin reply emails the client
- [ ] Contact form on marketing site emails ops + client confirmation
- [ ] Client AI chat replies (Groq)
- [ ] Admin Draft / Summarize / Next step inserts into composer
- [ ] `/portal` and `/admin` on www redirect to portal subdomain
- [ ] Freight routes unchanged
