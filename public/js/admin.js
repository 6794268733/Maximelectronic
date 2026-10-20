// Panel de administración. Las escrituras pasan por /api/admin, protegido con ADMIN_PASSWORD en el servidor.
const Admin = {
  pending: null, pw: sessionStorage.getItem('mx_pw') || '',
  view() {
    if (!this.pw) return `<section class="max-w-sm mx-auto px-4 py-20"><h2 class="text-2xl font-black mb-4">Administración</h2>
      <form onsubmit="return Admin.login(event)" class="space-y-3"><input name="pw" type="password" required placeholder="Contraseña de administrador" class="w-full border border-neutral-300 rounded-xl px-3 py-2">
      <button class="w-full bg-black text-white rounded-full py-3 font-semibold">Entrar</button></form></section>`;
    const pv = this.pending;
    return `<section class="max-w-7xl mx-auto px-4 py-10">
    <div class="flex justify-between items-center"><h2 class="text-3xl font-black">Panel de administración</h2><button onclick="Admin.logout()" class="text-sm underline">Salir</button></div>
    <p class="mt-2 text-sm bg-neutral-200 rounded-xl p-3">El stock se descuenta solo con cada pedido. Los pedidos se ven en Supabase > Table Editor > pedidos.</p>
    <div class="flex flex-wrap gap-2 mt-5">
      <button onclick="Excel.template()" class="bg-black text-white rounded-full px-5 py-2 text-sm">Descargar plantilla Excel</button>
      <button onclick="Excel.exportXlsx(Store.all)" class="border border-black rounded-full px-5 py-2 text-sm">Exportar Excel</button>
      <button onclick="Admin.seed()" class="border border-neutral-400 text-neutral-600 rounded-full px-5 py-2 text-sm">Cargar productos de ejemplo</button></div>
    <label class="mt-6 block border-2 border-dashed border-neutral-400 rounded-2xl p-10 text-center cursor-pointer grad-light"
      ondragover="event.preventDefault()" ondrop="event.preventDefault();Admin.file(event.dataTransfer.files[0])">
      Arrastrá tu Excel (.xlsx o .csv) acá o hacé clic para elegirlo
      <input type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="Admin.file(this.files[0])"></label>
    ${pv ? `<div class="mt-6"><p class="font-semibold">Vista previa: ${pv.ok.length} productos válidos, ${pv.errors.length} con errores</p>
      ${pv.errors.map(e => `<p class="text-sm text-red-700">Fila ${e.fila}: ${e.motivo}</p>`).join('')}
      <div class="overflow-x-auto mt-3"><table class="text-sm w-full">${pv.ok.slice(0, 15).map(p => `<tr class="border-b"><td class="py-1 pr-3">${p.sku}</td><td class="pr-3">${p.nombre}</td><td class="pr-3">${p.categoria}</td><td class="pr-3">${p.precio_usd ? Store.fmtUsd(p.precio_usd) + ' · ' : ''}${Store.fmt(p.precio_final)}</td><td>${p.stock}</td></tr>`).join('')}</table></div>
      <label class="block mt-3 text-sm"><input type="checkbox" id="ks" checked> Mantener el stock actual de los productos que ya existen (recomendado)</label>
      <button onclick="Admin.confirm()" class="mt-3 bg-black text-white rounded-full px-6 py-2 font-semibold">Confirmar importación</button></div>` : ''}
    <h3 class="text-xl font-black mt-10 mb-3">Productos (${Store.all.length})</h3>
    <div class="overflow-x-auto"><table class="text-sm w-full">${Store.all.map(p => `<tr class="border-b"><td class="py-2 pr-3">${p.sku}</td><td class="pr-3">${p.nombre}</td><td class="pr-3">${p.categoria}</td><td class="pr-3">${p.precio_usd ? Store.fmtUsd(p.precio_usd) + ' · ' : ''}${Store.fmt(p.precio_final)}</td><td class="pr-3">Stock: ${p.stock}</td>
      <td><button class="underline mr-3" onclick="Admin.setStock('${p.sku}')">Cambiar stock</button><button class="underline text-red-700" onclick="Admin.del('${p.sku}')">Eliminar</button></td></tr>`).join('')}</table></div></section>`;
  },
  async call(accion, data = {}) {
    try {
      const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': this.pw }, body: JSON.stringify({ accion, ...data }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { alert(j.error || 'Esto solo funciona con la web publicada en Vercel.'); return null; }
      return j;
    } catch (e) { alert('No hay conexión con el servidor.'); return null; }
  },
  async refresh() { await Store.load(); App.render(); },
  login(e) { e.preventDefault(); this.pw = new FormData(e.target).get('pw'); this.call('ping').then(j => { if (j) sessionStorage.setItem('mx_pw', this.pw); else this.pw = ''; App.render(); }); return false; },
  logout() { this.pw = ''; sessionStorage.removeItem('mx_pw'); App.render(); },
  async file(f) { if (!f) return; try { this.pending = await Excel.parse(f); } catch (e) { alert('No se pudo leer el archivo. Usá la plantilla.'); } App.render(); },
  async confirm() { const j = await this.call('importar', { rows: this.pending.ok, mantenerStock: document.getElementById('ks').checked }); if (j) { this.pending = null; alert(j.cantidad + ' productos guardados.'); this.refresh(); } },
  async seed() { if (!confirm('Se cargan los productos de ejemplo (pisan los que tengan el mismo SKU).')) return; const j = await this.call('sembrar', { rows: window.CATALOG_SEED }); if (j) this.refresh(); },
  async setStock(sku) { const p = Store.find(sku), v = prompt('Nuevo stock para ' + p.nombre, p.stock); if (v === null) return; const j = await this.call('stock', { sku, stock: parseInt(v, 10) || 0 }); if (j) this.refresh(); },
  async del(sku) { if (!confirm('¿Eliminar este producto?')) return; const j = await this.call('eliminar', { sku }); if (j) this.refresh(); }
};
