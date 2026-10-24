// Comprobante por mail con Resend (https://resend.com). Si no está configurado, simplemente no envía.
const E = new Proxy({}, { get: (_, k) => process.env[k] });   // lee las variables al usarlas (Cloudflare las entrega en cada pedido)
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = n => '$' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
module.exports = {
  // Aviso al dueño: llega apenas se confirma un pago.
  async avisoVenta(p, titulo) {
    const ref = 'MX-' + String(p.numero).padStart(5, '0'), e = p.envio || {};
    // Datos completos de cada producto (marca, especificaciones, medidas) desde el catálogo
    let det = {};
    try {
      const skus = [...new Set((p.items || []).map(i => i.sku).filter(Boolean))];
      if (skus.length && E.SUPABASE_URL && E.SUPABASE_SERVICE_KEY) {
        const q = skus.map(x => '"' + String(x).replace(/"/g, '') + '"').join(',');
        const r = await fetch(`${E.SUPABASE_URL}/rest/v1/productos?sku=in.(${encodeURIComponent(q)})&select=sku,marca,categoria,descripcion,especificaciones,peso_g,alto_cm,ancho_cm,largo_cm`, { headers: { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}` } });
        if (r.ok) (await r.json()).forEach(x => { det[x.sku] = x; });
      }
    } catch (e) { /* si falla, se manda con los datos del pedido */ }
    const items = (p.items || []).map(i => {
      const d = det[i.sku] || {}, specs = String(d.especificaciones || '').split(';').map(x => x.trim()).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('');
      const med = d.peso_g || d.alto_cm ? `Embalado: ${d.peso_g ? esc(d.peso_g) + ' g' : ''}${d.alto_cm ? ' · ' + esc(d.alto_cm) + 'x' + esc(d.ancho_cm) + 'x' + esc(d.largo_cm) + ' cm' : ''}` : '';
      return `<div style="border:1px solid #ddd;border-radius:8px;padding:10px;margin:8px 0"><b>${esc(i.qty)} x ${esc(i.nombre)}</b> · ${money(i.precio)} c/u<br>
Ref (SKU): <b>${esc(i.sku)}</b>${d.marca ? ' · Marca: ' + esc(d.marca) : ''}${d.categoria ? ' · Categoría: ' + esc(d.categoria) : ''}${i.color ? '<br>Color: <b>' + esc(i.color) + '</b>' : ''}${i.alm ? '<br>Almacenamiento: <b>' + esc(i.alm) + '</b>' : ''}
${d.descripcion ? '<br>' + esc(d.descripcion) : ''}${specs ? '<ul style="margin:6px 0">' + specs + '</ul>' : ''}${med ? '<br><small>' + med + '</small>' : ''}</div>`;
    }).join('');
    let fotoUrl = null; if (e.foto) { try { fotoUrl = await require('./_foto').url(e.foto, 604800); } catch (x) { /* secundario */ } }
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;color:#111"><h2>${esc(titulo || 'Nueva venta pagada')}: ${ref}</h2><p><b>Total: ${money(p.total)}</b> · Medio: ${esc(p.metodo)}</p>${items}
<p><b>Cliente:</b> ${esc(p.nombre)}${e.dni ? ' · DNI ' + esc(e.dni) : ''} · ${esc(p.email)} · Tel: ${esc(p.telefono)}</p>
<p><b>Envío:</b> ${esc(e.carrier)} ${esc(e.servicio)}${e.sucursal ? ' · Sucursal: ' + esc(e.sucursal) : ''}<br>${esc(e.direccion)}${e.piso ? ' (' + esc(e.piso) + ')' : ''}, ${esc(e.localidad)}${e.provincia ? ', ' + esc(e.provincia) : ''} (CP ${esc(e.cp)})${e.ubicacion && e.ubicacion.url ? `<br><a href="${esc(e.ubicacion.url)}">Ver ubicación en Google Maps</a>` : ''}${e.notas ? '<br><i>Notas: ' + esc(e.notas) + '</i>' : ''}</p>${fotoUrl ? `<p><a href="${fotoUrl}">Ver foto del domicilio</a> (el enlace dura 7 días; también la ves en el panel)</p>` : ''}</div>`;
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${E.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: E.MAIL_FROM, to: [E.OWNER_EMAIL], subject: `${titulo || 'Nueva venta'} ${ref} – ${money(p.total)}`, html }) });
    return r.ok;
  },
  configurado: () => !!(E.RESEND_API_KEY && E.MAIL_FROM),
  async comprobante(p) {
    if (!this.configurado()) return false;
    if (E.OWNER_EMAIL) { try { await this.avisoVenta(p); } catch (e) { /* secundario */ } }
    if (!p.email) return false;
    const ref = 'MX-' + String(p.numero).padStart(5, '0'), e = p.envio || {};
    const filas = (p.items || []).map(i => `<tr><td style="padding:4px 8px">${esc(i.qty)} x ${esc(i.nombre)}${i.sku ? ' (Ref ' + esc(i.sku) + ')' : ''}</td><td style="padding:4px 8px;text-align:right">${money(i.precio * i.qty)}</td></tr>`).join('');
    const rec = Math.round(Number(p.total) - (p.items || []).reduce((a, i) => a + i.precio * i.qty, 0) - Number(e.costo || 0));
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111"><h2>¡Gracias por tu compra!</h2>
<p>Recibimos tu pago del pedido <b>${ref}</b>.</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd">${filas}
${e.costo ? `<tr><td style="padding:4px 8px">Envío (${esc(e.servicio || e.carrier)})</td><td style="padding:4px 8px;text-align:right">${money(e.costo)}</td></tr>` : e.carrier === 'Envío gratis' ? '<tr><td style="padding:4px 8px">Envío</td><td style="padding:4px 8px;text-align:right">Gratis</td></tr>' : ''}
${rec > 0 ? `<tr><td style="padding:4px 8px">Recargo por pago con tarjeta</td><td style="padding:4px 8px;text-align:right">${money(rec)}</td></tr>` : ''}
<tr><td style="padding:8px"><b>Total pagado</b></td><td style="padding:8px;text-align:right"><b>${money(p.total)}</b></td></tr></table>
<p><b>Entrega:</b> ${esc(e.direccion)}, ${esc(e.localidad)}${e.provincia ? ', ' + esc(e.provincia) : ''}</p>
<p>Te vamos a avisar cuando despachemos tu pedido. Consultas: https://wa.me/${esc(E.WHATSAPP || '543754400392')}</p>
<p style="color:#888;font-size:12px">${esc(E.STORE_NAME || 'MAXIMELECTRONIC')}</p></div>`;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${E.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: E.MAIL_FROM, to: [p.email], subject: `Pago confirmado – Pedido ${ref}`, html })
    });
    return r.ok;
  }
};
