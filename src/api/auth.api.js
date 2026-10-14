import http from './http'

// 认证相关接口（baseURL 为 /api，见 http.js）
export default {
  // 登录：仅返回 { token, user }，菜单与权限请调用 me() 获取
  login(data) {
    return http({ url: '/auth/login', method: 'post', data })
  },
  // 获取当前登录用户：返回 { user, menus, permissions }
  me() {
    return http({ url: '/auth/me', method: 'get' })
  },
  // 修改密码
  changePassword(data) {
    return http({ url: '/auth/password', method: 'post', data })
  }
}
