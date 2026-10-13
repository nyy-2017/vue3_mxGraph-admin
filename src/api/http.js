import axios from 'axios'
import { message, notification } from 'ant-design-vue'
import { useUserStore } from '../stores/user'

const service = axios.create({
  baseURL: '/api',
  timeout: 30000
})

service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    config.headers['Content-Type'] = 'application/json'
    return config
  },
  (err) => Promise.reject(err)
)

service.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      const msg = data && data.message ? data.message : data && data.msg ? data.msg : '请求失败'
      if (status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        message.error('登录已失效，请重新登录')
      } else if (status === 403) {
        message.error('没有操作权限')
      } else if (status === 500) {
        notification.error({ message: '服务器出了小问题' })
      } else {
        message.error(msg)
      }
    }
    return Promise.reject(error)
  }
)

export default service
