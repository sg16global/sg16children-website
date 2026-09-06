/** Direct SG16 Mistral X client — sg16children.com → api.mistralbrain.com (no Engine). */

const DEFAULT_BRAIN_URL = 'https://api.mistralbrain.com';
const USER_ID = 'sg16-children-world';

function messagesToTask(messages) {
  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');
  const recent = messages
    .filter((m) => m.role !== 'system')
    .slice(-8)
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
    .join('\n');
  let task = '';
  if (systemParts) task += `System context:\n${systemParts}\n\n`;
  task += `Conversation:\n${recent}\n\nReply as the assistant. Be helpful and concise.`;
  return task.slice(0, 10000);
}

function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user' && messages[i].content) {
      return String(messages[i].content).slice(0, 2000);
    }
  }
  return '';
}

export function getBrainConfig(env) {
  const key = (env.MISTRAL_BRAIN_KEY || env.DOOR_API_KEY || '').trim();
  const brainUrl = (env.MISTRAL_BRAIN_URL || DEFAULT_BRAIN_URL).replace(/\/$/, '');
  return { key, brainUrl };
}

export async function pingBrain(env) {
  const { brainUrl } = getBrainConfig(env);
  const started = Date.now();
  try {
    const res = await fetch(`${brainUrl}/api/v1/ping`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`ping ${res.status}`);
    const data = await res.json();
    return {
      ok: data?.status === 'ok',
      latencyMs: Date.now() - started,
      brain: 'mistralbrain-cloud',
      url: brainUrl,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      brain: 'mistralbrain-cloud',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function callBrainChat({ env, messages, timeoutMs = 120000 }) {
  const { key, brainUrl } = getBrainConfig(env);
  if (!key) throw new Error('MISTRAL_BRAIN_KEY not configured');

  const task = messagesToTask(messages);
  const res = await fetch(`${brainUrl}/api/v1/control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Door-Key': key,
      'X-User-Id': USER_ID,
    },
    body: JSON.stringify({ task, max_steps: 1, user_text: lastUserText(messages) }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('Brain returned invalid JSON');
  }

  if (!res.ok) {
    throw new Error(data.error || `Brain request failed (${res.status})`);
  }
  if (data.status === 'refused' || data.status === 'blocked') {
    throw new Error(data.code || 'content_policy');
  }

  const content = data.answer?.trim();
  if (!content) throw new Error('Brain returned empty response');
  return content;
}
