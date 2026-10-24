import handler from '../../api/resena.js';
import { run } from '../../lib/cloudflare.mjs';
export const onRequest = ctx => run(handler, ctx);
