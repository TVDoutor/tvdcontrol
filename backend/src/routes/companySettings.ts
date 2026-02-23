import { Router } from 'express';
import { query, queryOne } from '../db';
import { authenticateUser } from '../utils/auth';
import { canListUsers, canManageUsers } from '../utils/permissions';

const DEFAULT_ID = 'default';

export const companySettingsRouter = Router();

companySettingsRouter.use(authenticateUser);

// GET /company-settings - Administrador e Gerente podem ler (para PDFs)
companySettingsRouter.get('/', (req, res, next) => {
  if (!canListUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para acessar configurações' });
  }
  next();
}, async (_req, res, next) => {
  try {
    const row = await queryOne(
      `SELECT id, name, legal_name AS legalName, address, city, state, zip, cnpj, created_at AS createdAt, updated_at AS updatedAt
       FROM company_settings WHERE id = ?`,
      [DEFAULT_ID]
    );
    if (!row) {
      return res.json({
        id: DEFAULT_ID,
        name: '',
        legalName: null,
        address: null,
        city: null,
        state: null,
        zip: null,
        cnpj: null,
      });
    }
    res.json({
      ...row,
      legalName: row.legalName ?? null,
      address: row.address ?? null,
      city: row.city ?? null,
      state: row.state ?? null,
      zip: row.zip ?? null,
      cnpj: row.cnpj ?? null,
    });
  } catch (e) {
    next(e);
  }
});

// PUT /company-settings - apenas Administrador
companySettingsRouter.put('/', (req, res, next) => {
  if (!canManageUsers(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para alterar configurações da empresa' });
  }
  next();
}, async (req, res, next) => {
  try {
    const { name, legalName, address, city, state, zip, cnpj } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(typeof name === 'string' ? name.trim() || '' : '');
    }
    if (legalName !== undefined) {
      updates.push('legal_name = ?');
      values.push(typeof legalName === 'string' ? legalName.trim() || null : null);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(typeof address === 'string' ? address.trim() || null : null);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      values.push(typeof city === 'string' ? city.trim() || null : null);
    }
    if (state !== undefined) {
      updates.push('state = ?');
      values.push(typeof state === 'string' ? state.trim() || null : null);
    }
    if (zip !== undefined) {
      updates.push('zip = ?');
      values.push(typeof zip === 'string' ? zip.trim() || null : null);
    }
    if (cnpj !== undefined) {
      const cnpjStr = cnpj === null || cnpj === '' ? null : String(cnpj).replace(/\D/g, '');
      updates.push('cnpj = ?');
      values.push(cnpjStr || null);
    }

    const existing = await queryOne(`SELECT id FROM company_settings WHERE id = ?`, [DEFAULT_ID]);

    if (existing) {
      if (updates.length === 0) {
        const row = await queryOne(
          `SELECT id, name, legal_name AS legalName, address, city, state, zip, cnpj, created_at AS createdAt, updated_at AS updatedAt
           FROM company_settings WHERE id = ?`,
          [DEFAULT_ID]
        );
        return res.json({ ...row, legalName: row?.legalName ?? null });
      }
      await query(
        `UPDATE company_settings SET ${updates.join(', ')} WHERE id = ?`,
        [...values, DEFAULT_ID]
      );
    } else {
      const finalName = typeof name === 'string' ? name.trim() || 'Empresa' : 'Empresa';
      const finalLegalName = typeof legalName === 'string' ? legalName.trim() || null : null;
      const finalAddress = typeof address === 'string' ? address.trim() || null : null;
      const finalCity = typeof city === 'string' ? city.trim() || null : null;
      const finalState = typeof state === 'string' ? state.trim() || null : null;
      const finalZip = typeof zip === 'string' ? zip.trim() || null : null;
      const finalCnpj = cnpj === null || cnpj === '' ? null : String(cnpj).replace(/\D/g, '') || null;

      await query(
        `INSERT INTO company_settings (id, name, legal_name, address, city, state, zip, cnpj)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [DEFAULT_ID, finalName, finalLegalName, finalAddress, finalCity, finalState, finalZip, finalCnpj]
      );
    }

    const row = await queryOne(
      `SELECT id, name, legal_name AS legalName, address, city, state, zip, cnpj, created_at AS createdAt, updated_at AS updatedAt
       FROM company_settings WHERE id = ?`,
      [DEFAULT_ID]
    );
    res.json({
      ...row,
      legalName: row?.legalName ?? null,
      address: row?.address ?? null,
      city: row?.city ?? null,
      state: row?.state ?? null,
      zip: row?.zip ?? null,
      cnpj: row?.cnpj ?? null,
    });
  } catch (e) {
    next(e);
  }
});
