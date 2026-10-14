// 后端入口：Express + Helmet 安全头 + 请求限流 + JWT 认证 + 角色菜单权限 +
// 操作日志采集 + SQLite 持久化（sql.js）。端口 8081，必须与前端的 API_PORT 一致。
const express = require('express')
const helmet = require('helmet')
const path = require('path')

const db = require('./db')
const { globalLimiter, loginLimiter } = require('./middleware/rateLimit')
const { operationLog } = require('./middleware/operationLog')
const { authenticate } = require('./middleware/auth')

const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const rolesRouter = require('./routes/roles')
const menusRouter = require('./routes/menus')
const logsRouter = require('./routes/logs')
const graphsRouter = require('./routes/graphs')

const app = express()
// Helmet 安全头（关闭默认 CSP / COEP 以兼容前端内联脚本与 mxgraph，其它安全头全部开启）
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
)
app.use(express.json({ limit: '10mb' }))

// 全局请求限流
app.use('/api', globalLimiter)
// 操作日志采集（在认证之前注册，可覆盖登录接口；认证后能从 token 拿到操作用户）
app.use('/api', operationLog)

// 健康检查（公开）
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// 登录接口（公开，但单独限流防爆破）；authRouter 内部已定义 /login、/me、/password
app.post('/api/auth/login', loginLimiter)
app.use('/api/auth', authRouter)

// 以下所有 /api 接口均需登录
app.use('/api', authenticate)
app.use('/api/users', usersRouter)
app.use('/api/roles', rolesRouter)
app.use('/api/menus', menusRouter)
app.use('/api/logs', logsRouter)
app.use('/api', graphsRouter)

// 404
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' })
})

// 统一错误兜底
app.use((err, req, res, next) => {
  console.error('[API ERROR]', err)
  res.status(500).json({ success: false, message: '服务器内部错误' })
})

const PORT = process.env.PORT || 8081

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log('> Backend API listening at http://localhost:' + PORT + '  (mounted at /api)')
      console.log('> SQLite 数据库: ' + path.resolve(__dirname, 'data/app.db'))
    })
  })
  .catch((e) => {
    console.error('数据库初始化失败:', e)
    process.exit(1)
  })
