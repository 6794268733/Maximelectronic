const Store = {
  products: [],
  cart: JSON.parse(localStorage.getItem('mx_cart') || '[]'),
  fmt: n => '$' + Number(n || 0).toLocaleString('es-AR'),
  all: [],        // todo el catálogo (lo usa el panel de administración)
  fmtUsd: n => 'US$ ' + Number(n || 0).toLocaleString('es-AR'),
  async load() {
    let rows = null;
    try {
      if (CONFIG.SUPABASE_URL) {
        const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/productos?select=*&order=sku`, { headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY } });
        if (!r.ok) throw new Error('db');
        const j = await r.json();
        rows = j;   // si la base responde, manda ella (aunque esté vacía); el archivo de ejemplo solo se usa si la base falla
      }
      if (!rows) {
        const r2 = await fetch(CONFIG.CATALOG_URL, { cache: 'no-store' });
        if (!r2.ok) throw new Error('sin archivo');
        rows = await r2.json();
      }
    } catch (e) { rows = window.CATALOG_SEED; }
    this.all = rows;
    this.products = rows.filter(p => p.stock > 0);   // la tienda solo publica lo que hay en stock
  },
  reviews: [],
  async loadReviews() {
    try {
      if (!CONFIG.SUPABASE_URL) return;
      const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/resenas?estado=eq.publicada&select=sku,nombre,estrellas,comentario,creado&order=creado.desc&limit=500`, { headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY } });
      if (r.ok) this.reviews = await r.json();
    } catch (e) { this.reviews = []; }
  },
  reviewsOf(sku) { return this.reviews.filter(x => x.sku === sku); },
  rating(sku) { const l = this.reviewsOf(sku); return { n: l.length, avg: l.length ? l.reduce((a, x) => a + x.estrellas, 0) / l.length : 0 }; },
  cats() { return [...new Set(this.products.map(p => p.categoria).filter(Boolean))]; },
  // Unidades disponibles de un producto (o de un color, si el producto maneja stock por color)
  conColor(p) { return !!(p && p.stock_colores && typeof p.stock_colores === 'object' && Object.keys(p.stock_colores).length); },
  stockDe(p, color = '') { if (!p) return 0; return this.conColor(p) ? (Number(p.stock_colores[color]) || 0) : (Number(p.stock) || 0); },
  find(sku) { return this.all.find(p => p.sku === sku); },
  list({ cat, q, sort, onlyStock } = {}) {
    let l = this.products.slice();
    if (cat === 'ofertas') l = l.filter(p => p.oferta);
    else if (cat && cat !== 'todos') l = l.filter(p => p.categoria === cat);
    if (q) { const s = q.toLowerCase(); l = l.filter(p => (p.nombre + ' ' + p.marca + ' ' + p.categoria).toLowerCase().includes(s)); }
    if (onlyStock) l = l.filter(p => p.stock > 0);
    if (sort === 'asc') l.sort((a, b) => a.precio_final - b.precio_final);
    if (sort === 'desc') l.sort((a, b) => b.precio_final - a.precio_final);
    return l;
  },
  saveCart() { localStorage.setItem('mx_cart', JSON.stringify(this.cart)); },
  count() { return this.cart.reduce((a, i) => a + i.qty, 0); },
  total() { return this.cart.reduce((a, i) => a + i.qty * i.precio, 0); },
  totalUsd() { return this.cart.length && this.cart.every(i => i.usd > 0) ? this.cart.reduce((a, i) => a + i.qty * i.usd, 0) : null; },
  add(sku, color = '', alm = '') {
    const p = this.find(sku), max = this.stockDe(p, color); if (!p || max <= 0) return;
    const it = this.cart.find(i => i.sku === sku && i.color === color && i.alm === alm);
    if (it) it.qty = Math.min(it.qty + 1, max);
    else this.cart.push({ sku, nombre: p.nombre, precio: p.precio_final, usd: Number(p.precio_usd) || 0, qty: 1, color, alm });
    this.saveCart();
  },
  qty(i, d) { const it = this.cart[i]; if (!it) return; it.qty += d; if (d > 0) { const max = this.stockDe(this.find(it.sku), it.color); if (this.conColor(this.find(it.sku)) && it.qty > max) it.qty = Math.max(max, 1); } if (it.qty <= 0) this.cart.splice(i, 1); this.saveCart(); },
  wa(text) { return 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(text); },
  cartMessage() {
    const l = this.cart.map(i => `• ${i.qty}x ${i.nombre}${i.color ? ' (' + i.color + (i.alm ? ', ' + i.alm : '') + ')' : ''} - ${this.fmt(i.precio * i.qty)}`);
    return `Hola ${CONFIG.STORE_NAME}, quiero hacer este pedido:\n${l.join('\n')}\nTotal: ${this.fmt(this.total())}`;
  }
};

// Galería de imágenes extra (columna imagenes_extra): foto grande + miniaturas en la ficha del producto.
// Acepta enlaces separados por coma, punto y coma, espacio o salto de línea.
(function () {
  const urls = p => [].concat((p && p.imagenes) || []).flatMap(x => String(x).split(/[\s,;|]+/)).filter(u => /^https?:\/\//i.test(u));
  const instalar = () => {
    if (typeof App === 'undefined' || typeof Store === 'undefined' || !App.open || App.open.__gal) return false;
    const orig = App.open;
    App.open = function (sku) {
      const r = orig.apply(this, arguments);
      try {
        const p = Store.find(sku), ex = urls(p), img = document.querySelector('#overlay img');
        if (!ex.length || !img) return r;
        const todas = [p.imagen, ...ex].filter((u, i, a) => u && a.indexOf(u) === i);
        const w = document.createElement('div'), fila = document.createElement('div');
        fila.className = 'flex flex-wrap gap-2 p-2';
        img.replaceWith(w); w.appendChild(img); w.appendChild(fila);
        todas.forEach(u => {
          const m = document.createElement('img');
          m.src = u; m.loading = 'lazy'; m.alt = 'Otra foto de ' + (p.nombre || 'producto');
          m.className = 'h-14 w-14 object-cover rounded-lg cursor-pointer border';
          m.onclick = () => { img.src = u; };
          m.onerror = () => m.remove();   // si un enlace no carga, no deja un hueco roto
          fila.appendChild(m);
        });
      } catch (e) { console.error('galería', e); }
      return r;
    };
    App.open.__gal = true; return true;
  };
  if (!instalar()) { let n = 0; const t = setInterval(() => { if (instalar() || ++n > 80) clearInterval(t); }, 100); }
})();

// Carrusel del inicio: si un slide no tiene productos propios (por ejemplo, ninguno marcado como destacado u oferta),
// muestra productos con foto y en stock, distintos en cada slide, para que siempre pasen imágenes de productos.
(function () {
  const instalar = () => {
    if (typeof C === 'undefined' || typeof Store === 'undefined' || !C.slideProducts || C.slideProducts.__fb) return false;
    const orig = C.slideProducts;
    C.slideProducts = function (s) {
      const h = orig.apply(this, arguments);
      if (h || !s.prod) return h;   // slide con prod vacío (prod: ''): sin productos, solo la foto de fondo
      const con = (Store.products || []).filter(p => p.imagen && !(p.stock <= 0));
      if (!con.length) return '';
      const i = Math.max(0, (C.slides || []).indexOf(s));
      const pick = [0, 1, 2].map(k => con[(i * 3 + k) % con.length]).filter((p, k, a) => a.indexOf(p) === k);
      return orig.call(this, { prod: pick.map(p => p.sku) });
    };
    C.slideProducts.__fb = true; return true;
  };
  if (!instalar()) { let n = 0; const t = setInterval(() => { if (instalar() || ++n > 80) clearInterval(t); }, 50); }
})();
