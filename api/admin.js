// Escrituras del catálogo. Requiere la variable ADMIN_PASSWORD en Vercel.
const crypto = require('crypto');
const fallos = new Map();   // ip -> { n, hasta }   (en memoria: frena la fuerza bruta, pero cada instancia de Vercel lleva su propia cuenta)
module.exports = async (req, res) => {
  const E = process.env;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x', f = fallos.get(ip) || { n: 0, hasta: 0 };
  if (f.hasta > Date.now()) return res.status(429).json({ error: 'Demasiados intentos. Esperá unos minutos.' });
  const pw = String(req.headers['x-admin-password'] || ''), real = E.ADMIN_PASSWORD || '';
  const ok = real && pw.length === real.length && crypto.timingSafeEqual(Buffer.from(pw), Buffer.from(real));
  if (!ok) { f.n += 1; if (f.n >= 5) { f.n = 0; f.hasta = Date.now() + 15 * 60 * 1000; } fallos.set(ip, f); await new Promise(r => setTimeout(r, 800)); return res.status(401).json({ error: 'Contraseña incorrecta.' }); }
  fallos.delete(ip);
  const H = { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
  const T = `${E.SUPABASE_URL}/rest/v1/productos`;
  const { accion, rows, sku, stock, mantenerStock } = req.body || {};
  const clean = r => ({
    sku: String(r.sku || '').trim(), nombre: String(r.nombre || '').trim(), categoria: r.categoria || '', marca: r.marca || '',
    descripcion: r.descripcion || '', especificaciones: r.especificaciones || '',
    precio_final: Number(r.precio_final) || 0, precio_lista: Number(r.precio_lista) || Number(r.precio_final) || 0,
    precio_usd: Number(r.precio_usd) > 0 ? Number(r.precio_usd) : null,
    peso_g: parseInt(r.peso_g, 10) > 0 ? parseInt(r.peso_g, 10) : null, alto_cm: parseInt(r.alto_cm, 10) > 0 ? parseInt(r.alto_cm, 10) : null,
    ancho_cm: parseInt(r.ancho_cm, 10) > 0 ? parseInt(r.ancho_cm, 10) : null, largo_cm: parseInt(r.largo_cm, 10) > 0 ? parseInt(r.largo_cm, 10) : null,
    stock: Math.max(0, parseInt(r.stock, 10) || 0), imagen: r.imagen || '', imagenes: r.imagenes || [],
    colores: r.colores || [], almacenamiento: r.almacenamiento || [], destacado: !!r.destacado, oferta: !!r.oferta, etiqueta: r.etiqueta || ''
  });
  const up = lote => fetch(`${T}?on_conflict=sku`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(lote) });
  try {
    if (accion === 'ping') return res.status(200).json({ ok: true });
    if (accion === 'importar' || accion === 'sembrar') {
      const m = new Map();
      (rows || []).map(clean).filter(r => r.sku && r.nombre && r.precio_final > 0).forEach(r => m.set(r.sku, r));
      const list = [...m.values()];
      if (!list.length) return res.status(400).json({ error: 'No hay productos válidos.' });
      let nuevos = list, existentes = [];
      if (mantenerStock && accion === 'importar') {
        const ex = await (await fetch(`${T}?select=sku`, { headers: H })).json();
        const set = new Set(ex.map(x => x.sku));
        nuevos = list.filter(r => !set.has(r.sku));
        existentes = list.filter(r => set.has(r.sku)).map(({ stock, ...rest }) => rest);
      }
      for (const lote of [nuevos, existentes]) if (lote.length && !(await up(lote)).ok) return res.status(500).json({ error: 'No se pudo guardar en la base de datos.' });
      return res.status(200).json({ ok: true, cantidad: list.length });
    }
    if (accion === 'stock') {
      const r = await fetch(`${T}?sku=eq.${encodeURIComponent(sku)}`, { method: 'PATCH', headers: H, body: JSON.stringify({ stock: Math.max(0, parseInt(stock, 10) || 0), actualizado: new Date().toISOString() }) });
      return r.ok ? res.status(200).json({ ok: true }) : res.status(500).json({ error: 'No se pudo cambiar el stock.' });
    }
    if (accion === 'eliminar') {
      const r = await fetch(`${T}?sku=eq.${encodeURIComponent(sku)}`, { method: 'DELETE', headers: H });
      return r.ok ? res.status(200).json({ ok: true }) : res.status(500).json({ error: 'No se pudo eliminar.' });
    }
    return res.status(400).json({ error: 'Acción desconocida.' });
  } catch (e) { return res.status(500).json({ error: 'Error del servidor.' }); }
};
