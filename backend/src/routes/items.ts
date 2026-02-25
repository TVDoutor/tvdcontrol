import { Router } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import { pool, query, queryOne, withTransaction } from '../db';
import { uuid } from '../utils/uuid';
import { authenticateUser } from '../utils/auth';
import { canCreate, canRead, canUpdate, canDelete } from '../utils/permissions';
import { generateRecebimentoPdf, generateDevolucaoPdf } from '../utils/pdfGenerator';

export const itemsRouter = Router();

const ASSET_TAG_PADDING = 6;

function formatAssetTag(value: number): string {
  return `#${String(value).padStart(ASSET_TAG_PADDING, '0')}`;
}

async function getNextAssetTagNumber(conn: PoolConnection): Promise<number> {
  const [rows] = await conn.query(
    `
    SELECT asset_tag AS assetTag, sku
    FROM inventory_items
    WHERE (asset_tag IS NOT NULL AND TRIM(asset_tag) <> '')
       OR (sku IS NOT NULL AND TRIM(sku) <> '')
    FOR UPDATE
    `
  );

  const maxFound = (rows as Array<{ assetTag?: unknown; sku?: unknown }>)
    .flatMap((row) => {
      const values: string[] = [];
      if (typeof row.assetTag === 'string') values.push(row.assetTag.trim());
      if (typeof row.sku === 'string') values.push(row.sku.trim());
      return values;
    })
    .reduce((max, raw) => {
      const match = raw.match(/(\d+)$/);
      if (!match) return max;
      const parsed = Number.parseInt(match[1], 10);
      if (!Number.isFinite(parsed)) return max;
      return Math.max(max, parsed);
    }, 0);

  return maxFound + 1;
}

async function getNextAssetTag(conn: PoolConnection): Promise<string> {
  const nextNumber = await getNextAssetTagNumber(conn);
  return formatAssetTag(nextNumber);
}

async function addHistoryEvent(conn: PoolConnection, params: {
  itemId: string;
  actorUserId?: string | null;
  eventType: string;
  color?: 'primary' | 'slate' | 'success' | 'danger' | null;
  title: string;
  description?: string | null;
  returnPhoto?: string | null;
  returnPhoto2?: string | null;
  returnNotes?: string | null;
  returnItems?: string | null;
}) {
  const id = uuid();
  const {
    itemId,
    actorUserId = null,
    eventType,
    color = null,
    title,
    description = null,
    returnPhoto = null,
    returnPhoto2 = null,
    returnNotes = null,
    returnItems = null,
  } = params;

  const hasReturnData = returnPhoto || returnPhoto2 || returnNotes || returnItems;
  const fullInsert = `
    INSERT INTO inventory_history (id, item_id, actor_user_id, event_type, color, title, description, return_photo, return_photo_2, return_notes, return_items)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const fullInsertLegacy = `
    INSERT INTO inventory_history (id, item_id, actor_user_id, event_type, color, title, description, return_photo, return_notes, return_items)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const minimalInsert = `
    INSERT INTO inventory_history (id, item_id, actor_user_id, event_type, color, title, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    if (hasReturnData) {
      try {
        await conn.query(fullInsert, [id, itemId, actorUserId, eventType, color, title, description, returnPhoto, returnPhoto2, returnNotes, returnItems]);
      } catch (e2: any) {
        if (e2?.code === 'ER_BAD_FIELD_ERROR') {
          await conn.query(fullInsertLegacy, [id, itemId, actorUserId, eventType, color, title, description, returnPhoto, returnNotes, returnItems]);
        } else {
          throw e2;
        }
      }
    } else {
      await conn.query(minimalInsert, [id, itemId, actorUserId, eventType, color, title, description]);
    }
  } catch (err: any) {
    if (err?.code === 'ER_BAD_FIELD_ERROR' && hasReturnData) {
      await conn.query(minimalInsert, [id, itemId, actorUserId, eventType, color, title, description]);
    } else {
      throw err;
    }
  }
  return id;
}

// GET /items
itemsRouter.get('/', authenticateUser, async (_req, res, next) => {
  try {
    if (!canRead(_req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão para listar itens' });
    }
    const [rows] = await pool.query(
      `
      SELECT 
        id,
        category, type, manufacturer, name, model,
        serial_number AS serialNumber,
        asset_tag AS assetTag,
        sku,
        icon,
        status,
        assigned_to_user_id AS assignedTo,
        purchase_date AS purchaseDate,
        purchase_price AS purchasePrice,
        warranty_end AS warrantyEnd,
        location, specs, notes,
        phone_number AS phoneNumber,
        photo_main AS photoMain,
        photo_main_2 AS photoMain2,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM inventory_items
      ORDER BY created_at DESC
      `
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /items/:id/documents
itemsRouter.get('/:id/documents', authenticateUser, async (req, res, next) => {
  try {
    if (!canRead(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão para visualizar documentos' });
    }
    const itemId = String(req.params.id);
    const rows = await query(
      `SELECT id, item_id AS itemId, user_id AS userId, type, signed_at AS signedAt, history_event_id AS historyEventId, created_at AS createdAt
       FROM inventory_documents WHERE item_id = ? ORDER BY created_at DESC`,
      [itemId]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /items/:id
itemsRouter.get('/:id', authenticateUser, async (req, res, next) => {
  try {
    if (!canRead(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão para visualizar item' });
    }
    const id = String(req.params.id);
    const [rows] = await pool.query(
      `
      SELECT 
        id,
        category, type, manufacturer, name, model,
        serial_number AS serialNumber,
        asset_tag AS assetTag,
        sku,
        icon,
        status,
        assigned_to_user_id AS assignedTo,
        purchase_date AS purchaseDate,
        purchase_price AS purchasePrice,
        warranty_end AS warrantyEnd,
        location, specs, notes,
        phone_number AS phoneNumber,
        photo_main AS photoMain,
        photo_main_2 AS photoMain2,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM inventory_items
      WHERE id = ?
      `,
      [id]
    );
    const item = (rows as any[])[0];
    if (!item) return res.status(404).json({ message: 'Item não encontrado' });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// GET /items/meta/next-asset-tag
itemsRouter.get('/meta/next-asset-tag', authenticateUser, async (req, res, next) => {
  try {
    if (!canCreate(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão para criar itens' });
    }

    const nextAssetTag = await withTransaction(async (conn) => getNextAssetTag(conn));
    res.json({ value: nextAssetTag });
  } catch (e) {
    next(e);
  }
});

// POST /items
itemsRouter.post('/', authenticateUser, async (req, res, next) => {
  try {
    if (!canCreate(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão para criar itens' });
    }
    const id = uuid();
    const body = req.body ?? {};

    const category = body.category;
    const type = body.type ?? 'notebook';
    const manufacturer = body.manufacturer ?? '';
    const name = body.name ?? null;
    const model = body.model;
    const serialNumber = body.serialNumber;
    // Tag de patrimônio é gerada automaticamente no backend.
    const icon = body.icon ?? null;
    const photoMain = body.photoMain ?? null;
    const photoMain2 = body.photoMain2 ?? null;
    const status = body.status ?? 'available';
    const assignedTo = body.assignedTo ?? null;
    const purchaseDate = body.purchaseDate;
    const purchasePrice = body.purchasePrice ?? null;
    const warrantyEnd = body.warrantyEnd;
    const location = body.location ?? null;
    const specs = body.specs ?? null;
    const notes = body.notes ?? null;
    const phoneNumber = body.phoneNumber?.trim() || null;

    if (!category || !model || !serialNumber || !purchaseDate || !warrantyEnd) {
      return res
        .status(400)
        .json({ message: 'category, model, serialNumber, purchaseDate, warrantyEnd são obrigatórios' });
    }

    const created = await withTransaction(async (conn) => {
      const generatedAssetTag = await getNextAssetTag(conn);
      await conn.query(
        `
        INSERT INTO inventory_items
        (id, category, type, manufacturer, name, model, serial_number, asset_tag, sku, icon, photo_main, photo_main_2, status, assigned_to_user_id, purchase_date, purchase_price, warranty_end, location, specs, notes, phone_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          category,
          type,
          manufacturer,
          name,
          model,
          serialNumber,
          generatedAssetTag,
          generatedAssetTag,
          icon,
          photoMain,
          photoMain2,
          status,
          assignedTo,
          purchaseDate,
          purchasePrice,
          warrantyEnd,
          location,
          specs,
          notes,
          phoneNumber,
        ]
      );

      await addHistoryEvent(conn, {
        itemId: id,
        actorUserId: req.user?.id || null,
        eventType: 'created',
        color: 'slate',
        title: 'Adicionado ao Inventário',
        description: 'Cadastro realizado no sistema.',
      });

      const [rows] = await conn.query(
        `
        SELECT 
          id,
          category, type, manufacturer, name, model,
          serial_number AS serialNumber,
          asset_tag AS assetTag,
          sku,
          icon,
          photo_main AS photoMain,
          photo_main_2 AS photoMain2,
          status,
          assigned_to_user_id AS assignedTo,
          purchase_date AS purchaseDate,
          purchase_price AS purchasePrice,
          warranty_end AS warrantyEnd,
          location, specs, notes,
          phone_number AS phoneNumber
        FROM inventory_items
        WHERE id = ?
        `,
        [id]
      );

      return (rows as any[])[0];
    });

    res.status(201).json(created);
  } catch (e: any) {
    console.error('[POST /items] Error:', e?.message || e);
    console.error('[POST /items] Code:', e?.code);
    console.error('[POST /items] SQL:', e?.sqlMessage);

    // Handle duplicate entry error
    if (e?.code === 'ER_DUP_ENTRY') {
      const msg = e?.sqlMessage || '';
      if (msg.includes('serial')) {
        return res.status(409).json({ error: 'Número de série já cadastrado no sistema' });
      }
      if (msg.includes('asset_tag')) {
        return res.status(409).json({ error: 'Tag de patrimônio já cadastrada no sistema' });
      }
      return res.status(409).json({ error: 'Item duplicado - verifique os dados informados' });
    }

    next(e);
  }
});

// PUT /items/:id
itemsRouter.put('/:id', authenticateUser, async (req, res, next) => {
  try {
    if (!canUpdate(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão para editar itens' });
    }
    const id = String(req.params.id);
    const patch = req.body ?? {};

    const candidates = [
      ['category', patch.category],
      ['type', patch.type],
      ['manufacturer', patch.manufacturer],
      ['name', patch.name],
      ['model', patch.model],
      ['serial_number', patch.serialNumber],
      ['asset_tag', patch.assetTag],
      ['sku', patch.sku],
      ['icon', patch.icon],
      ['photo_main', patch.photoMain],
      ['photo_main_2', patch.photoMain2],
      ['status', patch.status],
      ['assigned_to_user_id', patch.assignedTo],
      ['purchase_date', patch.purchaseDate],
      ['purchase_price', patch.purchasePrice],
      ['warranty_end', patch.warrantyEnd],
      ['location', patch.location],
      ['specs', patch.specs],
      ['notes', patch.notes],
      ['phone_number', patch.phoneNumber],
    ] as Array<[string, any]>;
    const fields = candidates.filter(([, v]) => v !== undefined) as Array<[string, any]>;

    if (fields.length === 0) return res.status(400).json({ message: 'Nenhum campo para atualizar' });

    const setClause = fields.map(([k]) => `${k} = ?`).join(', ');
    const values = fields.map(([, v]) => v);

    const updated = await withTransaction(async (conn) => {
      await conn.query(`UPDATE inventory_items SET ${setClause} WHERE id = ?`, [...values, id]);

      await addHistoryEvent(conn, {
        itemId: id,
        actorUserId: req.user?.id || null,
        eventType: 'updated',
        color: 'primary',
        title: 'Item atualizado',
        description: 'Dados do item foram alterados.',
      });

      const [rows] = await conn.query(
        `
        SELECT 
          id,
          category, type, manufacturer, name, model,
          serial_number AS serialNumber,
          asset_tag AS assetTag,
          sku,
          icon,
          photo_main AS photoMain,
          photo_main_2 AS photoMain2,
          status,
          assigned_to_user_id AS assignedTo,
          purchase_date AS purchaseDate,
          purchase_price AS purchasePrice,
          warranty_end AS warrantyEnd,
          location, specs, notes,
          phone_number AS phoneNumber
        FROM inventory_items
        WHERE id = ?
        `,
        [id]
      );

      return (rows as any[])[0];
    });

    if (!updated) return res.status(404).json({ message: 'Item não encontrado' });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// DELETE /items/:id
itemsRouter.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    if (!canDelete(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão para excluir itens' });
    }

    const id = String(req.params.id);
    await pool.query(`DELETE FROM inventory_items WHERE id = ?`, [id]);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// GET /items/:id/history
itemsRouter.get('/:id/history', authenticateUser, async (req, res) => {
  if (!canRead(req.user?.role)) {
    return res.status(403).json({ error: 'Sem permissão para visualizar histórico' });
  }
  const id = String(req.params.id);

  const fullQuery = `
    SELECT id, color,
      DATE_FORMAT(created_at, '%d %b %Y, %H:%i') AS \`date\`,
      title, description AS \`desc\`,
      return_photo AS returnPhoto, return_photo_2 AS returnPhoto2, return_notes AS returnNotes, return_items AS returnItems
    FROM inventory_history WHERE item_id = ? ORDER BY created_at DESC
  `;
  const fullQueryLegacy = `
    SELECT id, color,
      DATE_FORMAT(created_at, '%d %b %Y, %H:%i') AS \`date\`,
      title, description AS \`desc\`,
      return_photo AS returnPhoto, return_notes AS returnNotes, return_items AS returnItems
    FROM inventory_history WHERE item_id = ? ORDER BY created_at DESC
  `;
  const minimalQuery = `
    SELECT id, color,
      DATE_FORMAT(created_at, '%d %b %Y, %H:%i') AS \`date\`,
      title, description AS \`desc\`
    FROM inventory_history WHERE item_id = ? ORDER BY created_at DESC
  `;

  try {
    let rows: any[];
    try {
      const [r] = await pool.query(fullQuery, [id]);
      rows = (r as any[]) || [];
    } catch (err: any) {
      if (err?.code === 'ER_BAD_FIELD_ERROR' || err?.code === 'ER_NO_SUCH_TABLE') {
        try {
          const [r] = await pool.query(fullQueryLegacy, [id]);
          rows = ((r as any[]) || []).map((row) => ({
            ...row,
            returnPhoto2: null,
          }));
        } catch {
          try {
            const [r] = await pool.query(minimalQuery, [id]);
            rows = ((r as any[]) || []).map((row) => ({
              ...row,
              returnPhoto: null,
              returnPhoto2: null,
              returnNotes: null,
              returnItems: null,
            }));
          } catch {
            rows = [];
          }
        }
      } else {
        throw err;
      }
    }
    res.json(rows);
  } catch (e: any) {
    console.error('[GET /items/:id/history]', e?.code, e?.message);
    res.json([]);
  }
});

// POST /items/:id/assign { userId } - Administrador e Gerente
itemsRouter.post('/:id/assign', authenticateUser, async (req, res, next) => {
  try {
    if (!canUpdate(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão para atribuir itens' });
    }
    const id = String(req.params.id);
    const userId = req.body?.userId ? String(req.body.userId) : null;
    const signatureBase64 = req.body?.signatureBase64 ? String(req.body.signatureBase64) : null;
    if (!userId) return res.status(400).json({ message: 'userId é obrigatório' });

    const [itemRows] = await pool.query(
      `SELECT category, type, manufacturer, name, model, serial_number AS serialNumber, asset_tag AS assetTag, notes
       FROM inventory_items WHERE id = ?`,
      [id]
    );
    const item = (itemRows as any[])[0];
    if (!item) return res.status(404).json({ message: 'Item não encontrado' });

    const [userRows] = await pool.query(
      `SELECT name, department, job_title AS jobTitle, cpf, role FROM users WHERE id = ?`,
      [userId]
    );
    const user = (userRows as any[])[0];
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    if (req.user?.role === 'Gerente' && user.role !== 'Usuario') {
      return res.status(403).json({ message: 'Gerente só pode atribuir itens a usuários Produto/Inventário' });
    }

    const company = await queryOne(
      `SELECT name, legal_name AS legalName, address, city, state, zip, cnpj FROM company_settings WHERE id = 'default'`
    );

    let assignDocumentId: string | null = null;
    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE inventory_items SET assigned_to_user_id = ?, status = 'in_use' WHERE id = ?`,
        [userId, id]
      );

      const userName = user.name ?? null;
      const assignDesc = userName
        ? `Item atribuído ao usuário ${userName}.`
        : `Item atribuído ao usuário (ID: ${userId}).`;

      const historyId = await addHistoryEvent(conn, {
        itemId: id,
        actorUserId: req.user?.id || null,
        eventType: 'assigned',
        color: 'primary',
        title: 'Atribuído a usuário',
        description: assignDesc,
      });

      const now = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const pdfBuffer = await generateRecebimentoPdf({
        signatureBase64: signatureBase64 || null,
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
        item: {
          category: item.category,
          type: item.type,
          manufacturer: item.manufacturer || '–',
          model: item.model,
          serialNumber: item.serialNumber,
          assetTag: item.assetTag ?? null,
          notes: item.notes ?? null,
        },
        date: now,
      });
      const pdfBase64 = pdfBuffer.toString('base64');
      const docId = uuid();
      await conn.query(
        `INSERT INTO inventory_documents (id, item_id, user_id, type, file_path, pdf_base64, signed_at, actor_user_id, history_event_id)
         VALUES (?, ?, ?, 'recebimento', '', ?, NOW(), ?, ?)`,
        [docId, id, userId, pdfBase64, req.user?.id || null, historyId]
      );

      assignDocumentId = docId;
    });

    if (assignDocumentId) {
      res.status(200).json({ documentId: assignDocumentId });
    } else {
      res.status(204).send();
    }
  } catch (e) {
    next(e);
  }
});

// POST /items/:id/return
itemsRouter.post('/:id/return', authenticateUser, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const returnPhoto = req.body?.returnPhoto ?? null;
    const returnPhoto2 = req.body?.returnPhoto2 ?? null;
    const returnNotes = req.body?.returnNotes ?? null;
    const returnItemsRaw = req.body?.returnItems;
    const returnItems = Array.isArray(returnItemsRaw) ? returnItemsRaw : null;
    const signatureBase64 = req.body?.signatureBase64 ? String(req.body.signatureBase64) : null;

    const [itemRows] = await pool.query(
      `SELECT i.category, i.type, i.manufacturer, i.name, i.model, i.serial_number AS serialNumber, i.asset_tag AS assetTag, i.notes, i.assigned_to_user_id AS assignedTo
       FROM inventory_items i WHERE i.id = ?`,
      [id]
    );
    const item = (itemRows as any[])[0];
    if (!item) return res.status(404).json({ message: 'Item não encontrado' });
    const userId = item.assignedTo;
    if (!userId) return res.status(400).json({ message: 'Item não está atribuído' });

    const [userRows] = await pool.query(
      `SELECT name, department, job_title AS jobTitle, cpf FROM users WHERE id = ?`,
      [userId]
    );
    const user = (userRows as any[])[0];
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const company = await queryOne(
      `SELECT name, legal_name AS legalName, address, city, state, zip, cnpj FROM company_settings WHERE id = 'default'`
    );

    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE inventory_items SET assigned_to_user_id = NULL, status = 'available' WHERE id = ?`,
        [id]
      );

      const historyId = await addHistoryEvent(conn, {
        itemId: id,
        actorUserId: req.user?.id || null,
        eventType: 'returned',
        color: 'success',
        title: 'Devolvido ao estoque',
        description: 'Item retornado ao estoque. Status alterado para Disponível.',
        returnPhoto,
        returnPhoto2,
        returnNotes,
        returnItems: returnItems ? JSON.stringify(returnItems) : null,
      });

      const now = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const returnItemsList = returnItems && returnItems.length > 0
        ? (typeof returnItems[0] === 'string' ? returnItems : returnItems.map((r: any) => r?.label || r?.name || String(r)))
        : null;

      const pdfBuffer = await generateDevolucaoPdf({
        signatureBase64: signatureBase64 || null,
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
        item: {
          category: item.category,
          type: item.type,
          manufacturer: item.manufacturer || '–',
          model: item.model,
          serialNumber: item.serialNumber,
          assetTag: item.assetTag ?? null,
          notes: item.notes ?? null,
        },
        date: now,
        returnItems: returnItemsList,
        returnNotes: returnNotes || null,
      });
      const pdfBase64 = pdfBuffer.toString('base64');
      const docId = uuid();
      await conn.query(
        `INSERT INTO inventory_documents (id, item_id, user_id, type, file_path, pdf_base64, signed_at, actor_user_id, history_event_id)
         VALUES (?, ?, ?, 'devolucao', '', ?, NOW(), ?, ?)`,
        [docId, id, userId, pdfBase64, req.user?.id || null, historyId]
      );
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
