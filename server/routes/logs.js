// 操作日志接口（需 log:list 权限）。
const express = require('express')
const router = express.Router()
const db = require('../db')
const { authenticate, authorize } = require('../middleware/auth')

// 列表（分页 + 过滤）
router.get('/', authorize('log:list'), function (req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const size = Math.min(200, Math.max(1, parseInt(req.query.size) || 10))
  const username = (req.query.username || '').trim()
  const action = (req.query.action || '').trim()
  const where = []
  const params = []
  if (username) { where.push('username LIKE ?'); params.push(`%${username}%`) }
  if (action) { where.push('action = ?'); params.push(action) }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const totalRow = db.get(`SELECT COUNT(*) AS c FROM operation_logs ${whereSql}`, params)
  const list = db.all(
    `SELECT id, username, action, method, path, ip, status, created_at AS createdAt
     FROM operation_logs ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, size, (page - 1) * size]
  )
  res.json({ success: true, data: list, total: totalRow ? totalRow.c : 0, page, size })
})

module.exports = router
