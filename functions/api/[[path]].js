/** Proxy /api/* to live SG16 brain (server-side; avoids browser CORS). */
const ENGINE = 'https://sg16engine.com';

export async function onRequest(context) {
  const { request, params } = context;
  const parts = Array.isArray(params.path) ? params.path : [];
  const incoming = new URL(request.url);
  const upstream = new URL(`/api/${parts.join('/')}${incoming.search}`, ENGINE);

  const headers = new Headers(request.headers);
  headers.delete('host');

  const init = {
    method: request.method,
    headers,
    redirect: 'follow',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  return fetch(upstream, init);
}
