// Configuración de la tienda. Editá solo este archivo para cambiar datos.
window.CONFIG = {
  STORE_NAME: 'MAXIMELECTRONIC',
  OWNER: 'Cristian Wrubel',
  RAZON_SOCIAL: 'Cristian Wrubel',      // titular de la tienda (se muestra en el pie de página y en los Términos y condiciones)
  CUIT: '20-35006000-7',
  // Data Fiscal (Formulario 960/D de ARCA): pegá entre las comillas el código "Script" que te da ARCA para tu sitio (empieza con <a href="http://qr.afip.gob.ar/...). Vacío = no se muestra.
  DATA_FISCAL_HTML: '',
  WHATSAPP: '543754400392',            // formato internacional sin + ni espacios
  CITY: 'Puerto Iguazú, Misiones, Argentina',
  ADDRESS: '',                          // completar con la dirección exacta: el mapa se actualiza solo
  HOURS: 'Lunes a Viernes de 10 a 18:30 hs',
  EMAIL: 'maximelectronic1@gmail.com',
  ANNOUNCEMENT: 'Comprá online con tu cuenta | Envío gratis a todo el país',
  STOCK_NOTICE: 'TODO PRODUCTO PUBLICADO ESTÁ EN STOCK · No hace falta consultar disponibilidad',   // cartel de arriba de todo
  CARRIERS_TEXT: 'Correo Argentino, Andreani y Vía Cargo',   // se usa en las preguntas frecuentes
  SOCIAL: { instagram: '', facebook: '', tiktok: '', youtube: '', linkedin: '' }, // pegá cada link acá
  // Medios de pago visibles en el checkout. Ualá solo funciona si cargaste sus variables en Cloudflare.
  // Recargo (en %) que se suma al total cuando el cliente paga con tarjeta (Ualá). Transferencia / billetera virtual queda sin recargo. 0 = sin recargo.
  // IMPORTANTE: tiene que ser el MISMO número que la variable RECARGO_TARJETA_PCT de Cloudflare (la que manda es la del servidor; si no coinciden, el checkout avisa que el total cambió).
  RECARGO_TARJETA_PCT: 22,
  CUOTAS_MAX: 3,   // cuotas que ofrecés en Ualá (solo para el texto del checkout: las cuotas que se ofrecen se eligen en la app de Ualá Bis)
  // Envío gratis (el costo va incluido en el precio). Tiene que coincidir con la variable ENVIO_GRATIS=1 de Cloudflare.
  ENVIO_GRATIS: true,
  PAYMENTS: { uala: true, mercadopago: false, transferencia: true },   // transferencia: se confirma a mano en el panel > Pedidos (necesita TRANSFER_ALIAS y TRANSFER_TITULAR en Cloudflare)
  // Carrusel del inicio. prod = productos con foto que se muestran en ese slide: 'destacados', 'ofertas', el nombre de una categoría (ej. 'Drones') o una lista de SKUs (['EJ-001','EJ-009']). Se toman de las fotos cargadas en el Excel (imagen_principal).
  // t = título, s = subtítulo, b = texto del botón, l = a dónde lleva, img = enlace de la foto de fondo (opcional).
  // Si img queda vacío, se ve el fondo gris de siempre. Foto recomendada: horizontal, unos 1920x800 px, JPG de menos de 300 KB.
   SLIDES: [
    { t: 'Drones que llegan más alto', s: 'Cámara 4K, 5K y 6K', l: '#/catalogo/Drones', b: 'Ver drones', g: 'grad-dark', prod: '', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsnECVEznitHRyA5TB1yiiQ3DOaad8Jkflykx9FfADmw&s=10' },
    { t: 'Los mejores celulares', s: 'Las últimas marcas y modelos', l: '#/catalogo/Celulares', b: 'Ver celulares', g: 'grad-mid', prod: '', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR57xjqjLBLWt-soqtHPi44PdKcGjKLuFgWfhfqOzvk7A&s=10' },
    { t: 'Sonido de otro nivel', s: 'Parlantes y equipos de música', l: '#/catalogo/Audio HiFi', b: 'Ver audio', g: 'grad-dark', prod: '', img: 'https://blikstore.com/cdn/shop/articles/BLOG_2.jpg?v=1741805833&width=2048' },
    { t: 'Movete eléctrico', s: 'Monopatines eléctricos', l: '#/catalogo/todos', b: 'Ver catálogo', g: 'grad-mid', prod: '', img: 'https://media.lmneuquen.com/p/a03b3b951293c62a11d50904db871e7e/adjuntos/195/imagenes/007/679/0007679183/770x0/smart/el-uso-vehiculos-electricos-crece-neuquen.jpg' },
    { t: 'Climatizá tu casa', s: 'Aires acondicionados', l: '#/catalogo/todos', b: 'Ver catálogo', g: 'grad-dark', prod: '', img: 'https://tn.com.ar/resizer/v2/trucos-y-consejos-para-gastar-menos-energia-con-el-aire-acondicionado-foto-adobestock-MRZ76UU76FBFJGISJVXS2EELXQ.png?auth=b9345a05fd310ed9132a9a03617faf0d69bdeb802ff469818d013a54f7451512&width=767' }
  ],
  // Supabase: Settings > API en tu proyecto. Pegá la URL y la clave "anon public" (la pública; NUNCA la "service_role").
  SUPABASE_URL: 'https://axfupcpkwoymlfabxxkt.supabase.co',        // ejemplo: 'https://abcdefgh.supabase.co'
  SUPABASE_ANON_KEY: 'sb_publishable_jUQGHmA03tRQLlBt7RS85A_w60yqT1o',   // empieza con 'eyJ...'
  CATALOG_URL: 'data/productos.json',   // solo respaldo: el catálogo real vive en Supabase
};
