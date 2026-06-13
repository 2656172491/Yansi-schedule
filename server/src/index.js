import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './auth.js';
import schedulesRouter from './schedules.js';
import templatesRouter from './templates.js';
import palettesRouter from './palettes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 白名单
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:1420'];

app.use(cors({
  origin(origin, callback) {
    // 允许无 origin 的请求（如 curl、Tauri 本地）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 不允许的来源'));
    }
  },
  credentials: true,
}));

// 请求体限制 1MB
app.use(express.json({ limit: '1mb' }));

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
  if (err.message === 'CORS 不允许的来源') {
    return res.status(403).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
