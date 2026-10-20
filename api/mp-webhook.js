// Mercado Pago avisa acá cuando se paga. Se consulta el pago directo a Mercado Pago, así un aviso falso no sirve.
module.exports = async (req, res) => {
  const E = process.env, q = req.query || {}, b = req.body || {};
  const id = q['data.id'] || q.id || (b.data && b.data.id);
  const type = q.type || q.topic || b.type;
  if (!id || (type && type !== 'payment')) return res.status(200).end();
  try {
    const pay = await (await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${E.MP_ACCESS_TOKEN}` } })).json();
    if (pay.status === 'approved' && pay.external_reference) {
      const H = { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
      const n = parseInt(pay.external_reference, 10);
      const rows = await (await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${n}&select=total`, { headers: H })).json();
      if (rows[0] && Number(pay.transaction_amount) >= Number(rows[0].total)) {
        await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${n}&estado=in.(pendiente,vencido)`, { method: 'PATCH', headers: H, body: JSON.stringify({ estado: 'pagado', mp_payment_id: String(id) }) });
      }
    }
  } catch (e) {}
  return res.status(200).end();
};
