import { Router } from 'express';
import { query, queryOne } from '../db';
import { hashPassword } from '../utils/password';
import { generateUUID } from '../utils/uuid';
import { authenticateUser } from '../utils/auth';
import { canManageUsers } from '../utils/permissions';

export const usersRouter = Router();

usersRouter.use(authenticateUser);
usersRouter.use((req, res, next) => {
  if (!canManageUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para acessar usuários' });
  }
  next();
});

// GET /users
usersRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await query(`SELECT * FROM users ORDER BY created_at DESC`);
    const users = rows.map((u: any) => {
      const { password_hash, ...user } = u;
      return {
        ...user,
        avatar: user.avatar || '',
        itemsCount: 0, // TODO: calculate from inventory_items
      };
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// GET /users/:id
usersRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await queryOne(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const { password_hash, ...userResponse } = user;
    res.json({
      ...userResponse,
      avatar: userResponse.avatar || '',
      itemsCount: 0,
    });
  } catch (e) {
    next(e);
  }
});

// POST /users
usersRouter.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role, department, avatar } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    let finalAvatar: string | null = null;
    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return res.status(400).json({ error: 'Avatar inválido' });
      }
      const normalizedAvatar = avatar.trim();
      finalAvatar = normalizedAvatar.length > 0 ? normalizedAvatar : null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await queryOne(`SELECT id FROM users WHERE email = ?`, [normalizedEmail]);
    if (existing) {
      return res.status(409).json({ error: 'Este email já está cadastrado' });
    }

    const passwordHash = await hashPassword(password);
    const userId = generateUUID();

    // Validar role
    let finalRole = 'Usuario';
    if (role && (role === 'Administrador' || role === 'Gerente' || role === 'Usuario')) {
      finalRole = role;
    }

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, department, avatar, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), normalizedEmail, passwordHash, finalRole, department || 'Geral', finalAvatar, 'active']
    );

    const newUser = await queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!newUser) {
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    const { password_hash, ...userResponse } = newUser;
    res.status(201).json({
      ...userResponse,
      avatar: userResponse.avatar || '',
      itemsCount: 0,
    });
  } catch (e) {
    next(e);
  }
});

// PUT /users/:id
usersRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, status, avatar } = req.body;

    const existing = await queryOne(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome inválido' });
      }
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (email !== undefined) {
      if (typeof email !== 'string') {
        return res.status(400).json({ error: 'Email inválido' });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== existing.email) {
        const emailExists = await queryOne(`SELECT id FROM users WHERE email = ? AND id != ?`, [
          normalizedEmail,
          id,
        ]);
        if (emailExists) {
          return res.status(409).json({ error: 'Este email já está em uso' });
        }
      }
      updates.push('email = ?');
      values.push(normalizedEmail);
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length === 0) {
        return res.status(400).json({ error: 'Senha inválida' });
      }
      const passwordHash = await hashPassword(password);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    // Apenas Administrador pode alterar role
    if (role !== undefined) {
      if (role !== 'Administrador' && role !== 'Gerente' && role !== 'Usuario') {
        return res.status(400).json({ error: 'Role inválida' });
      }
      updates.push('role = ?');
      values.push(role);
    }

    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }

    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return res.status(400).json({ error: 'Avatar inválido' });
      }
      const normalizedAvatar = avatar.trim();
      updates.push('avatar = ?');
      values.push(normalizedAvatar.length > 0 ? normalizedAvatar : null);
    }

    if (status !== undefined) {
      if (status !== 'active' && status !== 'inactive') {
        return res.status(400).json({ error: 'Status inválido' });
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      const { password_hash, ...userResponse } = existing;
      return res.json({
        ...userResponse,
        avatar: userResponse.avatar || '',
        itemsCount: 0,
      });
    }

    values.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const updated = await queryOne(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!updated) {
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }

    const { password_hash, ...userResponse } = updated;
    res.json({
      ...userResponse,
      avatar: userResponse.avatar || '',
      itemsCount: 0,
    });
  } catch (e) {
    next(e);
  }
});

// DELETE /users/:id
usersRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await queryOne(`SELECT id FROM users WHERE id = ?`, [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await query(`DELETE FROM users WHERE id = ?`, [id]);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});


