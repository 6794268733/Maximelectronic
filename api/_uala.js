// Ayudante de Ualá Bis (API Cobros Online v2). Por defecto usa el entorno de PRUEBA: para cobrar de verdad, UALA_ENV=prod.
const E = new Proxy({}, { get: (_, k) => process.env[k] });   // lee las variables al usarlas (Cloudflare las entrega en cada pedido)
const base = {   // se decide en cada uso: UALA_ENV=prod para cobrar de verdad; si no, prueba
  get auth() { return E.UALA_ENV === 'prod' ? 'https://auth.developers.ar.ua.la/v2/api' : 'https://auth.stage.developers.ar.ua.la/v2/api'; },
  get checkout() { return E.UALA_ENV === 'prod' ? 'https://checkout.developers.ar.ua.la/v2/api' : 'https://checkout.stage.developers.ar.ua.la/v2/api'; }
};
let cache = { token: null, exp: 0 };
module.exports = {
  base,
  configurado: () => !!(E.UALA_USERNAME && E.UALA_CLIENT_ID && E.UALA_CLIENT_SECRET),
  async token() {
    if (cache.token && Date.now() < cache.exp) return cache.token;
    const r = await fetch(`${base.auth}/auth/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: E.UALA_USERNAME, client_id: E.UALA_CLIENT_ID, client_secret_id: E.UALA_CLIENT_SECRET, grant_type: 'client_credentials' })
    });
    if (!r.ok) throw new Error('auth ' + r.status);
    const j = await r.json();
    cache = { token: j.access_token, exp: Date.now() + (j.expires_in - 600) * 1000 };
    return cache.token;
  },
  async crearOrden(body) {
    const r = await fetch(`${base.checkout}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await this.token()}` }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('orden ' + r.status);
    return r.json();
  },
  async obtenerOrden(uuid) {
    const r = await fetch(`${base.checkout}/orders/${encodeURIComponent(uuid)}`, { headers: { Authorization: `Bearer ${await this.token()}` } });
    if (!r.ok) throw new Error('get ' + r.status);
    return r.json();
  }
};
