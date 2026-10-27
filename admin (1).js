// Escrituras del catálogo. Requiere la variable ADMIN_PASSWORD en Vercel.
// Comparación en tiempo constante (sin módulos de Node, para que corra en Cloudflare)
const iguales = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
const fallos = new Map();   // ip -> { n, hasta }   (en memoria: frena la fuerza bruta, pero cada instancia de Vercel lleva su propia cuenta)
module.exports = async (req, res) => {
  const E = process.env;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x', f = fallos.get(ip) || { n: 0, hasta: 0 };
  if (f.hasta > Date.now()) return res.status(429).json({ error: 'Demasiados intentos. Esperá unos minutos.' });
  const pw = String(req.headers['x-admin-password'] || ''), real = E.ADMIN_PASSWORD || '';
  const ok = real && pw.length === real.length && iguales(pw, real);
  if (!ok) { f.n += 1; if (f.n >= 5) { f.n = 0; f.hasta = Date.now() + 15 * 60 * 1000; } fallos.set(ip, f); await new Promise(r => setTimeout(r, 800)); return res.status(401).json({ error: 'Contraseña incorrecta.' }); }
  fallos.delete(ip);
  const H = { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
  const T = `${E.SUPABASE_URL}/rest/v1/productos`;
  const { accion, rows, sku, stock, mantenerStock, numero, estado, id, empresa, seguimiento } = req.body || {};
  const P = `${E.SUPABASE_URL}/rest/v1/pedidos`, R = `${E.SUPABASE_URL}/rest/v1/resenas`;
  // Stock por color: {"Negro":5,"Blanco":0}. Devuelve null si el producto no maneja stock por color.
  const colorStock = o => {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    const out = {};
    for (const [k, v] of Object.entries(o)) { const c = String(k).trim().replace(/\s+/g, ' ').slice(0, 40); if (c && Object.keys(out).length < 30) out[c] = Math.max(0, parseInt(v, 10) || 0); }
    return Object.keys(out).length ? out : null;
  };
  const suma = o => Object.values(o).reduce((a, n) => a + n, 0);
  const faltaSql = 'Falta correr el archivo supabase/stock_colores.sql en Supabase (SQL Editor > Run). Es un paso que se hace una sola vez.';
  const clean = r => { const sc = colorStock(r.stock_colores); return ({
    sku: String(r.sku || '').trim(), nombre: String(r.nombre || '').trim(), categoria: r.categoria || '', marca: r.marca || '',
    descripcion: r.descripcion || '', especificaciones: r.especificaciones || '',
    precio_final: Number(r.precio_final) || 0, precio_lista: Number(r.precio_lista) || Number(r.precio_final) || 0,
    precio_usd: Number(r.precio_usd) > 0 ? Number(r.precio_usd) : null,
    peso_g: parseInt(r.peso_g, 10) > 0 ? parseInt(r.peso_g, 10) : null, alto_cm: parseInt(r.alto_cm, 10) > 0 ? parseInt(r.alto_cm, 10) : null,
    ancho_cm: parseInt(r.ancho_cm, 10) > 0 ? parseInt(r.ancho_cm, 10) : null, largo_cm: parseInt(r.largo_cm, 10) > 0 ? parseInt(r.largo_cm, 10) : null,
    stock: sc ? suma(sc) : Math.max(0, parseInt(r.stock, 10) || 0), imagen: r.imagen || '', imagenes: r.imagenes || [],
    colores: sc ? Object.keys(sc) : (r.colores || []), stock_colores: sc, almacenamiento: r.almacenamiento || [], destacado: !!r.destacado, oferta: !!r.oferta, etiqueta: r.etiqueta || ''
  }); };
  const up = lote => fetch(`${T}?on_conflict=sku`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(lote) });
  try {
    if (accion === 'ping') return res.status(200).json({ ok: true });
    if (accion === 'importar' || accion === 'sembrar') {
      const m = new Map();
      (rows || []).map(clean).filter(r => r.sku && r.nombre && r.precio_final > 0).forEach(r => m.set(r.sku, r));
      const list = [...m.values()];
      if (!list.length) return res.status(400).json({ error: 'No hay productos válidos.' });
      let filas = list;
      if (mantenerStock && accion === 'importar') {
        // "Mantener el stock actual": los productos que ya existen conservan su stock. Con stock por color, cada color que ya existía
        // conserva sus unidades; un color nuevo entra con la cantidad del Excel y un color que ya no está en el Excel se quita.
        const exR = await fetch(`${T}?select=sku,stock_colores`, { headers: H });
        if (!exR.ok) return res.status(500).json({ error: faltaSql });
        const db = new Map((await exR.json()).map(x => [x.sku, colorStock(x.stock_colores)]));
        filas = list.map(r => {
          if (!db.has(r.sku)) return r;                                   // producto nuevo: todo del Excel
          const d = db.get(r.sku), x = r.stock_colores;
          if (d && x) { const m = {}; for (const c of Object.keys(x)) m[c] = Object.prototype.hasOwnProperty.call(d, c) ? d[c] : x[c]; return { ...r, stock_colores: m, colores: Object.keys(m), stock: suma(m) }; }
          if (!d && x) return r;                                          // primera vez con stock por color: usa las cantidades del Excel
          const { stock, ...resto } = r; return resto;                    // sin stock por color en el Excel: se conserva el stock actual
        });
      }
      // PostgREST pide que todos los productos de un mismo envío tengan los mismos campos: se agrupan por forma.
      const grupos = new Map(); filas.forEach(r => { const k = Object.keys(r).sort().join(','); (grupos.get(k) || grupos.set(k, []).get(k)).push(r); });
      for (const lote of grupos.values()) {
        const rr = await up(lote);
        if (!rr.ok) { const t = await rr.text().catch(() => ''); return res.status(500).json({ error: /stock_colores/.test(t) ? faltaSql : 'No se pudo guardar en la base de datos.' }); }
      }
      return res.status(200).json({ ok: true, cantidad: list.length });
    }
    if (accion === 'stock') {
      // Producto con stock por color: se cargan las cantidades de cada color. Producto común: un solo número.
      const sc = colorStock(req.body.stock_colores);
      const cur = await fetch(`${T}?sku=eq.${encodeURIComponent(sku)}&select=stock_colores`, { headers: H });
      const actual = cur.ok ? colorStock(((await cur.json())[0] || {}).stock_colores) : null;
      let cambio;
      if (sc) cambio = { stock_colores: sc, colores: Object.keys(sc), stock: suma(sc) };
      else if (actual) return res.status(400).json({ error: 'Este producto maneja el stock por color. Cargá las cantidades de cada color, por ejemplo Negro:5,Blanco:2.' });
      else cambio = { stock: Math.max(0, parseInt(stock, 10) || 0) };
      const r = await fetch(`${T}?sku=eq.${encodeURIComponent(sku)}`, { method: 'PATCH', headers: H, body: JSON.stringify({ ...cambio, actualizado: new Date().toISOString() }) });
      return r.ok ? res.status(200).json({ ok: true }) : res.status(500).json({ error: 'No se pudo cambiar el stock.' });
    }
    if (accion === 'eliminar') {
      const r = await fetch(`${T}?sku=eq.${encodeURIComponent(sku)}`, { method: 'DELETE', headers: H });
      return r.ok ? res.status(200).json({ ok: true }) : res.status(500).json({ error: 'No se pudo eliminar.' });
    }
    // ---- Pedidos: lista de los pagados / enviados / entregados y cambio de estado ----
    if (accion === 'pedidos') {
      const r = await fetch(`${P}?select=numero,nombre,email,telefono,items,total,envio,metodo,estado,creado&or=(estado.in.(pagado,enviado,entregado),and(estado.eq.pendiente,metodo.eq.transferencia))&order=creado.desc&limit=100`, { headers: H });
      return r.ok ? res.status(200).json({ ok: true, pedidos: await r.json() }) : res.status(500).json({ error: 'No se pudieron leer los pedidos.' });
    }
    if (accion === 'pedido_estado') {
      const n = parseInt(numero, 10);
      // pagado: solo transferencias pendientes (confirmación manual). enviado / entregado: pedidos ya pagados.
      const regla = { pagado: 'estado=eq.pendiente&metodo=eq.transferencia', enviado: 'estado=eq.pagado', entregado: 'estado=in.(pagado,enviado)' }[estado];
      if (!regla || !n) return res.status(400).json({ error: 'Datos inválidos.' });
      const cambio = { estado };
      if (estado === 'enviado') {
        // Al despachar hay que cargar la empresa y el número de seguimiento: quedan guardados en el pedido y van en el mail.
        const emp = String(empresa || '').trim().replace(/\s+/g, ' ').slice(0, 60), seg = String(seguimiento || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        if (!emp || !seg) return res.status(400).json({ error: 'Completá la empresa de envío y el número de seguimiento.' });
        if (!/^[\w\-./ ]+$/.test(seg)) return res.status(400).json({ error: 'El número de seguimiento solo puede tener letras, números, guiones, puntos o barras.' });
        const cur = await fetch(`${P}?numero=eq.${n}&select=envio`, { headers: H });
        const actual = cur.ok ? (((await cur.json())[0] || {}).envio || {}) : {};
        cambio.envio = { ...actual, despacho: { empresa: emp, seguimiento: seg, fecha: new Date().toISOString() } };
      }
      const r = await fetch(`${P}?numero=eq.${n}&${regla}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(cambio) });
      if (!r.ok) return res.status(500).json({ error: 'No se pudo cambiar el estado.' });
      const filas = await r.json();
      if (!filas.length) return res.status(409).json({ error: 'El pedido no estaba en un estado que permita ese cambio.' });
      // Mail al cliente: al confirmar el pago (comprobante) y al marcar enviado (pedido en camino). El resultado vuelve al panel.
      let mail = '';
      if (estado === 'pagado' || estado === 'enviado') {
        try { const M = require('./_mail'); const ok = estado === 'pagado' ? await M.comprobante(filas[0]) : await M.enviado(filas[0]); mail = ok ? 'enviado' : (M.ultimo || 'no se pudo enviar'); }
        catch (e) { mail = 'ERROR: ' + ((e && e.message) || e); }
      }
      return res.status(200).json({ ok: true, mail });
    }
    // ---- Foto del domicilio: enlace temporal (10 minutos) ----
    if (accion === 'foto_url') {
      const n = parseInt(numero, 10);
      const r = await fetch(`${P}?numero=eq.${n}&select=envio`, { headers: H });
      const f = r.ok ? (((await r.json())[0] || {}).envio || {}).foto : '';
      if (!/^MX-\d{5,}\.jpg$/.test(String(f || ''))) return res.status(404).json({ error: 'Este pedido no tiene foto.' });
      const url = await require('./_foto').url(f, 600);
      return url ? res.status(200).json({ ok: true, url }) : res.status(502).json({ error: 'No se pudo abrir la foto.' });
    }
    // ---- Reseñas: lista y moderación ----
    if (accion === 'resenas') {
      const r = await fetch(`${R}?select=id,pedido_numero,sku,nombre,estrellas,comentario,estado,creado&order=creado.desc&limit=200`, { headers: H });
      return r.ok ? res.status(200).json({ ok: true, resenas: await r.json() }) : res.status(500).json({ error: 'No se pudieron leer las reseñas.' });
    }
    if (accion === 'resena_estado') {
      if (!/^[0-9a-f-]{36}$/i.test(String(id || '')) || !['publicada', 'oculta', 'pendiente'].includes(estado)) return res.status(400).json({ error: 'Datos inválidos.' });
      const r = await fetch(`${R}?id=eq.${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ estado }) });
      return r.ok ? res.status(200).json({ ok: true }) : res.status(500).json({ error: 'No se pudo actualizar la reseña.' });
    }
    return res.status(400).json({ error: 'Acción desconocida.' });
  } catch (e) { return res.status(500).json({ error: 'Error del servidor.' }); }
};
