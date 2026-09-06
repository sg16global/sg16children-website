# SG16 Children World — sg16children.com

Parent-gated, age-aware AI learning app (**Robo**) for **sg16children.com**, backed by **SG16 Mistral X** at `api.mistralbrain.com`.

## Architecture (independent project)

| Layer | Host | Role |
|-------|------|------|
| Site + chat UI | `sg16children.com` | Cloudflare Pages (static + Functions) |
| Brain | `api.mistralbrain.com` | SG16 Mistral X — **direct** (no Engine hop) |
| Safety + prompts | `functions/lib/*` | Owned by this project |

```
Browser → sg16children.com/api/sg16/chat → api.mistralbrain.com/api/v1/control
```

**SG16 Engine (`sg16engine.com`) is a separate product** — not in this chat path.

## Cloudflare Pages secrets

Set in Pages → Settings → Environment variables:

- `MISTRAL_BRAIN_KEY` — same as Worker `DOOR_API_KEY`
- `MISTRAL_BRAIN_URL` — `https://api.mistralbrain.com` (optional)

## Local dev

```powershell
cd projects/sg16children-website
npx wrangler pages dev . --port 8787
# Set MISTRAL_BRAIN_KEY in wrangler or .dev.vars
```

Chat: `http://localhost:8787/app/` → `POST /api/sg16/chat`

## API

- `GET /api/sg16/health` — brain ping + project status
- `POST /api/sg16/chat` — `{ sessionId, ageTier, nickname, message, history }` → `{ reply, safe, flags }`

## Deploy

Push to GitHub → Cloudflare Pages project `sg16-children-world`.

Ensure **Functions** deploy with static assets (do not static-only deploy).
