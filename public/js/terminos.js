// Términos y condiciones. Se carga después de components.js y reemplaza el texto provisorio de C.pages.terminos.
// Para cambiar el texto, editá solo este archivo. Acepta HTML simple (<p>, <b>, enlaces).
(() => {
  const h = t => `<h3 class="text-lg font-bold text-black pt-3">${t}</h3>`;
  const tel = C.contacto.tel, mail = C.contacto.mail;
  const titular = CONFIG.RAZON_SOCIAL ? `${CONFIG.RAZON_SOCIAL}${CONFIG.CUIT ? ', CUIT ' + CONFIG.CUIT : ''}` : '';
  C.pages.terminos = ['Términos y condiciones', `
<p class="text-sm text-neutral-500">Última actualización: 30 de octubre de 2026</p>
<p>Estos Términos y condiciones regulan el uso del sitio de MAXIMELECTRONIC${titular ? ', cuyo titular es ' + titular : ''} (el “Sitio”), y las compras que hagas en él. Al registrarte o comprar, declarás que los leíste y que los aceptás. Si no estás de acuerdo, te pedimos que no uses el Sitio.</p>

${h('1. Quiénes pueden usar el Sitio')}
<p>Para registrarte y comprar tenés que ser mayor de 18 años y tener capacidad legal para contratar. Si comprás en nombre de una empresa, declarás tener facultades para obligarla. MAXIMELECTRONIC puede dar de baja las cuentas cuando no se acredite la mayoría de edad o la representación invocada.</p>

${h('2. Tu cuenta')}
<p>Para comprar necesitás una cuenta. Al crearla te comprometés a dar datos verdaderos, completos y actualizados (nombre, mail, teléfono, DNI y domicilio de entrega) y a avisarnos si cambian. Vas a recibir un mail para confirmar tu dirección de correo.</p>
<p>Sos responsable de la confidencialidad de tu contraseña y de todo lo que se haga con tu cuenta. Si notás un uso no autorizado, avisanos de inmediato por WhatsApp o por mail. Podemos suspender o cancelar las cuentas que incumplan estos Términos o la ley.</p>

${h('3. Uso correcto del Sitio')}
<p>No está permitido intentar acceder a datos o cuentas ajenas, probar o vulnerar la seguridad del Sitio, enviar virus o mensajes masivos, usar programas automáticos para navegarlo o extraer su contenido, ni hacerse pasar por otra persona. Estas conductas pueden generar responsabilidad civil y penal, y podemos colaborar con las autoridades.</p>

${h('4. Productos, precios y promociones')}
<p>Procuramos que las descripciones, imágenes y características sean precisas. La información técnica proviene de los fabricantes y las imágenes son ilustrativas: el empaque o los accesorios pueden variar levemente. Antes de usar un producto, leé las instrucciones y advertencias del fabricante.</p>
<p>Los precios se expresan en pesos argentinos (en algunos casos también se muestra una referencia en dólares) y son los vigentes al momento de tu compra. Pueden cambiar sin aviso previo, sin afectar a los pedidos ya confirmados. Las promociones rigen mientras estén publicadas en el Sitio. Podemos limitar la cantidad de unidades por pedido o por persona cuando haya razones que lo justifiquen.</p>

${h('5. Cómo comprar')}
<p>Elegí los productos (con su color y capacidad, si corresponde), agregalos al carrito y tocá “Finalizar compra”. Completá tus datos de entrega y facturación, elegí el medio de pago y confirmá el pedido. Antes de pagar podés revisar el pedido, modificarlo o cancelarlo. Al confirmarlo, los productos quedan reservados para vos.</p>

${h('6. Medios de pago')}
<p><b>Tarjetas:</b> el pago se procesa en la plataforma de pagos que te mostramos al confirmar el pedido. MAXIMELECTRONIC no recibe ni guarda los datos de tu tarjeta. El pago con tarjeta puede tener un recargo, que se informa en el resumen antes de que confirmes. Cualquier cargo adicional que cobre tu banco o la plataforma de pagos es ajeno a MAXIMELECTRONIC.</p>
<p><b>Transferencia bancaria:</b> al confirmar el pedido te mostramos los datos para transferir. Tu pedido queda reservado por 72 horas; si en ese plazo no acreditamos el pago, puede cancelarse automáticamente y los productos vuelven al stock. Las transferencias las confirmamos de forma manual, por lo que la acreditación puede demorar un poco.</p>

${h('7. Confirmación del pedido')}
<p>Tu pedido se considera aceptado cuando verificamos que: (a) hay stock de los productos elegidos, (b) el pago fue aprobado o acreditado, y (c) tus datos son correctos y coinciden con los del pago. Este proceso no debería demorar más de 72 horas hábiles. Cuando se confirma el pago te mandamos por mail el comprobante con el detalle de tu compra; si no lo ves, revisá la carpeta de spam y, si no está, contactanos.</p>
<p>La compraventa se perfecciona cuando entregamos el producto al transportista o a vos, o cuando pasan 72 horas hábiles sin que te hayamos avisado el rechazo del pedido por alguno de los motivos anteriores, lo que ocurra primero. Si no podemos aprobar el pedido, te avisamos y te reintegramos lo que hayas pagado por el mismo medio de pago.</p>

${h('8. Envíos y entrega')}
<p>Enviamos a todo el país, a domicilio y sin costo para vos: el envío es gratis. Despachamos con empresas de transporte como ${CONFIG.CARRIERS_TEXT}. Cuando despachamos tu pedido te mandamos por mail la empresa y el número de seguimiento.</p>
<p>Los plazos de entrega son estimados y dependen del transporte y del destino. Cargá bien tu dirección, código postal y teléfono: si el envío no puede entregarse por datos incorrectos o por ausencia reiterada, podemos coordinar una nueva entrega, cuyo costo puede quedar a tu cargo.</p>
<p>Al recibir el paquete, verificá que el embalaje esté en buen estado y que el contenido corresponda a tu pedido. Si algo no está bien, dejá constancia ante el transportista y avisanos cuanto antes.</p>

${h('9. Derecho de arrepentimiento (botón de arrepentimiento)')}
<div class="border border-neutral-300 rounded-2xl p-4 space-y-3 bg-neutral-50">
  <p>Como comprás a distancia, podés revocar la compra, sin dar explicaciones y sin responsabilidad alguna, dentro de los <b>10 días corridos</b> contados desde que recibís el producto o desde que hiciste la compra, lo que ocurra último (artículo 34 de la Ley 24.240 y artículo 1110 del Código Civil y Comercial).</p>
  <p><b>Cómo hacerlo:</b> escribinos por WhatsApp o por mail indicando tu nombre y el número de pedido (por ejemplo, MX-00012). Dentro de las 24 horas te enviamos el código de identificación de tu trámite.</p>
  <p><b>Devolución:</b> poné el producto a nuestra disposición, con su embalaje, accesorios y manuales. Los gastos de devolución corren por nuestra cuenta, y te reintegramos el importe pagado por el mismo medio de pago.</p>
  <p><b>Producto con el precinto abierto:</b> si el sello o precinto de seguridad del fabricante fue abierto, el producto deja de ser nuevo y pierde valor comercial. En ese caso, el reintegro se calcula según el valor de reventa del producto. Esto no se aplica si el producto llegó con fallas, con defectos o distinto de lo que compraste: en esos casos corresponde la garantía y te reintegramos el importe completo.</p>
  ${C.contacto.botones}
</div>

${h('10. Garantía')}
<p>Todos los productos tienen garantía oficial del fabricante, en los plazos y condiciones que este establezca, sin perjuicio de la garantía legal que te corresponde como consumidor. Para hacer un reclamo, conservá el comprobante de compra y escribinos: te indicamos cómo seguir.</p>

${h('11. Datos personales')}
<p>Usamos tus datos únicamente para procesar tus pedidos, coordinar los envíos y atenderte, y los tratamos conforme a la Ley 25.326 de Protección de Datos Personales. No vendemos ni cedemos tus datos a terceros, salvo los necesarios para completar tu compra (envío y pagos) o cuando la ley lo exija. En nuestras <a class="underline font-semibold" href="#/info/privacidad">Políticas de privacidad</a> detallamos qué datos tratamos y cómo ejercer tus derechos de acceso, rectificación y supresión.</p>

${h('12. Propiedad intelectual y enlaces de terceros')}
<p>Los textos, logos, imágenes, diseño y código del Sitio son de MAXIMELECTRONIC o de terceros que nos autorizaron su uso, y están protegidos por las leyes de propiedad intelectual. Podés usar el Sitio para tu uso personal; no podés copiar, reproducir, modificar ni distribuir su contenido sin autorización escrita. Las marcas de los productos pertenecen a sus respectivos titulares. Los enlaces o referencias a sitios y marcas de terceros son solo informativos: no implican respaldo y no controlamos esos sitios.</p>

${h('13. Responsabilidad')}
<p>Hacemos lo posible para que el Sitio funcione sin interrupciones, pero no podemos garantizar que esté libre de errores, fallas o virus. En la medida en que la ley lo permite, MAXIMELECTRONIC no responde por daños derivados del mal uso del Sitio, de fallas técnicas de tu equipo o de tu conexión, ni por casos fortuitos o de fuerza mayor. Nada de esto limita los derechos que la Ley de Defensa del Consumidor te reconoce.</p>

${h('14. Cambios en estos Términos')}
<p>Podemos modificar estos Términos cuando sea necesario. Los cambios rigen desde su publicación en el Sitio y no afectan a las compras ya confirmadas, que se rigen por los Términos vigentes al momento de la compra. Si no estás de acuerdo con los cambios, dejá de usar el Sitio.</p>

${h('15. Ley aplicable y jurisdicción')}
<p>Estos Términos se rigen por las leyes de la República Argentina. Cualquier conflicto se resolverá ante los tribunales ordinarios competentes según la normativa aplicable a las relaciones de consumo. Podés enviarnos tus notificaciones por WhatsApp o por mail; las que te enviemos a vos se harán al mail que registraste.</p>

${h('16. Contacto')}
<p>MAXIMELECTRONIC${titular ? ' · ' + titular : ''} · ${CONFIG.CITY}${tel ? ' · WhatsApp ' + tel : ''}${mail ? ' · ' + mail : ''}<br>Horario de atención: ${CONFIG.HOURS}</p>
${C.contacto.botones}
`];
})();
