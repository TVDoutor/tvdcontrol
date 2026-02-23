import { Router } from 'express';
import { query, queryOne } from '../db';
import { hashPassword } from '../utils/password';
import { generateUUID } from '../utils/uuid';
import { authenticateUser } from '../utils/auth';
import { canListUsers, canManageUsers } from '../utils/permissions';

export const usersRouter = Router();

usersRouter.use(authenticateUser);

// GET /users - Administrador e Gerente podem listar (Gerente para atribuição)
usersRouter.get('/', (req, res, next) => {
  if (!canListUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para acessar usuários' });
  }
  next();
}, async (_req, res, next) => {
  try {
    const rows = await query(`SELECT * FROM users ORDER BY created_at DESC`);
    const users = rows.map((u: any) => {
      const { password_hash, ...user } = u;
      return {
        ...user,
        phone: user.phone ?? null,
        avatar: user.avatar || '',
        itemsCount: 0, // TODO: calculate from inventory_items
      };
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// GET /users/:id - Administrador e Gerente podem listar
usersRouter.get('/:id', (req, res, next) => {
  if (!canListUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para acessar usuários' });
  }
  next();
}, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await queryOne(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const { password_hash, ...userResponse } = user;
    res.json({
      ...userResponse,
      phone: userResponse.phone ?? null,
      avatar: userResponse.avatar || '',
      itemsCount: 0,
    });
  } catch (e) {
    next(e);
  }
});

// POST /users - apenas Administrador
usersRouter.post('/', (req, res, next) => {
  if (!canManageUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para gerenciar usuários' });
  }
  next();
}, async (req, res, next) => {
  try {
    const { name, email, password, role, department, avatar, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    let finalAvatar: string | null = null;
    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return res.status(400).json({ error: 'Avatar inválido' });
      }
      const normalizedAvatar = avatar.trim();
      finalAvatar = normalizedAvatar.length > 0 ? normalizedAvatar : null;
    }

    let finalPhone: string | null = null;
    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ error: 'Telefone inválido' });
      }
      const normalizedPhone = phone.trim();
      finalPhone = normalizedPhone.length > 0 ? normalizedPhone : null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await queryOne(`SELECT id FROM users WHERE email = ?`, [normalizedEmail]);
    if (existing) {
      return res.status(409).json({ error: 'Este email já está cadastrado' });
    }

    // Validar role
    let finalRole = 'Usuario';
    if (role && (role === 'Administrador' || role === 'Gerente' || role === 'Usuario')) {
      finalRole = role;
    }

    let passwordHash: string;
    if (finalRole === 'Administrador' || finalRole === 'Gerente') {
      if (!password || typeof password !== 'string' || password.length === 0) {
        return res.status(400).json({ error: 'Senha é obrigatória para este perfil' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
      }
      passwordHash = await hashPassword(password);
    } else {
      if (typeof password === 'string' && password.length > 0) {
        passwordHash = await hashPassword(password);
      } else {
        passwordHash = await hashPassword(generateUUID());
      }
    }

    const userId = generateUUID();

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, department, avatar, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), normalizedEmail, passwordHash, finalRole, department || 'Geral', finalAvatar, finalPhone, 'active']
    );

    const newUser = await queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!newUser) {
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    const { password_hash, ...userResponse } = newUser;
    res.status(201).json({
      ...userResponse,
      phone: userResponse.phone ?? null,
      avatar: userResponse.avatar || '',
      itemsCount: 0,
    });
  } catch (e) {
    next(e);
  }
});

// PUT /users/:id - apenas Administrador
usersRouter.put('/:id', (req, res, next) => {
  if (!canManageUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para gerenciar usuários' });
  }
  next();
}, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, status, avatar, phone } = req.body;

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

    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ error: 'Telefone inválido' });
      }
      const normalizedPhone = phone.trim();
      updates.push('phone = ?');
      values.push(normalizedPhone.length > 0 ? normalizedPhone : null);
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
        phone: userResponse.phone ?? null,
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
      phone: userResponse.phone ?? null,
      avatar: userResponse.avatar || '',
      itemsCount: 0,
    });
  } catch (e) {
    next(e);
  }
});

// DELETE /users/:id - apenas Administrador
usersRouter.delete('/:id', (req, res, next) => {
  if (!canManageUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para gerenciar usuários' });
  }
  next();
}, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await queryOne(`SELECT id FROM users WHERE id = ?`, [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se usuário tem itens atribuídos
    const itemsCount = await queryOne(
      `SELECT COUNT(*) as count FROM inventory_items WHERE assigned_to_user_id = ?`,
      [id]
    );
    if (itemsCount?.count > 0) {
      return res.status(409).json({
        error: `Não é possível excluir o usuário pois possui ${itemsCount.count} item(s) atribuído(s). Remova as atribuições primeiro.`
      });
    }

    // Limpar referência do histórico (actor_user_id pode ser NULL)
    await query(`UPDATE inventory_history SET actor_user_id = NULL WHERE actor_user_id = ?`, [id]);

    await query(`DELETE FROM users WHERE id = ?`, [id]);
    res.status(204).send();
  } catch (e: any) {
    console.error('[DELETE /users] Error:', e?.message || e);

    if (e?.code === 'ER_ROW_IS_REFERENCED' || e?.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        error: 'Não é possível excluir o usuário pois ele possui registros vinculados no sistema'
      });
    }

    next(e);
  }
});
