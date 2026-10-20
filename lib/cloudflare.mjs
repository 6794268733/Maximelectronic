// Adaptador: ejecuta las funciones de /api (formato req/res) como Pages Functions de Cloudflare.
export async function run(handler, { request, env }) {
  for (const [k, v] of Object.entries(env || {})) if (typeof v === 'string') process.env[k] = v;
  const headers = {}; request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  if (headers['cf-connecting-ip']) headers['x-forwarded-for'] = headers['cf-connecting-ip'];
  const query = {}; new URL(request.url).searchParams.forEach((v, k) => { query[k] = v; });
  let body;
  if (!['GET', 'HEAD'].includes(request.method)) {
    const t = await request.text();
    if (t) { try { body = (headers['content-type'] || '').includes('x-www-form-urlencoded') ? Object.fromEntries(new URLSearchParams(t)) : JSON.parse(t); } catch (e) { body = {}; } }
  }
  let status = 200, payload = null; const out = {};
  const res = {
    status(c) { status = c; return res; },
    json(o) { payload = JSON.stringify(o); out['Content-Type'] = 'application/json'; return res; },
    end(t) { if (t !== undefined && payload === null) payload = String(t); return res; },
    setHeader(k, v) { out[k] = v; return res; }
  };
  try { await handler({ method: request.method, headers, body, query, url: request.url }, res); }
  catch (e) { return new Response(JSON.stringify({ error: 'Error del servidor.' }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
  return new Response(payload, { status, headers: out });
}
