import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { itemsRouter } from './routes/items';
import { categoriesRouter } from './routes/categories';
import { companySettingsRouter } from './routes/companySettings';
import { documentsRouter } from './routes/documents';
import { cargosRouter } from './routes/cargos';
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

async function ensureInventoryHistoryTable(): Promise<void> {
  const [tables] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_history' LIMIT 1`
  );
  if (Array.isArray(tables) && tables.length > 0) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_history (
      id CHAR(36) PRIMARY KEY,
      item_id CHAR(36) NOT NULL,
      actor_user_id CHAR(36) NULL,
      event_type VARCHAR(40) NOT NULL,
      color ENUM('primary','slate','success','danger') NULL,
      title VARCHAR(160) NOT NULL,
      description TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_hist_item_created (item_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureItemPhotoColumns(): Promise<void> {
  const [tables] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_items' LIMIT 1`
  );
  if (!Array.isArray(tables) || tables.length === 0) return;

  await ensureInventoryHistoryTable();

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
  await ensureColumn('inventory_history', 'return_notes', `ALTER TABLE inventory_history ADD COLUMN return_notes TEXT NULL`);
  await ensureColumn('inventory_history', 'return_items', `ALTER TABLE inventory_history ADD COLUMN return_items TEXT NULL`);
}

async function ensureUserCpfColumn(): Promise<void> {
  const [tables] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' LIMIT 1`
  );
  if (!Array.isArray(tables) || tables.length === 0) return;

  const [cols] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'cpf' LIMIT 1`
  );
  if (Array.isArray(cols) && cols.length > 0) return;
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN cpf VARCHAR(14) NULL`);
  } catch (e: any) {
    if (e?.code === 'ER_DUP_FIELDNAME') return;
    throw e;
  }
}

const CARGO_NAMES = [
  'Executivo de Contas Junior', 'Executivo de Contas Senior 1', 'Executivo de Contas Senior 2',
  'Executivo de Contas Pleno 1', 'Executivo de Contas Pleno 2', 'Analista de marketing Junior',
  'Analista de marketing Senior 1', 'Analista de marketing Senior 2', 'Analista de marketing Pleno 1',
  'Analista de marketing Pleno 2', 'Customer Success pleno 3', 'Customer Success Senior 2',
  'Customer Success Senior 3', 'Assistente de Mkt Pleno 2', 'Assistente de Mkt Senior 2',
  'Jornalista Pleno 1', 'Jornalista Pleno 2', 'Jornalista Pleno 3', 'Jornalista Senior 1',
  'Jornalista Senior 2', 'Jornalista Senior 3', 'Jornalista', 'Especialista de Marketing Digital Junior',
  'Especialista de Marketing Digital Pleno 1', 'Especialista de Marketing Digital Pleno 2',
  'Especialista de Marketing Digital Senior 1', 'Especialista de Marketing Digital Senior 2',
  'Analista de Inteligência Junior', 'Analista de Inteligência Pleno 2', 'Analista de Inteligência Pleno',
  'Analista de inteligência', 'Analista de marketing', 'Analistas de tecnologia da informação Pleno 2',
  'Analistas de tecnologia da informação Pleno', 'Analistas de tecnologia da informação Senior',
  'Analistas de tecnologia da informação', 'Assistente de customer success Jr', 'Assistente de customer success',
  'Assistente de diretoria', 'Assistente de Mkt Junior', 'Assistente de Mkt Pleno', 'Assistente de Mkt Senior',
  'Assistente de Mkt', 'Assistente de sucesso', 'Assistente de Vendas SDR', 'Assistente Financeiro',
  'Auxiliar Comercial Junior', 'Auxiliar Comercial Pleno 2', 'Auxiliar Comercial', 'Customer Success pleno 2',
  'Customer Success pleno', 'Customer Success Senior', 'Designer júnior', 'Designer Pleno 2', 'Designer Pleno',
  'Designer trainee B', 'Designer trainee', 'Diretor de Criação', 'Executivo de Contas',
  'Gerente administrativo financeiro', 'Gerente comercial', 'Gerente de customer success',
  'Gerente de grandes contas', 'Gerente de suporte técnico de TI', 'Gerente de vendas',
  'Jornalista Pleno', 'Jornalista Senior', 'Suporte comercial Júnior', 'Suporte comercial Pleno 2',
  'Suporte comercial Pleno', 'Suporte comercial', 'Técnico de suporte ao usuário de T.I. 2',
  'Técnico de suporte ao usuário de T.I. 3', 'Técnico suporte ao usuário de TI',
  'Vendedor interno Júnior', 'Vendedor interno Pleno 2', 'Vendedor interno Pleno', 'Vendedor interno',
];

async function ensureCargoTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cargo (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  for (const name of CARGO_NAMES) {
    await pool.query(
      `INSERT IGNORE INTO cargo (id, name) VALUES (?, ?)`,
      [generateUUID(), name]
    );
  }
}

async function ensureUserJobTitleColumn(): Promise<void> {
  const [tables] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' LIMIT 1`
  );
  if (!Array.isArray(tables) || tables.length === 0) return;

  const [cols] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'job_title' LIMIT 1`
  );
  if (Array.isArray(cols) && cols.length > 0) return;
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN job_title VARCHAR(120) NULL`);
  } catch (e: any) {
    if (e?.code === 'ER_DUP_FIELDNAME') return;
    throw e;
  }
}

async function ensureCompanySettingsTable(): Promise<void> {
  const [tables] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'company_settings' LIMIT 1`
  );
  if (Array.isArray(tables) && tables.length > 0) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      legal_name VARCHAR(255) NULL,
      address VARCHAR(255) NULL,
      city VARCHAR(120) NULL,
      state VARCHAR(60) NULL,
      zip VARCHAR(20) NULL,
      cnpj VARCHAR(20) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureInventoryDocumentsTable(): Promise<void> {
  const [tables] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_documents' LIMIT 1`
  );
  if (Array.isArray(tables) && tables.length > 0) {
    const [cols] = await pool.query(
      `SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_documents' AND COLUMN_NAME = 'pdf_base64' LIMIT 1`
    );
    if (!(Array.isArray(cols) && cols.length > 0)) {
      try {
        await pool.query(`ALTER TABLE inventory_documents ADD COLUMN pdf_base64 LONGTEXT NULL`);
      } catch (e: any) {
        if (e?.code !== 'ER_DUP_FIELDNAME') throw e;
      }
    }
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_documents (
      id CHAR(36) PRIMARY KEY,
      item_id CHAR(36) NOT NULL,
      user_id CHAR(36) NOT NULL,
      type ENUM('recebimento','devolucao') NOT NULL,
      file_path VARCHAR(512) NOT NULL DEFAULT '',
      pdf_base64 LONGTEXT NULL,
      signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actor_user_id CHAR(36) NULL,
      history_event_id CHAR(36) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_doc_item FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
      CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users(id),
      CONSTRAINT fk_doc_actor FOREIGN KEY (actor_user_id) REFERENCES users(id),
      INDEX idx_doc_item (item_id),
      INDEX idx_doc_user (user_id),
      INDEX idx_doc_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
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
  app.use('/company-settings', companySettingsRouter);
  app.use('/documents', documentsRouter);
  app.use('/cargos', cargosRouter);

  const frontendDistPath = path.resolve(__dirname, '../../dist');
  const frontendIndexPath = path.join(frontendDistPath, 'index.html');
  const hasFrontendBuild = fs.existsSync(frontendIndexPath);

  if (hasFrontendBuild) {
    app.use(express.static(frontendDistPath));

    app.get('*', (req, res) => {
      const p = req.path || '';
      const isApiPath = p === '/health' || p.startsWith('/auth') || p.startsWith('/users') || p.startsWith('/items') || p.startsWith('/categories') || p.startsWith('/company-settings') || p.startsWith('/documents') || p.startsWith('/cargos');
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
      await ensureUserCpfColumn();
      await ensureUserJobTitleColumn();
      await ensureItemPhotoColumns();
      await ensureCompanySettingsTable();
      await ensureInventoryDocumentsTable();
      await ensureCategoriesTableAndSeed();
      await ensureCargoTable();
    } catch (e) {
      console.error('[tvdcontrol-backend] schema init error:', e);
    }
    return createApp();
  })();
  return appPromise;
}
