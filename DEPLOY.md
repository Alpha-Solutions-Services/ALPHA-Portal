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

## Hosting
- [ ] Connect `ALPHA-Portal` repo to Vercel/Netlify (root = repo root)
- [ ] Set env vars from `.env.example`

## Environment variables (hosting)
Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`
- `SMTP_*`, `AUTH_OPS_NOTIFY_EMAIL`
- `GROQ_API_KEY` (+ optional `GROQ_MODEL`)
- `NEXT_PUBLIC_PORTAL_URL=https://portal.alphasolutions.software`
- `NEXT_PUBLIC_SITE_URL=https://www.alphasolutions.software`
- `ADMIN_EMAILS`

## Supabase
- [ ] Run `supabase/schema-admin-portal.sql` if tables missing
- [ ] Run `supabase/portal-chat-ai.sql` (attachments, edit/delete, AI, storage, realtime)
- [ ] Auth → Redirect URLs:
  - `https://portal.alphasolutions.software/auth/callback`
  - `http://localhost:3001/auth/callback`

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
