import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { itemsRouter } from './routes/items';
import { categoriesRouter } from './routes/categories';
import { pool } from './db';
import { generateUUID } from './utils/uuid';

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

async function ensureItemPhotoColumns(): Promise<void> {
  const [tables] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_items' LIMIT 1`
  );
  if (!Array.isArray(tables) || tables.length === 0) return;

  const ensureColumn = async (table: string, columnName: string, ddl: string) => {
    const [cols] = await pool.query(
      `SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [table, columnName]
    );
    if (Array.isArray(cols) && cols.length > 0) return;
    try {
      await pool.query(ddl);
    } catch (e: any) {
      if (e?.code === 'ER_DUP_FIELDNAME') return;
      throw e;
    }
  };
  await ensureColumn('inventory_items', 'photo_main', `ALTER TABLE inventory_items ADD COLUMN photo_main TEXT NULL`);
  await ensureColumn('inventory_history', 'return_photo', `ALTER TABLE inventory_history ADD COLUMN return_photo TEXT NULL`);
}

async function ensureCategoriesTableAndSeed(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(80) NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const defaultCategories = ['Notebook', 'Computadores', 'Celulares', 'Monitores', 'Periféricos', 'Chips', 'Acessórios'];

  for (const categoryName of defaultCategories) {
    await pool.query(
      `INSERT INTO categories (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [generateUUID(), categoryName]
    );
  }

  let itemCategories: unknown[] = [];
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT TRIM(category) AS name
       FROM inventory_items
       WHERE category IS NOT NULL AND TRIM(category) <> ''`
    );
    itemCategories = Array.isArray(rows) ? rows : [];
  } catch {
    // inventory_items pode não existir ainda; ignora
  }

  if (Array.isArray(itemCategories) && itemCategories.length > 0) {
    for (const row of itemCategories as any[]) {
      const name = typeof row?.name === 'string' ? row.name.trim() : '';
      if (!name) continue;
      await pool.query(
        `INSERT INTO categories (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [generateUUID(), name]
      );
    }
  }
}

function createApp(): express.Express {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: config.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Email'],
      credentials: true,
    })
  );

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, error });
    }
  });

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/items', itemsRouter);
  app.use('/categories', categoriesRouter);

  const frontendDistPath = path.resolve(__dirname, '../../dist');
  const frontendIndexPath = path.join(frontendDistPath, 'index.html');
  const hasFrontendBuild = fs.existsSync(frontendIndexPath);

  if (hasFrontendBuild) {
    app.use(express.static(frontendDistPath));

    app.get('*', (req, res) => {
      const p = req.path || '';
      const isApiPath = p === '/health' || p.startsWith('/auth') || p.startsWith('/users') || p.startsWith('/items') || p.startsWith('/categories');
      if (isApiPath) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.sendFile(frontendIndexPath);
    });
  }

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const isProd = process.env.NODE_ENV === 'production';
    console.error('[tvdcontrol-backend] error:', err);
    if (!isProd) {
      console.error('[tvdcontrol-backend] error stack:', err.stack);
    }
    const errorMessage = isProd ? 'Internal server error' : err.message || 'Internal server error';
    res.status(500).json({ error: errorMessage });
  });

  return app;
}

let appPromise: Promise<express.Express> | null = null;

/**
 * Returns the Express app. On first call, runs DB migrations then returns the app.
 * Used both by the standalone server (index.ts) and by the Vercel serverless handler.
 */
export async function getApp(): Promise<express.Express> {
  if (appPromise) return appPromise;
  appPromise = (async () => {
    try {
      await ensureRefreshTokenColumns();
      await ensureItemPhotoColumns();
      await ensureCategoriesTableAndSeed();
    } catch (e) {
      console.error('[tvdcontrol-backend] schema init error:', e);
    }
    return createApp();
  })();
  return appPromise;
}
