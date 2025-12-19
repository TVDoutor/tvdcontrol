import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { itemsRouter } from './routes/items';
import { pool } from './db';

const app = express();

async function ensureRefreshTokenColumns(): Promise<void> {
  const [tables] = await pool.query(
    `SELECT 1 AS ok
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
     LIMIT 1`
  );
  const hasUsersTable = Array.isArray(tables) && tables.length > 0;
  if (!hasUsersTable) return;

  const ensureColumn = async (columnName: string, ddl: string) => {
    const [cols] = await pool.query(
      `SELECT 1 AS ok
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [columnName]
    );
    const exists = Array.isArray(cols) && cols.length > 0;
    if (exists) return;
    try {
      await pool.query(ddl);
    } catch (e: any) {
      if (e?.code === 'ER_DUP_FIELDNAME') return;
      throw e;
    }
  };

  await ensureColumn('refresh_token_hash', `ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR(255) NULL`);
  await ensureColumn('refresh_token_expires_at', `ALTER TABLE users ADD COLUMN refresh_token_expires_at DATETIME NULL`);
}

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Email'],
    credentials: true,
  })
);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    res.status(500).json({ ok: false, error });
  }
});

// Routes
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/items', itemsRouter);

const frontendDistPath = path.resolve(__dirname, '../../dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    const p = req.path || '';
    const isApiPath = p === '/health' || p.startsWith('/auth') || p.startsWith('/users') || p.startsWith('/items');
    if (isApiPath) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.sendFile(frontendIndexPath);
  });
}

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error('[tvdcontrol-backend] error:', err);
  if (!isProd) {
    console.error('[tvdcontrol-backend] error stack:', err.stack);
  }
  const errorMessage = isProd ? 'Internal server error' : err.message || 'Internal server error';
  res.status(500).json({ error: errorMessage });
});

const PORT = config.port;
void (async () => {
  try {
    await ensureRefreshTokenColumns();
  } catch (e) {
    console.error('[tvdcontrol-backend] schema init error:', e);
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[tvdcontrol-backend] listening on :${PORT}`);
  });
})();


