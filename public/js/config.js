// Configuración de la tienda. Editá solo este archivo para cambiar datos.
window.CONFIG = {
  STORE_NAME: 'MAXIMELECTRONIC',
  OWNER: 'Cristian Wrubel',
  WHATSAPP: '543754400392',            // formato internacional sin + ni espacios
  CITY: 'Puerto Iguazú, Misiones, Argentina',
  ADDRESS: '',                          // completar con la dirección exacta: el mapa se actualiza solo
  HOURS: 'Lunes a Viernes de 08 a 20:30 hs',
  EMAIL: 'maximelectronic1@gmail.com',
  ANNOUNCEMENT: 'Comprá online con tu cuenta | Envíos a todo el país (el costo lo paga el comprador)',
  STOCK_NOTICE: 'TODO PRODUCTO PUBLICADO ESTÁ EN STOCK · No hace falta consultar disponibilidad',   // cartel de arriba de todo
  CARRIERS_TEXT: 'Correo Argentino y Andreani',   // se usa en las preguntas frecuentes
  SOCIAL: { instagram: 'https://www.instagram.com/digidots_3d/', facebook: '', tiktok: '', youtube: '', linkedin: '' }, // pegá cada link acá
  // Medios de pago visibles en el checkout. Ualá solo funciona si cargaste sus variables en Vercel.
  PAYMENTS: { uala: true, mercadopago: false, transferencia: false },   // transferencia es manual (hay que confirmarla a mano): apagada
  // Carrusel del inicio. prod = productos con foto que se muestran en ese slide: 'destacados', 'ofertas', el nombre de una categoría (ej. 'Drones') o una lista de SKUs (['EJ-001','EJ-009']). Se toman de las fotos cargadas en el Excel (imagen_principal).
  // t = título, s = subtítulo, b = texto del botón, l = a dónde lleva, img = enlace de la foto de fondo (opcional).
  // Si img queda vacío, se ve el fondo gris de siempre. Foto recomendada: horizontal, unos 1920x800 px, JPG de menos de 300 KB.
  SLIDES: [
    { t: 'Tecnología de alta gama', s: 'Celulares, notebooks, drones y más', l: '#/catalogo/ofertas', b: 'Ver ofertas', g: 'grad-dark', prod: 'destacados', img: '' },
    { t: 'Drones que llegan más alto', s: 'Nueva categoría con cámara 4K, 5K y 6K', l: '#/catalogo/Drones', b: 'Ver drones', g: 'grad-mid', prod: 'Drones', img: '' },
    { t: 'Comprá online, sin vueltas', s: 'Registrate, elegí tus productos y pagá desde la web', l: '#/catalogo/todos', b: 'Ver catálogo', g: 'grad-dark', prod: 'ofertas', img: '' },
    { t: 'Envíos a todo el país', s: 'Comprá desde donde estés, con asesoría remota', l: '#/info/contacto', b: 'Consultar', g: 'grad-mid', prod: 'Notebooks', img: '' },
    { t: 'Audio HiFi y auriculares', s: 'Sonido de otro nivel', l: '#/catalogo/Audio HiFi', b: 'Ver audio', g: 'grad-dark', prod: 'Audio HiFi', img: '' }
  ],
  // Supabase: Settings > API en tu proyecto. Pegá la URL y la clave "anon public" (la pública; NUNCA la "service_role").
  SUPABASE_URL: 'https://axfupcpkwoymlfabxxkt.supabase.co',        // ejemplo: 'https://abcdefgh.supabase.co'
  SUPABASE_ANON_KEY: 'sb_publishable_jUQGHmA03tRQLlBt7RS85A_w60yqT1o',   // empieza con 'eyJ...'
  CATALOG_URL: 'data/productos.json',   // solo respaldo: el catálogo real vive en Supabase
};
