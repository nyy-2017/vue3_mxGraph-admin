import http from './http'

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
    return http({ url: `delete_Graph/${id}`, method: 'delete' })
  }
}
