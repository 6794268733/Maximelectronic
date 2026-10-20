// Devuelve las opciones de envío (y su costo actual) para un código postal y un carrito.
const Env = require('./_envios');
const usos = new Map();   // ip -> { n, hasta }   (freno simple contra abuso: cada consulta llama a las transportistas)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x', ahora = Date.now();
  let u = usos.get(ip); if (!u || u.hasta < ahora) u = { n: 0, hasta: ahora + 10 * 60 * 1000 };
  u.n += 1; usos.set(ip, u);
  if (u.n > 40) return res.status(429).json({ error: 'Demasiadas consultas. Esperá unos minutos.' });
  try {
    const { cp, items } = req.body || {};
    const r = await Env.cotizar(cp, items);
    const opciones = r.opciones.map(({ id, carrier, servicio, modo, precio }) => ({ id, carrier, servicio, modo, precio }));
    let mensaje = '';
    if (!opciones.length) mensaje = r.configurados
      ? 'No pudimos calcular el envío para ese código postal. Revisalo o probá de nuevo en unos minutos.'
      : 'El cálculo de envío todavía no está configurado.';
    return res.status(200).json({ opciones, mensaje });
  } catch (e) {
    return e.publico ? res.status(400).json({ error: e.message }) : res.status(500).json({ error: 'No se pudo calcular el envío. Intentá de nuevo.' });
  }
};
