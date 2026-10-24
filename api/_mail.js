// Mails por Gmail (Google Apps Script, sin dominio propio) o por Resend (https://resend.com): aviso de venta al dueño, comprobante de pago al cliente y aviso de "pedido en camino".
// Si no está configurado, simplemente no envía. El motivo del último fallo queda en `ultimo` (el panel lo muestra).
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
    if (!E.OWNER_EMAIL) return false;
    return this._enviar(E.OWNER_EMAIL, `${titulo || 'Nueva venta'} ${ref} – ${money(p.total)}`, html);
  },
  // Gmail (Google Apps Script) si están MAIL_SCRIPT_URL y MAIL_SCRIPT_SECRET; si no, Resend (RESEND_API_KEY y MAIL_FROM)
  usaGmail: () => !!(E.MAIL_SCRIPT_URL && E.MAIL_SCRIPT_SECRET),
  configurado() { return this.usaGmail() || !!(E.RESEND_API_KEY && E.MAIL_FROM); },
  ultimo: '',   // motivo del último fallo de envío (lo muestra el panel al cambiar el estado de un pedido)
  faltan: 'No hay servicio de mail configurado: faltan MAIL_SCRIPT_URL y MAIL_SCRIPT_SECRET (Gmail) en este despliegue',
  async _enviar(to, subject, html) {
    try {
      if (this.usaGmail()) {
        const r = await fetch(E.MAIL_SCRIPT_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ secret: E.MAIL_SCRIPT_SECRET, to, subject, html, name: E.STORE_NAME || 'MAXIMELECTRONIC' }) });
        const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch (x) { /* no era JSON */ }
        if (r.ok && j.ok) { this.ultimo = ''; return true; }
        this.ultimo = 'Gmail respondió: ' + (j.error || (r.status + ' ' + t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200)));
        return false;
      }
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${E.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: E.MAIL_FROM, to: [to], subject, html })
      });
      if (r.ok) { this.ultimo = ''; return true; }
      let t = ''; try { t = (await r.text()).slice(0, 300); } catch (x) { /* sin detalle */ }
      this.ultimo = 'Resend respondió ' + r.status + ': ' + t;
      return false;
    } catch (x) { this.ultimo = 'No se pudo conectar con el servicio de mail: ' + ((x && x.message) || x); return false; }
  },
  // Datos de cada producto (marca, descripción, especificaciones) desde el catálogo
  async _detalle(items) {
    const det = {};
    try {
      const skus = [...new Set((items || []).map(i => i.sku).filter(Boolean))];
      if (skus.length && E.SUPABASE_URL && E.SUPABASE_SERVICE_KEY) {
        const q = skus.map(x => '"' + String(x).replace(/"/g, '') + '"').join(',');
        const r = await fetch(`${E.SUPABASE_URL}/rest/v1/productos?sku=in.(${encodeURIComponent(q)})&select=sku,marca,categoria,descripcion,especificaciones`, { headers: { apikey: E.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_KEY}` } });
        if (r.ok) (await r.json()).forEach(x => { det[x.sku] = x; });
      }
    } catch (x) { /* si falla, se manda con los datos del pedido */ }
    return det;
  },
  _bloques(items, det) {
    return (items || []).map(i => {
      const d = det[i.sku] || {}, specs = String(d.especificaciones || '').split(';').map(x => x.trim()).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('');
      return `<div style="border:1px solid #ddd;border-radius:8px;padding:10px;margin:8px 0"><b>${esc(i.qty)} x ${esc(i.nombre)}</b> · ${money(i.precio)} c/u<br>${d.marca ? 'Marca: ' + esc(d.marca) + ' · ' : ''}Ref: ${esc(i.sku)}${i.color ? '<br>Color: ' + esc(i.color) : ''}${i.alm ? '<br>Almacenamiento: ' + esc(i.alm) : ''}${d.descripcion ? '<br>' + esc(d.descripcion) : ''}${specs ? '<ul style="margin:6px 0;padding-left:18px">' + specs + '</ul>' : ''}</div>`;
    }).join('');
  },
  _pagoA(p) {
    const m = String(p.metodo || '');
    if (m === 'transferencia') return `Transferencia a <b>${esc(E.TRANSFER_TITULAR || 'MAXIMELECTRONIC')}</b>${E.TRANSFER_ALIAS ? ' · alias <b>' + esc(E.TRANSFER_ALIAS) + '</b>' : ''}`;
    if (m === 'uala') return 'Tarjeta de crédito o débito, cobrada a nombre de <b>MAXIMELECTRONIC</b> (procesada por Ualá)';
    if (m === 'mercadopago') return 'Pago a nombre de <b>MAXIMELECTRONIC</b> (procesado por Mercado Pago)';
    return esc(m);
  },
  _destino(e) { return `${esc(e.direccion)}${e.piso ? ' (' + esc(e.piso) + ')' : ''}, ${esc(e.localidad)}${e.provincia ? ', ' + esc(e.provincia) : ''} (CP ${esc(e.cp)})`; },
  // Comprobante de pago para el cliente (y aviso de venta para el dueño)
  async comprobante(p) {
    if (!this.configurado()) { this.ultimo = this.faltan; return false; }
    if (E.OWNER_EMAIL) { try { await this.avisoVenta(p); } catch (e) { /* secundario */ } }
    if (!p.email) { this.ultimo = 'El pedido no tiene email del cliente'; return false; }
    const ref = 'MX-' + String(p.numero).padStart(5, '0'), e = p.envio || {}, det = await this._detalle(p.items);
    const rec = Math.round(Number(p.total) - (p.items || []).reduce((a, i) => a + i.precio * i.qty, 0) - Number(e.costo || 0));
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111"><h2>¡Gracias por tu compra!</h2>
<p>Recibimos tu pago del pedido <b>${ref}</b>.</p>
<h3 style="margin-bottom:0">Qué compraste</h3>${this._bloques(p.items, det)}
<table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd">
${e.costo ? `<tr><td style="padding:4px 8px">Envío (${esc(e.servicio || e.carrier)})</td><td style="padding:4px 8px;text-align:right">${money(e.costo)}</td></tr>` : e.carrier === 'Envío gratis' ? '<tr><td style="padding:4px 8px">Envío</td><td style="padding:4px 8px;text-align:right">Gratis</td></tr>' : ''}
${rec > 0 ? `<tr><td style="padding:4px 8px">Recargo por pago con tarjeta</td><td style="padding:4px 8px;text-align:right">${money(rec)}</td></tr>` : ''}
<tr><td style="padding:8px"><b>Total pagado</b></td><td style="padding:8px;text-align:right"><b>${money(p.total)}</b></td></tr></table>
<p><b>Pagaste a:</b> ${this._pagoA(p)}</p>
<p><b>Entrega:</b> ${this._destino(e)}</p>
<p>Te avisamos por mail cuando despachemos tu pedido. Consultas: https://wa.me/${esc(E.WHATSAPP || '543754400392')}</p>
<p style="color:#888;font-size:12px">${esc(E.STORE_NAME || 'MAXIMELECTRONIC')}</p></div>`;
    return this._enviar(p.email, `Pago confirmado – Pedido ${ref}`, html);
  },
  // Aviso al cliente cuando el pedido se marca como enviado (con la empresa y el número de seguimiento que cargaste en el panel)
  async enviado(p) {
    if (!this.configurado()) { this.ultimo = this.faltan; return false; }
    if (!p.email) { this.ultimo = 'El pedido no tiene email del cliente'; return false; }
    const ref = 'MX-' + String(p.numero).padStart(5, '0'), e = p.envio || {}, d = e.despacho || {};
    const lista = (p.items || []).map(i => `<li>${esc(i.qty)} x ${esc(i.nombre)}${i.color ? ' · ' + esc(i.color) : ''}${i.alm ? ' · ' + esc(i.alm) : ''}</li>`).join('');
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111"><h2>¡Tu pedido va en camino!</h2>
<p>Despachamos tu pedido <b>${ref}</b>.</p>
<ul style="padding-left:18px">${lista}</ul>
<div style="background:#f4f4f4;border-radius:8px;padding:12px;margin:12px 0">
<p style="margin:0 0 6px"><b>Empresa de envío:</b> ${esc(d.empresa || [e.carrier, e.servicio].filter(Boolean).join(' · ') || 'A coordinar')}</p>
${d.seguimiento ? `<p style="margin:0"><b>Número de seguimiento:</b> <span style="font-size:18px;letter-spacing:1px">${esc(d.seguimiento)}</span></p>` : ''}</div>
<p><b>Destino:</b> ${this._destino(e)}</p>
<p>Con ese número podés seguir tu paquete en la web de la empresa. Si tenés alguna duda, escribinos: https://wa.me/${esc(E.WHATSAPP || '543754400392')}</p>
<p style="color:#888;font-size:12px">${esc(E.STORE_NAME || 'MAXIMELECTRONIC')}</p></div>`;
    return this._enviar(p.email, `Tu pedido ${ref} va en camino`, html);
  }
};
