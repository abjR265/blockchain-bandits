# web

Next.js 14 (App Router) analyst dashboard for Blockchain-Bandits.

## Dev

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Visit http://localhost:3000.

## Routes

- `/` — dashboard (search, stats, recent flags)
- `/wallet/[address]` — wallet detail (risk score, SHAP features, feedback)

## Hooking up the real API

The UI currently reads from `lib/mock.ts`. To switch to live data, swap
imports in `app/page.tsx` / `app/wallet/[address]/page.tsx` to call `api`
from `lib/api.ts` (TanStack Query is already installed but not wired).

## Deploy

```bash
vercel           # preview
vercel --prod    # production
```
