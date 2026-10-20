// Comprobante por mail con Resend (https://resend.com). Si no está configurado, simplemente no envía.
const E = new Proxy({}, { get: (_, k) => process.env[k] });   // lee las variables al usarlas (Cloudflare las entrega en cada pedido)
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = n => '$' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
module.exports = {
  configurado: () => !!(E.RESEND_API_KEY && E.MAIL_FROM),
  async comprobante(p) {
    if (!this.configurado() || !p.email) return false;
    const ref = 'MX-' + String(p.numero).padStart(5, '0'), e = p.envio || {};
    const filas = (p.items || []).map(i => `<tr><td style="padding:4px 8px">${esc(i.qty)} x ${esc(i.nombre)}</td><td style="padding:4px 8px;text-align:right">${money(i.precio * i.qty)}</td></tr>`).join('');
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111"><h2>¡Gracias por tu compra!</h2>
<p>Recibimos tu pago del pedido <b>${ref}</b>.</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd">${filas}
${e.costo ? `<tr><td style="padding:4px 8px">Envío (${esc(e.servicio || e.carrier)})</td><td style="padding:4px 8px;text-align:right">${money(e.costo)}</td></tr>` : ''}
<tr><td style="padding:8px"><b>Total pagado</b></td><td style="padding:8px;text-align:right"><b>${money(p.total)}</b></td></tr></table>
<p><b>Entrega:</b> ${esc(e.direccion)}, ${esc(e.localidad)}${e.provincia ? ', ' + esc(e.provincia) : ''}</p>
<p>Te vamos a avisar cuando despachemos tu pedido. Consultas: https://wa.me/${esc(E.WHATSAPP || '543754400392')}</p>
<p style="color:#888;font-size:12px">${esc(E.STORE_NAME || 'MAXIMELECTRONIC')}</p></div>`;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${E.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: E.MAIL_FROM, to: [p.email], ...(E.OWNER_EMAIL ? { bcc: [E.OWNER_EMAIL] } : {}), subject: `Pago confirmado – Pedido ${ref}`, html })
    });
    return r.ok;
  }
};
