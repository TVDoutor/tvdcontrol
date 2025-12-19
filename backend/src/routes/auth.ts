import { Router } from 'express';
import { query, queryOne } from '../db';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateUUID } from '../utils/uuid';
import { authenticateUser } from '../utils/auth';
import { config } from '../config';
import { createAuthToken, createRefreshToken, getRefreshTokenExpiresAt, hashRefreshToken, verifyAuthToken } from '../utils/token';

export const authRouter = Router();

function isMissingRefreshColumnsError(e: any): boolean {
  const msg = typeof e?.sqlMessage === 'string' ? e.sqlMessage : typeof e?.message === 'string' ? e.message : '';
  return e?.code === 'ER_BAD_FIELD_ERROR' && /refresh_token_(hash|expires_at)/i.test(msg);
}

type RefreshColumnsStatus = 'unknown' | 'present' | 'missing';

let refreshColumnsStatus: RefreshColumnsStatus = 'unknown';
let refreshColumnsCheckedAtMs = 0;
let refreshColumnsCreateAttempted = false;
const REFRESH_COLUMNS_CACHE_TTL_MS = 60_000;

async function hasRefreshColumnsCached(): Promise<boolean> {
  const now = Date.now();
  if (refreshColumnsStatus !== 'unknown' && now - refreshColumnsCheckedAtMs < REFRESH_COLUMNS_CACHE_TTL_MS) {
    return refreshColumnsStatus === 'present';
  }

  const rows = await query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('refresh_token_hash', 'refresh_token_expires_at')
    `
  );

  const found = new Set<string>();
  if (Array.isArray(rows)) {
    for (const r of rows as any[]) {
      const name = typeof r?.COLUMN_NAME === 'string' ? r.COLUMN_NAME : '';
      if (name) found.add(name);
    }
  }

  const ok = found.has('refresh_token_hash') && found.has('refresh_token_expires_at');
  refreshColumnsStatus = ok ? 'present' : 'missing';
  refreshColumnsCheckedAtMs = now;
  return ok;
}

async function ensureRefreshColumnsBestEffort(): Promise<void> {
  const ddls = [
    `ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR(255) NULL`,
    `ALTER TABLE users ADD COLUMN refresh_token_expires_at DATETIME NULL`,
  ];
  for (const ddl of ddls) {
    try {
      await query(ddl);
    } catch (e: any) {
      if (e?.code === 'ER_DUP_FIELDNAME') continue;
      throw e;
    }
  }
}

async function ensureRefreshColumnsAvailable(): Promise<boolean> {
  const hasColumns = await hasRefreshColumnsCached();
  if (hasColumns) return true;

  if (refreshColumnsCreateAttempted) return false;
  refreshColumnsCreateAttempted = true;

  try {
    await ensureRefreshColumnsBestEffort();
  } catch {
    return false;
  } finally {
    refreshColumnsStatus = 'unknown';
    refreshColumnsCheckedAtMs = 0;
  }

  return hasRefreshColumnsCached();
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    const key = rawKey?.trim();
    if (!key) continue;
    const value = rest.join('=').trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

function setRefreshCookie(res: any, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(config.jwt.refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/auth',
    maxAge: config.jwt.refreshExpiresInSeconds * 1000,
  });
}

function clearRefreshCookie(res: any) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(config.jwt.refreshCookieName, { path: '/auth', sameSite: 'lax', secure: isProd });
}

// GET /auth/me
authRouter.get('/me', authenticateUser, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const user = await queryOne(`SELECT * FROM users WHERE id = ? AND status = 'active'`, [userId]);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    const { password_hash, ...userResponse } = user;
    res.json({
      user: {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role,
        department: userResponse.department,
        avatar: userResponse.avatar || '',
        itemsCount: 0,
        status: userResponse.status,
      },
    });
  } catch (e) {
    next(e);
  }
});

// PUT /auth/me
authRouter.put('/me', authenticateUser, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const user = await queryOne(`SELECT * FROM users WHERE id = ? AND status = 'active'`, [userId]);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    const { name, department, avatar } = req.body ?? {};

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome inválido' });
      }
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (department !== undefined) {
      if (typeof department !== 'string' || department.trim().length === 0) {
        return res.status(400).json({ error: 'Departamento inválido' });
      }
      updates.push('department = ?');
      values.push(department.trim());
    }

    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return res.status(400).json({ error: 'Avatar inválido' });
      }
      const normalizedAvatar = avatar.trim();
      updates.push('avatar = ?');
      values.push(normalizedAvatar.length > 0 ? normalizedAvatar : null);
    }

    if (updates.length > 0) {
      values.push(userId);
      await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const updated = await queryOne(`SELECT * FROM users WHERE id = ? AND status = 'active'`, [userId]);
    if (!updated) {
      return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }

    const { password_hash, ...userResponse } = updated;
    res.json({
      user: {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role,
        department: userResponse.department,
        avatar: userResponse.avatar || '',
        itemsCount: 0,
        status: userResponse.status,
      },
    });
  } catch (e) {
    next(e);
  }
});

// PUT /auth/me/password
authRouter.put('/me/password', authenticateUser, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;

    if (typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ error: 'Senha atual é obrigatória' });
    }

    if (typeof newPassword !== 'string' || !newPassword) {
      return res.status(400).json({ error: 'Nova senha é obrigatória' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    const user = await queryOne(`SELECT id, password_hash FROM users WHERE id = ? AND status = 'active'`, [userId]);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Senha atual inválida' });
    }

    const nextHash = await hashPassword(newPassword);
    await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [nextHash, userId]);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// POST /auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await queryOne(`SELECT * FROM users WHERE email = ? AND status = 'active'`, [
      normalizedEmail,
    ]);

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Return user without password_hash
    const { password_hash, ...userResponse } = user;
    const responseUser = {
      id: userResponse.id,
      name: userResponse.name,
      email: userResponse.email,
      role: userResponse.role,
      department: userResponse.department,
      avatar: userResponse.avatar || '',
      itemsCount: 0, // TODO: calculate from inventory_items
      status: userResponse.status,
    };
    const token = createAuthToken({ userId: responseUser.id, email: responseUser.email });
    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const refreshExpiresAt = getRefreshTokenExpiresAt();
    let refreshEnabled = true;
    const columnsOk = await ensureRefreshColumnsAvailable().catch(() => false);
    if (!columnsOk) {
      refreshEnabled = false;
    } else {
      try {
        await query(`UPDATE users SET refresh_token_hash = ?, refresh_token_expires_at = ? WHERE id = ?`, [
          refreshTokenHash,
          refreshExpiresAt,
          responseUser.id,
        ]);
      } catch (e: any) {
        if (isMissingRefreshColumnsError(e)) {
          refreshEnabled = false;
          refreshColumnsStatus = 'missing';
          refreshColumnsCheckedAtMs = Date.now();
        } else {
          throw e;
        }
      }
    }
    if (refreshEnabled) {
      setRefreshCookie(res, refreshToken);
    } else {
      clearRefreshCookie(res);
    }
    const isProd = process.env.NODE_ENV === 'production';
    res.json({
      user: responseUser,
      token,
      ...(refreshEnabled && !isProd ? { refreshToken } : {}),
    });
  } catch (e) {
    console.error('[auth/login] error:', e);
    next(e);
  }
});

// POST /auth/register
authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Validate name length
    if (name.trim().length < 3) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 3 caracteres' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await queryOne(`SELECT id FROM users WHERE email = ?`, [normalizedEmail]);
    if (existing) {
      return res.status(409).json({ error: 'Este email já está cadastrado' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = generateUUID();
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, department, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), normalizedEmail, passwordHash, 'Usuario', 'Geral', 'active']
    );

    // Fetch created user
    const newUser = await queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!newUser) {
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    // Return user without password_hash
    const { password_hash, ...userResponse } = newUser;
    const responseUser = {
      id: userResponse.id,
      name: userResponse.name,
      email: userResponse.email,
      role: userResponse.role,
      department: userResponse.department,
      avatar: userResponse.avatar || '',
      itemsCount: 0,
      status: userResponse.status,
    };
    const token = createAuthToken({ userId: responseUser.id, email: responseUser.email });
    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const refreshExpiresAt = getRefreshTokenExpiresAt();
    let refreshEnabled = true;
    const columnsOk = await ensureRefreshColumnsAvailable().catch(() => false);
    if (!columnsOk) {
      refreshEnabled = false;
    } else {
      try {
        await query(`UPDATE users SET refresh_token_hash = ?, refresh_token_expires_at = ? WHERE id = ?`, [
          refreshTokenHash,
          refreshExpiresAt,
          responseUser.id,
        ]);
      } catch (e: any) {
        if (isMissingRefreshColumnsError(e)) {
          refreshEnabled = false;
          refreshColumnsStatus = 'missing';
          refreshColumnsCheckedAtMs = Date.now();
        } else {
          throw e;
        }
      }
    }
    if (refreshEnabled) {
      setRefreshCookie(res, refreshToken);
    } else {
      clearRefreshCookie(res);
    }
    const isProd = process.env.NODE_ENV === 'production';
    res.status(201).json({
      user: responseUser,
      token,
      ...(refreshEnabled && !isProd ? { refreshToken } : {}),
    });
  } catch (e) {
    console.error('[auth/register] error:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('[auth/register] error details:', {
      name: e instanceof Error ? e.name : 'Unknown',
      stack: e instanceof Error ? e.stack : undefined,
    });
    next(e);
  }
});

// POST /auth/refresh
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const cookies = parseCookieHeader(req.headers.cookie);
    const bodyToken = req.body?.refreshToken;
    const refreshToken = typeof bodyToken === 'string' && bodyToken.trim() ? bodyToken.trim() : cookies[config.jwt.refreshCookieName];

    if (!refreshToken) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'Refresh token ausente' });
    }

    const columnsOk = await hasRefreshColumnsCached().catch(() => false);
    if (!columnsOk) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);
    let user: any = null;
    try {
      user = await queryOne(
        `SELECT id, email FROM users WHERE refresh_token_hash = ? AND refresh_token_expires_at > NOW() AND status = 'active'`,
        [refreshTokenHash]
      );
    } catch (e: any) {
      if (isMissingRefreshColumnsError(e)) {
        clearRefreshCookie(res);
        return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
      }
      throw e;
    }

    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    const nextRefreshToken = createRefreshToken();
    const nextRefreshHash = hashRefreshToken(nextRefreshToken);
    const nextRefreshExpiresAt = getRefreshTokenExpiresAt();
    await query(`UPDATE users SET refresh_token_hash = ?, refresh_token_expires_at = ? WHERE id = ?`, [
      nextRefreshHash,
      nextRefreshExpiresAt,
      user.id,
    ]);
    setRefreshCookie(res, nextRefreshToken);

    const token = createAuthToken({ userId: user.id, email: user.email });
    const isProd = process.env.NODE_ENV === 'production';
    res.json({ token, ...(isProd ? {} : { refreshToken: nextRefreshToken }) });
  } catch (e) {
    next(e);
  }
});

// POST /auth/logout
authRouter.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.replace(/^Bearer\s+/i, '').trim()
      : '';
    const payload = bearer ? verifyAuthToken(bearer) : null;

    const cookies = parseCookieHeader(req.headers.cookie);
    const bodyToken = req.body?.refreshToken;
    const refreshToken = typeof bodyToken === 'string' && bodyToken.trim() ? bodyToken.trim() : cookies[config.jwt.refreshCookieName];

    const columnsOk = await hasRefreshColumnsCached().catch(() => false);
    if (payload?.sub) {
      if (columnsOk) {
        try {
          await query(`UPDATE users SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE id = ?`, [payload.sub]);
        } catch (e: any) {
          if (!isMissingRefreshColumnsError(e)) throw e;
        }
      }
    } else if (refreshToken) {
      if (columnsOk) {
        const refreshTokenHash = hashRefreshToken(refreshToken);
        try {
          await query(`UPDATE users SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE refresh_token_hash = ?`, [
            refreshTokenHash,
          ]);
        } catch (e: any) {
          if (!isMissingRefreshColumnsError(e)) throw e;
        }
      }
    }

    clearRefreshCookie(res);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});


