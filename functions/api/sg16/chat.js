/** POST /api/sg16/chat — sg16children.com direct brain (independent from Engine). */

import { runChildrenChat, isBrainConfigured } from '../../lib/chat.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isBrainConfigured(env)) {
    return json({ error: 'Brain key not configured on sg16children.com' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  try {
    const result = await runChildrenChat(env, body);
    return json(result);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Chat failed' }, 400);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, X-SG16-Client',
    },
  });
}
