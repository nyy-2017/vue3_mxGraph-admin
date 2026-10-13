import http from './http'

// 后端接口统一挂在 /api 下（见 vue_mxgraph_admin 的 build/dev-server.js: app.use('/api', apiRouter)），
// http 实例默认 baseURL 为 '/api'，所以这里 url 用相对路径即可。
export default {
  // 后端基础路径（编辑器核心 graph/*.js 中通过 window.SAVE_URL 使用）
  url: '/graphs/',
  // 查询列表
  list() {
    return http({ url: '/list_All', method: 'get' })
  },
  // 编辑组态详情
  detail(id) {
    return http({ url: `/detail_Graph/${id}`, method: 'get' })
  },
  // 新建
  create(data) {
    return http({ url: this.url, method: 'post', data })
  },
  // 修改
  update(data) {
    return http({ url: this.url, method: 'put', data })
  },
  // 删除
  delete(id) {
    return http({ url: `/delete_Graph/${id}`, method: 'delete' })
  }
}
