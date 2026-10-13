import { defineStore } from 'pinia'
import { appRouter } from '../router'

function flatMenus(routers) {
  const list = []
  routers.forEach((item) => {
    if (item.meta && item.meta.hidden) return
    const menu = { ...item }
    if (item.children) {
      menu.children = item.children.filter((c) => !(c.meta && c.meta.hidden))
    }
    list.push(menu)
  })
  return list
}

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    ready: false,
    menuList: [],
    openedTabs: [],
    currentPath: []
  }),
  getters: {
    sidebarMenuList: (state) => state.menuList,
    openedTabList: (state) => state.openedTabs
  },
  actions: {
    initLayout() {
      this.menuList = flatMenus(appRouter)
      this.openedTabs = [appRouter[0]]
      this.ready = true
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
      if (!existed) {
        const tab = this.menuList
          .flatMap((m) => (m.children ? m.children : [m]))
          .find((t) => t.name === name)
        if (tab) this.openedTabs.push(tab)
      }
    },
    removeTab(name) {
      this.openedTabs = this.openedTabs.filter((t) => t.name !== name)
    }
  }
})
