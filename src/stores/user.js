import { defineStore } from 'pinia'

const STORAGE_KEY = 'mx_user'

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: () => {
    const saved = loadPersisted()
    return {
      id: saved?.id || '',
      userId: saved?.id || '',
      userName: saved?.userName || '',
      nickname: saved?.nickname || '',
      email: saved?.email || '',
      roleId: saved?.roleId || null,
      roleCode: saved?.roleCode || '',
      roleName: saved?.roleName || '',
      // 权限标识集合（如 ['user:list','user:create', ...]），超级管理员前端也按全量处理
      permissions: saved?.permissions || [],
      // 当前角色可见菜单树（含 type=1 菜单与 type=2 按钮）
      menus: saved?.menus || [],
      token: saved?.token || ''
    }
  },
  getters: {
    isLogin: (state) => !!state.token,
    // 权限判断：超级管理员直接放行
    hasPerm: (state) => (perm) =>
      state.roleCode === 'admin' || (perm ? state.permissions.includes(perm) : true)
  },
  actions: {
    // 登录成功后写入：{ token, user }（菜单/权限由 setProfile 从 /me 同步）
    setAuth(payload) {
      this.token = payload.token
      const u = payload.user || {}
      this.id = u.id
      this.userId = u.id
      this.userName = u.username
      this.nickname = u.nickname || u.username
      this.email = u.email || ''
      this.roleId = u.roleId
      this.roleCode = u.roleCode
      this.roleName = u.roleName
      this.menus = payload.menus || []
      this.permissions = payload.permissions || []
      this.persist()
    },
    // 拉取 /me 后同步资料与菜单
    setProfile(payload) {
      const u = payload.user || {}
      this.nickname = u.nickname || this.nickname
      this.email = u.email || this.email
      this.menus = payload.menus || this.menus
      this.permissions = payload.permissions || this.permissions
      this.persist()
    },
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          id: this.id,
          userName: this.userName,
          nickname: this.nickname,
          email: this.email,
          roleId: this.roleId,
          roleCode: this.roleCode,
          roleName: this.roleName,
          permissions: this.permissions,
          menus: this.menus,
          token: this.token
        })
      )
    },
    logout() {
      this.$reset()
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.clear()
    }
  }
})
