// 用户管理接口（需 user:list 权限，写入操作需对应按钮权限）。
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const db = require('../db')
const { authenticate, authorize, SECRETS } = require('../middleware/auth')

// 列表（分页 + 关键字搜索）
router.get('/', authorize('user:list'), function (req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 10))
  const keyword = (req.query.keyword || '').trim()
  const where = keyword ? "WHERE u.username LIKE ? OR u.nickname LIKE ?" : ''
  const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : []
  const totalRow = db.get(
    `SELECT COUNT(*) AS c FROM users u ${where}`,
    params
  )
  const list = db.all(
    `SELECT u.id, u.username, u.nickname, u.role_id AS roleId, r.name AS roleName,
            u.status, u.email, u.created_at AS createdAt
     FROM users u LEFT JOIN roles r ON r.id = u.role_id
     ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`,
    [...params, size, (page - 1) * size]
  )
  res.json({ success: true, data: list, total: totalRow ? totalRow.c : 0, page, size })
})

// 新增用户
router.post('/', authorize('user:create'), function (req, res) {
  const { username, nickname, roleId, email, password } = req.body || {}
  if (!username) return res.status(400).json({ success: false, message: '用户名不能为空' })
  const exist = db.getUserByUsername(username)
  if (exist) return res.status(400).json({ success: false, message: '用户名已存在' })
  const role = db.get('SELECT id FROM roles WHERE id = ?', [roleId])
  if (!role) return res.status(400).json({ success: false, message: '角色不存在' })
  const hash = bcrypt.hashSync(password || SECRETS.defaultPassword, SECRETS.bcryptRounds)
  const t = db.nowStr()
  const id = db.insert(
    'INSERT INTO users(username,password,nickname,role_id,status,email,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
    [username, hash, nickname || username, roleId, 1, email || '', t, t]
  )
  res.json({ success: true, message: '创建成功', data: { id } })
})

// 更新用户
router.put('/:id', authorize('user:update'), function (req, res) {
  const id = req.params.id
  const { nickname, roleId, email, status, password } = req.body || {}
  const user = db.getUserById(id)
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' })
  if (roleId) {
    const role = db.get('SELECT id FROM roles WHERE id = ?', [roleId])
    if (!role) return res.status(400).json({ success: false, message: '角色不存在' })
  }
  const sets = []
  const params = []
  if (nickname !== undefined) { sets.push('nickname = ?'); params.push(nickname) }
  if (roleId !== undefined) { sets.push('role_id = ?'); params.push(roleId) }
  if (email !== undefined) { sets.push('email = ?'); params.push(email) }
  if (status !== undefined) { sets.push('status = ?'); params.push(status ? 1 : 0) }
  if (password) { sets.push('password = ?'); params.push(bcrypt.hashSync(password, SECRETS.bcryptRounds)) }
  sets.push('updated_at = ?')
  params.push(db.nowStr())
  params.push(id)
  db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params)
  res.json({ success: true, message: '更新成功' })
})

// 删除用户
router.delete('/:id', authorize('user:delete'), function (req, res) {
  const id = req.params.id
  if (Number(id) === req.user.id) {
    return res.status(400).json({ success: false, message: '不能删除当前登录账号' })
  }
  const user = db.getUserById(id)
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' })
  if (user.username === 'admin') {
    return res.status(400).json({ success: false, message: '内置超级管理员不可删除' })
  }
  db.run('DELETE FROM users WHERE id = ?', [id])
  res.json({ success: true, message: '删除成功' })
})

// 重置密码为默认密码
router.post('/:id/reset-password', authorize('user:reset'), function (req, res) {
  const id = req.params.id
  const user = db.getUserById(id)
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' })
  const hash = bcrypt.hashSync(SECRETS.defaultPassword, SECRETS.bcryptRounds)
  db.run('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [hash, db.nowStr(), id])
  res.json({ success: true, message: `密码已重置为 ${SECRETS.defaultPassword}` })
})

module.exports = router
