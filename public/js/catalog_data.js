// Catálogo de ejemplo (fallback). Precios e imágenes de referencia.
(function () {
  const img = t => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fafafa'/><stop offset='1' stop-color='#d4d4d4'/></linearGradient></defs><rect width='600' height='600' fill='url(#g)'/><rect x='190' y='130' width='220' height='320' rx='28' fill='#171717'/><text x='300' y='520' font-family='Arial' font-size='24' text-anchor='middle' fill='#404040'>" + t + "</text></svg>");
  // categoria, marca, nombre, precio_final, descuento%, stock, destacado, especificaciones
  const R = [
    ['Celulares','Apple','iPhone 17 Pro',3219989,20,12,1,'Pantalla OLED 6.3"; Cámara 48MP; 256GB'],
    ['Celulares','Apple','iPhone 17 Pro Max',4299000,18,6,0,'Pantalla OLED 6.9"; Cámara 48MP; 512GB'],
    ['Celulares','Samsung','Samsung Galaxy S25 Ultra 256GB',3650000,22,8,1,'Pantalla AMOLED 6.9"; 200MP; 256GB'],
    ['Celulares','Samsung','Samsung Galaxy A56 128GB',899000,12,20,0,'Pantalla 6.7"; Batería 5000mAh'],
    ['Notebooks','Apple','MacBook Air 13" M5',2979639,15,7,1,'13.6"; 16GB RAM; SSD 512GB'],
    ['Notebooks','Apple','MacBook Pro 14" M5',5289989,15,4,1,'14.2" XDR; 24GB RAM; SSD 1TB'],
    ['Notebooks','ASUS','ASUS ROG Strix G16',2450000,10,5,0,'RTX 4060; 16GB RAM; 165Hz'],
    ['Notebooks','Lenovo','Lenovo IdeaPad 15"',1190000,8,14,0,'Core i5; 8GB RAM; SSD 256GB'],
    ['Tablets','Apple','iPad Air 13" M4 WiFi',2644988,25,9,1,'13"; 256GB; Chip M4'],
    ['Tablets','Samsung','Samsung Galaxy Tab S10 11"',1350000,10,11,0,'11" AMOLED; 128GB; S Pen incluido'],
    ['Tablets','Xiaomi','Xiaomi Redmi Pad 10.6"',320000,5,25,0,'10.6"; 128GB; Batería 8000mAh'],
    ['Smartwatch','Apple','Apple Watch Series 11',1099000,12,15,1,'GPS; Sensor ECG; Resistente al agua'],
    ['Smartwatch','Samsung','Samsung Galaxy Watch 8',520000,10,18,0,'AMOLED; GPS; Monitor de salud'],
    ['Smartwatch','Xiaomi','Xiaomi Smart Band 9',99000,0,40,0,'AMOLED; Pulsómetro; 21 días de batería'],
    ['Auriculares','Apple','AirPods Pro 3',450000,15,30,1,'Cancelación de ruido; Estuche MagSafe'],
    ['Auriculares','Samsung','Samsung Galaxy Buds 3',210000,10,22,0,'Bluetooth 5.4; ANC'],
    ['Auriculares','Sony','Sony WH-1000XM5',380000,20,10,0,'ANC; 30h de batería'],
    ['Audio HiFi','JBL','JBL Charge 5',280000,10,16,0,'IP67; 20h de batería'],
    ['Audio HiFi','Sony','Sony HT-S400 Barra de Sonido 2.1',590000,12,6,0,'Subwoofer inalámbrico; 330W'],
    ['Drones','DJI','DJI Mini 4K',899000,14,10,1,'Cámara 4K; 31 min de vuelo; <249g'],
    ['Drones','DJI','DJI Air 3S',1750000,10,6,1,'Doble cámara; 45 min; Sensores omnidireccionales'],
    ['Drones','DJI','DJI Mavic 4 Pro',3490000,8,3,0,'Hasselblad 100MP; 51 min; Hasta 30km'],
    ['Drones','DJI','DJI Avata 2 FPV',1290000,5,5,0,'FPV inmersivo; 4K/60; Gafas incluidas'],
    ['Drones','DJI','DJI Agras T25',9800000,0,2,0,'Tanque 20L; Pulverización agrícola'],
    ['Drones','DJI','DJI Neo',320000,10,18,0,'4K; 135g; Control por gestos'],
    ['Accesorios','Anker','Cargador Anker 65W GaN',65000,10,50,0,'USB-C; Carga rápida'],
    ['Accesorios','Spigen','Funda Spigen para iPhone',35000,0,60,0,'Antigolpes; Compatible MagSafe'],
    ['Bolsos y mochilas','Xiaomi','Mochila Xiaomi Business',89000,10,20,0,'Notebook hasta 15.6"; Impermeable']
  ];
  window.CATALOG_SEED = R.map((r, i) => ({
    sku: 'MX-' + String(i + 1).padStart(3, '0'),
    nombre: r[2], categoria: r[0], marca: r[1],
    descripcion: r[2] + ' - precio e imagen de referencia.',
    especificaciones: r[7],
    precio_final: r[3],
    precio_usd: Math.round(r[3] / 1620),   // referencia (dólar 1620): dato de ejemplo
    precio_lista: r[4] ? Math.round(r[3] / (1 - r[4] / 100)) : r[3],
    stock: r[5],
    imagen: img(r[2].replace(/[&<>"']/g, '')), imagenes: [],
    colores: ['Negro', 'Gris'], almacenamiento: [],
    destacado: !!r[6], oferta: r[4] > 0, etiqueta: r[4] ? '-' + r[4] + '%' : ''
  }));
})();
