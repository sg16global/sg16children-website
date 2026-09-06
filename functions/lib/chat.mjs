import { callBrainChat, getBrainConfig } from './brain.mjs';
import { buildModelMessages } from './history.mjs';
import { fullSystemPrompt, VALID_AGE_TIERS } from './prompts.mjs';
import { Action, applySafetyPipeline, classify, crisisMessage, refusalMessage } from './safety.mjs';

const KALI_AGENT_BY_TIER = {
  '6-11': 'h-guide',
  '12-17': 'youth-teen',
  '18+': 'adult-guide',
};

const SAFE_COMPLETE_STEER =
  'Give only general safe guidance. No explicit details. Encourage trusted adult.';

function buildUserMessage(message, nickname) {
  const nick = (nickname || '').trim();
  if (nick) return `[Nickname: ${nick}]\n${message}`;
  return message;
}

function buildSystemPrompt(ageTier, steerSafe) {
  let system = fullSystemPrompt(ageTier);
  if (steerSafe) {
    system += `\n\nINTERNAL STEERING:\n${SAFE_COMPLETE_STEER}`;
  }
  return system;
}

function offlineFallback(message, ageTier) {
  const t = message.toLowerCase();
  if (t.includes('sad') || t.includes('angry') || t.includes('scared')) {
    return (
      "I'm sorry you feel that way. Try three small steps: take slow breaths, " +
      'tell a trusted grown-up, and do something gentle like drawing. What happened?'
    );
  }
  if (t.includes('7') && t.includes('8')) {
    return '7 × 8 = 56. A trick: 7×4=28, then double it to get 56.';
  }
  if (t.includes('story')) {
    return (
      'Once there was a brave bunny named Pip. Pip helped a lost bird find its nest. ' +
      'The bird said thank you. Pip smiled. The end.'
    );
  }
  if (t.includes('science')) {
    return 'Science fact: Honey bees can "talk" by doing a waggle dance to show where flowers are.';
  }
  if (ageTier === '18+') {
    return (
      'Our Mistral brain is warming up or busy right now. ' +
      'Please wait a few seconds and try again.'
    );
  }
  return (
    'Robo is waking up — give me a moment and try again. ' +
    'If it keeps happening, ask a parent to check the SG16 brain.'
  );
}

export async function runChildrenChat(env, body) {
  const ageTier = body?.ageTier;
  const message = body?.message ?? body?.text;
  const nickname = body?.nickname || '';
  const sessionId = body?.sessionId || '';
  const history = body?.history || [];

  if (!message?.trim()) {
    throw new Error('message is required');
  }
  if (!VALID_AGE_TIERS.includes(ageTier)) {
    throw new Error(`Unknown age tier: ${ageTier}`);
  }

  const userText = String(message).trim();
  const pre = classify(ageTier, userText);

  if (pre.action === Action.CRISIS) {
    return {
      reply: crisisMessage(ageTier),
      safe: false,
      flags: pre.flags,
      action: pre.action,
      agent: KALI_AGENT_BY_TIER[ageTier],
      sessionId: sessionId || undefined,
      brain: 'mistralbrain-cloud',
    };
  }

  if (pre.action === Action.REFUSE) {
    return {
      reply: refusalMessage(ageTier, pre.flags),
      safe: false,
      flags: pre.flags,
      action: pre.action,
      agent: KALI_AGENT_BY_TIER[ageTier],
      sessionId: sessionId || undefined,
      brain: 'mistralbrain-cloud',
    };
  }

  const sanitized = pre.redactedText || userText;
  const systemPrompt = buildSystemPrompt(ageTier, pre.action === Action.SAFE_COMPLETE);
  const userPayload = buildUserMessage(sanitized, nickname);
  // Must stay below the browser's abort in app/index.html, otherwise the
  // offlineFallback() below can never run and the client gives up first.
  const timeoutMs = Number(env.SG16_CHILDREN_CHAT_TIMEOUT_MS || 25000);

  let content;
  try {
    content = await callBrainChat({
      env,
      messages: buildModelMessages({ systemPrompt, history, userPayload }),
      timeoutMs,
    });
  } catch {
    content = offlineFallback(sanitized, ageTier);
  }

  const pipeline = applySafetyPipeline(ageTier, userText, content);
  const flags = [...new Set([...pre.flags, ...(pipeline.postFlags || [])])];
  const postAction = pipeline.postAction || pipeline.action;

  return {
    reply: pipeline.reply || content,
    safe: postAction === Action.ALLOW || postAction === Action.SAFE_COMPLETE,
    flags,
    action: postAction,
    agent: KALI_AGENT_BY_TIER[ageTier],
    sessionId: sessionId || undefined,
    brain: 'mistralbrain-cloud',
  };
}

export function isBrainConfigured(env) {
  return !!getBrainConfig(env).key;
}
