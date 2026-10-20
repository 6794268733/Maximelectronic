const Checkout = {
  sel: null, opts: [], _t: null, _q: 0,
  esc: t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]),
  totals() { const el = document.getElementById('ctot'); if (el) el.innerHTML = C.totales(); },
  cpChanged(v) {
    clearTimeout(this._t); this._q++; this.sel = null; this.opts = []; this.totals();
    const box = document.getElementById('envopts'), suc = document.getElementById('sucwrap'); if (suc) suc.innerHTML = '';
    if (!/^\d{4}$/.test(v)) { if (box) box.textContent = 'Ingresá tu código postal para calcular el costo de envío.'; return; }
    if (box) box.textContent = 'Calculando envío…';
    this._t = setTimeout(() => this.quote(v), 350);
  },
  async quote(cp) {
    const box = document.getElementById('envopts'), mine = ++this._q; if (!box) return;
    try {
      const res = await fetch('/api/envio-cotizar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cp, items: Store.cart.map(i => ({ sku: i.sku, qty: i.qty })) }) });
      const j = await res.json().catch(() => ({}));
      if (mine !== this._q) return;   // el cliente cambió el código postal mientras tanto
      if (!res.ok) { box.textContent = j.error || 'No se pudo calcular el envío.'; return; }
      this.opts = j.opciones || [];
      if (!this.opts.length) { box.textContent = j.mensaje || 'No hay envíos disponibles para ese código postal.'; return; }
      box.className = 'space-y-2 text-neutral-900';
      box.innerHTML = this.opts.map(o => `<label class="flex justify-between gap-3 border border-neutral-300 rounded-xl p-3 cursor-pointer"><span class="flex gap-2"><input type="radio" name="envio_op" value="${this.esc(o.id)}" onchange="Checkout.pick(this.value)" class="mt-1"><span><b>${this.esc(o.carrier)}</b> · ${this.esc(o.servicio)}<br><span class="text-xs text-neutral-500">${o.modo === 'domicilio' ? 'Entrega a domicilio' : 'Retiro en sucursal'}</span></span></span><b class="whitespace-nowrap">${Store.fmt(o.precio)}</b></label>`).join('');
    } catch (e) { if (mine === this._q) box.textContent = 'No se pudo calcular el envío. Probá de nuevo.'; }
  },
  pick(id) {
    this.sel = this.opts.find(o => o.id === id) || null; this.totals();
    const suc = document.getElementById('sucwrap');
    if (suc) suc.innerHTML = this.sel && this.sel.modo === 'sucursal' ? `<input name="sucursal" placeholder="Sucursal donde querés retirar (opcional)" class="${C.inp}">` : '';
  },
  start() {
    this.sel = null; this.opts = [];
    if (!Store.cart.length) return;
    if (!Auth.user) return Auth.modal('registro', () => Checkout.form());
    this.form();
  },
  form() { document.getElementById('overlay').innerHTML = C.checkout(); lucide.createIcons(); },
  submit(e) { e.preventDefault(); this.send(e.target); return false; },
  async send(form) {
    const d = Object.fromEntries(new FormData(form)), err = document.getElementById('cerr'), btn = document.getElementById('cbtn');
    err.textContent = '';
    if (!this.sel) { err.textContent = 'Elegí una opción de envío.'; return; }
    btn.disabled = true; btn.textContent = 'Procesando…';
    try {
      const res = await fetch('/api/crear-pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + Auth.session.access_token },
        body: JSON.stringify({
          items: Store.cart.map(i => ({ sku: i.sku, qty: i.qty, color: i.color, alm: i.alm })),
          envio: { nombre: d.nombre, telefono: d.telefono, direccion: d.direccion, localidad: d.localidad, provincia: d.provincia, cp: d.cp, notas: d.notas, sucursal: d.sucursal || '' },
          metodo: d.metodo, envio_op: this.sel.id, envio_precio: this.sel.precio
        })
      });
      let r = {}; try { r = await res.json(); } catch (x) {}
      if (res.status === 409) { this.sel = null; this.totals(); this.quote(d.cp); throw new Error(r.error); }
      if (!res.ok) throw new Error(r.error || 'El cobro solo funciona con la web publicada en Vercel (no en Live Server).');
      Store.cart = []; Store.saveCart(); App.upd();
      if (r.url) location.href = r.url;
      else { document.getElementById('overlay').innerHTML = C.done(r); lucide.createIcons(); }
    } catch (x) { err.textContent = x.message; btn.disabled = false; btn.textContent = 'Confirmar pedido'; }
  },
  async loadOrders() {
    const el = document.getElementById('plist'); if (!el) return;
    if (!Auth.user) { el.innerHTML = '<p class="text-neutral-500">Ingresá para ver tus pedidos.</p><button onclick="Auth.modal(\'ingreso\')" class="mt-3 bg-black text-white rounded-full px-5 py-2 text-sm">Ingresar</button>'; return; }
    const { data, error } = await Auth.sb.from('pedidos').select('numero,total,estado,metodo,creado,items').order('creado', { ascending: false });
    if (error) { el.textContent = 'No se pudieron cargar los pedidos.'; return; }
    el.innerHTML = data.length ? data.map(p => `<div class="grad-light rounded-2xl p-4"><div class="flex justify-between"><b>Pedido MX-${String(p.numero).padStart(5, '0')}</b><span class="text-sm">${({ pendiente: 'Esperando pago', pagado: 'Pagado ✓', enviado: 'Enviado', cancelado: 'Cancelado', vencido: 'Vencido' })[p.estado] || p.estado}</span></div>
      <p class="text-sm text-neutral-600">${p.items.map(i => i.qty + 'x ' + i.nombre).join(' · ')}</p><p class="font-black mt-1">${Store.fmt(p.total)}</p></div>`).join('') : '<p class="text-neutral-500">Todavía no hiciste pedidos.</p>';
  }
};
