import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Vercel serverless handler: forwards all /api/* requests to the Express app.
 * Uses rewrite so /api/auth/login etc. arrive here; path comes from x-invoke-path or url.
 */
export default async function handler(req: any, res: any): Promise<void> {
  const appModule = path.join(process.cwd(), 'backend', 'dist', 'app.js');
  const { getApp } = require(appModule);
  const app = await getApp();

  // Path: from rewrite query (?path=), x-invoke-path, or url sans /api
  let requestPath = '/';
  const invokePath = req.headers?.['x-invoke-path'] ?? req.headers?.['x-vercel-invoke-path'];
  const urlRaw = (req.url ?? req.headers?.['x-forwarded-url'] ?? '/').toString();

  if (typeof invokePath === 'string' && invokePath) {
    requestPath = invokePath.startsWith('/') ? invokePath : `/${invokePath}`;
  } else if (urlRaw.includes('?path=')) {
    const m = urlRaw.match(/[?&]path=([^&]*)/);
    requestPath = m ? `/${decodeURIComponent(m[1])}`.replace(/\/+/g, '/') : '/';
  } else {
    requestPath = urlRaw.replace(/^\/api/, '').split('?')[0] || '/';
  }

  (req as { url: string }).url = requestPath;

  return new Promise((resolve, reject) => {
    app(req as any, res, (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
