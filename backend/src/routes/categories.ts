import { Router } from 'express';
import { query, queryOne } from '../db';
import { authenticateUser } from '../utils/auth';
import { canManageCategories } from '../utils/permissions';
import { generateUUID } from '../utils/uuid';

export const categoriesRouter = Router();

categoriesRouter.use(authenticateUser);
categoriesRouter.use((req, res, next) => {
  if (!canManageCategories(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para gerenciar categorias' });
  }
  next();
});

// GET /categories
categoriesRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await query(`SELECT id, name, created_at AS createdAt, updated_at AS updatedAt FROM categories ORDER BY name ASC`);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// POST /categories
categoriesRouter.post('/', async (req, res, next) => {
  try {
    const nameRaw = req.body?.name;
    if (typeof nameRaw !== 'string' || nameRaw.trim().length === 0) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }
    const name = nameRaw.trim();

    const exists = await queryOne(`SELECT id FROM categories WHERE name = ?`, [name]);
    if (exists) {
      return res.status(409).json({ error: 'Categoria já cadastrada' });
    }

    const id = generateUUID();
    await query(`INSERT INTO categories (id, name) VALUES (?, ?)`, [id, name]);

    const created = await queryOne(`SELECT id, name, created_at AS createdAt, updated_at AS updatedAt FROM categories WHERE id = ?`, [id]);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// DELETE /categories/:id
categoriesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const category = await queryOne(`SELECT id, name FROM categories WHERE id = ?`, [id]);
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const usage = await queryOne(`SELECT COUNT(*) AS count FROM inventory_items WHERE category = ?`, [category.name]);
    if (usage?.count > 0) {
      return res.status(409).json({ error: `Categoria em uso por ${usage.count} item(ns)` });
    }

    await query(`DELETE FROM categories WHERE id = ?`, [id]);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

