// Cotización de envíos en tiempo real. Cada transportista es un módulo independiente:
// si faltan sus variables de entorno en Vercel, simplemente no aparece (no rompe nada).
//
//  Correo Argentino (API MiCorreo)  → CORREO_USER, CORREO_PASSWORD, CORREO_CUSTOMER_ID   (+ CORREO_ENV=test para pruebas)
//  Andreani                         → ANDREANI_USER, ANDREANI_PASSWORD, ANDREANI_CLIENTE,
//                                     ANDREANI_CONTRATO_DOMICILIO y/o ANDREANI_CONTRATO_SUCURSAL   (+ ANDREANI_ENV=qa para pruebas)
//  Origen del envío                 → ENVIO_CP_ORIGEN (por defecto 3370, Puerto Iguazú)
//  Vía Cargo: no tiene API pública documentada; se agrega acá como un módulo más cuando la habilite.
const E = new Proxy({}, { get: (_, k) => process.env[k] });   // lee las variables al usarlas (Cloudflare las entrega en cada pedido)
const pub = m => Object.assign(new Error(m), { publico: true });
const DEF = { peso_g: 1000, alto_cm: 10, ancho_cm: 20, largo_cm: 30 };   // se usa solo si el producto no tiene medidas cargadas

async function http(url, opts = {}, ms = 9000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctl.signal }); } finally { clearTimeout(t); }
}

// ---------- paquete a partir del carrito ----------
async function productos(skus) {
  const H = { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}` };
  const lista = skus.map(s => encodeURIComponent('"' + String(s).replace(/"/g, '') + '"')).join(',');
  const r = await http(`${E.SUPABASE_URL}/rest/v1/productos?select=sku,nombre,stock,precio_final,peso_g,alto_cm,ancho_cm,largo_cm&sku=in.(${lista})`, { headers: H });
  if (!r.ok) throw new Error('No se pudo leer el catálogo');
  const m = {}; (await r.json()).forEach(p => { m[p.sku] = p; });
  return m;
}
// Varios productos van en una sola caja: se suman pesos y alturas, y se toma el mayor largo y ancho.
function paquete(items, prods) {
  let peso = 0, valor = 0, alto = 0, ancho = 0, largo = 0;
  for (const it of items) {
    const p = prods[it.sku], q = it.qty;
    if (!p) throw pub('Hay un producto que ya no está disponible.');
    peso += (p.peso_g || DEF.peso_g) * q; alto += (p.alto_cm || DEF.alto_cm) * q;
    ancho = Math.max(ancho, p.ancho_cm || DEF.ancho_cm); largo = Math.max(largo, p.largo_cm || DEF.largo_cm);
    valor += Number(p.precio_final) * q;
  }
  return { peso_g: Math.ceil(peso), alto: Math.ceil(alto), ancho: Math.ceil(ancho), largo: Math.ceil(largo), valor: Math.round(valor) };
}

// ---------- Correo Argentino (MiCorreo) ----------
const correo = {
  nombre: 'Correo Argentino',
  activo: () => !!(E.CORREO_USER && E.CORREO_PASSWORD && E.CORREO_CUSTOMER_ID),
  base: () => E.CORREO_ENV === 'test' ? 'https://apitest.correoargentino.com.ar/micorreo/v1' : 'https://api.correoargentino.com.ar/micorreo/v1',
  tok: null,
  async token(forzar) {
    if (!forzar && this.tok && this.tok.hasta > Date.now()) return this.tok.v;
    const r = await http(`${this.base()}/token`, { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(`${E.CORREO_USER}:${E.CORREO_PASSWORD}`).toString('base64') } });
    if (!r.ok) throw new Error('login ' + r.status);
    const j = await r.json(); if (!j.token) throw new Error('sin token');
    this.tok = { v: j.token, hasta: Date.now() + 10 * 60 * 1000 };   // se renueva cada 10 min
    return j.token;
  },
  async cotizar(cp, k) {
    if (k.peso_g > 25000 || k.alto > 150 || k.ancho > 150 || k.largo > 150) throw new Error('el paquete supera el máximo (25 kg / 150 cm)');
    const body = JSON.stringify({ customerId: E.CORREO_CUSTOMER_ID, postalCodeOrigin: String(E.ENVIO_CP_ORIGEN || '3370'), postalCodeDestination: String(cp),
      dimensions: { weight: k.peso_g, height: k.alto, width: k.ancho, length: k.largo } });   // sin deliveredType: devuelve domicilio (D) y sucursal (S)
    const go = async f => http(`${this.base()}/rates`, { method: 'POST', headers: { Authorization: 'Bearer ' + await this.token(f), 'Content-Type': 'application/json' }, body });
    let r = await go(false); if (r.status === 401) r = await go(true);
    if (!r.ok) throw new Error('rates ' + r.status);
    const j = await r.json();
    return (j.rates || []).filter(x => Number(x.price) > 0).map(x => ({
      id: `correo:${x.deliveredType}:${String(x.productType || '').replace(/[^\w-]/g, '')}`, carrier: this.nombre, servicio: x.productName || 'Correo Argentino',
      modo: x.deliveredType === 'D' ? 'domicilio' : 'sucursal', precio: Math.ceil(Number(x.price))
    }));
  }
};

// ---------- Andreani ----------
const andreani = {
  nombre: 'Andreani',
  activo: () => !!(E.ANDREANI_USER && E.ANDREANI_PASSWORD && E.ANDREANI_CLIENTE && (E.ANDREANI_CONTRATO_DOMICILIO || E.ANDREANI_CONTRATO_SUCURSAL)),
  base: () => E.ANDREANI_ENV === 'qa' ? 'https://apisqa.andreani.com' : 'https://apis.andreani.com',
  tok: null,
  async token(forzar) {
    if (!forzar && this.tok && this.tok.hasta > Date.now()) return this.tok.v;
    const r = await http(`${this.base()}/login`, { headers: { Authorization: 'Basic ' + Buffer.from(`${E.ANDREANI_USER}:${E.ANDREANI_PASSWORD}`).toString('base64') } });
    if (!r.ok) throw new Error('login ' + r.status);
    let v = r.headers.get('x-authorization-token');
    if (!v) { const j = await r.json().catch(() => ({})); v = j.token; }
    if (!v) throw new Error('sin token');
    this.tok = { v, hasta: Date.now() + 6 * 60 * 60 * 1000 };   // el token dura 24 hs; se renueva antes
    return v;
  },
  async tarifa(cp, k, contrato, modo, f) {
    const q = new URLSearchParams({ cpDestino: String(cp), contrato, cliente: E.ANDREANI_CLIENTE,
      'bultos[0][kilos]': String(k.peso_g / 1000), 'bultos[0][volumen]': String(k.alto * k.ancho * k.largo), 'bultos[0][valorDeclarado]': String(k.valor) });
    if (E.ANDREANI_SUCURSAL_ORIGEN) q.set('sucursalOrigen', E.ANDREANI_SUCURSAL_ORIGEN);
    const r = await http(`${this.base()}/v1/tarifas?${q}`, { headers: { 'x-authorization-token': await this.token(f) } });
    if (r.status === 401 && !f) return this.tarifa(cp, k, contrato, modo, true);
    if (!r.ok) throw new Error('tarifas ' + r.status);
    const j = await r.json(), total = Number(j.tarifaConIva && j.tarifaConIva.total);
    if (!(total > 0)) throw new Error('sin tarifa');
    return { id: `andreani:${modo === 'domicilio' ? 'D' : 'S'}:est`, carrier: this.nombre, servicio: modo === 'domicilio' ? 'Andreani a domicilio' : 'Andreani a sucursal', modo, precio: Math.ceil(total) };
  },
  async cotizar(cp, k) {
    const pedidos = [];
    if (E.ANDREANI_CONTRATO_DOMICILIO) pedidos.push(this.tarifa(cp, k, E.ANDREANI_CONTRATO_DOMICILIO, 'domicilio'));
    if (E.ANDREANI_CONTRATO_SUCURSAL) pedidos.push(this.tarifa(cp, k, E.ANDREANI_CONTRATO_SUCURSAL, 'sucursal'));
    const rs = await Promise.allSettled(pedidos), ok = rs.filter(x => x.status === 'fulfilled').map(x => x.value);
    if (!ok.length) throw rs[0].reason;
    return ok;
  }
};

const TRANSPORTES = [correo, andreani];

// items: [{ sku, qty }]. Devuelve { opciones, errores, configurados }.
async function cotizar(cp, items) {
  if (!/^\d{4}$/.test(String(cp || ''))) throw pub('Ingresá un código postal de 4 números.');
  if (!Array.isArray(items) || !items.length || items.length > 30) throw pub('El carrito está vacío.');
  const limpios = items.map(i => ({ sku: String(i.sku || ''), qty: parseInt(i.qty, 10) }));
  if (limpios.some(i => !i.sku || !(i.qty > 0) || i.qty > 50)) throw pub('Cantidad inválida.');
  const activos = TRANSPORTES.filter(t => t.activo());
  if (!activos.length) return { opciones: [], errores: [], configurados: 0 };
  const k = paquete(limpios, await productos([...new Set(limpios.map(i => i.sku))]));
  const rs = await Promise.allSettled(activos.map(t => t.cotizar(cp, k)));
  const opciones = [], errores = [];
  rs.forEach((r, i) => r.status === 'fulfilled' ? opciones.push(...r.value) : errores.push({ carrier: activos[i].nombre, motivo: String(r.reason && r.reason.message || r.reason) }));
  errores.forEach(e => console.error('Error de envío:', e.carrier, e.motivo));
  opciones.sort((a, b) => a.precio - b.precio);
  return { opciones, errores, configurados: activos.length };
}

module.exports = { cotizar, pub, _paquete: paquete };
