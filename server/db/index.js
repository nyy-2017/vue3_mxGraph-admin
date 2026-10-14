// SQLite 数据访问层（基于 sql.js：SQLite 编译为 WASM，纯 JS 实现，无需原生编译）。
// 数据持久化：所有写操作执行后，将整个数据库二进制导出并写回 server/data/app.db。
// 适合中小规模后台管理系统；兼顾了"SQLite 本地持久化"与跨平台免编译。
const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')
const bcrypt = require('bcryptjs')
const { SECRETS } = require('../config')

const DATA_DIR = path.resolve(__dirname, '../data')
const DB_FILE = path.resolve(DATA_DIR, 'app.db')
const WASM_DIR = path.resolve(__dirname, '../../node_modules/sql.js/dist')

let SQL = null
let db = null

/* ----------------------------- 底层操作封装 ----------------------------- */
function persist() {
  if (!db) return
  const data = db.export()
  fs.writeFileSync(DB_FILE, Buffer.from(data))
}

function run(sql, params = []) {
  db.run(sql, params)
  persist()
}

function all(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function get(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  let row = null
  if (stmt.step()) row = stmt.getAsObject()
  stmt.free()
  return row
}

function insert(sql, params = []) {
  db.run(sql, params)
  // 必须在 persist()（db.export）之前读取自增 id，export 会重置 last_insert_rowid
  const res = db.exec('SELECT last_insert_rowid() AS id')
  const id = res.length ? res[0].values[0][0] : null
  persist()
  return id
}

function nowStr() {
  return new Date(+new Date(new Date().toJSON()) + 8 * 3600 * 1000)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z/, '')
}

/* ------------------------------- 建表 ------------------------------- */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT,
  role_id INTEGER,
  status INTEGER DEFAULT 1,
  email TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY(role_id) REFERENCES roles(id)
);
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  remark TEXT,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  path TEXT,
  component TEXT,
  icon TEXT,
  sort INTEGER DEFAULT 0,
  permission TEXT,
  type INTEGER DEFAULT 1,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS role_menus (
  role_id INTEGER,
  menu_id INTEGER,
  PRIMARY KEY(role_id, menu_id),
  FOREIGN KEY(role_id) REFERENCES roles(id),
  FOREIGN KEY(menu_id) REFERENCES menus(id)
);
CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  action TEXT,
  method TEXT,
  path TEXT,
  ip TEXT,
  params TEXT,
  status INTEGER,
  created_at TEXT
);
`

/* ------------------------------- 种子数据 ------------------------------- */
function seed() {
  const u = get('SELECT COUNT(*) AS c FROM users')
  if (u && u.c > 0) return

  // 角色
  const adminRoleId = insert(
    'INSERT INTO roles(name,code,remark,created_at) VALUES(?,?,?,?)',
    ['超级管理员', 'admin', '系统内置超级管理员，拥有全部权限', nowStr()]
  )
  const operatorRoleId = insert(
    'INSERT INTO roles(name,code,remark,created_at) VALUES(?,?,?,?)',
    ['操作员', 'operator', '仅可查看组态与操作日志', nowStr()]
  )

  // 菜单（目录/菜单）
  const menuSeed = [
    { key: 'home', parent: 0, name: 'home', title: '首页', path: '/home', component: 'home', icon: 'HomeOutlined', sort: 1, permission: 'home:view', type: 1 },
    { key: 'graphs', parent: 0, name: 'Graphs', title: '组态管理', path: '', component: '', icon: 'AppstoreOutlined', sort: 2, permission: 'graph:view', type: 1 },
    { key: 'dt', parent: 'graphs', name: 'dateTime', title: '当前时间', path: 'dateTime', icon: 'ClockCircleOutlined', sort: 1, permission: 'graph:view', type: 1 },
    { key: 'dr', parent: 'graphs', name: 'dateRange', title: '时间范围', path: 'dateRange', icon: 'FieldTimeOutlined', sort: 2, permission: 'graph:view', type: 1 },
    { key: 'av', parent: 'graphs', name: 'appView', title: '组态列表一', path: 'appView', icon: 'ApartmentOutlined', sort: 3, permission: 'graph:view', type: 1 },
    { key: 'gl', parent: 'graphs', name: 'graph_list', title: '组态列表二', path: 'graphList', icon: 'UnorderedListOutlined', sort: 4, permission: 'graph:manage', type: 1 },
    { key: 'ls', parent: 'graphs', name: 'lookStatus', title: '查看状态', path: 'lookStatus', icon: 'EyeOutlined', sort: 5, permission: 'graph:view', type: 1 },
    { key: 'sys', parent: 0, name: 'System', title: '系统管理', path: '', component: '', icon: 'SettingOutlined', sort: 9, permission: 'system:view', type: 1 },
    { key: 'user', parent: 'sys', name: 'system_user', title: '用户管理', path: '/system/user', icon: 'UserOutlined', sort: 1, permission: 'user:list', type: 1 },
    { key: 'role', parent: 'sys', name: 'system_role', title: '角色管理', path: '/system/role', icon: 'TeamOutlined', sort: 2, permission: 'role:list', type: 1 },
    { key: 'menu', parent: 'sys', name: 'system_menu', title: '菜单管理', path: '/system/menu', icon: 'MenuOutlined', sort: 3, permission: 'menu:list', type: 1 },
    { key: 'log', parent: 'sys', name: 'system_log', title: '操作日志', path: '/system/log', icon: 'FileSearchOutlined', sort: 4, permission: 'log:list', type: 1 }
  ]
  // 按钮级权限（type=2，仅用于接口鉴权，不在侧边栏展示）
  const btnSeed = [
    { parent: 'user', name: 'user_create', title: '新增用户', permission: 'user:create', type: 2 },
    { parent: 'user', name: 'user_update', title: '编辑用户', permission: 'user:update', type: 2 },
    { parent: 'user', name: 'user_delete', title: '删除用户', permission: 'user:delete', type: 2 },
    { parent: 'user', name: 'user_reset', title: '重置密码', permission: 'user:reset', type: 2 },
    { parent: 'role', name: 'role_create', title: '新增角色', permission: 'role:create', type: 2 },
    { parent: 'role', name: 'role_update', title: '编辑角色', permission: 'role:update', type: 2 },
    { parent: 'role', name: 'role_delete', title: '删除角色', permission: 'role:delete', type: 2 },
    { parent: 'role', name: 'role_menu', title: '分配菜单', permission: 'role:menu', type: 2 },
    { parent: 'menu', name: 'menu_create', title: '新增菜单', permission: 'menu:create', type: 2 },
    { parent: 'menu', name: 'menu_update', title: '编辑菜单', permission: 'menu:update', type: 2 },
    { parent: 'menu', name: 'menu_delete', title: '删除菜单', permission: 'menu:delete', type: 2 }
  ]

  const keyToId = {}
  menuSeed.forEach((m) => {
    keyToId[m.key] = insert(
      'INSERT INTO menus(parent_id,name,title,path,component,icon,sort,permission,type,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      [0, m.name, m.title, m.path || '', m.component || '', m.icon, m.sort, m.permission, m.type, nowStr()]
    )
  })
  // 处理父子关系
  menuSeed.forEach((m) => {
    if (m.parent && keyToId[m.parent]) {
      run('UPDATE menus SET parent_id = ? WHERE id = ?', [keyToId[m.parent], keyToId[m.key]])
    }
  })
  // 按钮挂到对应父菜单下
  btnSeed.forEach((b) => {
    if (keyToId[b.parent]) {
      insert(
        'INSERT INTO menus(parent_id,name,title,path,component,icon,sort,permission,type,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
        [keyToId[b.parent], b.name, b.title, '', '', '', 0, b.permission, b.type, nowStr()]
      )
    }
  })

  // 超级管理员：拥有全部菜单
  const allMenuIds = all('SELECT id FROM menus').map((r) => r.id)
  allMenuIds.forEach((id) => {
    insert('INSERT OR IGNORE INTO role_menus(role_id,menu_id) VALUES(?,?)', [adminRoleId, id])
  })

  // 操作员：首页 + 组态管理 + 操作日志（仅查看）
  const operatorMenuKeys = ['home', 'graphs', 'dt', 'dr', 'av', 'gl', 'ls', 'sys', 'log']
  operatorMenuKeys.forEach((k) => {
    if (keyToId[k]) insert('INSERT OR IGNORE INTO role_menus(role_id,menu_id) VALUES(?,?)', [operatorRoleId, keyToId[k]])
  })

  // 用户：超级管理员 admin / admin
  const adminHash = bcrypt.hashSync('admin', SECRETS.bcryptRounds)
  insert(
    'INSERT INTO users(username,password,nickname,role_id,status,email,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
    ['admin', adminHash, '超级管理员', adminRoleId, 1, 'admin@mxgraph.local', nowStr(), nowStr()]
  )
  // 演示用的操作员账号 operator / operator123
  const opHash = bcrypt.hashSync('operator123', SECRETS.bcryptRounds)
  insert(
    'INSERT INTO users(username,password,nickname,role_id,status,email,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
    ['operator', opHash, '操作员', operatorRoleId, 1, 'operator@mxgraph.local', nowStr(), nowStr()]
  )
}

/* ------------------------------- 业务查询 ------------------------------- */
function getUserByUsername(username) {
  return get('SELECT * FROM users WHERE username = ?', [username])
}

function getUserById(id) {
  return get('SELECT * FROM users WHERE id = ?', [id])
}

function getRoleMenuIds(roleId) {
  return all('SELECT menu_id FROM role_menus WHERE role_id = ?', [roleId]).map((r) => r.menu_id)
}

function getAllMenus() {
  return all(
    'SELECT id, parent_id AS parentId, name, title, path, component, icon, sort, permission, type FROM menus ORDER BY sort ASC, id ASC'
  )
}

// 将菜单列表按 ids 过滤并组装成树
function buildMenuTree(menus, ids) {
  const list = menus.filter((m) => ids.includes(m.id))
  const map = {}
  list.forEach((m) => {
    map[m.id] = { ...m, children: [] }
  })
  const tree = []
  list.forEach((m) => {
    if (m.parentId && map[m.parentId]) {
      map[m.parentId].children.push(map[m.id])
    } else {
      tree.push(map[m.id])
    }
  })
  return tree
}

// 当前用户可见菜单树（含按钮级 type=2）
function getUserMenuTree(roleId) {
  const ids = getRoleMenuIds(roleId)
  return buildMenuTree(getAllMenus(), ids)
}

// 当前用户权限字符串集合
function getUserPermissions(roleId) {
  const ids = getRoleMenuIds(roleId)
  const menus = getAllMenus().filter((m) => ids.includes(m.id) && m.permission)
  return menus.map((m) => m.permission)
}

/* ------------------------------- 初始化 ------------------------------- */
async function init() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  SQL = await initSqlJs({ locateFile: (file) => path.join(WASM_DIR, file) })
  if (fs.existsSync(DB_FILE)) {
    const buf = fs.readFileSync(DB_FILE)
    db = new SQL.Database(buf)
  } else {
    db = new SQL.Database()
  }
  db.run(SCHEMA)
  seed()
  persist()
}

module.exports = {
  init,
  run,
  all,
  get,
  insert,
  nowStr,
  getUserByUsername,
  getUserById,
  getUserMenuTree,
  getUserPermissions,
  getRoleMenuIds,
  getAllMenus
}
