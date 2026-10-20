// Ualá avisa acá el estado de cada pago. No se confía en el aviso: se consulta la orden directo a Ualá antes de marcar el pedido como pagado.
const U = require('./_uala'), M = require('./_mail');
module.exports = async (req, res) => {
  const E = process.env, b = req.body || {};
  if (!b.uuid) return res.status(200).end();
  try {
    const o = await U.obtenerOrden(b.uuid);
    if (['APPROVED', 'PROCESSED'].includes(o.status) && o.external_reference) {
      const H = { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
      const n = parseInt(o.external_reference, 10);
      const rows = await (await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${n}&select=total,pago_ref`, { headers: H })).json();
      if (rows[0] && !rows[0].pago_ref) throw new Error('pago_ref aún no guardado');   // 500: Ualá reintenta
      if (rows[0] && rows[0].pago_ref === b.uuid && Number(o.amount) + 0.005 >= Number(rows[0].total)) {
        // Devuelve las filas que cambiaron: si vuelve vacío, ya estaba pagado (Ualá manda varios avisos) y no se reenvía el mail.
        const up = await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${n}&estado=in.(pendiente,vencido)`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify({ estado: 'pagado' }) });
        if (!up.ok) throw new Error('no se pudo marcar pagado');
        const cambiadas = await up.json();
        if (cambiadas[0]) { try { await M.comprobante(cambiadas[0]); } catch (e) { /* el mail es secundario: el pedido ya quedó pagado */ } }
      }
    }
  } catch (e) { return res.status(500).end(); }   // un error 500 hace que Ualá reintente el aviso
  return res.status(200).end();
};
