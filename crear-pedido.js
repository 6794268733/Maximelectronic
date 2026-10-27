// Crea el pedido y descuenta el stock en una sola operación atómica (función SQL crear_pedido).
const HORAS_RESERVA = 72;   // el pedido sin pagar reserva el stock este tiempo (alcanza para pagar en Pago Fácil / Rapipago)
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
    const { items, envio: raw, metodo, envio_op, envio_precio, foto, total_esperado } = req.body || {};
    if (!Array.isArray(items) || !items.length) return fail(400, 'El carrito está vacío.');
    // Datos de entrega: se validan y se limpian acá (no se guarda cualquier cosa que mande el navegador).
    if (!raw || typeof raw !== 'object') return fail(400, 'Completá los datos de entrega.');
    const txt = (v, n) => String(v == null ? '' : v).trim().replace(/\s+/g, ' ').slice(0, n);
    const PROV = ['Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];
    const nombre = txt(raw.nombre, 80), dni = String(raw.dni || '').replace(/[.\s]/g, ''), telefono = txt(raw.telefono, 25);
    if (nombre.length < 5 || nombre.split(' ').length < 2) return fail(400, 'Escribí tu nombre y apellido completos, como figuran en tu DNI.');
    if (!/^\d{7,8}$/.test(dni)) return fail(400, 'Ingresá tu DNI: 7 u 8 números, sin puntos.');
    if (!/^[0-9+()\s-]+$/.test(telefono) || telefono.replace(/\D/g, '').length < 8) return fail(400, 'Ingresá un teléfono válido con código de área: lo usamos para coordinar la entrega.');
    if (txt(raw.direccion, 120).length < 5 || txt(raw.localidad, 60).length < 2) return fail(400, 'Completá la dirección exacta (calle y número) y la localidad.');
    if (!PROV.includes(raw.provincia)) return fail(400, 'Elegí tu provincia.');
    if (!/^\d{4}$/.test(String(raw.cp || ''))) return fail(400, 'Ingresá un código postal de 4 números.');
    // Ubicación opcional: coordenadas dentro de Argentina y/o enlace de Google Maps (solo dominios de Google)
    let ubicacion;
    const g = raw.ubicacion || {}, lat = Number(g.lat), lng = Number(g.lng), link = txt(raw.maps, 300);
    const linkOk = /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.com|(www\.)?google\.[a-z.]+\/maps)(\/|\?)/i.test(link);
    if (isFinite(lat) && isFinite(lng) && lat < -21 && lat > -56 && lng < -53 && lng > -74) ubicacion = { lat: +lat.toFixed(6), lng: +lng.toFixed(6), url: linkOk ? link : `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}` };
    else if (linkOk) ubicacion = { url: link };
    const envio = { nombre, dni, telefono, direccion: txt(raw.direccion, 120), piso: txt(raw.piso, 40), localidad: txt(raw.localidad, 60), provincia: raw.provincia, cp: String(raw.cp), notas: txt(raw.notas, 300), sucursal: txt(raw.sucursal, 100), ...(ubicacion ? { ubicacion } : {}) };
    if (!envio_op) return fail(400, 'Elegí una opción de envío.');
    if (!['uala', 'mercadopago', 'transferencia'].includes(metodo)) return fail(400, 'Elegí un medio de pago.');
    if (metodo === 'uala' && !U.configurado()) return fail(400, 'El pago con tarjeta no está disponible todavía.');
    if (metodo === 'mercadopago' && !E.MP_ACCESS_TOKEN) return fail(400, 'Mercado Pago no está disponible todavía.');

    // Envío gratis: el costo del envío ya va incluido en el precio de los productos. Si no, el costo se vuelve a cotizar acá:
    // el precio que muestra el navegador no se toma como válido.
    const gratis = ['1', 'true', 'si'].includes(String(E.ENVIO_GRATIS || '').toLowerCase());
    let op;
    if (gratis) {
      if (!/^\d{4}$/.test(String(envio.cp || ''))) return fail(400, 'Ingresá un código postal válido de 4 números.');
      op = { id: 'gratis', carrier: 'Envío gratis', servicio: 'A coordinar', modo: 'domicilio', precio: 0 };
    } else {
      let q; try { q = await Env.cotizar(envio.cp, items.map(i => ({ sku: i.sku, qty: i.qty }))); } catch (e) { return e.publico ? fail(400, e.message) : fail(502, 'No se pudo calcular el envío. Intentá de nuevo.'); }
      op = q.opciones.find(o => o.id === envio_op);
      if (!op) return fail(400, 'Esa opción de envío ya no está disponible. Elegí otra.');
      if (Math.abs(op.precio - Number(envio_precio)) > 0.5) return fail(409, `El costo de envío cambió a $${op.precio.toLocaleString('es-AR')}. Revisalo y confirmá de nuevo.`);
    }
    const envioFull = { ...envio, carrier: op.carrier, servicio: op.servicio, modo: op.modo, costo: op.precio };

    await rpc('liberar_vencidos', { p_horas: HORAS_RESERVA }).catch(() => {});   // devuelve stock de pedidos sin pagar
    const r = await rpc('crear_pedido', { p_user: user.id, p_email: user.email, p_telefono: envio.telefono, p_nombre: envio.nombre || '', p_items: items.map(i => ({ sku: i.sku, qty: i.qty, color: i.color || '', alm: i.alm || '' })), p_envio: envioFull, p_metodo: metodo });
    const j = await r.json();
    if (!r.ok) return j.code === 'P0001' ? fail(400, j.message) : fail(500, 'No se pudo registrar el pedido.');
    const ped = j[0], ref = 'MX-' + String(ped.o_numero).padStart(5, '0'), totalProductos = Number(ped.o_total), base = totalProductos + op.precio,
      // Recargo solo para pago con tarjeta (cubre el costo de Ualá). Transferencia / billetera: precio sin recargo.
      recargo = (metodo === 'uala' && Number(E.RECARGO_TARJETA_PCT) > 0) ? Math.ceil(base * Number(E.RECARGO_TARJETA_PCT) / 100) : 0,
      total = base + recargo;
    // Si lo que vio el cliente no coincide con lo que se va a cobrar, se frena antes de cobrar.
    if (total_esperado != null && Math.abs(Number(total_esperado) - total) > 1) { await rpc('cancelar_pedido', { p_numero: ped.o_numero }); return fail(409, `El total cambió a $${total.toLocaleString('es-AR')}. Revisalo y confirmá de nuevo.`); }
    // El total del pedido incluye el envío: es lo que se cobra y lo que el webhook verifica.
    // Foto opcional del domicilio: si falla, el pedido sigue igual (el cliente igual puede escribir las referencias en las notas).
    if (foto) {
      const bytes = require('./_foto').parse(foto), nombre = ref + '.jpg';
      if (bytes && await require('./_foto').subir(nombre, bytes).catch(() => false)) envioFull.foto = nombre;
    }
    const upT = await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${ped.o_numero}`, { method: 'PATCH', headers: H, body: JSON.stringify({ total, ...(envioFull.foto ? { envio: envioFull } : {}) }) });
    if (!upT.ok) { await rpc('cancelar_pedido', { p_numero: ped.o_numero }); return fail(500, 'No se pudo registrar el pedido.'); }

    if (metodo === 'transferencia') {
      // Aviso al dueño: hay una transferencia por llegar (se confirma a mano en el panel > Pedidos).
      const Mail = require('./_mail');
      if (Mail.configurado()) { try { const ok = await Mail.avisoVenta({ numero: ped.o_numero, total, metodo: 'transferencia', items: ped.o_items, nombre: envio.nombre, email: user.email, telefono: envio.telefono, envio: envioFull }, 'Nueva compra por transferencia', true); if (!ok) console.error('Aviso de venta al dueño NO enviado:', Mail.ultimo); } catch (e) { console.error('Aviso de venta al dueño falló:', e && e.message); } }
    }
    if (metodo === 'transferencia') return res.status(200).json({ numero: ref, total, transferencia: { alias: E.TRANSFER_ALIAS || '', cvu: E.TRANSFER_CVU || '', titular: E.TRANSFER_TITULAR || '' } });

    const origin = `https://${req.headers.host}`;

    if (metodo === 'uala') {
      // Ualá recibe el monto en pesos, como texto, entre 25 y 9.999.999 (no en centavos).
      const cancelar = async m => { await rpc('cancelar_pedido', { p_numero: ped.o_numero }); return fail(502, m); };
      if (total < 25 || total > 9999999) return cancelar('El monto del pedido no es válido para pagar con tarjeta. Probá con otro medio.');
      try {
        const o = await U.crearOrden({
          amount: total.toFixed(2), description: `Pedido ${ref}`, external_reference: String(ped.o_numero),
          callback_success: `${origin}/#/pago-exitoso/${ref}`, callback_fail: `${origin}/#/pedidos`, notification_url: `${origin}/api/uala-webhook`
        });
        const link = (o.links && o.links.checkout_link) || o.checkout_link;
        if (!o.uuid || !link) return cancelar('No se pudo iniciar el pago. Probá con otro medio.');
        const up = await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${ped.o_numero}`, { method: 'PATCH', headers: H, body: JSON.stringify({ pago_ref: o.uuid }) });
        if (!up.ok) return cancelar('No se pudo iniciar el pago. Probá con otro medio.');
        return res.status(200).json({ numero: ref, total, url: link });
      } catch (e) { return cancelar('No se pudo iniciar el pago. Probá con otro medio.'); }
    }
    // El cupón de efectivo vence un poco antes de que se libere el stock, así nadie paga un pedido ya vencido.
    const ar = ms => new Date(Date.now() + ms - 3 * 3600e3).toISOString().replace('Z', '-03:00');
    const mp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST', headers: { Authorization: `Bearer ${E.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [...ped.o_items.map(l => ({ title: `${l.nombre} (Ref ${l.sku})`, quantity: l.qty, unit_price: l.precio, currency_id: 'ARS' })), { title: `Envío ${op.servicio}`, quantity: 1, unit_price: op.precio, currency_id: 'ARS' }],
        external_reference: String(ped.o_numero), payer: { email: user.email }, notification_url: `${origin}/api/mp-webhook`,
        back_urls: { success: `${origin}/#/pago-exitoso/${ref}`, failure: `${origin}/#/pedidos`, pending: `${origin}/#/pedidos` }, auto_return: 'approved',
        expires: true, expiration_date_from: ar(0), expiration_date_to: ar((HORAS_RESERVA - 2) * 3600e3)
      })
    });
    const pref = await mp.json();
    if (!mp.ok || !pref.init_point) { await rpc('cancelar_pedido', { p_numero: ped.o_numero }); return fail(502, 'No se pudo iniciar el pago. Probá con otro medio.'); }
    return res.status(200).json({ numero: ref, total, url: pref.init_point });
  } catch (e) { return fail(500, 'Error del servidor. Intentá de nuevo.'); }
};
