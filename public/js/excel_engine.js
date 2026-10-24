const COLS = ['sku','nombre','categoria','subcategoria','marca','descripcion','especificaciones','precio_lista','precio_venta_usd','precio_final','stock','peso_g','alto_cm','ancho_cm','largo_cm','imagen_principal','imagenes_extra','colores','almacenamiento','destacado','oferta','etiqueta'];
const Excel = {
  template() {
    const ejemplo = ['SKU-001','Producto de ejemplo','Celulares','','Marca','Descripción corta','Pantalla 6.1"; 256GB','',1032,1672000,10,600,8,12,20,'https://tu-sitio.com/foto.jpg','','Negro,Gris','128GB,256GB','si','si','Nuevo'];
    const ws = XLSX.utils.aoa_to_sheet([COLS, ejemplo]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  },
  async parse(file) {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    const ok = [], errors = [];
    const num = v => typeof v === 'number' ? v : (Number(String(v).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0);
    const list = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);
    const yes = v => ['si', 'sí', 'yes', 'true', '1', 'x'].includes(String(v).trim().toLowerCase());
    rows.forEach((r, i) => {
      const g = k => { const key = Object.keys(r).find(x => x.trim().toLowerCase() === k); return key ? r[key] : ''; };
      const p = {
        sku: String(g('sku')).trim() || 'MX-' + Date.now().toString(36) + i,
        nombre: String(g('nombre')).trim(), categoria: String(g('categoria')).trim(),
        marca: String(g('marca')).trim(), descripcion: String(g('descripcion')).trim(),
        especificaciones: String(g('especificaciones')).trim(),
        precio_final: num(g('precio_final')), precio_lista: num(g('precio_lista')), precio_usd: num(g('precio_venta_usd')),
        peso_g: Math.round(num(g('peso_g'))) || null, alto_cm: Math.round(num(g('alto_cm'))) || null, ancho_cm: Math.round(num(g('ancho_cm'))) || null, largo_cm: Math.round(num(g('largo_cm'))) || null,
        stock: num(g('stock')),
        imagen: String(g('imagen_principal')).trim(), imagenes: list(g('imagenes_extra')),
        colores: list(g('colores')), almacenamiento: list(g('almacenamiento')),
        destacado: yes(g('destacado')), oferta: yes(g('oferta')), etiqueta: String(g('etiqueta')).trim()
      };
      if (!p.precio_lista) p.precio_lista = p.precio_final;
      if (p.precio_lista > p.precio_final) p.oferta = true;   // con descuento cargado, el producto entra solo en Ofertas
      const e = [];
      if (!p.nombre) e.push('falta nombre');
      if (!p.categoria) e.push('falta categoría');
      if (!(p.precio_final > 0)) e.push('precio_final inválido');
      if (e.length) errors.push({ fila: i + 2, motivo: e.join(', ') }); else ok.push(p);
    });
    return { ok, errors };
  },
  exportXlsx(products) {
    const data = products.map(p => [p.sku,p.nombre,p.categoria,p.subcategoria||'',p.marca,p.descripcion,p.especificaciones,p.precio_lista,p.precio_usd||'',p.precio_final,p.stock,p.peso_g||'',p.alto_cm||'',p.ancho_cm||'',p.largo_cm||'',p.imagen,(p.imagenes||[]).join(','),(p.colores||[]).join(','),(p.almacenamiento||[]).join(','),p.destacado?'si':'no',p.oferta?'si':'no',p.etiqueta]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([COLS, ...data]), 'Productos');
    XLSX.writeFile(wb, 'catalogo_maximelectronic.xlsx');
  },
  exportJson(products) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(products, null, 1)], { type: 'application/json' }));
    a.download = 'productos.json'; a.click();
  }
};
