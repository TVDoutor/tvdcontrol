import { Router } from 'express';
import { query, queryOne } from '../db';
import { hashPassword } from '../utils/password';
import { generateUUID } from '../utils/uuid';
import { authenticateUser } from '../utils/auth';
import { canListUsers, canManageUsers, canCreateProductUser, canEditProductUser } from '../utils/permissions';
import { generateTermoItensUsuarioPdf } from '../utils/pdfGenerator';

export const usersRouter = Router();

usersRouter.use(authenticateUser);

// GET /users - Administrador e Gerente podem listar (Gerente para atribuição)
usersRouter.get('/', (req, res, next) => {
  if (!canListUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para acessar usuários' });
  }
  next();
}, async (req, res, next) => {
  try {
    const requesterRole = req.user?.role;
    const isGerente = requesterRole === 'Gerente';

    const rows = await query(
      isGerente
        ? `
      SELECT u.*,
        (SELECT COUNT(*) FROM inventory_items WHERE assigned_to_user_id = u.id) AS itemsCount
      FROM users u
      WHERE u.role = 'Usuario'
      ORDER BY u.created_at DESC
    `
        : `
      SELECT u.*,
        (SELECT COUNT(*) FROM inventory_items WHERE assigned_to_user_id = u.id) AS itemsCount
      FROM users u
      ORDER BY u.created_at DESC
    `
    );
    const users = rows.map((u: any) => {
      const { password_hash, job_title, ...user } = u;
      return {
        ...user,
        jobTitle: job_title ?? null,
        phone: user.phone ?? null,
        avatar: user.avatar || '',
        itemsCount: Number(user.itemsCount ?? 0),
      };
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// GET /users/:id/termo-itens - Download PDF com itens associados ao usuário
usersRouter.get('/:id/termo-itens', (req, res, next) => {
  if (!canListUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão' });
  }
  next();
}, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const user = await queryOne(`SELECT name, department, job_title AS jobTitle, cpf, role FROM users WHERE id = ?`, [id]);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (req.user?.role === 'Gerente' && user.role !== 'Usuario') {
      return res.status(403).json({ error: 'Sem permissão para acessar usuários do tipo Sistema' });
    }

    const company = await queryOne(
      `SELECT name, legal_name AS legalName, address, city, state, zip, cnpj FROM company_settings WHERE id = 'default'`
    );

    const itemRows = await query(
      `SELECT category, type, manufacturer, name, model, serial_number AS serialNumber, asset_tag AS assetTag, notes
       FROM inventory_items WHERE assigned_to_user_id = ? ORDER BY category, model`,
      [id]
    );
    const items = (Array.isArray(itemRows) ? itemRows : []).map((row: any) => ({
      category: row.category || 'Equipamento',
      type: row.type || '',
      manufacturer: row.manufacturer || '–',
      model: row.model || row.name || '–',
      serialNumber: row.serialNumber || '–',
      assetTag: row.assetTag ?? null,
      notes: row.notes ?? null,
    }));

    const now = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const pdfBuffer = await generateTermoItensUsuarioPdf({
      company: {
        name: company?.name || 'Empresa',
        legalName: company?.legalName ?? null,
        address: company?.address ?? null,
        city: company?.city ?? null,
        state: company?.state ?? null,
        zip: company?.zip ?? null,
        cnpj: company?.cnpj ?? null,
      },
      user: {
        name: user.name,
        department: user.department || 'Geral',
        jobTitle: user.jobTitle ?? null,
        cpf: user.cpf ?? null,
      },
      items,
      date: now,
    });

    const safeName = (user.name || 'usuario').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 40);
    const filename = `termo-itens-${safeName}-${now.replace(/\//g, '-')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
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
    if (req.user?.role === 'Gerente' && user.role !== 'Usuario') {
      return res.status(403).json({ error: 'Sem permissão para acessar usuários do tipo Sistema' });
    }
    const itemsCountRow = await queryOne(
      `SELECT COUNT(*) AS count FROM inventory_items WHERE assigned_to_user_id = ?`,
      [id]
    );
    const { password_hash, job_title, ...userResponse } = user;
    res.json({
      ...userResponse,
      jobTitle: job_title ?? null,
      phone: userResponse.phone ?? null,
      avatar: userResponse.avatar || '',
      itemsCount: Number(itemsCountRow?.count ?? 0),
    });
  } catch (e) {
    next(e);
  }
});

// POST /users - Administrador (qualquer role) ou Gerente (apenas Usuario)
usersRouter.post('/', (req, res, next) => {
  if (canManageUsers(req.user?.role)) return next();
  if (canCreateProductUser(req.user?.role)) {
    const role = req.body?.role;
    if (role && role !== 'Usuario') {
      return res.status(403).json({ error: 'Gerente só pode cadastrar usuários Produto/Inventário' });
    }
    return next();
  }
  return res.status(403).json({ error: 'Sem permissão para cadastrar usuários' });
}, async (req, res, next) => {
  try {
    const { name, email, password, role, department, jobTitle, avatar, phone, cpf } = req.body;

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

    let finalCpf: string | null = null;
    if (cpf !== undefined && cpf !== null && cpf !== '') {
      const cpfStr = String(cpf).replace(/\D/g, '');
      finalCpf = cpfStr.length >= 11 ? cpfStr : null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await queryOne(`SELECT id FROM users WHERE email = ?`, [normalizedEmail]);
    if (existing) {
      return res.status(409).json({ error: 'Este email já está cadastrado' });
    }

    // Validar role - Gerente só pode criar Usuario
    let finalRole = 'Usuario';
    if (canManageUsers(req.user?.role)) {
      if (role && (role === 'Administrador' || role === 'Gerente' || role === 'Usuario')) {
        finalRole = role;
      }
    } else if (canCreateProductUser(req.user?.role)) {
      finalRole = 'Usuario';
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

    const finalJobTitle = typeof jobTitle === 'string' && jobTitle.trim() ? jobTitle.trim() : null;
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, department, job_title, avatar, phone, cpf, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), normalizedEmail, passwordHash, finalRole, department || 'Geral', finalJobTitle, finalAvatar, finalPhone, finalCpf, 'active']
    );

    const newUser = await queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!newUser) {
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    const { password_hash, job_title: jt, ...userResponse } = newUser;
    res.status(201).json({
      ...userResponse,
      jobTitle: jt ?? null,
      phone: userResponse.phone ?? null,
      avatar: userResponse.avatar || '',
      itemsCount: 0,
    });
  } catch (e) {
    next(e);
  }
});

// PUT /users/:id - Administrador (qualquer) ou Gerente (apenas Usuario)
usersRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, jobTitle, status, avatar, phone, cpf } = req.body;

    const existing = await queryOne(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!canManageUsers(req.user?.role) && !canEditProductUser(req.user?.role, existing.role)) {
      return res.status(403).json({ error: 'Sem permissão para editar este usuário' });
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

    // Apenas Administrador pode alterar role (Gerente não pode)
    if (role !== undefined && canManageUsers(req.user?.role)) {
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

    if (jobTitle !== undefined) {
      const val = typeof jobTitle === 'string' && jobTitle.trim() ? jobTitle.trim() : null;
      updates.push('job_title = ?');
      values.push(val);
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

    if (cpf !== undefined) {
      const cpfStr = cpf === null || cpf === '' ? null : String(cpf).replace(/\D/g, '');
      updates.push('cpf = ?');
      values.push(cpfStr && cpfStr.length >= 11 ? cpfStr : null);
    }

    if (status !== undefined) {
      if (status !== 'active' && status !== 'inactive') {
        return res.status(400).json({ error: 'Status inválido' });
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      const itemsCountRow = await queryOne(
        `SELECT COUNT(*) AS count FROM inventory_items WHERE assigned_to_user_id = ?`,
        [id]
      );
      const { password_hash, job_title: jt, ...userResponse } = existing;
      return res.json({
        ...userResponse,
        jobTitle: jt ?? null,
        phone: userResponse.phone ?? null,
        avatar: userResponse.avatar || '',
        itemsCount: Number(itemsCountRow?.count ?? 0),
      });
    }

    values.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const updated = await queryOne(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!updated) {
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }

    const itemsCountRow = await queryOne(
      `SELECT COUNT(*) AS count FROM inventory_items WHERE assigned_to_user_id = ?`,
      [id]
    );
    const { password_hash, job_title: jt, ...userResponse } = updated;
    res.json({
      ...userResponse,
      jobTitle: jt ?? null,
      phone: userResponse.phone ?? null,
      avatar: userResponse.avatar || '',
      itemsCount: Number(itemsCountRow?.count ?? 0),
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
