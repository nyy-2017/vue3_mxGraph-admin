// 角色管理接口（需 role:list 权限，写入操作需对应按钮权限）。
const express = require('express')
const router = express.Router()
const db = require('../db')
const { authenticate, authorize } = require('../middleware/auth')

// 列表
router.get('/', authorize('role:list'), function (req, res) {
  const list = db.all(
    `SELECT r.id, r.name, r.code, r.remark, r.created_at AS createdAt,
            (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS userCount
     FROM roles r ORDER BY r.id ASC`
  )
  res.json({ success: true, data: list })
})

// 角色拥有的菜单 id 列表
router.get('/:id/menus', authorize('role:menu'), function (req, res) {
  const ids = db.getRoleMenuIds(req.params.id)
  res.json({ success: true, data: ids })
})

// 新增角色
router.post('/', authorize('role:create'), function (req, res) {
  const { name, code, remark } = req.body || {}
  if (!name || !code) return res.status(400).json({ success: false, message: '角色名称与编码不能为空' })
  const exist = db.get('SELECT id FROM roles WHERE code = ?', [code])
  if (exist) return res.status(400).json({ success: false, message: '角色编码已存在' })
  const id = db.insert(
    'INSERT INTO roles(name,code,remark,created_at) VALUES(?,?,?,?)',
    [name, code, remark || '', db.nowStr()]
  )
  res.json({ success: true, message: '创建成功', data: { id } })
})

// 更新角色
router.put('/:id', authorize('role:update'), function (req, res) {
  const { name, remark } = req.body || {}
  const role = db.get('SELECT id FROM roles WHERE id = ?', [req.params.id])
  if (!role) return res.status(404).json({ success: false, message: '角色不存在' })
  const sets = []
  const params = []
  if (name !== undefined) { sets.push('name = ?'); params.push(name) }
  if (remark !== undefined) { sets.push('remark = ?'); params.push(remark) }
  params.push(req.params.id)
  db.run(`UPDATE roles SET ${sets.join(', ')} WHERE id = ?`, params)
  res.json({ success: true, message: '更新成功' })
})

// 分配菜单（覆盖式）
router.put('/:id/menus', authorize('role:menu'), function (req, res) {
  const id = req.params.id
  const role = db.get('SELECT id FROM roles WHERE id = ?', [id])
  if (!role) return res.status(404).json({ success: false, message: '角色不存在' })
  const menuIds = Array.isArray(req.body.menuIds) ? req.body.menuIds : []
  db.run('DELETE FROM role_menus WHERE role_id = ?', [id])
  menuIds.forEach((mid) => {
    db.insert('INSERT OR IGNORE INTO role_menus(role_id,menu_id) VALUES(?,?)', [id, mid])
  })
  res.json({ success: true, message: '菜单分配成功' })
})

// 删除角色
router.delete('/:id', authorize('role:delete'), function (req, res) {
  const id = req.params.id
  const role = db.get('SELECT code FROM roles WHERE id = ?', [id])
  if (!role) return res.status(404).json({ success: false, message: '角色不存在' })
  if (role.code === 'admin') {
    return res.status(400).json({ success: false, message: '内置超级管理员角色不可删除' })
  }
  const used = db.get('SELECT COUNT(*) AS c FROM users WHERE role_id = ?', [id])
  if (used && used.c > 0) {
    return res.status(400).json({ success: false, message: '仍有用户使用该角色，无法删除' })
  }
  db.run('DELETE FROM role_menus WHERE role_id = ?', [id])
  db.run('DELETE FROM roles WHERE id = ?', [id])
  res.json({ success: true, message: '删除成功' })
})

module.exports = router
