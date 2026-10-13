import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: '',
    userName: '',
    loginTime: '',
    token: ''
  }),
  getters: {
    isLogin: (state) => !!state.token
  },
  actions: {
    setUser({ userId, userName, loginTime, token }) {
      if (userId) this.userId = userId
      if (userName) this.userName = userName
      if (loginTime) this.loginTime = loginTime
      if (token) this.token = token
    },
    logout() {
      this.$reset()
      localStorage.clear()
      sessionStorage.clear()
    }
  }
})
