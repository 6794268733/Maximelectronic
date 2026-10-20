import handler from '../../api/admin.js';
import { run } from '../../lib/cloudflare.mjs';
export const onRequest = ctx => run(handler, ctx);
