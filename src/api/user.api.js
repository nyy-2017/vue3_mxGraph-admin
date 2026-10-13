import http from './http'

export default {
  url: '/users/',
  list(params) {
    return http({ url: this.url + 'all', method: 'get', params })
  },
  login(data) {
    return http({ url: '/authenticate', method: 'post', data })
  },
  getUserInfo() {
    return http({ url: '/account', method: 'get' })
  }
}
