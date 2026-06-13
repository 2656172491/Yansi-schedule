import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';
import { authMiddleware } from './auth.js';

const router = Router();

// 转换数据库字段名为驼峰格式
function formatSchedule(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    color: row.color,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 所有路由需要认证
router.use(authMiddleware);

// 获取所有日程
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM schedules WHERE user_id = ? ORDER BY date, start_time').all(req.userId);
  res.json({ schedules: rows.map(formatSchedule) });
});

// 创建日程
router.post('/', (req, res) => {
  const { title, date, startTime, endTime, color, notes } = req.body;

  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ error: '标题、日期、开始和结束时间必填' });
  }

  // 检查时间冲突
  const conflict = db.prepare(`
    SELECT id FROM schedules
    WHERE user_id = ? AND date = ? AND id != ?
    AND start_time < ? AND end_time > ?
  `).get(req.userId, date, '', endTime, startTime);

  if (conflict) {
    return res.status(409).json({ error: '时间冲突', reason: 'conflict' });
  }

  const id = req.body.id || uuidv4();

  try {
    db.prepare(`
      INSERT INTO schedules (id, user_id, title, date, start_time, end_time, color, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, title, date, startTime, endTime, color || 'blue', notes || '');

    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
    res.json({ ok: true, schedule: formatSchedule(schedule) });
  } catch (err) {
    res.status(500).json({ error: '创建失败' });
  }
});

// 更新日程
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, date, startTime, endTime, color, notes } = req.body;

  // 检查日程是否存在
  const existing = db.prepare('SELECT * FROM schedules WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: '日程不存在' });
  }

  // 检查时间冲突
  if (date && startTime && endTime) {
    const conflict = db.prepare(`
      SELECT id FROM schedules
      WHERE user_id = ? AND date = ? AND id != ?
      AND start_time < ? AND end_time > ?
    `).get(req.userId, date, id, endTime, startTime);

    if (conflict) {
      return res.status(409).json({ error: '时间冲突', reason: 'conflict' });
    }
  }

  try {
    db.prepare(`
      UPDATE schedules
      SET title = ?, date = ?, start_time = ?, end_time = ?, color = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      title || existing.title,
      date || existing.date,
      startTime || existing.start_time,
      endTime || existing.end_time,
      color || existing.color,
      notes !== undefined ? notes : existing.notes,
      id,
      req.userId
    );

    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
    res.json({ ok: true, schedule: formatSchedule(schedule) });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除日程
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM schedules WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: '日程不存在' });
  }

  db.prepare('DELETE FROM schedules WHERE id = ? AND user_id = ?').run(id, req.userId);
  res.json({ ok: true });
});

// 批量同步
router.post('/sync', (req, res) => {
  const { schedules } = req.body;

  if (!Array.isArray(schedules)) {
    return res.status(400).json({ error: 'schedules 必须是数组' });
  }

  if (schedules.length > 1000) {
    return res.status(400).json({ error: '单次同步不能超过 1000 条' });
  }

  // 验证每项数据
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const timeRe = /^\d{2}:\d{2}$/;
  for (let i = 0; i < schedules.length; i++) {
    const item = schedules[i];
    if (!item.id || !item.title || !item.date || !item.startTime || !item.endTime) {
      return res.status(400).json({ error: `第 ${i + 1} 条数据缺少必填字段（id/title/date/startTime/endTime）` });
    }
    if (!dateRe.test(item.date)) {
      return res.status(400).json({ error: `第 ${i + 1} 条日期格式错误，应为 YYYY-MM-DD` });
    }
    if (!timeRe.test(item.startTime) || !timeRe.test(item.endTime)) {
      return res.status(400).json({ error: `第 ${i + 1} 条时间格式错误，应为 HH:mm` });
    }
  }

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO schedules (id, user_id, title, date, start_time, end_time, color, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertStmt.run(
        item.id,
        req.userId,
        item.title,
        item.date,
        item.startTime,
        item.endTime,
        item.color || 'blue',
        item.notes || ''
      );
    }
  });

  try {
    insertMany(schedules);
    const rows = db.prepare('SELECT * FROM schedules WHERE user_id = ? ORDER BY date, start_time').all(req.userId);
    res.json({ ok: true, schedules: rows.map(formatSchedule) });
  } catch (err) {
    res.status(500).json({ error: '同步失败' });
  }
});

export default router;
