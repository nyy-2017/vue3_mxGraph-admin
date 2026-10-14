import { defineStore } from 'pinia'
import { appRouter } from '../router'

// 仅保留 type=1 的菜单用于侧边栏（按钮级 type=2 仅用于接口鉴权）
function filterMenuTree(menus) {
  return (menus || [])
    .filter((m) => m.type === 1)
    .map((m) => ({
      ...m,
      children: m.children && m.children.length ? filterMenuTree(m.children) : undefined
    }))
}

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    ready: false,
    // 侧边栏菜单：来自后端（按角色过滤），不再是前端静态路由
    menuList: [],
    openedTabs: [],
    currentPath: [],
    // 顶部栏展示的当前页面标题
    currentTitle: ''
  }),
  getters: {
    sidebarMenuList: (state) => state.menuList,
    openedTabList: (state) => state.openedTabs
  },
  actions: {
    // 登录后 / 刷新还原时，用后端菜单树构建侧边栏
    setMenus(menus) {
      this.menuList = filterMenuTree(menus)
      this.ready = true
      if (!this.openedTabs.length) {
        const home = this.menuList.find((m) => m.name === 'home')
        this.openedTabs = home ? [home] : this.menuList.length ? [this.menuList[0]] : []
      }
    },
    setCurrentPath(name) {
      const path = []
      this.menuList.forEach((menu) => {
        if (!menu.children && menu.name === name) {
          path.push({ title: menu.title, name: menu.name, path: menu.path })
        } else if (menu.children) {
          const child = menu.children.find((c) => c.name === name)
          if (child) {
            path.push({ title: menu.title, name: menu.name, path: '' })
            path.push({ title: child.title, name: child.name, path: child.path })
          }
        }
      })
      this.currentPath = path
    },
    openTab(name) {
      const existed = this.openedTabs.some((t) => t.name === name)
      // 用原始 appRouter 查找（含 meta.hidden 的页面，如 graph详情页），hidden 只影响侧边栏
      const tab = appRouter
        .flatMap((m) => (m.children ? m.children : [m]))
        .find((t) => t.name === name)
      if (!existed && tab) this.openedTabs.push(tab)
      if (tab) this.currentTitle = tab.title || ''
    },
    removeTab(name) {
      this.openedTabs = this.openedTabs.filter((t) => t.name !== name)
    }
  }
})
