# MarketLeague (Wagerly)

Private group betting — **Circles**, custom bets, Polymarket-style odds (phase 2).

## Stack

- **Web:** Vite + React 19 + React Router
- **Database & Auth:** [Supabase](https://supabase.com) only (Postgres + RLS + Auth)
- **Mobile (optional):** Expo shell

No Prisma. No separate database connection strings.

## Setup

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com).

### 2. Run the schema

In **Supabase Dashboard → SQL Editor**, paste and run:

[`supabase/migrations/20250601000000_init.sql`](supabase/migrations/20250601000000_init.sql)

This creates tables, RLS policies, signup trigger (profile + wallets), and `join_circle()` RPC.

### 3. Enable auth providers

**Authentication → Providers:** Email, Google, Apple.

**Redirect URLs:**

- `http://localhost:3000/auth/callback`
- `wagerly://` (Expo only)

### 4. Environment

```bash
cp .env.example .env
cp .env.example apps/web/.env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API** (publishable / anon key).

### 5. Install & run

```bash
npm install
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000). Vite loads `.env` from the repo root automatically.

## Deploy to Vercel

This is a **Vite + React SPA** in an npm workspaces monorepo. Either Root Directory option works:

| Root Directory | Config file | Output Directory |
|----------------|-------------|------------------|
| *(empty — repo root)* | [`vercel.json`](vercel.json) | `apps/web/dist` |
| `apps/web` | [`apps/web/vercel.json`](apps/web/vercel.json) | `dist` |

Leave **Build Command**, **Output Directory**, and **Install Command** empty in the Vercel dashboard so `vercel.json` controls them.

### New project

On the Vercel "New Project" screen:

1. **Root Directory** — leave blank (repo root) **or** set to `apps/web`. Both are supported.
2. **Framework Preset** — choose **Other**. Do not pick Turborepo or Vite.
3. **Environment Variables** — expand and add before deploying:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**.

### Vercel project settings (after creation)

| Setting | Value |
|---------|--------|
| **Root Directory** | *(empty)* or `apps/web` |
| **Framework Preset** | **Other** (not Turborepo, not Vite) |
| **Build Command** | *(empty — use vercel.json)* |
| **Output Directory** | *(empty — use vercel.json)* |
| **Install Command** | *(empty — use vercel.json)* |

### Environment variables

Add for **Production**, **Preview**, and **Development**:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon / publishable key |

Redeploy after adding env vars — Vite inlines them at build time.

### Supabase auth redirects

In **Supabase → Authentication → URL Configuration**, add your Vercel URL:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

Also run all SQL migrations in `supabase/migrations/` if you have not already.

## How data flows

```
Browser → Supabase Auth (login)
        → Supabase JS client (queries + RPC)
        → Postgres (RLS enforces circle membership)
```

No Next.js, no API server — the React app calls Supabase directly.

New users get a `public.users` row and play/real wallets automatically via DB trigger.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev -w @wagerly/web` | Web dev server |
| `npm run dev -w @wagerly/mobile` | Expo (optional) |
| `npm run build` | Production build |

## Phase 2

Live odds, bet placements, Realtime subscriptions, Stripe, push notifications.

## Design

[Figma Make — MarketLeague](https://www.figma.com/make/fWHFc7aTJQSFVt9etV4Man/MarketLeague)
