import { Request, Response, NextFunction } from 'express';
import { queryOne } from '../db';
import { verifyAuthToken } from './token';

// Estende o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        status: string;
      };
    }
  }
}

// Middleware de autenticação baseado em Bearer Token
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }

    const user = await queryOne(
      `SELECT id, email, role, status FROM users WHERE id = ? AND status = 'active'`,
      [payload.sub]
    );

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    console.error('[auth middleware] error:', error);
    res.status(500).json({ error: 'Erro ao autenticar usuário' });
  }
}
