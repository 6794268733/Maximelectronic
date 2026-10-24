const App = {
  state: { sort: '', onlyStock: false }, idx: 0, timer: null,
  async init() { await Store.load(); await Auth.init(); await Store.loadReviews(); window.addEventListener('hashchange', () => { this.state = { sort: '', onlyStock: false }; this.render(); window.scrollTo(0, 0); }); this.render(); },
  render() {
    const [, r, a] = (location.hash || '#/').split('/'); const arg = a ? decodeURIComponent(a) : '';
    let body;
    if (r === 'catalogo') body = C.catalog(arg || 'todos');
    else if (r === 'buscar') body = C.catalog('todos', arg);
    else if (r === 'info') body = C.page(arg);
    else if (r === 'pedidos') body = C.pedidos();
    else if (r === 'pago-exitoso') body = C.exito(arg);
    else body = C.home();
    document.getElementById('app').innerHTML = C.header() + body + C.footer();
    lucide.createIcons(); clearInterval(this.timer);
    if (r === 'pedidos') Checkout.loadOrders();
    if (document.getElementById('hero')) this.timer = setInterval(() => this.slide(1), 6000);
  },
  slide(d) {
    const s = document.querySelectorAll('.hero-slide'), dots = document.querySelectorAll('.dot'); if (!s.length) return;
    s[this.idx].classList.add('hidden'); dots[this.idx].classList.add('opacity-40');
    this.idx = (this.idx + d + s.length) % s.length;
    s[this.idx].classList.remove('hidden'); dots[this.idx].classList.remove('opacity-40');
  },
  account() { if (Auth.user) location.hash = '#/pedidos'; else Auth.modal('ingreso'); },
  search(e) { e.preventDefault(); const q = document.getElementById('q').value.trim(); if (q) location.hash = '#/buscar/' + encodeURIComponent(q); return false; },
  open(sku) { document.getElementById('overlay').innerHTML = C.modal(Store.find(sku)); lucide.createIcons(); },
  cart(open) { document.getElementById('overlay').innerHTML = C.drawer(); lucide.createIcons(); },
  close() { document.getElementById('overlay').innerHTML = ''; },
  upd() { const c = document.getElementById('cc'); if (c) c.textContent = Store.count(); },
  add(sku) { Store.add(sku); this.upd(); this.cart(); },
  addModal(sku) { const c = document.getElementById('vc'), a = document.getElementById('va'); Store.add(sku, c ? c.value : '', a ? a.value : ''); this.upd(); this.cart(); },
  qty(i, d) { Store.qty(i, d); this.upd(); this.cart(); }
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') App.close(); });
App.init();
