// Foto opcional del domicilio: se guarda en un bucket PRIVADO de Supabase Storage ("domicilios") y solo se ve con enlaces firmados temporales.
const E = new Proxy({}, { get: (_, k) => process.env[k] });
const H = () => ({ apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}` });
const MAX = 900 * 1024;
module.exports = {
  // Acepta solo JPEG (el navegador siempre la convierte a JPEG antes de enviarla). Devuelve los bytes o null.
  parse(dataUrl) {
    const t = String(dataUrl || '');
    if (t.length > 1250000) return null;
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(t); if (!m) return null;
    let bin; try { bin = atob(m[1]); } catch (e) { return null; }
    if (bin.length < 200 || bin.length > MAX || bin.charCodeAt(0) !== 0xFF || bin.charCodeAt(1) !== 0xD8) return null;
    const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  },
  async subir(nombre, bytes) {
    const r = await fetch(`${E.SUPABASE_URL}/storage/v1/object/domicilios/${nombre}`, { method: 'POST', headers: { ...H(), 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: bytes });
    return r.ok;
  },
  async url(nombre, segundos) {
    const r = await fetch(`${E.SUPABASE_URL}/storage/v1/object/sign/domicilios/${nombre}`, { method: 'POST', headers: { ...H(), 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: segundos }) });
    if (!r.ok) return null;
    const j = await r.json();
    return j.signedURL ? `${E.SUPABASE_URL}/storage/v1${j.signedURL}` : null;
  }
};
