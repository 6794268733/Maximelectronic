import handler from '../../api/crear-pedido.js';
import { run } from '../../lib/cloudflare.mjs';
export const onRequest = ctx => run(handler, ctx);
