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
pnpm install
pnpm --filter @wagerly/web dev
```

Open [http://localhost:3000](http://localhost:3000). Vite loads `.env` from the repo root automatically.

## Deploy to Vercel

This is a **Vite + React SPA** (not Next.js). Use the Vite preset with the app rooted at `apps/web`.

### Vercel project settings

| Setting | Value |
|---------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | `apps/web` |
| **Include source files outside Root Directory** | Enabled (required for pnpm workspace packages) |
| **Build Command** | `pnpm build` (default from `apps/web/vercel.json`) |
| **Output Directory** | `dist` |
| **Install Command** | `cd ../.. && pnpm install` |

### Environment variables (Vercel → Settings → Environment Variables)

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

### Alternative: deploy from repo root

If Root Directory is `.` (repo root), the root [`vercel.json`](vercel.json) is used instead — no Vite preset needed.

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
| `pnpm --filter @wagerly/web dev` | Web dev server |
| `pnpm --filter @wagerly/mobile dev` | Expo (optional) |
| `pnpm build` | Production build |

## Phase 2

Live odds, bet placements, Realtime subscriptions, Stripe, push notifications.

## Design

[Figma Make — MarketLeague](https://www.figma.com/make/fWHFc7aTJQSFVt9etV4Man/MarketLeague)
