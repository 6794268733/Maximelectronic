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
   **Mercado Pago (recomendado, todo automático):** cargá `MP_ACCESS_TOKEN` (Access Token de producción) en Cloudflare y poné `PAYMENTS.mercadopago: true`. El cliente elige billetera virtual, transferencia, tarjeta o efectivo (Pago Fácil / Rapipago); al aprobarse el pago el pedido pasa a `pagado` y sale el comprobante por mail, sin intervención tuya. La plata queda en tu cuenta de Mercado Pago y de ahí la pasás a tu Ualá. En la app de Mercado Pago, Tu negocio > Configuración > Notificaciones, la URL de avisos la manda el sistema sola en cada pedido. La transferencia manual al alias (`PAYMENTS.transferencia`) viene apagada porque se confirma a mano. Los pedidos sin pagar reservan el stock 72 horas (el cupón de efectivo vence un poco antes).

## Datos del cliente en el checkout
- Obligatorios: nombre y apellido completos (como en el DNI), DNI, teléfono con código de área, dirección exacta (calle y número), localidad, provincia y código postal. Opcionales: piso/depto/barrio, referencias, ubicación de Google Maps (botón "Usar mi ubicación actual" o enlace pegado) y foto del domicilio.
- El servidor valida todo y descarta cualquier campo que no corresponda. La ubicación solo se acepta si cae dentro de Argentina y el enlace es de Google Maps.
- En el panel (Pedidos) y en tu mail de venta ves DNI, teléfono, dirección, piso, notas y el enlace a Google Maps.

## Envío gratis
- Se activa con la variable `ENVIO_GRATIS` = `1` en Cloudflare (la que manda) y `ENVIO_GRATIS: true` en `public/js/config.js` (lo que se muestra). Mismo valor en los dos lugares.
- En ese modo el checkout no cotiza ni pide elegir transportista: el cliente ve "Envío gratis", y el pedido queda con "Envío gratis · A coordinar" para que vos elijas Correo Argentino, Andreani o Vía Cargo al despachar. No hace falta cargar las credenciales de las transportistas para vender.
- El costo del envío va dentro del precio: en el Excel, columna `envio_incluido_ars` (lo que cuesta enviar ese producto, ya embalado, al destino más lejano).

## Recargo por pago con tarjeta
- Ualá deja que el cliente elija las cuotas en SU pantalla de pago, y el costo de las cuotas sin interés lo paga el comercio. La tienda no puede saber cuántas cuotas elige, por eso el recargo es **uno solo para todo pago con tarjeta**, y la transferencia / billetera virtual queda sin recargo.
- Para activarlo: cargá el mismo porcentaje en `RECARGO_TARJETA_PCT` de `public/js/config.js` (lo que se muestra) y en la variable `RECARGO_TARJETA_PCT` de Cloudflare (la que cobra de verdad). 0 = sin recargo.
- Si no coinciden, el checkout frena antes de cobrar y avisa que el total cambió. El comprobante muestra el recargo en un renglón aparte.
- Para elegir las cuotas (por ejemplo solo hasta 3) hay que pedirlo a Ualá Bis (hola@ualabis.com.ar o chat de la app).

## Foto opcional del domicilio
- En el checkout el cliente puede subir una foto del frente de su casa (opcional) y/o escribir referencias en las notas. La foto se reduce y se guarda en un bucket **privado** de Supabase (`domicilios`).
- Antes de usarlo, correr `supabase/domicilios.sql` en Supabase > SQL Editor (crea el bucket; también está al final de `schema.sql`).
- Se ve en el panel (botón **Ver foto del domicilio** en Pedidos, enlace temporal de 10 minutos) y en el mail de venta (enlace de 7 días).

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
- Un pedido sin pagar por 72 horas pasa a `vencido` y devuelve el stock.
- Para cancelar a mano: en Supabase > SQL Editor: `select cancelar_pedido(12);` (12 = número del pedido).
- Transferencias: cuando llega la plata, cambiá `estado` a `pagado` en la tabla `pedidos`.
- Reimportar el Excel con "Mantener el stock actual" tildado no pisa el stock de lo que ya existe.
- La referencia de cada producto es la columna `sku`.

## Reseñas de clientes
- Cuando un pedido pagado se marca como **entregado** en el panel (pestaña Pedidos), el cliente puede dejar una reseña (1 a 5 estrellas y comentario) de cada producto desde "Mis pedidos".
- Las reseñas quedan **pendientes**: se publican u ocultan desde la pestaña Reseñas del panel.
- Antes de usarlo, correr `supabase/resenas.sql` en Supabase (también está al final de `schema.sql`).

## Envíos: diagnóstico de Correo Argentino
- La respuesta de `/api/envio-cotizar` incluye `diag` con el motivo real si Correo no devuelve tarifas (se ve en F12 > Network). Cuando la cotización ande, borrá `, diag: r.errores` de `api/envio-cotizar.js`.
- Requiere `nodejs_compat` en Cloudflare (ver más arriba) y las variables `CORREO_USER`, `CORREO_PASSWORD`, `CORREO_CUSTOMER_ID` (el customerId se obtiene con `/users/validate`, no es el usuario).


## Mails: comprobante, envío y avisos (Gmail, sin dominio propio)
- El sitio manda tres mails por venta: aviso al dueño (`OWNER_EMAIL`), comprobante de pago al cliente (cuando confirmás el pago en el panel o cuando paga con tarjeta) y "¡Tu pedido va en camino!" con empresa de envío y número de seguimiento.
- **Por Gmail (recomendado, gratis, a cualquier cliente):** abrí script.google.com con la cuenta que va a enviar, pegá `apps_script_gmail.gs` (cambiá `SECRETO` por una clave larga y al azar), ejecutá la función `probar` una vez para dar el permiso y después Implementar > Nueva implementación > App web (Ejecutar como: Yo, Acceso: Cualquier persona). Copiá la URL que termina en `/exec`.
- En Cloudflare cargá `MAIL_SCRIPT_URL` (esa URL) y `MAIL_SCRIPT_SECRET` (la misma clave del script, como Secret). Si cambiás el script, hay que publicar una versión nueva (Implementar > Administrar implementaciones > editar > Nueva versión).
- Límite de Gmail gratuito: unos 100 mails por día (cada venta usa 3).
- **Respaldo con Resend:** si no están las variables de Gmail, usa `RESEND_API_KEY` y `MAIL_FROM` (Resend solo entrega a clientes reales con un dominio propio verificado).
- El panel muestra después de cada cambio de estado "Mail al cliente: enviado ✓" o el motivo exacto del error.

## Panel: marcar enviado
- Al tocar **Marcar enviado** se abre un cuadro para cargar la **empresa de envío** y el **número de seguimiento** (los dos obligatorios). Al tocar **Finalizado** el pedido pasa a enviado, se guardan los datos en el pedido (`envio.despacho`) y el cliente recibe el mail.

## Cuenta del cliente
- El ícono del usuario abre un menú con: Mis pedidos, Mis datos para próximos pedidos, Cambiar contraseña, Preguntas frecuentes, Contacto y Cerrar sesión.
- Los datos de entrega guardados (en la cuenta de Supabase, `user_metadata`) se completan solos en el checkout. El checkout tiene una casilla "Guardar estos datos en mi cuenta" (marcada por defecto).
- En el checkout el **medio de pago** está arriba del resumen de totales.
- Nota: algunos comentarios viejos del código nombran a Vercel; el sitio corre en Cloudflare Pages.


## Stock por color
- En el Excel, la columna `stock_colores` lleva las unidades de cada color: `Negro:5,Blanco:0,Azul:2`. Si está completa, el stock total y la lista de colores salen de ahí (se ignoran `stock` y `colores`). Vacía = el producto funciona como siempre.
- En la tienda el cliente solo puede elegir colores con unidades: los agotados se ven como "(agotado)" y no se pueden elegir. Desde la tarjeta del producto, si tiene varios colores, se abre la ficha para elegir el color antes de agregar al carrito.
- Al cobrar, la base de datos descuenta el stock del color en la misma operación (función `crear_pedido`): si dos clientes compran la última unidad a la vez, el segundo recibe un aviso y no se le cobra. Si un pedido se cancela o vence, el stock vuelve al color correspondiente.
- Panel > Cambiar stock: en productos con stock por color se cargan las cantidades de todos los colores (`Negro:5,Blanco:2`).
- **Activarlo (una sola vez):** correr `supabase/stock_colores.sql` en Supabase > SQL Editor > Run, y después subir el código. Hasta correr el SQL, importar productos devuelve un aviso que lo indica.


## Aviso de venta al dueño
- Cada compra por **transferencia** manda un mail al dueño apenas se crea el pedido (asunto "💰 Nueva compra por transferencia MX-xxxxx – $total (confirmá el pago)"): trae el monto exacto, la referencia, el cliente, los productos con color y el destino, y un enlace al panel. Cuando ves la plata, en el panel > Pedidos tocás "Confirmar pago recibido".
- Las compras con **tarjeta** avisan cuando el pago queda aprobado (asunto "✅ Venta pagada …").
- Llega a `OWNER_EMAIL`; si esa variable no está cargada, llega a maximelectronic1@gmail.com. `SITE_URL` (opcional) define el dominio del enlace al panel; por defecto https://maximelectronic.pages.dev.
- Si el aviso no sale, el motivo queda en los registros (logs) de Cloudflare: "Aviso de venta al dueño NO enviado".

## Mails de cuenta (registro, contraseña) en español
- Esos mails los manda Supabase, no este código. `supabase/plantillas_mail_es.html` es una página (abrila en el navegador) con los textos en español listos para copiar y los pasos: conectar Gmail como SMTP (sin eso Supabase solo entrega a los miembros del equipo y con tope de 2 por hora), Site URL y pegar cada plantilla.

## Registro: aviso de revisar spam
- Al crear la cuenta, el cliente ve una pantalla "¡Revisá tu mail!" que le dice que mire Spam/Promociones y toque "No es spam" (los mails salen de un Gmail común y pueden caer ahí). Botón "Ya confirmé, ingresar".
- Los errores más comunes de Supabase (mail o contraseña incorrectos, mail sin confirmar, demasiados intentos) se muestran en español (`Auth.msg` en `public/js/auth.js`).
