// 认证与鉴权中间件：JWT 校验 + 基于角色的菜单权限校验。
const jwt = require('jsonwebtoken')
const db = require('../db')
const { SECRETS } = require('../config')

// 从请求头解析 Bearer Token
function extractToken(req) {
  const header = req.headers['authorization'] || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

// 认证中间件：校验 JWT 并挂载 req.user（含角色与权限集合）
function authenticate(req, res, next) {
  const token = extractToken(req)
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录或登录已失效' })
  }
  let payload
  try {
    payload = jwt.verify(token, SECRETS.jwtSecret)
  } catch (e) {
    return res.status(401).json({ success: false, message: '登录已失效，请重新登录' })
  }
  const user = db.getUserById(payload.sub)
  if (!user) {
    return res.status(401).json({ success: false, message: '账号不存在' })
  }
  if (user.status === 0) {
    return res.status(403).json({ success: false, message: '账号已被禁用' })
  }
  const role = db.get('SELECT id, name, code FROM roles WHERE id = ?', [user.role_id])
  req.user = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    roleId: user.role_id,
    roleCode: role ? role.code : '',
    roleName: role ? role.name : '',
    permissions: db.getUserPermissions(user.role_id)
  }
  next()
}

// 鉴权中间件工厂：校验指定权限（超级管理员 admin 直接放行）
function authorize(permission) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: '未登录' })
    if (req.user.roleCode === 'admin') return next()
    if (permission && req.user.permissions.includes(permission)) return next()
    return res.status(403).json({ success: false, message: '无操作权限' })
  }
}

module.exports = { authenticate, authorize, SECRETS }
