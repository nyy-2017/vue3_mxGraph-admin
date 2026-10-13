// 轻量 Express 后端：仅提供 /api 接口（TOPO 图的增删改查，以 XML 文件存储）。
// 端口 8081 必须与 vite.config.js 中的 API_PORT 保持一致（前端 Vite 在 8090）。
// 正常情况下无需单独启动：运行 `npm run dev` 会一并拉起本服务。
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' })); // 传输/上传内容较大，放宽到 10MB

const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// 健康检查
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log('> Backend API listening at http://localhost:' + PORT + '  (mounted at /api)');
});
