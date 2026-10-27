const C = {};
C.slides = CONFIG.SLIDES;   // se editan en js/config.js
C.pages = {
  faq: ['Preguntas frecuentes', [['¿Hacen envíos a todo el país?', 'Sí, enviamos a toda la Argentina con ' + CONFIG.CARRIERS_TEXT + ', a domicilio o a sucursal.'], ['¿Cuánto cuesta el envío?', (CONFIG.ENVIO_GRATIS ? 'El envío es gratis a todo el país: el costo ya está incluido en el precio.' : 'El costo lo paga el comprador. Se calcula automáticamente con tu código postal antes de pagar, con la tarifa vigente de cada empresa.')], ['¿Tienen stock?', 'Sí. Todo producto publicado en la tienda está en stock.'], ['¿Qué medios de pago aceptan?', 'Tarjetas Visa, Mastercard, American Express, Cabal y Naranja.'], ['¿Tienen garantía?', 'Todos los productos tienen garantía oficial del fabricante.']]],
  contacto: ['Contacto', 'Escribinos por WhatsApp y te respondemos a la brevedad.'],
  servicio: ['Servicio técnico', 'Texto de ejemplo: completá con la información de tu servicio técnico.'],
  corporativo: ['Servicios corporativos', 'Texto de ejemplo: compras por volumen y facturación A para empresas.'],
  acerca: ['Conócenos', 'MAXIMELECTRONIC es una tienda de tecnología de alta gama ubicada en Puerto Iguazú, Misiones.'],
  arrepentimiento: ['Botón de arrepentimiento', 'Texto legal de ejemplo: reemplazar por el texto oficial.'],
  terminos: ['Términos y condiciones', 'Texto legal de ejemplo: reemplazar por el texto oficial.'],
  privacidad: ['Políticas de privacidad', 'Texto legal de ejemplo: reemplazar por el texto oficial.'],
  financiacion: ['Condiciones de financiación', 'Texto legal de ejemplo: reemplazar por el texto oficial.'],
  garantias: ['Garantías', 'Texto legal de ejemplo: reemplazar por el texto oficial.']
};
C.header = () => `
<div class="bg-orange-500 text-white text-center text-xs sm:text-sm font-black tracking-wide py-2 px-4">${CONFIG.STOCK_NOTICE}</div>
<div class="bg-black text-white text-xs text-center py-2 px-4">${CONFIG.ANNOUNCEMENT}</div>
<header class="glass-header sticky top-0 z-40 border-b border-neutral-200">
  <div class="max-w-7xl mx-auto flex items-center gap-4 px-4 h-16">
    <a href="#/" class="font-black tracking-tight text-lg whitespace-nowrap">MAXIM<span class="font-light">ELECTRONIC</span></a>
    <nav class="hidden lg:flex items-center gap-4 xl:gap-5 text-sm ml-4 min-w-0">
      ${Store.cats().slice(0, 7).map((c, i) => `<a class="hover:underline whitespace-nowrap ${i >= 5 ? 'hidden xl:inline' : ''}" href="#/catalogo/${encodeURIComponent(c)}">${c}</a>`).join('')}
      <a class="font-bold bg-red-600 text-white rounded-full px-3 py-0.5 hover:bg-red-700 whitespace-nowrap" href="#/catalogo/ofertas">Ofertas</a>
    </nav>
    <div class="ml-auto flex items-center gap-1">
      <button onclick="App.searchOpen()" class="p-2" aria-label="Buscar productos"><i data-lucide="search"></i></button>
      <button onclick="App.account()" class="p-2" aria-label="Mi cuenta"><i data-lucide="user"></i></button>
      <button onclick="App.cart(true)" class="relative p-2" aria-label="Carrito"><i data-lucide="shopping-bag"></i>
        <span id="cc" class="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">${Store.count()}</span></button>
    </div>
  </div>
  <div class="lg:hidden flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3 text-sm">
    ${Store.cats().map(c => `<a class="whitespace-nowrap border border-neutral-300 rounded-full px-3 py-1" href="#/catalogo/${encodeURIComponent(c)}">${c}</a>`).join('')}
  </div>
</header>`;
// Productos que se muestran con foto en cada slide del carrusel (se elige con "prod" en js/config.js)
C.slideProducts = s => {
  let l = [];
  if (Array.isArray(s.prod)) l = s.prod.map(k => Store.find(k)).filter(Boolean);
  else if (s.prod === 'destacados') l = Store.products.filter(p => p.destacado);
  else if (s.prod === 'ofertas') l = Store.products.filter(p => p.oferta);
  else if (s.prod) l = Store.products.filter(p => p.categoria === s.prod);
  l = l.filter(p => p.imagen && !(p.stock <= 0)).slice(0, 3);
  if (!l.length) return '';
  return `<div class="flex gap-3 justify-center md:justify-end">${l.map(p => `
    <button onclick="App.open('${p.sku}')" class="grad-light text-black rounded-2xl p-3 w-1/3 max-w-[190px] shadow-xl hover:-translate-y-1 transition text-left" aria-label="${p.nombre}">
      <img src="${p.imagen}" alt="${p.nombre}" class="w-full aspect-square object-contain">
      <span class="block mt-2 text-xs font-semibold leading-snug line-clamp-2">${p.nombre}</span>
      <span class="block text-sm font-black">${Store.fmt(p.precio_final)}</span></button>`).join('')}</div>`;
};
C.hero = () => `
<section class="relative overflow-hidden" id="hero">
  ${C.slides.map((s, i) => `<div class="hero-slide ${s.g} text-white ${i ? 'hidden' : ''}" ${s.img ? `style="background-image:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55)),url('${encodeURI(s.img).replace(/'/g, '%27')}');background-size:cover;background-position:center"` : ''}><div class="max-w-7xl mx-auto px-12 md:px-16 py-14 md:py-20 grid md:grid-cols-2 gap-8 items-center">
    <div><h1 class="text-4xl md:text-6xl font-black tracking-tight max-w-2xl">${s.t}</h1>
    <p class="mt-4 text-lg text-neutral-300 max-w-xl">${s.s}</p>
    <a href="${s.l}" class="inline-block mt-8 bg-white text-black font-semibold px-6 py-3 rounded-full hover:bg-neutral-200">${s.b}</a></div>
    ${C.slideProducts(s)}</div></div>`).join('')}
  <button onclick="App.slide(-1)" class="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2" aria-label="Anterior"><i data-lucide="chevron-left"></i></button>
  <button onclick="App.slide(1)" class="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2" aria-label="Siguiente"><i data-lucide="chevron-right"></i></button>
  <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2">${C.slides.map((s, i) => `<span class="dot w-2 h-2 rounded-full bg-white ${i ? 'opacity-40' : ''}"></span>`).join('')}</div>
</section>`;
C.benefits = () => `
<section class="grad-light border-b border-neutral-200"><div class="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-sm">
  ${[['headset', 'Asesoría remota', 'Comprá desde todo el país, sin moverte de tu casa'], ['shield-check', 'Seguridad', 'Tus datos personales protegidos'], ['badge-check', 'Garantía', 'Gestioná tu garantía en nuestro servicio técnico'], ['layout-grid', 'Catálogo', 'La mayor variedad de tecnología de alta gama']]
    .map(b => `<div><i data-lucide="${b[0]}" class="mx-auto mb-2"></i><p class="font-semibold">${b[1]}</p><p class="text-neutral-500">${b[2]}</p></div>`).join('')}
</div></section>`;
C.pct = p => p.precio_lista > p.precio_final ? Math.round((1 - p.precio_final / p.precio_lista) * 100) : 0;
C.badge = p => { const d = C.pct(p); return d > 0 ? `<span class="inline-block bg-red-600 text-white text-xs font-black rounded-full px-2.5 py-1">OFERTA -${d}%</span>` : (p.oferta ? '<span class="inline-block bg-red-600 text-white text-xs font-black rounded-full px-2.5 py-1">OFERTA</span>' : ''); };
C.price = (p, big) => {
  const usd = Number(p.precio_usd) > 0, lista = p.precio_lista > p.precio_final ? `<span class="line-through text-neutral-500 mr-2">${Store.fmt(p.precio_lista)}</span>` : '';
  const eg = CONFIG.ENVIO_GRATIS ? '<div class="text-xs font-semibold text-green-700">Envío gratis</div>' : '';
  const bd = C.badge(p) ? `<div class="mb-1">${C.badge(p)}</div>` : '';
  return bd + eg + (usd
    ? `<div class="${big ? 'text-3xl' : 'text-xl'} font-black">${Store.fmtUsd(p.precio_usd)}</div><div class="${big ? 'text-lg' : 'text-sm'} text-neutral-600">${lista}${Store.fmt(p.precio_final)}</div>`
    : `${lista ? `<div class="text-sm">${lista}</div>` : ''}<div class="${big ? 'text-3xl' : 'text-xl'} font-black">${Store.fmt(p.precio_final)}</div>`);
};
C.esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
C.stars = n => { const k = Math.round(n); return '★'.repeat(k) + '☆'.repeat(5 - k); };
C.rate = sku => { const r = Store.rating(sku); return r.n ? `<span class="text-sm"><span class="text-amber-500">${C.stars(r.avg)}</span> ${r.avg.toFixed(1).replace('.', ',')} <span class="text-neutral-500">(${r.n})</span></span>` : ''; };
C.card = p => `
<article class="grad-light rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition cursor-pointer flex flex-col" onclick="App.open('${p.sku}')">
  <div class="category-card-hover overflow-hidden rounded-xl relative"><img src="${p.imagen}" alt="${p.nombre}" loading="lazy" class="w-full aspect-square object-cover">${C.badge(p) ? `<span class="absolute top-2 left-2">${C.badge(p)}</span>` : ''}</div>
  <div class="mt-3 text-xs text-neutral-500">Ref: ${p.sku}${p.stock > 0 ? '' : ' · Sin stock'}</div>
  <h3 class="font-semibold mt-1 leading-snug">${p.nombre}</h3>
  <div class="mt-1">${C.rate(p.sku)}</div>
  <div class="mt-auto pt-3">
    ${C.price(p)}
    <button ${p.stock > 0 ? '' : 'disabled'} onclick="event.stopPropagation();App.add('${p.sku}')" class="mt-3 w-full rounded-full py-2 text-sm font-semibold ${p.stock > 0 ? 'bg-black text-white hover:bg-neutral-800' : 'bg-neutral-300 text-neutral-500'}">Agregar al carrito</button>
  </div>
</article>`;
C.featured = () => `
<section class="max-w-7xl mx-auto px-4 py-12"><h2 class="text-2xl font-black mb-6">Productos destacados</h2>
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">${Store.products.filter(p => p.destacado).slice(0, 8).map(C.card).join('')}</div></section>`;
C.reviews = () => {
  const l = Store.reviews.filter(x => x.comentario && x.estrellas >= 4).slice(0, 3);
  if (!l.length) return '';   // sin reseñas reales no se muestra nada (nunca reseñas inventadas)
  const avg = Store.reviews.reduce((a, x) => a + x.estrellas, 0) / Store.reviews.length;
  return `<section class="grad-dark text-white"><div class="max-w-7xl mx-auto px-4 py-12">
  <div class="flex flex-wrap items-center gap-4 mb-6"><h2 class="text-2xl font-black">Lo que dicen nuestros clientes</h2>
  <span class="text-sm text-neutral-300"><span class="text-amber-400">${C.stars(avg)}</span> ${avg.toFixed(1).replace('.', ',')} · ${Store.reviews.length} ${Store.reviews.length === 1 ? 'opinión' : 'opiniones'}</span></div>
  <div class="grid md:grid-cols-3 gap-4">${l.map(r => `<div class="glass-card text-black rounded-2xl p-5"><p class="text-amber-500">${C.stars(r.estrellas)}</p><p class="mt-2">${C.esc(r.comentario)}</p><p class="mt-3 text-sm text-neutral-500">${C.esc(r.nombre)}</p></div>`).join('')}</div>
</div></section>`;
};
C.categories = () => `
<section class="max-w-7xl mx-auto px-4 py-12"><h2 class="text-2xl font-black mb-6">Categorías</h2>
<div class="flex gap-4 overflow-x-auto no-scrollbar pb-2">${Store.cats().map(c => {
  const p = Store.products.find(x => x.categoria === c);
  return `<a href="#/catalogo/${encodeURIComponent(c)}" class="category-card-hover shrink-0 w-56 grad-mid rounded-2xl overflow-hidden">
    <div class="overflow-hidden"><img src="${p.imagen}" alt="${c}" loading="lazy" class="w-full aspect-square object-cover"></div>
    <div class="p-4 flex justify-between items-center"><span class="font-bold">${c}</span><span class="text-sm underline">Ver más</span></div></a>`;
}).join('')}</div></section>`;
C.location = () => {
  const q = encodeURIComponent((CONFIG.ADDRESS + ' ' + CONFIG.CITY).trim());
  return `<section class="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
  <div><h2 class="text-2xl font-black">Estamos en Puerto Iguazú, Misiones</h2>
  <p class="mt-3 text-neutral-600">${CONFIG.ADDRESS || 'Dirección a confirmar'}</p>
  <p class="mt-1 text-neutral-600">${CONFIG.HOURS}</p>
  <p class="mt-1 text-neutral-600">${CONFIG.OWNER} · WhatsApp +54 375 4400392</p>
  <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${q}" class="inline-block mt-5 bg-black text-white px-6 py-3 rounded-full font-semibold">Cómo llegar</a></div>
  <iframe title="Mapa" class="w-full h-72 rounded-2xl border border-neutral-300" loading="lazy" src="https://www.google.com/maps?q=${q}&output=embed"></iframe></section>`;
};
C.footer = () => {
  const icons = { instagram: 'instagram', facebook: 'facebook', linkedin: 'linkedin', youtube: 'youtube', tiktok: 'music-2' };
  const li = (t, s) => `<li><a class="hover:underline" href="#/info/${s}">${t}</a></li>`;
  return `<footer class="glass-dark text-neutral-300 mt-8"><div class="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8 text-sm">
  <div><p class="text-white font-black text-lg">MAXIM<span class="font-light">ELECTRONIC</span></p>
    <div class="flex gap-3 mt-4">${Object.keys(icons).map(k => `<a ${CONFIG.SOCIAL[k] ? `href="${CONFIG.SOCIAL[k]}" target="_blank" rel="noopener"` : 'class="opacity-30 pointer-events-none"'} aria-label="${k}"><i data-lucide="${icons[k]}"></i></a>`).join('')}</div></div>
  <div><p class="text-white font-semibold mb-2">Información</p><p>${CONFIG.HOURS}</p><p>${CONFIG.ADDRESS || 'Puerto Iguazú, Misiones'}</p><p>WhatsApp +54 375 4400392</p>${CONFIG.EMAIL ? `<p>${CONFIG.EMAIL}</p>` : ''}</div>
  <div><p class="text-white font-semibold mb-2">Ayuda</p><ul class="space-y-1">${li('Conócenos', 'acerca')}${li('Preguntas frecuentes', 'faq')}${li('Botón de arrepentimiento', 'arrepentimiento')}${li('Contacto', 'contacto')}${li('Servicio técnico', 'servicio')}${li('Servicios corporativos', 'corporativo')}</ul></div>
  <div><p class="text-white font-semibold mb-2">Legales</p><ul class="space-y-1">${li('Términos y condiciones', 'terminos')}${li('Políticas de privacidad', 'privacidad')}${li('Condiciones de financiación', 'financiacion')}${li('Garantías', 'garantias')}</ul></div>
  </div>
  <div class="border-t border-neutral-800 text-center text-xs py-5">Pagá con Visa · Mastercard · American Express · Cabal · Naranja &nbsp;|&nbsp; Envíos a todo el país &nbsp;|&nbsp; Sellos Data Fiscal y Defensa del Consumidor (agregar)</div></footer>`;
};
C.home = () => C.hero() + C.benefits() + C.featured() + C.reviews() + C.categories() + C.location();
C.catalog = (cat, q) => {
  const sort = App.state.sort, only = App.state.onlyStock;
  const l = Store.list({ cat, q, sort, onlyStock: only });
  return `<section class="max-w-7xl mx-auto px-4 py-10"><div class="flex flex-wrap items-center gap-3 mb-6">
  <h2 class="text-2xl font-black mr-auto">${q ? 'Resultados para "' + q + '"' : (cat === 'todos' ? 'Catálogo' : cat === 'ofertas' ? 'Ofertas' : cat)} <span class="text-neutral-400 text-base">(${l.length})</span></h2>
  <select class="border border-neutral-300 rounded-full px-3 py-2 text-sm bg-white" onchange="App.state.sort=this.value;App.render()">
    <option value="">Ordenar</option><option value="asc" ${sort === 'asc' ? 'selected' : ''}>Menor precio</option><option value="desc" ${sort === 'desc' ? 'selected' : ''}>Mayor precio</option></select></div>
  ${l.length ? `<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">${l.map(C.card).join('')}</div>` : '<p class="text-neutral-500 py-20 text-center">No encontramos productos. Probá con otra búsqueda o categoría.</p>'}</section>`;
};
C.page = slug => {
  const p = C.pages[slug]; if (!p) return '<p class="p-20 text-center">Página no encontrada.</p>';
  const body = Array.isArray(p[1]) ? p[1].map((f, i) => `<div class="border-b border-neutral-300 py-3"><button class="w-full text-left font-semibold flex justify-between" onclick="this.nextElementSibling.classList.toggle('active')">${f[0]}<i data-lucide="plus"></i></button><div class="accordion-content text-neutral-600"><p class="pt-2">${f[1]}</p></div></div>`).join('') : `<p class="text-neutral-600">${p[1]}</p>`;
  return `<section class="max-w-3xl mx-auto px-4 py-14"><h2 class="text-3xl font-black mb-6">${p[0]}</h2>${body}</section>`;
};
// Opciones de color: con stock por color, los colores agotados se ven pero no se pueden elegir
C.colorOpts = p => {
  if (!Store.conColor(p)) return p.colores.map(c => `<option>${C.esc(c)}</option>`).join('');
  const primero = p.colores.find(c => Store.stockDe(p, c) > 0);
  return p.colores.map(c => { const n = Store.stockDe(p, c); return n > 0 ? `<option value="${C.esc(c)}" ${c === primero ? 'selected' : ''}>${C.esc(c)}</option>` : `<option value="${C.esc(c)}" disabled>${C.esc(c)} (agotado)</option>`; }).join('');
};
C.modal = p => `
<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<div class="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-auto grid md:grid-cols-2">
  <img src="${p.imagen}" alt="${p.nombre}" class="w-full aspect-square object-cover">
  <div class="p-6"><button onclick="App.close()" class="float-right" aria-label="Cerrar"><i data-lucide="x"></i></button>
    <p class="text-xs text-neutral-500">${p.marca} · ${p.categoria}</p><h3 class="text-2xl font-black mt-1">${p.nombre}</h3><p class="text-xs text-neutral-500">Ref: ${p.sku}</p>
    <div class="mt-3">${C.price(p, true)}</div>
    <div class="mt-2">${C.rate(p.sku)}</div>
    <p class="mt-4 text-sm text-neutral-600">${p.descripcion || ''}</p><p class="mt-2 text-sm text-neutral-600">${p.especificaciones || ''}</p>
    ${(p.colores || []).length ? `<select id="vc" class="mt-4 w-full border rounded-full px-3 py-2 text-sm">${C.colorOpts(p)}</select>` : ''}
    ${(p.almacenamiento || []).length ? `<select id="va" class="mt-2 w-full border rounded-full px-3 py-2 text-sm">${p.almacenamiento.map(c => `<option>${c}</option>`).join('')}</select>` : ''}
    <button ${p.stock > 0 ? '' : 'disabled'} onclick="App.addModal('${p.sku}')" class="mt-5 w-full rounded-full py-3 font-semibold ${p.stock > 0 ? 'bg-black text-white' : 'bg-neutral-300 text-neutral-500'}">${p.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}</button>
    ${Store.reviewsOf(p.sku).length ? `<div class="mt-6 border-t pt-4"><p class="font-black text-sm mb-2">Opiniones de clientes</p><div class="space-y-3 max-h-56 overflow-auto">${Store.reviewsOf(p.sku).slice(0, 20).map(x => `<div class="text-sm"><span class="text-amber-500">${C.stars(x.estrellas)}</span> <b>${C.esc(x.nombre)}</b>${x.comentario ? `<p class="text-neutral-600">${C.esc(x.comentario)}</p>` : ''}</div>`).join('')}</div></div>` : ''}
  </div></div></div>`;
C.drawer = () => `
<div class="fixed inset-0 z-50"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<aside class="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col">
  <div class="p-4 flex justify-between items-center border-b"><h3 class="font-black text-lg">Tu carrito</h3><button onclick="App.close()" aria-label="Cerrar"><i data-lucide="x"></i></button></div>
  <div class="flex-1 overflow-auto p-4 space-y-3">${Store.cart.length ? Store.cart.map((i, n) => `
    <div class="flex justify-between items-center gap-3 border-b pb-3"><div class="text-sm"><p class="font-semibold">${i.nombre}</p><p class="text-neutral-500">${[i.color, i.alm].filter(Boolean).join(' · ')}</p><p>${i.usd > 0 ? `<b>${Store.fmtUsd(i.usd)}</b><br><span class="text-neutral-600">${Store.fmt(i.precio)}</span>` : Store.fmt(i.precio)}</p></div>
    <div class="flex items-center gap-2"><button onclick="App.qty(${n},-1)" class="w-7 h-7 border rounded-full">−</button><span>${i.qty}</span><button onclick="App.qty(${n},1)" class="w-7 h-7 border rounded-full">+</button></div></div>`).join('') : '<p class="text-neutral-500 text-center py-20">Tu carrito está vacío. Agregá productos para empezar.</p>'}</div>
  <div class="p-4 border-t"><div class="flex justify-between items-start font-black text-lg mb-1"><span>Subtotal</span><span class="text-right">${Store.totalUsd() ? `<span class="block">${Store.fmtUsd(Store.totalUsd())}</span><span class="block text-sm font-semibold text-neutral-600">${Store.fmt(Store.total())}</span>` : Store.fmt(Store.total())}</span></div>
  <p class="text-xs text-neutral-500 mb-3">${CONFIG.ENVIO_GRATIS ? 'Envío gratis a todo el país.' : 'El envío lo paga el comprador y se calcula con tu código postal antes de pagar.'}</p>
  ${Store.cart.length ? `<button onclick="Checkout.start()" class="w-full bg-black text-white rounded-full py-3 font-semibold">Finalizar compra</button>` : ''}</div></aside></div>`;
C.inp = 'w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm';
C.auth = mode => `
<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<form onsubmit="return Auth.submit(event,'${mode}')" class="relative bg-white rounded-3xl max-w-md w-full p-6 space-y-3">
  <div class="flex gap-2 text-sm font-semibold">
    <button type="button" onclick="Auth.modal('registro')" class="flex-1 py-2 rounded-full ${mode === 'registro' ? 'bg-black text-white' : 'border'}">Registrarme</button>
    <button type="button" onclick="Auth.modal('ingreso')" class="flex-1 py-2 rounded-full ${mode === 'ingreso' ? 'bg-black text-white' : 'border'}">Ingresar</button></div>
  ${mode === 'registro' ? `<input name="nombre" required placeholder="Nombre y apellido" class="${C.inp}">` : ''}
  <input name="email" type="email" required placeholder="Email" class="${C.inp}">
  ${mode === 'registro' ? `<input name="telefono" type="tel" required minlength="8" placeholder="Teléfono (ej. 3754 123456)" class="${C.inp}">` : ''}
  <input name="password" type="password" required minlength="6" placeholder="Contraseña (mínimo 6 caracteres)" class="${C.inp}">
  <p id="aerr" class="text-sm text-red-700"></p>
  <button class="w-full bg-black text-white rounded-full py-3 font-semibold">${mode === 'registro' ? 'Crear cuenta' : 'Ingresar'}</button></form></div>`;
C.totales = () => {
  const s = Checkout.sel, usd = Store.totalUsd();
  return `<div class="text-sm flex justify-between"><span>Productos</span><span>${usd ? Store.fmtUsd(usd) + ' · ' : ''}${Store.fmt(Store.total())}</span></div>
  <div class="text-sm flex justify-between"><span>Envío</span><span>${CONFIG.ENVIO_GRATIS ? '<b class="text-green-700">¡Gratis!</b>' : (s ? Store.fmt(s.precio) : 'se calcula con tu código postal')}</span></div>
  ${Checkout.recargo(Checkout.metodo) ? `<div class="text-sm flex justify-between"><span>Recargo por pago con tarjeta (${Number(CONFIG.RECARGO_TARJETA_PCT)}%)</span><span>${Store.fmt(Checkout.recargo(Checkout.metodo))}</span></div>` : ''}
  <div class="font-black text-lg flex justify-between"><span>Total a pagar</span><span>${Store.fmt(Store.total() + (s ? s.precio : 0) + Checkout.recargo(Checkout.metodo))}</span></div>
  ${Number(CONFIG.RECARGO_TARJETA_PCT) > 0 ? '<p class="text-xs text-neutral-500">Pagando por transferencia o billetera virtual el precio no tiene recargo.</p>' : ''}
  <p class="text-xs text-neutral-500">El pago se realiza en pesos argentinos.</p>`;
};
const PROVINCIAS = ['Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];
C.checkout = () => {
  const m = (Auth.user && Auth.user.user_metadata) || {}, P = CONFIG.PAYMENTS;
  const f = (n, l, v = '', req = true, t = 'text') => `<input name="${n}" type="${t}" ${req ? 'required' : ''} value="${C.esc(v)}" placeholder="${l}" class="${C.inp}">`;
  return `<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<form onsubmit="return Checkout.submit(event)" class="relative bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-auto p-6 space-y-3">
  <h3 class="text-xl font-black">Finalizar compra</h3>
  <p class="text-sm text-neutral-600">${Store.cart.map(i => `${i.qty}x ${i.nombre}`).join(' · ')}</p>
  <p class="text-xs text-neutral-500">Completá tus datos tal cual figuran en tu DNI: la transportista los pide para entregar el paquete.</p>
  ${f('nombre', 'Nombre y apellido completos, como figuran en tu DNI', m.nombre || '')}
  <input name="dni" value="${C.esc(m.dni || '')}" required inputmode="numeric" pattern="[0-9.]{7,10}" maxlength="10" placeholder="DNI (solo números, sin puntos)" class="${C.inp}">
  ${f('telefono', 'Teléfono con código de área, obligatorio (ej. 3755123456)', m.telefono || '', true, 'tel')}
  <p class="text-xs text-neutral-500 -mt-2">Lo usamos solo para coordinar la entrega si hace falta.</p>
  ${f('direccion', 'Dirección exacta: calle y número', m.direccion || '')}
  ${f('piso', 'Piso, departamento, torre o barrio (opcional)', m.piso || '', false)}
  <div class="grid grid-cols-2 gap-2">${f('localidad', 'Localidad', m.localidad || '')}<select name="provincia" required class="${C.inp}"><option value="">Provincia</option>${PROVINCIAS.map(x => `<option ${x === m.provincia ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <input name="cp" value="${C.esc(m.cp || '')}" required inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="Código postal (4 números, ej. 3370)" ${CONFIG.ENVIO_GRATIS ? '' : 'oninput="Checkout.cpChanged(this.value)"'} class="${C.inp}">
  ${f('notas', 'Referencias para la entrega (opcional): color de la casa, entre qué calles, timbre…', m.notas || '', false)}
  <div class="text-sm"><label class="font-semibold">Ubicación en Google Maps <span class="font-normal text-neutral-500">(opcional)</span></label>
    <p class="text-xs text-neutral-500">Ayuda a que el paquete llegue sin errores.</p>
    <button type="button" onclick="Checkout.miUbicacion()" class="mt-1 border border-black rounded-full px-3 py-1 text-xs">Usar mi ubicación actual</button>
    <input name="maps" placeholder="O pegá el enlace de Google Maps de tu casa" class="${C.inp} mt-2"><p id="ubicinfo" class="text-xs text-neutral-600 mt-1"></p></div>
  <div class="text-sm"><label class="font-semibold">Foto de tu domicilio <span class="font-normal text-neutral-500">(opcional)</span></label>
    <p class="text-xs text-neutral-500">Frente de la casa, portón o timbre, para evitar errores en la entrega. Se usa solo para el envío.</p>
    <input id="fotoin" type="file" accept="image/*" onchange="Checkout.pickFoto(this)" class="mt-1 text-xs"><div id="fotoprev" class="mt-2"></div><p id="fotoerr" class="text-xs text-red-700"></p></div>
  ${CONFIG.ENVIO_GRATIS ? '<div class="text-sm rounded-xl bg-green-50 border border-green-300 p-3"><p class="font-semibold text-green-800">Envío gratis a todo el país</p><p class="text-xs text-neutral-600">Te avisamos por mail cuando despachemos tu pedido.</p></div>' : `  <div class="text-sm space-y-2"><p class="font-semibold">Envío <span class="font-normal text-neutral-500">(lo paga el comprador)</span></p>
    <div id="envopts" class="space-y-2 text-neutral-500">Ingresá tu código postal para calcular el costo de envío.</div>
    <div id="sucwrap"></div></div>`}
  <div class="text-sm space-y-2"><p class="font-semibold">Medio de pago</p>
    ${[['uala', 'Tarjeta de crédito o débito (cualquier banco)' + (Number(CONFIG.CUOTAS_MAX) > 1 ? ' · hasta ' + Number(CONFIG.CUOTAS_MAX) + ' cuotas' : '') + (Number(CONFIG.RECARGO_TARJETA_PCT) > 0 ? ' · +' + Number(CONFIG.RECARGO_TARJETA_PCT) + '% de recargo (incluye el costo de las cuotas)' : '')], ['mercadopago', 'Billetera virtual, transferencia, tarjeta o efectivo (Pago Fácil / Rapipago)'], ['transferencia', 'Transferencia bancaria / billetera virtual' + (Number(CONFIG.RECARGO_TARJETA_PCT) > 0 ? ' · precio sin recargo' : '')]]
      .filter(([k]) => P[k]).map(([k, t], i) => `<label class="flex gap-2"><input type="radio" name="metodo" value="${k}" ${i === 0 ? 'checked' : ''} onchange="Checkout.setMetodo(this.value)"> ${t}</label>`).join('')}</div>
  <div id="ctot" class="space-y-1 border-t pt-3">${C.totales()}</div>
  <label class="flex gap-2 text-xs text-neutral-600"><input type="checkbox" name="guardar" checked> Guardar estos datos en mi cuenta para mis próximos pedidos</label>
  <p id="cerr" class="text-sm text-red-700"></p>
  <button id="cbtn" class="w-full bg-black text-white rounded-full py-3 font-semibold">Confirmar pedido</button></form></div>`;
};
C.done = r => `<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<div class="relative bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-3">
  <p class="text-sm text-neutral-500">Pedido recibido</p><p class="text-4xl font-black">${r.numero}</p><p class="font-semibold">Total: ${Store.fmt(r.total)}</p>
  ${r.transferencia ? `<div id="tbox"><div class="text-sm text-left grad-light rounded-2xl p-4 space-y-2"><p>Transferí exactamente este monto desde cualquier billetera virtual o banco:</p>
    <div class="flex justify-between items-center gap-2"><span>Monto: <b>${Store.fmt(r.total)}</b></span><button type="button" onclick="Checkout.copy('${Number(r.total).toFixed(2)}', this)" class="text-xs border border-black rounded-full px-3 py-1">Copiar monto</button></div>
    <div class="flex justify-between items-center gap-2"><span>Alias: <b>${C.esc(r.transferencia.alias || '(a confirmar)')}</b></span><button type="button" onclick="Checkout.copy('${C.esc(r.transferencia.alias || '')}', this)" class="text-xs border border-black rounded-full px-3 py-1">Copiar alias</button></div>
    ${r.transferencia.cvu ? `<div class="flex justify-between items-center gap-2"><span>CVU: <b>${C.esc(r.transferencia.cvu)}</b></span><button type="button" onclick="Checkout.copy('${C.esc(r.transferencia.cvu)}', this)" class="text-xs border border-black rounded-full px-3 py-1">Copiar CVU</button></div>` : ''}
    <p>Titular: <b>${C.esc(r.transferencia.titular || '')}</b></p>
    <p class="text-xs text-neutral-600">En el concepto podés poner el número de pedido <b>${r.numero}</b>.</p></div>
    <button type="button" onclick="Checkout.yaPague('${r.numero}')" class="mt-3 w-full bg-black text-white rounded-full py-3 font-semibold">Ya hice la transferencia</button></div>` : ''}
  <a href="#/pedidos" onclick="App.close()" class="block underline text-sm">Ver mis pedidos</a></div></div>`;
C.exito = ref => `<section class="max-w-xl mx-auto px-4 py-16 text-center"><div class="text-5xl mb-3">✓</div><h2 class="text-3xl font-black">¡Pago exitoso!</h2>
  <p class="mt-3 text-neutral-600">Recibimos tu pago. Número de pedido:</p><p class="text-2xl font-black mt-1">${C.esc(ref || '')}</p>
  <p class="mt-3 text-sm text-neutral-600">Te enviamos el comprobante a tu mail. Si no lo ves, revisá la carpeta de spam.</p>
  <a href="#/pedidos" class="inline-block mt-6 bg-black text-white rounded-full px-6 py-3 text-sm font-semibold">Ver mis pedidos</a></section>`;
C.pedidos = () => `<section class="max-w-3xl mx-auto px-4 py-12"><div class="flex justify-between items-center mb-6"><h2 class="text-3xl font-black">Mis pedidos</h2>
  <button onclick="Auth.out()" class="text-sm underline">Cerrar sesión</button></div><div id="plist" class="space-y-3">Cargando…</div></section>`;

// ---------- Mi cuenta (ícono del usuario) ----------
C.shell = inner => `<div class="fixed inset-0 z-50 flex justify-center sm:justify-end items-start p-4 sm:pt-20"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<div class="relative bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-auto p-5">${inner}</div></div>`;
C.account = () => {
  const u = Auth.user || {}, m = u.user_metadata || {};
  const row = (icon, t, attrs) => { const tag = attrs.startsWith('href') ? 'a' : 'button'; return `<${tag} ${attrs} class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-100 text-left text-sm font-semibold"><i data-lucide="${icon}" class="w-4 h-4"></i>${t}</${tag}>`; };
  return C.shell(`<div class="flex justify-between items-start gap-3"><div class="min-w-0"><p class="text-xs text-neutral-500">Mi cuenta</p><p class="font-black text-lg truncate">${C.esc(m.nombre || 'Mi perfil')}</p><p class="text-sm text-neutral-600 truncate">${C.esc(u.email || '')}</p></div>
  <button onclick="App.close()" aria-label="Cerrar"><i data-lucide="x"></i></button></div>
  <div class="mt-4 border-t pt-2 space-y-1">
  ${row('package', 'Mis pedidos', 'href="#/pedidos" onclick="App.close()"')}
  ${row('map-pin', 'Mis datos para próximos pedidos', 'type="button" onclick="Auth.datos()"')}
  ${row('lock', 'Cambiar contraseña', 'type="button" onclick="Auth.passModal()"')}
  ${row('circle-help', 'Preguntas frecuentes', 'href="#/info/faq" onclick="App.close()"')}
  ${row('message-circle', 'Contacto', 'href="#/info/contacto" onclick="App.close()"')}
  </div><div class="mt-2 border-t pt-2">${row('log-out', 'Cerrar sesión', 'type="button" onclick="App.close();Auth.out()"')}</div>`);
};
C.datos = () => {
  const u = Auth.user || {}, m = u.user_metadata || {}, f = (n, l, v, req, t = 'text') => `<input name="${n}" type="${t}" ${req ? 'required' : ''} value="${C.esc(v || '')}" placeholder="${l}" class="${C.inp}">`;
  return C.shell(`<form onsubmit="return Auth.saveDatos(event)" class="space-y-3">
  <div class="flex justify-between items-center"><h3 class="font-black text-lg">Mis datos</h3><button type="button" onclick="Auth.menu()" class="text-sm underline">Volver</button></div>
  <p class="text-xs text-neutral-500">Se completan solos cuando hacés un pedido. Mail de la cuenta: <b>${C.esc(u.email || '')}</b></p>
  ${f('nombre', 'Nombre y apellido completos', m.nombre, true)}
  <input name="dni" value="${C.esc(m.dni || '')}" inputmode="numeric" maxlength="10" placeholder="DNI (solo números, sin puntos)" class="${C.inp}">
  ${f('telefono', 'Teléfono con código de área', m.telefono, false, 'tel')}
  ${f('direccion', 'Dirección: calle y número', m.direccion, false)}
  ${f('piso', 'Piso, departamento, torre o barrio', m.piso, false)}
  <div class="grid grid-cols-2 gap-2">${f('localidad', 'Localidad', m.localidad, false)}<select name="provincia" class="${C.inp}"><option value="">Provincia</option>${PROVINCIAS.map(x => `<option ${x === m.provincia ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <input name="cp" value="${C.esc(m.cp || '')}" inputmode="numeric" maxlength="4" placeholder="Código postal (4 números)" class="${C.inp}">
  ${f('notas', 'Referencias para la entrega', m.notas, false)}
  <p id="derr" class="text-sm text-red-700"></p>
  <button id="dbtn" class="w-full bg-black text-white rounded-full py-3 font-semibold">Guardar mis datos</button></form>`);
};
C.password = () => C.shell(`<form onsubmit="return Auth.savePass(event)" class="space-y-3">
  <div class="flex justify-between items-center"><h3 class="font-black text-lg">Cambiar contraseña</h3><button type="button" onclick="Auth.menu()" class="text-sm underline">Volver</button></div>
  <input name="p1" type="password" required minlength="6" autocomplete="new-password" placeholder="Nueva contraseña (mínimo 6 caracteres)" class="${C.inp}">
  <input name="p2" type="password" required minlength="6" autocomplete="new-password" placeholder="Repetí la nueva contraseña" class="${C.inp}">
  <p id="perr" class="text-sm text-red-700"></p>
  <button id="pbtn" class="w-full bg-black text-white rounded-full py-3 font-semibold">Guardar contraseña</button></form>`);

// Buscador: se abre al tocar la lupa del encabezado
C.searchBox = () => `<div class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<form onsubmit="return App.search(event)" class="relative bg-white rounded-full w-full max-w-lg shadow-xl flex items-center gap-2 px-4 py-2">
  <i data-lucide="search" class="w-5 h-5 text-neutral-500"></i>
  <input id="q" list="sug" autocomplete="off" placeholder="Buscar productos" class="flex-1 bg-transparent py-2 text-base focus:outline-none">
  <datalist id="sug">${Store.products.slice(0, 40).map(p => `<option value="${C.esc(p.nombre)}">`).join('')}</datalist>
  <button type="button" onclick="App.close()" aria-label="Cerrar"><i data-lucide="x" class="w-5 h-5"></i></button></form></div>`;
