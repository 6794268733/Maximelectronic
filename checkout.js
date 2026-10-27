const Checkout = {
  sel: null, opts: [], _t: null, _q: 0, foto: '', metodo: '', ubic: null,
  recargo(m) { const n = Number(CONFIG.RECARGO_TARJETA_PCT) || 0; return (m === 'uala' && n > 0) ? Math.ceil((Store.total() + (this.sel ? this.sel.precio : 0)) * n / 100) : 0; },
  setMetodo(m) { this.metodo = m; this.totals(); },
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
    this.sel = CONFIG.ENVIO_GRATIS ? { id: 'gratis', carrier: 'Envío gratis', servicio: '', precio: 0, modo: 'domicilio' } : null; this.opts = []; this.foto = ''; this.ubic = null;
    this.metodo = ['uala', 'mercadopago', 'transferencia'].find(k => CONFIG.PAYMENTS[k]) || '';
    if (!Store.cart.length) return;
    if (!Auth.user) return Auth.modal('registro', () => Checkout.form());
    this.form();
  },
  form() {
    document.getElementById('overlay').innerHTML = C.checkout(); lucide.createIcons();
    const cp = document.querySelector('#overlay [name=cp]'); if (!CONFIG.ENVIO_GRATIS && cp && /^\d{4}$/.test(cp.value)) this.cpChanged(cp.value);   // datos guardados: cotiza el envío solo
  },
  submit(e) { e.preventDefault(); this.send(e.target); return false; },
  async send(form) {
    const d = Object.fromEntries(new FormData(form)), err = document.getElementById('cerr'), btn = document.getElementById('cbtn');
    err.textContent = '';
    if (!this.sel) { err.textContent = 'Elegí una opción de envío.'; return; }
    if (String(d.nombre || '').trim().split(/\s+/).length < 2) { err.textContent = 'Escribí tu nombre y apellido completos, como figuran en tu DNI.'; return; }
    btn.disabled = true; btn.textContent = 'Procesando…';
    try {
      const res = await fetch('/api/crear-pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + Auth.session.access_token },
        body: JSON.stringify({
          items: Store.cart.map(i => ({ sku: i.sku, qty: i.qty, color: i.color, alm: i.alm })),
          envio: { nombre: d.nombre, dni: d.dni, telefono: d.telefono, direccion: d.direccion, piso: d.piso, localidad: d.localidad, provincia: d.provincia, cp: d.cp, notas: d.notas, sucursal: d.sucursal || '', ubicacion: this.ubic, maps: d.maps },
          metodo: d.metodo, envio_op: this.sel.id, envio_precio: this.sel.precio, foto: this.foto || '', total_esperado: Store.total() + this.sel.precio + this.recargo(d.metodo)
        })
      });
      let r = {}; try { r = await res.json(); } catch (x) {}
      if (res.status === 409) { this.sel = null; this.totals(); this.quote(d.cp); throw new Error(r.error); }
      if (!res.ok) throw new Error(r.error || 'El cobro solo funciona con la web publicada (no en Live Server).');
      if (d.guardar) { const t = k => String(d[k] || '').trim(); await Promise.race([Auth.guardarDatos({ nombre: t('nombre'), dni: t('dni').replace(/[.\s]/g, ''), telefono: t('telefono'), direccion: t('direccion'), piso: t('piso'), localidad: t('localidad'), provincia: t('provincia'), cp: t('cp'), notas: t('notas') }), new Promise(ok => setTimeout(ok, 2500))]); }   // antes de redirigir al pago
      Store.cart = []; Store.saveCart(); App.upd();
      if (r.url) location.href = r.url;
      else { document.getElementById('overlay').innerHTML = C.done(r); lucide.createIcons(); }
    } catch (x) {
      err.textContent = x.message; btn.disabled = false; btn.textContent = 'Confirmar pedido';
      if (/agotó|Solo quedan|stock|color/i.test(x.message || '')) Store.load().catch(() => {});   // actualiza el stock mostrado en la tienda
    }
  },
  // Foto opcional del domicilio: se reduce a máx. 1280 px y se convierte a JPEG antes de enviarla
  async pickFoto(inp) {
    const f = inp.files && inp.files[0], prev = document.getElementById('fotoprev'), err = document.getElementById('fotoerr');
    err.textContent = ''; this.foto = ''; prev.innerHTML = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) { err.textContent = 'El archivo tiene que ser una imagen.'; inp.value = ''; return; }
    try {
      const url = URL.createObjectURL(f);
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
      const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      let q = 0.8, d = c.toDataURL('image/jpeg', q);
      while (d.length > 1100000 && q > 0.4) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
      if (d.length > 1100000) throw new Error('grande');
      this.foto = d;
      prev.innerHTML = `<img src="${d}" alt="Foto del domicilio" class="rounded-xl max-h-40"><button type="button" onclick="Checkout.quitarFoto()" class="text-xs underline mt-1">Quitar foto</button>`;
    } catch (e) { err.textContent = 'No se pudo usar esa imagen. Probá con otra o escribí las referencias en las notas.'; inp.value = ''; }
  },
  quitarFoto() { this.foto = ''; const i = document.getElementById('fotoin'); if (i) i.value = ''; const p = document.getElementById('fotoprev'); if (p) p.innerHTML = ''; },
  miUbicacion() {
    const info = document.getElementById('ubicinfo'); if (!info) return;
    if (!navigator.geolocation) { info.textContent = 'Tu navegador no permite obtener la ubicación. Pegá el enlace de Google Maps.'; return; }
    info.textContent = 'Buscando tu ubicación…';
    navigator.geolocation.getCurrentPosition(p => {
      this.ubic = { lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) };
      info.innerHTML = `✓ Ubicación guardada (precisión aprox. ${Math.round(p.coords.accuracy)} m). <a class="underline" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${this.ubic.lat},${this.ubic.lng}">Verla en el mapa</a>. Usala solo si estás en el domicilio de entrega.`;
    }, () => { this.ubic = null; info.textContent = 'No pudimos obtener tu ubicación (revisá el permiso del navegador). Podés pegar el enlace de Google Maps.'; }, { enableHighAccuracy: true, timeout: 12000 });
  },
  copy(t, btn) { try { navigator.clipboard.writeText(t); const o = btn.textContent; btn.textContent = '¡Copiado!'; setTimeout(() => { btn.textContent = o; }, 1500); } catch (e) {} },
  yaPague(ref) {
    const b = document.getElementById('tbox'); if (!b) return;
    b.innerHTML = `<div class="rounded-2xl bg-amber-50 border border-amber-300 p-4 text-center"><p class="text-lg font-black">Pago en aprobación</p><p class="text-sm text-neutral-700 mt-1">Pedido ${this.esc(ref)}. Cuando se acredite el pago te enviamos el comprobante a tu mail.</p></div>`;
  },
  async loadOrders() {
    const el = document.getElementById('plist'); if (!el) return;
    if (!Auth.user) { el.innerHTML = '<p class="text-neutral-500">Ingresá para ver tus pedidos.</p><button onclick="Auth.modal(\'ingreso\')" class="mt-3 bg-black text-white rounded-full px-5 py-2 text-sm">Ingresar</button>'; return; }
    const { data, error } = await Auth.sb.from('pedidos').select('numero,total,estado,metodo,creado,items').order('creado', { ascending: false });
    if (error) { el.textContent = 'No se pudieron cargar los pedidos.'; return; }
    const rv = await Auth.sb.from('resenas').select('pedido_numero,sku,estrellas,estado').eq('user_id', Auth.user.id);
    const mias = {}; (rv.data || []).forEach(x => { mias[x.pedido_numero + '|' + x.sku] = x; });
    const est = { pendiente: 'En revisión', publicada: 'Publicada', oculta: 'No publicada' };
    const resenia = (p, i) => {
      if (p.estado !== 'entregado') return '';
      const x = mias[p.numero + '|' + i.sku];
      return x ? `<p class="text-xs mt-1 text-neutral-600">Tu reseña de ${C.esc(i.nombre)}: <span class="text-amber-500">${C.stars(x.estrellas)}</span> · ${est[x.estado] || ''}</p>`
        : `<button onclick="Resenas.abrir(${p.numero},'${C.esc(i.sku)}')" class="mt-2 mr-2 text-xs border border-black rounded-full px-3 py-1">Dejar reseña de ${C.esc(i.nombre)}</button>`;
    };
    el.innerHTML = data.length ? data.map(p => `<div class="grad-light rounded-2xl p-4"><div class="flex justify-between"><b>Pedido MX-${String(p.numero).padStart(5, '0')}</b><span class="text-sm">${(p.estado === 'pendiente' && p.metodo === 'transferencia' ? { pendiente: 'Pago en aprobación' } : { pendiente: 'Esperando pago', pagado: 'Pagado ✓', enviado: 'Enviado', entregado: 'Entregado ✓', cancelado: 'Cancelado', vencido: 'Vencido' })[p.estado] || p.estado}</span></div>
      <p class="text-sm text-neutral-600">${p.items.map(i => i.qty + 'x ' + C.esc(i.nombre)).join(' · ')}</p><p class="font-black mt-1">${Store.fmt(p.total)}</p>
      ${p.items.map(i => resenia(p, i)).join('')}</div>`).join('') : '<p class="text-neutral-500">Todavía no hiciste pedidos.</p>';
  }
};
// Formulario para dejar una reseña (solo pedidos entregados; el servidor lo vuelve a verificar)
const Resenas = {
  est: 0, pedido: 0, sku: '',
  abrir(pedido, sku) {
    this.est = 0; this.pedido = pedido; this.sku = sku;
    const p = Store.find(sku), nombre = p ? p.nombre : 'este producto';
    document.getElementById('overlay').innerHTML = `<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
    <div class="relative bg-white rounded-3xl max-w-md w-full p-6 space-y-3"><h3 class="font-black text-lg">¿Qué te pareció?</h3><p class="text-sm text-neutral-600">${C.esc(nombre)}</p>
    <div id="rstars" class="text-3xl text-amber-500 select-none">${[1, 2, 3, 4, 5].map(n => `<button type="button" onclick="Resenas.set(${n})" aria-label="${n} estrellas">☆</button>`).join('')}</div>
    <textarea id="rtxt" maxlength="1000" rows="4" placeholder="Contanos tu experiencia (opcional)" class="${C.inp}"></textarea>
    <p id="rerr" class="text-sm text-red-700"></p>
    <p class="text-xs text-neutral-500">Tu reseña se publica con tu nombre y la inicial del apellido, después de que la revisemos.</p>
    <button id="rbtn" onclick="Resenas.enviar()" class="w-full bg-black text-white rounded-full py-3 font-semibold">Enviar reseña</button></div></div>`;
  },
  set(n) { this.est = n; document.querySelectorAll('#rstars button').forEach((b, i) => { b.textContent = i < n ? '★' : '☆'; }); },
  async enviar() {
    const err = document.getElementById('rerr'), btn = document.getElementById('rbtn'); err.textContent = '';
    if (!this.est) { err.textContent = 'Elegí de 1 a 5 estrellas.'; return; }
    btn.disabled = true;
    try {
      const r = await fetch('/api/resena', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + Auth.session.access_token }, body: JSON.stringify({ pedido: this.pedido, sku: this.sku, estrellas: this.est, comentario: document.getElementById('rtxt').value }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { err.textContent = j.error || 'No se pudo enviar.'; btn.disabled = false; return; }
      App.close(); alert('¡Gracias! Tu reseña se publicará cuando la revisemos.'); Checkout.loadOrders();
    } catch (e) { err.textContent = 'No se pudo conectar. Intentá de nuevo.'; btn.disabled = false; }
  }
};
