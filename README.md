# vue3_mxGraph

基于 **Vue3 + Vite + Pinia + Ant Design Vue + socket.io-client** 重构的 mxGraph 组态编辑器后台。

项目由原 `Vue_mxgraph_admin`（Vue2 + iView）按相同功能点重写为 Vue3 语法，并尽量优化渲染与交互以避免页面卡顿。

## 技术栈
- Vue 3（`<script setup>` / Options API 混合，编辑器核心保持框架无关）
- Vite 5
- Pinia（状态管理，替代原 Vuex）
- Ant Design Vue 4（UI 组件，替代原 iView / Element-UI）
- Vue Router 4
- socket.io-client（查看状态实时刷新，替代原原生 WebSocket）
- mxGraph 4（组态绘图核心，复用原 `graph/` 编辑器代码）

## 技术栈（后端 API）
- Express 5（HTTP 服务）
- **sql.js**（SQLite 编译为 WASM，纯 JS 实现，无需原生编译，数据落盘到 `server/data/app.db`）
- jsonwebtoken（JWT 登录令牌）
- bcryptjs（密码哈希）
- helmet（安全响应头）
- express-rate-limit（请求限流）

## 功能点
- **真实登录**：JWT 鉴权，密码 bcrypt 哈希，超级管理员默认账号 `admin / admin`
- **用户管理**：新增 / 编辑 / 删除用户、禁用启用、重置密码
- **角色管理**：角色 CRUD + 为角色分配菜单 / 按钮权限
- **菜单管理**：菜单（目录 / 菜单 / 按钮）树形 CRUD
- **操作日志**：采集所有 /api 请求（方法、路径、IP、操作人、参数、状态码）
- **布局**：侧边菜单由后端按角色动态下发，顶部用户、多标签
- 组态列表：新增 / 编辑 / 删除 TOPO 图
- 组态编辑器：基于 mxGraph 的完整绘图编辑器
- 查看状态：只读画布 + socket 实时刷新设备状态与图元换图
- 时间 / 时间范围等辅助页面

## 目录结构
```
vue3_mxGraph
├── index.html
├── vite.config.js
├── package.json
├── public/                # 静态资源（mxgraph / stencils / images / xmls）
├── server/                # Node 后端 API
│   ├── index.js           # 入口：helmet + 限流 + 认证 + 权限 + 日志 + SQLite
│   ├── config.js          # 密钥 / 限流 / JWT 过期等配置
│   ├── db/                # sql.js 初始化、建表、种子数据、查询封装
│   ├── middleware/        # auth（JWT+权限）、rateLimit、operationLog
│   └── routes/            # auth / users / roles / menus / logs / graphs
└── src
    ├── main.js
    ├── App.vue
    ├── api/               # axios 封装 + 接口（auth / system / graph）
    ├── bridge/            # 编辑器核心与 Vue3 的桥接层
    ├── stores/            # Pinia store（user / layout）
    ├── router/            # 路由 + 登录守卫
    ├── views/
    │   ├── index.vue      # 主框架布局
    │   ├── login.vue
    │   ├── layout/        # sidebar / ceiling / tabs
    │   ├── system/        # 用户 / 角色 / 菜单 / 操作日志管理页
    │   └── mxgraph/       # 组态相关页面 + graph/ 编辑器核心
    └── libs/ utils/       # 工具函数
```

## 开发
```bash
npm install
npm run dev      # 同时启动前端(8090) 与 后端(8081)
npm run build
```
> 默认超级管理员账号：**admin / admin**（首次启动自动写入 SQLite）。
> 默认 `JWT_SECRET` 请在 `server/config.js` 或环境变量中覆盖后再用于生产。

## 安全机制
- **JWT 登录**：登录成功后返回 `token`，前端存入 localStorage 并在每次请求通过 `Authorization: Bearer` 携带。
- **密码 bcrypt 哈希**：数据库仅存哈希值，登录用 `bcrypt.compare` 校验。
- **角色与菜单权限校验**：后端 `authenticate` 解析 JWT 并加载用户权限集合；`authorize(perm)` 中间件按接口权限拦截（超级管理员放行）；前端侧边栏与按钮按角色菜单动态展示。
- **请求限流**：全局每 IP 15 分钟 300 次；登录接口额外限流 10 次 / 15 分钟。
- **Helmet 安全头**：开启 CSP 之外的各类防护响应头。
- **操作日志采集**：`operationLog` 中间件在响应完成后落库，记录访问行为（密码等敏感字段脱敏）。

## 说明
- `src/views/mxgraph/graph/` 下的编辑器核心 JS 为框架无关的 mxGraph 封装（源自原项目），
  通过 `src/bridge/editorBridge.js` 提供的外观对象对接 Vue3，无需重写即可运行。
- 后端接口地址与 socket 地址（默认 `ws://192.168.25.41:7001/`）请按实际环境在 `vite.config.js` 代理与 `lookStatus.vue` 中调整。
