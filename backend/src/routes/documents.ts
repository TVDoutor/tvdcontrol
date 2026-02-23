import { Router } from 'express';
import { queryOne } from '../db';
import { authenticateUser } from '../utils/auth';
import { canRead } from '../utils/permissions';

export const documentsRouter = Router();

documentsRouter.use(authenticateUser);

// GET /documents/:id/download - download PDF
documentsRouter.get('/:id/download', async (req, res, next) => {
  try {
    if (!canRead(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    const id = String(req.params.id);
    const doc = await queryOne(
      `SELECT id, item_id AS itemId, type, pdf_base64 AS pdfBase64 FROM inventory_documents WHERE id = ?`,
      [id]
    );
    if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });
    const base64 = doc.pdfBase64;
    if (!base64 || typeof base64 !== 'string') {
      return res.status(404).json({ error: 'Conteúdo do PDF não disponível' });
    }
    const buf = Buffer.from(base64, 'base64');
    const filename = `termo-${doc.type}-${doc.itemId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (e) {
    next(e);
  }
});
