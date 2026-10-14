// 操作日志采集中间件：记录所有 /api 请求的访问情况（方法、路径、IP、操作人、参数、状态码）。
// 在响应 finish 时落库，避免阻塞业务处理。登录接口的账号名从 body 中取。
const db = require('../db')

function clientIp(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    ''
  )
}

// 脱敏：避免把密码等敏感字段写入日志
function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const clone = Array.isArray(obj) ? [] : {}
  Object.keys(obj).forEach((k) => {
    const lower = String(k).toLowerCase()
    if (lower.includes('password') || lower.includes('pwd') || lower.includes('token')) {
      clone[k] = '******'
    } else {
      clone[k] = obj[k]
    }
  })
  return clone
}

function operationLog(req, res, next) {
  // 健康检查与静态资源不记录
  if (req.path === '/api/health') return next()

  const start = Date.now()
  res.on('finish', () => {
    try {
      const username = (req.user && req.user.username) || (req.body && req.body.username) || 'anonymous'
      const action = inferAction(req)
      const params = JSON.stringify({
        query: sanitize(req.query),
        body: sanitize(req.body)
      })
      db.run(
        'INSERT INTO operation_logs(user_id,username,action,method,path,ip,params,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)',
        [
          req.user ? req.user.id : null,
          username,
          action,
          req.method,
          req.path,
          clientIp(req),
          params,
          res.statusCode,
          db.nowStr()
        ]
      )
    } catch (e) {
      // 日志失败不影响主流程
    }
  })
  next()
}

function inferAction(req) {
  const map = {
    POST: '新增/创建',
    PUT: '更新',
    DELETE: '删除',
    GET: '查询'
  }
  if (req.path.includes('/login')) return '登录'
  if (req.path.includes('/password')) return '修改密码'
  return map[req.method] || req.method
}

module.exports = { operationLog }
