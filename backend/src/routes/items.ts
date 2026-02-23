import { Router } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import { pool, query, queryOne, withTransaction } from '../db';
import { uuid } from '../utils/uuid';
import { authenticateUser } from '../utils/auth';
import { canCreate, canRead, canUpdate, canDelete } from '../utils/permissions';

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
    returnNotes = null,
    returnItems = null,
  } = params;

  await conn.query(
    `
    INSERT INTO inventory_history (id, item_id, actor_user_id, event_type, color, title, description, return_photo, return_notes, return_items)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [id, itemId, actorUserId, eventType, color, title, description, returnPhoto, returnNotes, returnItems]
  );
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
        photo_main AS photoMain,
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
        photo_main AS photoMain,
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
    const status = body.status ?? 'available';
    const assignedTo = body.assignedTo ?? null;
    const purchaseDate = body.purchaseDate;
    const purchasePrice = body.purchasePrice ?? null;
    const warrantyEnd = body.warrantyEnd;
    const location = body.location ?? null;
    const specs = body.specs ?? null;
    const notes = body.notes ?? null;

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
        (id, category, type, manufacturer, name, model, serial_number, asset_tag, sku, icon, photo_main, status, assigned_to_user_id, purchase_date, purchase_price, warranty_end, location, specs, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          status,
          assignedTo,
          purchaseDate,
          purchasePrice,
          warrantyEnd,
          location,
          specs,
          notes,
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
          status,
          assigned_to_user_id AS assignedTo,
          purchase_date AS purchaseDate,
          purchase_price AS purchasePrice,
          warranty_end AS warrantyEnd,
          location, specs, notes
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
      ['status', patch.status],
      ['assigned_to_user_id', patch.assignedTo],
      ['purchase_date', patch.purchaseDate],
      ['purchase_price', patch.purchasePrice],
      ['warranty_end', patch.warrantyEnd],
      ['location', patch.location],
      ['specs', patch.specs],
      ['notes', patch.notes],
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
          status,
          assigned_to_user_id AS assignedTo,
          purchase_date AS purchaseDate,
          purchase_price AS purchasePrice,
          warranty_end AS warrantyEnd,
          location, specs, notes
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
itemsRouter.get('/:id/history', authenticateUser, async (req, res, next) => {
  try {
    if (!canRead(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão para visualizar histórico' });
    }
    const id = String(req.params.id);
    const [rows] = await pool.query(
      `
        SELECT 
          id,
          color,
          DATE_FORMAT(created_at, '%d %b %Y, %H:%i') AS date,
          title,
          description AS desc,
          return_photo AS returnPhoto,
          return_notes AS returnNotes,
          return_items AS returnItems
        FROM inventory_history
        WHERE item_id = ?
        ORDER BY created_at DESC
      `,
      [id]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// POST /items/:id/assign { userId }
itemsRouter.post('/:id/assign', authenticateUser, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const userId = req.body?.userId ? String(req.body.userId) : null;
    if (!userId) return res.status(400).json({ message: 'userId é obrigatório' });

    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE inventory_items SET assigned_to_user_id = ?, status = 'in_use' WHERE id = ?`,
        [userId, id]
      );

      await addHistoryEvent(conn, {
        itemId: id,
        actorUserId: req.user?.id || null,
        eventType: 'assigned',
        color: 'primary',
        title: 'Atribuído a usuário',
        description: `Item atribuído ao usuário #${userId}.`,
      });
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// POST /items/:id/return
itemsRouter.post('/:id/return', authenticateUser, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const returnPhoto = req.body?.returnPhoto ?? null;
    const returnNotes = req.body?.returnNotes ?? null;
    const returnItems = req.body?.returnItems ?? null;

    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE inventory_items SET assigned_to_user_id = NULL, status = 'available' WHERE id = ?`,
        [id]
      );

      await addHistoryEvent(conn, {
        itemId: id,
        actorUserId: req.user?.id || null,
        eventType: 'returned',
        color: 'success',
        title: 'Devolvido ao estoque',
        description: 'Item retornado ao estoque. Status alterado para Disponível.',
        returnPhoto,
        returnNotes,
        returnItems,
      });
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
