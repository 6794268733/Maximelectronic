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
        if (j.length) rows = j;
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
    const p = this.find(sku); if (!p || p.stock <= 0) return;
    const it = this.cart.find(i => i.sku === sku && i.color === color && i.alm === alm);
    if (it) it.qty = Math.min(it.qty + 1, p.stock);
    else this.cart.push({ sku, nombre: p.nombre, precio: p.precio_final, usd: Number(p.precio_usd) || 0, qty: 1, color, alm });
    this.saveCart();
  },
  qty(i, d) { const it = this.cart[i]; if (!it) return; it.qty += d; if (it.qty <= 0) this.cart.splice(i, 1); this.saveCart(); },
  wa(text) { return 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(text); },
  cartMessage() {
    const l = this.cart.map(i => `• ${i.qty}x ${i.nombre}${i.color ? ' (' + i.color + (i.alm ? ', ' + i.alm : '') + ')' : ''} - ${this.fmt(i.precio * i.qty)}`);
    return `Hola ${CONFIG.STORE_NAME}, quiero hacer este pedido:\n${l.join('\n')}\nTotal: ${this.fmt(this.total())}`;
  }
};
