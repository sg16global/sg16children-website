/** GET /api/sg16/health — sg16children.com brain status (direct, no Engine). */

import { pingBrain, getBrainConfig } from '../../lib/brain.mjs';
import { VALID_AGE_TIERS } from '../../lib/prompts.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const configured = !!getBrainConfig(env).key;

  if (!configured) {
    return json({
      status: 'degraded',
      enabled: true,
      brain: 'mistralbrain-cloud',
      ready: false,
      error: 'MISTRAL_BRAIN_KEY not set on Cloudflare Pages',
      service: 'sg16-children-world',
      tiers: VALID_AGE_TIERS,
    });
  }

  const mistralBrain = await pingBrain(env);
  return json({
    status: mistralBrain.ok ? 'ok' : 'degraded',
    enabled: true,
    brain: 'mistralbrain-cloud',
    ready: mistralBrain.ok,
    mistralBrain,
    service: 'sg16-children-world',
    route: 'direct',
    tiers: VALID_AGE_TIERS,
    agents: { '6-11': 'h-guide', '12-17': 'youth-teen', '18+': 'adult-guide' },
  });
}
