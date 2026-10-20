const C = {};
C.slides = CONFIG.SLIDES;   // se editan en js/config.js
C.pages = {
  faq: ['Preguntas frecuentes', [['¿Hacen envíos a todo el país?', 'Sí, enviamos a toda la Argentina con ' + CONFIG.CARRIERS_TEXT + ', a domicilio o a sucursal.'], ['¿Cuánto cuesta el envío?', 'El costo lo paga el comprador. Se calcula automáticamente con tu código postal antes de pagar, con la tarifa vigente de cada empresa.'], ['¿Tienen stock?', 'Sí. Todo producto publicado en la tienda está en stock.'], ['¿Qué medios de pago aceptan?', 'Tarjetas Visa, Mastercard, American Express, Cabal y Naranja.'], ['¿Tienen garantía?', 'Todos los productos tienen garantía oficial del fabricante.']]],
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
<div class="bg-white text-black border-b border-neutral-300 text-center text-xs sm:text-sm font-black tracking-wide py-2 px-4">${CONFIG.STOCK_NOTICE}</div>
<div class="bg-black text-white text-xs text-center py-2 px-4">${CONFIG.ANNOUNCEMENT}</div>
<header class="glass-header sticky top-0 z-40 border-b border-neutral-200">
  <div class="max-w-7xl mx-auto flex items-center gap-4 px-4 h-16">
    <a href="#/" class="font-black tracking-tight text-lg whitespace-nowrap">MAXIM<span class="font-light">ELECTRONIC</span></a>
    <nav class="hidden lg:flex gap-5 text-sm ml-4">
      ${Store.cats().slice(0, 7).map(c => `<a class="hover:underline" href="#/catalogo/${encodeURIComponent(c)}">${c}</a>`).join('')}
      <a class="font-semibold hover:underline" href="#/catalogo/ofertas">Ofertas</a>
    </nav>
    <form class="ml-auto flex-1 max-w-xs" onsubmit="return App.search(event)">
      <input id="q" list="sug" autocomplete="off" placeholder="Buscar productos" class="w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm focus:outline-none focus:border-black">
      <datalist id="sug">${Store.products.slice(0, 40).map(p => `<option value="${p.nombre}">`).join('')}</datalist>
    </form>
    <button onclick="App.account()" class="p-2" aria-label="Mi cuenta"><i data-lucide="user"></i></button>
    <button onclick="App.cart(true)" class="relative p-2" aria-label="Carrito"><i data-lucide="shopping-bag"></i>
      <span id="cc" class="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">${Store.count()}</span></button>
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
C.price = (p, big) => {
  const usd = Number(p.precio_usd) > 0, lista = p.precio_lista > p.precio_final ? `<span class="line-through text-neutral-500 mr-2">${Store.fmt(p.precio_lista)}</span>` : '';
  return usd
    ? `<div class="${big ? 'text-3xl' : 'text-xl'} font-black">${Store.fmtUsd(p.precio_usd)}</div><div class="${big ? 'text-lg' : 'text-sm'} text-neutral-600">${lista}${Store.fmt(p.precio_final)}</div>`
    : `${lista ? `<div class="text-sm">${lista}</div>` : ''}<div class="${big ? 'text-3xl' : 'text-xl'} font-black">${Store.fmt(p.precio_final)}</div>`;
};
C.card = p => `
<article class="grad-light rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition cursor-pointer flex flex-col" onclick="App.open('${p.sku}')">
  <div class="category-card-hover overflow-hidden rounded-xl"><img src="${p.imagen}" alt="${p.nombre}" loading="lazy" class="w-full aspect-square object-cover"></div>
  <div class="mt-3 text-xs text-neutral-500">Ref: ${p.sku}${p.stock > 0 ? '' : ' · Sin stock'}</div>
  <h3 class="font-semibold mt-1 leading-snug">${p.nombre}</h3>
  <div class="mt-auto pt-3">
    ${C.price(p)}
    <button ${p.stock > 0 ? '' : 'disabled'} onclick="event.stopPropagation();App.add('${p.sku}')" class="mt-3 w-full rounded-full py-2 text-sm font-semibold ${p.stock > 0 ? 'bg-black text-white hover:bg-neutral-800' : 'bg-neutral-300 text-neutral-500'}">Agregar al carrito</button>
  </div>
</article>`;
C.featured = () => `
<section class="max-w-7xl mx-auto px-4 py-12"><h2 class="text-2xl font-black mb-6">Productos destacados</h2>
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">${Store.products.filter(p => p.destacado).slice(0, 8).map(C.card).join('')}</div></section>`;
C.reviews = () => `
<section class="grad-dark text-white"><div class="max-w-7xl mx-auto px-4 py-12">
  <div class="flex flex-wrap items-center gap-4 mb-6"><h2 class="text-2xl font-black">Lo que dicen nuestros clientes</h2>
  <span class="text-sm text-neutral-400">★★★★★ 4,9 · reseñas de ejemplo</span>
  <a href="#" class="text-sm underline">Leé las opiniones</a></div>
  <div class="grid md:grid-cols-3 gap-4">${[['Excelente atención y llegó rápido.', 'Antonela Estefanía de la Cruz'], ['Compré mi drone y vino perfecto.', 'Cliente 2'], ['Muy buena asesoría por WhatsApp.', 'Cliente 3']]
    .map(r => `<div class="glass-card text-black rounded-2xl p-5"><p>★★★★★</p><p class="mt-2">${r[0]}</p><p class="mt-3 text-sm text-neutral-500">${r[1]}</p></div>`).join('')}</div>
</div></section>`;
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
C.modal = p => `
<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<div class="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-auto grid md:grid-cols-2">
  <img src="${p.imagen}" alt="${p.nombre}" class="w-full aspect-square object-cover">
  <div class="p-6"><button onclick="App.close()" class="float-right" aria-label="Cerrar"><i data-lucide="x"></i></button>
    <p class="text-xs text-neutral-500">${p.marca} · ${p.categoria}</p><h3 class="text-2xl font-black mt-1">${p.nombre}</h3><p class="text-xs text-neutral-500">Ref: ${p.sku}</p>
    <div class="mt-3">${C.price(p, true)}</div>
    <p class="mt-4 text-sm text-neutral-600">${p.descripcion || ''}</p><p class="mt-2 text-sm text-neutral-600">${p.especificaciones || ''}</p>
    ${(p.colores || []).length ? `<select id="vc" class="mt-4 w-full border rounded-full px-3 py-2 text-sm">${p.colores.map(c => `<option>${c}</option>`).join('')}</select>` : ''}
    ${(p.almacenamiento || []).length ? `<select id="va" class="mt-2 w-full border rounded-full px-3 py-2 text-sm">${p.almacenamiento.map(c => `<option>${c}</option>`).join('')}</select>` : ''}
    <button ${p.stock > 0 ? '' : 'disabled'} onclick="App.addModal('${p.sku}')" class="mt-5 w-full rounded-full py-3 font-semibold ${p.stock > 0 ? 'bg-black text-white' : 'bg-neutral-300 text-neutral-500'}">${p.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}</button>
  </div></div></div>`;
C.drawer = () => `
<div class="fixed inset-0 z-50"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<aside class="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col">
  <div class="p-4 flex justify-between items-center border-b"><h3 class="font-black text-lg">Tu carrito</h3><button onclick="App.close()" aria-label="Cerrar"><i data-lucide="x"></i></button></div>
  <div class="flex-1 overflow-auto p-4 space-y-3">${Store.cart.length ? Store.cart.map((i, n) => `
    <div class="flex justify-between items-center gap-3 border-b pb-3"><div class="text-sm"><p class="font-semibold">${i.nombre}</p><p class="text-neutral-500">${[i.color, i.alm].filter(Boolean).join(' · ')}</p><p>${i.usd > 0 ? `<b>${Store.fmtUsd(i.usd)}</b><br><span class="text-neutral-600">${Store.fmt(i.precio)}</span>` : Store.fmt(i.precio)}</p></div>
    <div class="flex items-center gap-2"><button onclick="App.qty(${n},-1)" class="w-7 h-7 border rounded-full">−</button><span>${i.qty}</span><button onclick="App.qty(${n},1)" class="w-7 h-7 border rounded-full">+</button></div></div>`).join('') : '<p class="text-neutral-500 text-center py-20">Tu carrito está vacío. Agregá productos para empezar.</p>'}</div>
  <div class="p-4 border-t"><div class="flex justify-between items-start font-black text-lg mb-1"><span>Subtotal</span><span class="text-right">${Store.totalUsd() ? `<span class="block">${Store.fmtUsd(Store.totalUsd())}</span><span class="block text-sm font-semibold text-neutral-600">${Store.fmt(Store.total())}</span>` : Store.fmt(Store.total())}</span></div>
  <p class="text-xs text-neutral-500 mb-3">El envío lo paga el comprador y se calcula con tu código postal antes de pagar.</p>
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
  <div class="text-sm flex justify-between"><span>Envío</span><span>${s ? Store.fmt(s.precio) : 'se calcula con tu código postal'}</span></div>
  <div class="font-black text-lg flex justify-between"><span>Total a pagar</span><span>${Store.fmt(Store.total() + (s ? s.precio : 0))}</span></div>
  <p class="text-xs text-neutral-500">El pago se realiza en pesos argentinos.</p>`;
};
C.checkout = () => {
  const m = (Auth.user && Auth.user.user_metadata) || {}, P = CONFIG.PAYMENTS;
  const f = (n, l, v = '', req = true, t = 'text') => `<input name="${n}" type="${t}" ${req ? 'required' : ''} value="${v}" placeholder="${l}" class="${C.inp}">`;
  return `<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<form onsubmit="return Checkout.submit(event)" class="relative bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-auto p-6 space-y-3">
  <h3 class="text-xl font-black">Finalizar compra</h3>
  <p class="text-sm text-neutral-600">${Store.cart.map(i => `${i.qty}x ${i.nombre}`).join(' · ')}</p>
  ${f('nombre', 'Nombre y apellido', m.nombre || '')}${f('telefono', 'Teléfono', m.telefono || '', true, 'tel')}
  ${f('direccion', 'Dirección de entrega (calle y número)')}
  <div class="grid grid-cols-2 gap-2">${f('localidad', 'Localidad')}${f('provincia', 'Provincia')}</div>
  <input name="cp" required inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="Código postal (4 números, ej. 3370)" oninput="Checkout.cpChanged(this.value)" class="${C.inp}">
  ${f('notas', 'Notas (opcional)', '', false)}
  <div class="text-sm space-y-2"><p class="font-semibold">Envío <span class="font-normal text-neutral-500">(lo paga el comprador)</span></p>
    <div id="envopts" class="space-y-2 text-neutral-500">Ingresá tu código postal para calcular el costo de envío.</div>
    <div id="sucwrap"></div></div>
  <div id="ctot" class="space-y-1 border-t pt-3">${C.totales()}</div>
  <div class="text-sm space-y-2"><p class="font-semibold">Medio de pago</p>
    ${[['uala', 'Tarjeta de crédito o débito (Ualá)'], ['mercadopago', 'Mercado Pago (tarjeta o dinero en cuenta)'], ['transferencia', 'Transferencia bancaria / billetera virtual']]
      .filter(([k]) => P[k]).map(([k, t], i) => `<label class="flex gap-2"><input type="radio" name="metodo" value="${k}" ${i === 0 ? 'checked' : ''}> ${t}</label>`).join('')}</div>
  <p id="cerr" class="text-sm text-red-700"></p>
  <button id="cbtn" class="w-full bg-black text-white rounded-full py-3 font-semibold">Confirmar pedido</button></form></div>`;
};
C.done = r => `<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/60" onclick="App.close()"></div>
<div class="relative bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-3">
  <p class="text-sm text-neutral-500">Pedido recibido</p><p class="text-4xl font-black">${r.numero}</p><p class="font-semibold">Total: ${Store.fmt(r.total)}</p>
  ${r.transferencia ? `<div class="text-sm text-left grad-light rounded-2xl p-4"><p>Para confirmar tu compra, transferí <b>${Store.fmt(r.total)}</b> a:</p>
    <p class="mt-2">Alias: <b>${r.transferencia.alias || '(a confirmar)'}</b></p><p>Titular: <b>${r.transferencia.titular || ''}</b></p>
    <p class="mt-2">Indicá el número de pedido <b>${r.numero}</b> en el concepto y mandanos el comprobante por WhatsApp.</p></div>
    <a target="_blank" rel="noopener" href="${Store.wa('Hola, hice el pedido ' + r.numero + ' por ' + Store.fmt(r.total) + '. Te envío el comprobante.')}" class="block bg-black text-white rounded-full py-3 font-semibold">Enviar comprobante por WhatsApp</a>` : ''}
  <a href="#/pedidos" onclick="App.close()" class="block underline text-sm">Ver mis pedidos</a></div></div>`;
C.pedidos = () => `<section class="max-w-3xl mx-auto px-4 py-12"><div class="flex justify-between items-center mb-6"><h2 class="text-3xl font-black">Mis pedidos</h2>
  <button onclick="Auth.out()" class="text-sm underline">Cerrar sesión</button></div><div id="plist" class="space-y-3">Cargando…</div></section>`;
