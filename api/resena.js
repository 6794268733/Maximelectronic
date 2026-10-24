// El cliente deja una reseña. Se valida en el servidor: pedido propio, entregado, producto incluido, una sola por producto y pedido.
// Queda en estado "pendiente" hasta que la apruebes desde el panel.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const E = process.env, fail = (c, m) => res.status(c).json({ error: m });
  const H = { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const u = await fetch(`${E.SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: E.SUPABASE_ANON_KEY } });
    if (!u.ok) return fail(401, 'Iniciá sesión para dejar tu reseña.');
    const user = await u.json();
    const b = req.body || {}, numero = parseInt(b.pedido, 10), estrellas = parseInt(b.estrellas, 10);
    const sku = String(b.sku || ''), comentario = String(b.comentario || '').trim().slice(0, 1000);
    if (!numero || !sku) return fail(400, 'Faltan datos.');
    if (!(estrellas >= 1 && estrellas <= 5)) return fail(400, 'Elegí de 1 a 5 estrellas.');
    const q = await fetch(`${E.SUPABASE_URL}/rest/v1/pedidos?numero=eq.${numero}&user_id=eq.${encodeURIComponent(user.id)}&select=numero,estado,items,nombre`, { headers: H });
    const rows = q.ok ? await q.json() : [];
    const ped = rows[0];
    if (!ped) return fail(404, 'No encontramos ese pedido.');
    if (ped.estado !== 'entregado') return fail(400, 'Solo podés opinar sobre pedidos ya entregados.');
    if (!(ped.items || []).some(i => i.sku === sku)) return fail(400, 'Ese producto no está en tu pedido.');
    // Nombre público: nombre + inicial del apellido (no se publica el mail ni el nombre completo)
    const full = String(ped.nombre || (user.user_metadata && user.user_metadata.nombre) || '').trim().split(/\s+/).filter(Boolean);
    const nombre = full.length ? (full.length > 1 ? `${full[0]} ${full[full.length - 1][0].toUpperCase()}.` : full[0]) : 'Cliente';
    const ins = await fetch(`${E.SUPABASE_URL}/rest/v1/resenas`, {
      method: 'POST', headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ pedido_numero: numero, sku, user_id: user.id, nombre, estrellas, comentario, estado: 'pendiente' })
    });
    if (ins.status === 409) return fail(409, 'Ya dejaste tu reseña de este producto.');
    if (!ins.ok) return fail(500, 'No se pudo guardar tu reseña. Intentá de nuevo.');
    return res.status(200).json({ ok: true });
  } catch (e) { return fail(500, 'Error del servidor. Intentá de nuevo.'); }
};
