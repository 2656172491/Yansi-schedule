import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.use(authMiddleware);

// 获取所有模板
router.get('/', (req, res) => {
  const templates = db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at').all(req.userId);
  res.json({ templates });
});

// 创建模板
router.post('/', (req, res) => {
  const { label, title, color, notes } = req.body;

  if (!label || !title) {
    return res.status(400).json({ error: '标签和标题必填' });
  }

  const id = req.body.id || uuidv4();

  try {
    db.prepare('INSERT INTO templates (id, user_id, label, title, color, notes) VALUES (?, ?, ?, ?, ?, ?)').run(id, req.userId, label, title, color || 'blue', notes || '');
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    res.json({ ok: true, template });
  } catch (err) {
    res.status(500).json({ error: '创建失败' });
  }
});

// 删除模板
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM templates WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: '模板不存在' });
  }

  db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?').run(id, req.userId);
  res.json({ ok: true });
});

export default router;
