import express from 'express';
import cors from 'cors';
import authRouter from './auth.js';
import schedulesRouter from './schedules.js';
import templatesRouter from './templates.js';
import palettesRouter from './palettes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/palettes', palettesRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
