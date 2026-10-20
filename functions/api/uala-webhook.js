import handler from '../../api/uala-webhook.js';
import { run } from '../../lib/cloudflare.mjs';
export const onRequest = ctx => run(handler, ctx);
