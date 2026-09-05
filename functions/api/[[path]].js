/** Proxy /api/* to live SG16 brain (server-side; avoids browser CORS). */
const ENGINE = 'https://sg16engine.com';

const PASS_HEADERS = new Set([
  'accept',
  'content-type',
  'x-sg16-client',
  'user-agent',
]);

export async function onRequest(context) {
  const { request, params } = context;
  const parts = Array.isArray(params.path) ? params.path : [];
  const incoming = new URL(request.url);
  const upstream = new URL(`/api/${parts.join('/')}${incoming.search}`, ENGINE);

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (PASS_HEADERS.has(lower)) headers.set(key, value);
  }

  const init = {
    method: request.method,
    headers,
    redirect: 'follow',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const resp = await fetch(upstream, init);
  const outHeaders = new Headers();
  const ct = resp.headers.get('content-type');
  if (ct) outHeaders.set('content-type', ct);

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: outHeaders,
  });
}
