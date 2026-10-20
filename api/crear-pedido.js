// Crea el pedido y descuenta el stock en una sola operación atómica (función SQL crear_pedido).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const U = require('./_uala'), Env = require('./_envios');
  const E = process.env, fail = (c, m) => res.status(c).json({ error: m });
  const H = { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
  const rpc = (fn, args) => fetch(`${E.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(args) });
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const u = await fetch(`${E.SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: E.SUPABASE_ANON_KEY } });
    if (!u.ok) return fail(401, 'Iniciá sesión para comprar.');
    const user = await u.json();
    const { items, envio, metodo, envio_op, envio_precio } = req.body || {};
    if (!Array.isArray(items) || !items.length) return fail(400, 'El carrito está vacío.');
    if (!envio || !envio.direccion || !envio.localidad || !envio.telefono) return fail(400, 'Completá los datos de entrega.');
    if (!/^\d{4}$/.test(String(envio.cp || ''))) return fail(400, 'Ingresá un código postal de 4 números.');
    if (!envio_op) return fail(400, 'Elegí una opción de envío.');
    if (!['uala', 'mercadopago', 'transferencia'].includes(metodo)) return fail(400, 'Elegí un medio de pago.');
    if (metodo === 'uala' && !U.configurado()) return fail(400, 'El pago con tarjeta no está disponible todavía.');
    if (metodo === 'mercadopago' && !E.MP_ACCESS_TOKEN) return fail(400, 'Mercado Pago no está disponible todavía.');

    // El costo de envío se vuelve a cotizar acá: el precio que muestra el navegador no se toma como válido.
    let q; try { q = await Env.cotizar(envio.cp, items.map(i => ({ sku: i.sku, qty: i.qty }))); } catch (e) { return e.publico ? fail(400, e.message) : fail(502, 'No se pudo calcular el envío. Intentá de nuevo.'); }
    const op = q.opciones.find(o => o.id === envio_op);
    if (!op) return fail(400, 'Esa opción de envío ya no está disponible. Elegí otra.');
    if (Math.abs(op.precio - Number(envio_precio)) > 0.5) return fail(409, `El costo de envío cambió a $${op.precio.toLocaleString('es-AR')}. Revisalo y confirmá de nuevo.`);
    const envioFull = { ...envio, carrier: op.carrier, servicio: op.servicio, modo: op.modo, costo: op.precio };

    await rpc('liberar_vencidos', { p_horas: 48 }).catch(() => {});   // devuelve stock de pedidos sin pagar
    const r = await rpc('crear_pedido', { p_user: user.id, p_email: user.email, p_telefono: envio.telefono, p_nombre: envio.nombre || '', p_items: items.map(i => ({ sku: i.sku, qty: i.qty, color: i.color || '', alm: i.alm || '' })), p_envio: envioFull, p_metodo: metodo });
    const j = await r.json();
    if (!r.ok) return j.code === 'P0001' ? fail(400, j.message) : fail(500, 'No se pudo registrar el pedido.');
    const ped = j[0], ref = 'MX-' + String(ped.o_numero).padStart(5, '0'), totalProductos = Number(ped.o_total), total = totalProductos + op.precio;
    // El total del pedido incluye el envío: es lo que se cobra y lo que el webhook verifica.
    const upT = await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${ped.o_numero}`, { method: 'PATCH', headers: H, body: JSON.stringify({ total }) });
    if (!upT.ok) { await rpc('cancelar_pedido', { p_numero: ped.o_numero }); return fail(500, 'No se pudo registrar el pedido.'); }

    if (metodo === 'transferencia') return res.status(200).json({ numero: ref, total, transferencia: { alias: E.TRANSFER_ALIAS || '', titular: E.TRANSFER_TITULAR || '' } });

    const origin = `https://${req.headers.host}`;

    if (metodo === 'uala') {
      // Ualá recibe el monto en pesos, como texto, entre 25 y 9.999.999 (no en centavos).
      const cancelar = async m => { await rpc('cancelar_pedido', { p_numero: ped.o_numero }); return fail(502, m); };
      if (total < 25 || total > 9999999) return cancelar('El monto del pedido no es válido para pagar con tarjeta. Probá con otro medio.');
      try {
        const o = await U.crearOrden({
          amount: total.toFixed(2), description: `Pedido ${ref}`, external_reference: String(ped.o_numero),
          callback_success: `${origin}/#/pedidos`, callback_fail: `${origin}/#/pedidos`, notification_url: `${origin}/api/uala-webhook`
        });
        const link = (o.links && o.links.checkout_link) || o.checkout_link;
        if (!o.uuid || !link) return cancelar('No se pudo iniciar el pago. Probá con otro medio.');
        const up = await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${ped.o_numero}`, { method: 'PATCH', headers: H, body: JSON.stringify({ pago_ref: o.uuid }) });
        if (!up.ok) return cancelar('No se pudo iniciar el pago. Probá con otro medio.');
        return res.status(200).json({ numero: ref, total, url: link });
      } catch (e) { return cancelar('No se pudo iniciar el pago. Probá con otro medio.'); }
    }
    const mp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST', headers: { Authorization: `Bearer ${E.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [...ped.o_items.map(l => ({ title: `${l.nombre} (Ref ${l.sku})`, quantity: l.qty, unit_price: l.precio, currency_id: 'ARS' })), { title: `Envío ${op.servicio}`, quantity: 1, unit_price: op.precio, currency_id: 'ARS' }],
        external_reference: String(ped.o_numero), payer: { email: user.email }, notification_url: `${origin}/api/mp-webhook`,
        back_urls: { success: `${origin}/#/pedidos`, failure: `${origin}/#/pedidos`, pending: `${origin}/#/pedidos` }, auto_return: 'approved'
      })
    });
    const pref = await mp.json();
    if (!mp.ok || !pref.init_point) { await rpc('cancelar_pedido', { p_numero: ped.o_numero }); return fail(502, 'No se pudo iniciar el pago. Probá con otro medio.'); }
    return res.status(200).json({ numero: ref, total, url: pref.init_point });
  } catch (e) { return fail(500, 'Error del servidor. Intentá de nuevo.'); }
};
