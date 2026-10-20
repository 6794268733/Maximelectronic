import handler from '../../api/mp-webhook.js';
import { run } from '../../lib/cloudflare.mjs';
export const onRequest = ctx => run(handler, ctx);
