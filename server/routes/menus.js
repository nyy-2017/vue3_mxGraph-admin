// 菜单管理接口（需 menu:list 权限，写入操作需对应按钮权限）。
const express = require('express')
const router = express.Router()
const db = require('../db')
const { authenticate, authorize } = require('../middleware/auth')

// 菜单树（含全部类型：目录/菜单/按钮）
router.get('/', authorize('menu:list'), function (req, res) {
  const menus = db.getAllMenus()
  // 组装完整树（管理页展示全部菜单，含按钮级 type=2，不限角色）
  const list = menus.map((m) => ({ ...m, children: [] }))
  const map = {}
  list.forEach((m) => { map[m.id] = m })
  const root = []
  list.forEach((m) => {
    if (m.parentId && map[m.parentId]) map[m.parentId].children.push(m)
    else root.push(m)
  })
  res.json({ success: true, data: root })
})

// 新增菜单
router.post('/', authorize('menu:create'), function (req, res) {
  const { parentId, name, title, path, component, icon, sort, permission, type } = req.body || {}
  if (!name || !title) return res.status(400).json({ success: false, message: '菜单标识与名称不能为空' })
  const id = db.insert(
    `INSERT INTO menus(parent_id,name,title,path,component,icon,sort,permission,type,created_at)
     VALUES(?,?,?,?,?,?,?,?,?,?)`,
    [
      parentId || 0,
      name,
      title,
      path || '',
      component || '',
      icon || '',
      sort || 0,
      permission || '',
      type || 1,
      db.nowStr()
    ]
  )
  res.json({ success: true, message: '创建成功', data: { id } })
})

// 更新菜单
router.put('/:id', authorize('menu:update'), function (req, res) {
  const id = req.params.id
  const { parentId, name, title, path, component, icon, sort, permission, type } = req.body || {}
  const menu = db.get('SELECT id FROM menus WHERE id = ?', [id])
  if (!menu) return res.status(404).json({ success: false, message: '菜单不存在' })
  const sets = []
  const params = []
  const set = (col, val) => { if (val !== undefined) { sets.push(`${col} = ?`); params.push(val) } }
  set('parent_id', parentId)
  set('name', name)
  set('title', title)
  set('path', path)
  set('component', component)
  set('icon', icon)
  set('sort', sort)
  set('permission', permission)
  set('type', type)
  // 防止自己挂到自己或自己子节点下（简单保护）
  if (parentId && Number(parentId) === Number(id)) {
    return res.status(400).json({ success: false, message: '父级菜单不能是自身' })
  }
  params.push(id)
  db.run(`UPDATE menus SET ${sets.join(', ')} WHERE id = ?`, params)
  res.json({ success: true, message: '更新成功' })
})

// 删除菜单（级联删除子菜单与角色关联）
router.delete('/:id', authorize('menu:delete'), function (req, res) {
  const id = req.params.id
  const menu = db.get('SELECT id FROM menus WHERE id = ?', [id])
  if (!menu) return res.status(404).json({ success: false, message: '菜单不存在' })
  const all = db.getAllMenus()
  const toDelete = new Set([Number(id)])
  let changed = true
  while (changed) {
    changed = false
    all.forEach((m) => {
      if (toDelete.has(m.parentId) && !toDelete.has(m.id)) {
        toDelete.add(m.id)
        changed = true
      }
    })
  }
  toDelete.forEach((mid) => {
    db.run('DELETE FROM role_menus WHERE menu_id = ?', [mid])
    db.run('DELETE FROM menus WHERE id = ?', [mid])
  })
  res.json({ success: true, message: '删除成功' })
})

module.exports = router
