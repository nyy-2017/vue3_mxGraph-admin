// 认证相关接口：登录、获取当前用户信息（含菜单与权限）、修改密码。
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { authenticate, authorize, SECRETS } = require('../middleware/auth')

// 登录
router.post('/login', function (req, res) {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
  }
  const user = db.getUserByUsername(username)
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' })
  }
  if (user.status === 0) {
    return res.status(403).json({ success: false, message: '账号已被禁用，请联系管理员' })
  }
  const ok = bcrypt.compareSync(password, user.password)
  if (!ok) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' })
  }
  const role = db.get('SELECT id, name, code FROM roles WHERE id = ?', [user.role_id])
  const token = jwt.sign(
    { sub: user.id, username: user.username, roleId: user.role_id, roleCode: role ? role.code : '' },
    SECRETS.jwtSecret,
    { expiresIn: SECRETS.jwtExpiresIn }
  )
  // 登录仅返回用户身份与令牌；菜单与权限由 /auth/me 单独提供
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      roleId: user.role_id,
      roleCode: role ? role.code : '',
      roleName: role ? role.name : ''
    }
  })
})

// 获取当前登录用户信息（需认证）
router.get('/me', authenticate, function (req, res) {
  const user = db.getUserById(req.user.id)
  if (!user) return res.status(401).json({ success: false, message: '账号不存在' })
  const role = db.get('SELECT id, name, code FROM roles WHERE id = ?', [user.role_id])
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      roleId: user.role_id,
      roleCode: role ? role.code : '',
      roleName: role ? role.name : ''
    },
    menus: db.getUserMenuTree(user.role_id),
    permissions: db.getUserPermissions(user.role_id)
  })
})

// 修改密码（需认证）
router.post('/password', authenticate, function (req, res) {
  const { oldPassword, newPassword } = req.body || {}
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '原密码和新密码不能为空' })
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ success: false, message: '新密码至少 6 位' })
  }
  const user = db.getUserById(req.user.id)
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({ success: false, message: '原密码不正确' })
  }
  const hash = bcrypt.hashSync(newPassword, SECRETS.bcryptRounds)
  db.run('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [hash, db.nowStr(), user.id])
  res.json({ success: true, message: '密码修改成功，请重新登录' })
})

module.exports = router
