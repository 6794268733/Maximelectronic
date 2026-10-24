// Mercado Pago avisa acá cuando se paga (tarjeta, billetera, transferencia o efectivo en Pago Fácil / Rapipago).
// No se confía en el aviso: se consulta el pago directo a Mercado Pago, se valida el monto y recién ahí se marca pagado y se manda el comprobante.
const M = require('./_mail');
module.exports = async (req, res) => {
  const E = process.env, q = req.query || {}, b = req.body || {};
  const id = q['data.id'] || q.id || (b.data && b.data.id);
  const type = q.type || q.topic || b.type;
  if (!id || (type && type !== 'payment')) return res.status(200).end();
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${E.MP_ACCESS_TOKEN}` } });
    if (r.status === 404) return res.status(200).end();            // pago inexistente (p. ej. aviso de prueba): no se reintenta
    if (!r.ok) throw new Error('mp ' + r.status);                  // error temporal: 500 para que Mercado Pago reintente
    const pay = await r.json();
    if (pay.status === 'approved' && pay.external_reference && (!pay.currency_id || pay.currency_id === 'ARS')) {
      const H = { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
      const n = parseInt(pay.external_reference, 10);
      const rows = await (await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${n}&select=total`, { headers: H })).json();
      if (rows[0] && Number(pay.transaction_amount) + 0.005 >= Number(rows[0].total)) {
        // Devuelve las filas que cambiaron: si vuelve vacío, ya estaba pagado (Mercado Pago manda varios avisos) y no se reenvía el mail.
        const up = await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${n}&estado=in.(pendiente,vencido)`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify({ estado: 'pagado', mp_payment_id: String(id) }) });
        if (!up.ok) throw new Error('no se pudo marcar pagado');
        const cambiadas = await up.json();
        if (cambiadas[0]) { try { await M.comprobante(cambiadas[0]); } catch (e) { /* el mail es secundario: el pedido ya quedó pagado */ } }
      }
    }
  } catch (e) { return res.status(500).end(); }
  return res.status(200).end();
};
