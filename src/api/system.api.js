import http from './http'

// 系统管理接口：用户、角色、菜单、操作日志
const user = {
  list(params) {
    return http({ url: '/users', method: 'get', params })
  },
  create(data) {
    return http({ url: '/users', method: 'post', data })
  },
  update(id, data) {
    return http({ url: `/users/${id}`, method: 'put', data })
  },
  remove(id) {
    return http({ url: `/users/${id}`, method: 'delete' })
  },
  resetPassword(id) {
    return http({ url: `/users/${id}/reset-password`, method: 'post' })
  }
}

const role = {
  list() {
    return http({ url: '/roles', method: 'get' })
  },
  create(data) {
    return http({ url: '/roles', method: 'post', data })
  },
  update(id, data) {
    return http({ url: `/roles/${id}`, method: 'put', data })
  },
  remove(id) {
    return http({ url: `/roles/${id}`, method: 'delete' })
  },
  menus(id) {
    return http({ url: `/roles/${id}/menus`, method: 'get' })
  },
  saveMenus(id, menuIds) {
    return http({ url: `/roles/${id}/menus`, method: 'put', data: { menuIds } })
  }
}

const menu = {
  tree() {
    return http({ url: '/menus', method: 'get' })
  },
  create(data) {
    return http({ url: '/menus', method: 'post', data })
  },
  update(id, data) {
    return http({ url: `/menus/${id}`, method: 'put', data })
  },
  remove(id) {
    return http({ url: `/menus/${id}`, method: 'delete' })
  }
}

const log = {
  list(params) {
    return http({ url: '/logs', method: 'get', params })
  }
}

export default { user, role, menu, log }
