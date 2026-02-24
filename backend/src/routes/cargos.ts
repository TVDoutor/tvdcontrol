import { Router } from 'express';
import { query } from '../db';
import { authenticateUser } from '../utils/auth';

export const cargosRouter = Router();

cargosRouter.use(authenticateUser);

// GET /cargos - Lista cargos para seleção (Cargo | Função)
cargosRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, name FROM cargo ORDER BY name ASC`
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    next(e);
  }
});
