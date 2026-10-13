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

## 功能点
- 登录 / 布局（侧边菜单、顶部用户、多标签）
- 组态列表：新增 / 编辑 / 删除 TOPO 图
- 组态编辑器：基于 mxGraph 的完整绘图编辑器（工具栏、侧边栏、图层、导入导出、自动布局、绑定设备/设备类型等）
- 查看状态：只读画布 + socket 实时刷新设备状态与图元换图
- 时间 / 时间范围 / 权限树等辅助页面

## 目录结构
```
vue3_mxGraph
├── index.html
├── vite.config.js
├── package.json
├── public/                # 静态资源（mxgraph / stencils / images / xmls）
└── src
    ├── main.js
    ├── App.vue
    ├── api/               # axios 封装 + 接口
    ├── bridge/            # 编辑器核心与 Vue3 的桥接层（替代 Vue2 事件总线）
    ├── stores/            # Pinia store
    ├── router/            # 路由 + 导航辅助
    ├── views/
    │   ├── index.vue      # 主框架布局
    │   ├── login.vue
    │   ├── layout/        # sidebar / ceiling / tabs
    │   └── mxgraph/       # 组态相关页面 + graph/ 编辑器核心 + resources/ + styles/
    └── libs/ utils/       # 工具函数
```

## 开发
```bash
npm install
npm run dev      # http://localhost:8080
npm run build
```

## 说明
- `src/views/mxgraph/graph/` 下的编辑器核心 JS 为框架无关的 mxGraph 封装（源自原项目），
  通过 `src/bridge/editorBridge.js` 提供的外观对象对接 Vue3（替代原 `vm.$on/$emit/$refs`），无需重写即可运行。
- 后端接口地址与 socket 地址（默认 `ws://192.168.25.41:7001/`）请按实际环境在 `vite.config.js` 代理与 `lookStatus.vue` 中调整。
