import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.use(authMiddleware);

// 获取所有色签
router.get('/', (req, res) => {
  const palettes = db.prepare('SELECT * FROM palettes WHERE user_id = ? ORDER BY created_at').all(req.userId);
  res.json({ palettes });
});

// 创建色签
router.post('/', (req, res) => {
  const { label, color } = req.body;

  if (!label || !color) {
    return res.status(400).json({ error: '标签和颜色必填' });
  }

  const id = req.body.id || uuidv4();

  try {
    db.prepare('INSERT INTO palettes (id, user_id, label, color) VALUES (?, ?, ?, ?)').run(id, req.userId, label, color);
    const palette = db.prepare('SELECT * FROM palettes WHERE id = ?').get(id);
    res.json({ ok: true, palette });
  } catch (err) {
    res.status(500).json({ error: '创建失败' });
  }
});

// 删除色签
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM palettes WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: '色签不存在' });
  }

  db.prepare('DELETE FROM palettes WHERE id = ? AND user_id = ?').run(id, req.userId);
  res.json({ ok: true });
});

export default router;
