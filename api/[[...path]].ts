import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Vercel serverless handler: forwards all /api/* requests to the Express app.
 * The frontend should use VITE_API_BASE_URL="/api" so requests go to same origin.
 */
export default async function handler(req: any, res: any): Promise<void> {
  const appModule = path.join(process.cwd(), 'backend', 'dist', 'app.js');
  const { getApp } = require(appModule);
  const app = await getApp();

  // Strip /api prefix so Express sees /auth/login, /users, etc.
  const url = (req.url ?? req.headers['x-forwarded-url'] ?? '/').toString();
  const requestPath = url.replace(/^\/api/, '') || '/';
  (req as { url: string }).url = requestPath;

  return new Promise((resolve, reject) => {
    app(req as any, res, (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
