# Publicar en Cloudflare Pages (con GitHub)
Estructura: el sitio que ven los clientes está en `public/`; el servidor (cobros, pedidos, panel) está en `api/`, `functions/` y `lib/` y NO se publica como archivos.
1. **GitHub:** creá un repositorio privado y subí todo el contenido de esta carpeta (en la web: "Add file > Upload files"). No hay claves secretas en el código.
2. **Cloudflare:** Workers & Pages > Create > **Pages** > Connect to Git > elegí el repositorio. Framework: *None*. Build command: vacío. **Build output directory: `public`**.
3. Después del primer deploy, en el proyecto: **Settings > Runtime** (o "Functions"): Compatibility flags = `nodejs_compat` (en Production y Preview) y Compatibility date = `2025-06-01`.
4. **Settings > Variables and Secrets:** cargá las variables de más abajo (las claves como *Secret*). Luego **volvé a desplegar** (Deployments > Retry/Redeploy) para que las tomen.
5. **Supabase > Authentication > URL Configuration:** poné la dirección de tu sitio en Cloudflare como *Site URL* (sirve para los mails de confirmación).
6. Probá primero en modo prueba de Ualá (sin `UALA_ENV=prod`). Para empezar a cobrar de verdad, agregá `UALA_ENV=prod`.
7. Dominio propio: Pages > Custom domains.
Cada vez que subas cambios a GitHub, Cloudflare vuelve a publicar solo.
Para ver la tienda en tu computadora con Live Server, abrí la carpeta `public`. El cobro y el panel solo funcionan ya publicados.

# MAXIMELECTRONIC

## Cómo abrirlo en VS Code
1. Abrí la carpeta en VS Code.
2. Instalá la extensión **Live Server** y hacé clic derecho en `index.html` > "Open with Live Server".
   (No lo abras con doble clic: el navegador bloquea la lectura de `public/data/productos.json`.)

## Qué editar
- `public/js/config.js`: WhatsApp, ciudad, **dirección exacta** (el mapa se actualiza solo), horarios, redes sociales, textos.
- Logo: por ahora es texto en `public/js/components.js` (buscá "MAXIM"). Cuando lo definas se reemplaza por una imagen.
- Productos: panel en `panel-mx7k29qd.html` (ver más abajo).

## Carga de productos por Excel
1. En el admin, "Descargar plantilla Excel" y completala.
2. Arrastrala al recuadro, revisá la vista previa y "Confirmar importación".
3. Se guarda directo en Supabase (con la web publicada en Cloudflare). Ya no hace falta exportar el JSON.

## Antes de publicar
- Reemplazá los productos de ejemplo y sus imágenes.

## Registro, cobros y stock (Supabase + Cloudflare Pages)
Esto funciona solo con la web publicada en Cloudflare. En Live Server se ve todo menos el cobro y la carga de productos.
1. **Supabase** (gratis): creá un proyecto y corré `supabase/schema.sql` completo en SQL Editor. En Settings > API copiá la URL y la clave `anon` a `public/js/config.js`.
2. **Cloudflare Pages**: publicá la tienda con la sección «Publicar en Cloudflare» de más abajo y cargá estas variables de entorno:
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` (clave service_role: secreta, nunca en config.js), `ADMIN_PASSWORD` (inventala larga), `TRANSFER_ALIAS`, `TRANSFER_TITULAR`.
3. El panel es la página `panel-mx7k29qd.html` (`tu-dominio/panel-mx7k29qd.html`). No tiene enlaces desde la tienda, lleva `noindex` y el archivo `public/_headers` le agrega el encabezado `X-Robots-Tag`. **No la pongas en `robots.txt`**: eso mostraría la dirección. Para cambiar el nombre, renombrá el archivo y la línea correspondiente de `public/_headers`. Lo que realmente lo protege es la contraseña (validada por el servidor, con bloqueo de 15 minutos tras 5 intentos fallidos). Usá una contraseña larga. Entrá, ingresá la contraseña y subí tu Excel (o "Cargar productos de ejemplo" para probar).
4. **Ualá Bis** (tarjeta crédito/débito): en la app o web de Ualá, "Tu negocio", pedí las credenciales de API. Cargalas en Cloudflare como `UALA_USERNAME`, `UALA_CLIENT_ID` y `UALA_CLIENT_SECRET` (nunca en el código ni en un chat) y dejá `PAYMENTS.uala: true` en `public/js/config.js` (ya viene así; `false` lo oculta del checkout).
   Antes de publicar con Ualá, volvé a correr `supabase/schema.sql` (agrega la columna `pago_ref`). Arranca en el entorno de PRUEBA. Para cobrar de verdad, agregá la variable `UALA_ENV=prod`.
   **Primera prueba obligatoria:** hacé un pedido chico en prueba y verificá que el checkout de Ualá muestre el monto correcto (Ualá recibe el monto en pesos, como texto, mínimo 25 y máximo 9.999.999).
   5. **Comprobante por mail** (opcional pero recomendado): creá una cuenta gratis en resend.com, verificá tu dominio y cargá en Cloudflare `RESEND_API_KEY`, `MAIL_FROM` (por ejemplo `MAXIMELECTRONIC <ventas@tudominio.com>`) y, si querés copia de cada venta, `OWNER_EMAIL`. Sin dominio propio Resend solo deja enviar a tu propio mail, así que hace falta el dominio. Cuando Ualá confirma el pago, el pedido pasa a `pagado` solo y el cliente recibe el comprobante.
   Mercado Pago (`MP_ACCESS_TOKEN` + `PAYMENTS.mercadopago: true`, viene apagado) y transferencia siguen disponibles, pero la transferencia viene apagada porque se confirma a mano (`PAYMENTS.transferencia`).

## Precios en dólares y pesos
- Cada producto muestra **primero el precio en dólares (en negrita) y debajo el precio en pesos**. Se cobra siempre en pesos.
- En el Excel: `precio_venta_usd` (dólares) y `precio_final` (pesos). El archivo de ejemplo (`ejemplo_productos_maximelectronic.xlsx`) calcula los dos solos a partir del costo en dólares, la cotización y tu ganancia.
- Si un producto no tiene `precio_venta_usd`, se muestra solo el precio en pesos.
- Antes de importar con estas columnas, corré de nuevo `supabase/schema.sql` (agrega `precio_usd`, `peso_g`, `alto_cm`, `ancho_cm`, `largo_cm`).

## Cartel de stock y catálogo
- El cartel de arriba de todo sale de `STOCK_NOTICE` en `public/js/config.js`.
- Para que el cartel sea cierto, **la tienda solo publica productos con stock mayor a 0**. Cuando se vende la última unidad, el producto deja de mostrarse solo. El panel sigue mostrando todos (también los de stock 0) para que puedas reponer.
- Se quitó el botón flotante de WhatsApp y los botones "Consultar por WhatsApp" de la ficha y del carrito. El número sigue en el pie de página y en Contacto.

## Envíos (los paga el comprador)
Antes de pagar, el cliente ingresa su código postal y la tienda calcula el costo de cada opción (a domicilio o a sucursal) con las tarifas vigentes. El costo se suma al total que se cobra. El servidor **vuelve a cotizar** al confirmar el pedido y no toma como válido el precio que manda el navegador; si el costo cambió, avisa al cliente y le pide confirmar de nuevo.

**Medidas:** para cotizar hace falta el peso (gramos) y las medidas (cm) de cada producto **ya embalado**: columnas `peso_g`, `alto_cm`, `ancho_cm`, `largo_cm` del Excel. Si faltan, se usa 1 kg y 30x20x10 cm y el envío puede salir mal cotizado. Con varios productos se arma una sola caja (suma pesos y alturas; toma el mayor largo y ancho).

**Variables de entorno en Cloudflare** (cada transportista se activa solo si están todas las suyas):
- Origen: `ENVIO_CP_ORIGEN` (por defecto `3370`, Puerto Iguazú: verificalo).
- **Correo Argentino (API MiCorreo):** `CORREO_USER`, `CORREO_PASSWORD` (credenciales de API que se piden a Correo Argentino para cada ambiente) y `CORREO_CUSTOMER_ID` (tu ID de cliente de MiCorreo). Para pruebas: `CORREO_ENV=test`.
- **Andreani:** hay que ser cliente con credenciales y contrato (se generan en andreani.com > Integraciones): `ANDREANI_USER`, `ANDREANI_PASSWORD`, `ANDREANI_CLIENTE`, `ANDREANI_CONTRATO_DOMICILIO` y/o `ANDREANI_CONTRATO_SUCURSAL`, opcional `ANDREANI_SUCURSAL_ORIGEN`. Para pruebas: `ANDREANI_ENV=qa`.
- **Vía Cargo:** no se encontró una API pública para cotizar. Se agrega como un módulo más en `api/_envios.js` cuando Vía Cargo entregue su documentación y credenciales.

**Probar antes de vender:** estas integraciones se probaron solo con respuestas simuladas. Con tus credenciales, cotizá un código postal real y compará el precio con el cotizador de la web de cada empresa. El código de Andreani sigue el formato publicado en fuentes secundarias y en su guía de autenticación; confirmalo contra su documentación oficial.
**Qué no hace (todavía):** no genera la etiqueta ni el envío en Correo Argentino/Andreani. Cuando entra un pedido pagado, el envío se carga a mano en MiCorreo o en Andreani; el pedido guarda transportista, servicio, costo y la sucursal elegida (si el cliente la indicó).

## Cómo funciona el stock
- Cada pedido descuenta el stock en el momento (aunque todavía no esté pagado).
- Un pedido sin pagar por 48 horas pasa a `vencido` y devuelve el stock.
- Para cancelar a mano: en Supabase > SQL Editor: `select cancelar_pedido(12);` (12 = número del pedido).
- Transferencias: cuando llega la plata, cambiá `estado` a `pagado` en la tabla `pedidos`.
- Reimportar el Excel con "Mantener el stock actual" tildado no pisa el stock de lo que ya existe.
- La referencia de cada producto es la columna `sku`.
