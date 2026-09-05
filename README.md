# SG16 Children World — sg16children.com

Parent-gated, age-aware AI learning app (**Robo**) for **sg16children.com**, backed by **SG16 Mistral X** at `api.mistralbrain.com` via `sg16engine.com`.

| Layer | Host | Repo / service |
|-------|------|----------------|
| Static app | `sg16children.com` | This repo (Cloudflare Pages) |
| Children API | `api.sg16children.com` | `backend/` on Railway (optional proxy) |
| Brain | `api.mistralbrain.com` | Cloudflare Workers AI — via `sg16engine.com/api/sg16/*` |

## PWA (standalone home-screen app)

This site is its **own installable app** on `sg16children.com` — separate from SG16 Engine, Saif Tech, and SG16 Finance.

Before deploy, regenerate manifest + service worker:

```powershell
node scripts/pwa-generate.mjs .
npx wrangler pages deploy . --project-name sg16-children-world --commit-dirty=true
```

Edit `pwa.config.json` and bump `"version"` when precache paths change. Master generator: `shared/sg16-pwa/` in the MISTRAL BRAIN workspace.

## Structure

```
index.html              Robo app (main product)
assets/backgrounds/     Tier theme backgrounds
landing/                Archived promo video landing page
backend/                Express API — proxies to SG16 engine brain
_redirects              Cloudflare Pages: /api/* → api.sg16children.com
```

## Local preview

**Static site**

```powershell
npx --yes serve .
```

Open http://localhost:3000

**API (proxies to engine)**

```powershell
cd backend
npm install
$env:SG16_ENGINE_URL = "https://sg16engine.com"
npm run dev
```

Chat requests from localhost use `http://localhost:8787/api/sg16/chat`.

## Deploy — Cloudflare Pages (static)

1. Connect **sg16global/sg16children-website** in Cloudflare Pages.
2. **Build command:** *(empty)*
3. **Output directory:** `/`
4. Custom domains: `sg16children.com`, `www.sg16children.com`

## Deploy — Railway (children API)

1. New service from this repo; set **Root directory** to `backend`.
2. Env vars:
   - `NODE_ENV=production`
   - `SG16_ENGINE_URL=https://sg16engine.com`
   - `SG16_CHILDREN_ORIGINS=https://sg16children.com,https://www.sg16children.com`
3. Custom domain: `api.sg16children.com`
4. Ensure engine Railway has `SG16_CHILDREN_ORIGINS` including `https://sg16children.com` (for direct API calls if needed).

## Engine dependency

The brain route must be live on the engine stack:

- `GET /api/sg16/health`
- `POST /api/sg16/chat`

Deploy **sg16-ai-engine** after merging the `backend/lib/childrenWorld/` integration.

## Assets

- `assets/backgrounds/` — tier themes (6–11, 12–17, 18+)
- `/landing/` — archived promo landing page (static gradient background)

<!-- redeploy: restore sovereign brain 2026-08-28T01:22:00Z -->
