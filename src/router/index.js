import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useLayoutStore } from '../stores/layout'
import authApi from '../api/auth.api'

const Main = () => import('../views/index.vue')
const Abstract = () => import('../views/layout/abstract.vue')
const Home = () => import('../views/home/home.vue')
const Login = () => import('../views/login.vue')
const DateTime = () => import('../views/mxgraph/dateTime.vue')
const DateRange = () => import('../views/mxgraph/dateRange.vue')
const AppView = () => import('../views/mxgraph/appView.vue')
const GraphList = () => import('../views/mxgraph/graph-list.vue')
const LookStatus = () => import('../views/mxgraph/lookStatus.vue')
const Grapheditor = () => import('../views/mxgraph/grapheditor.vue')

// 系统管理页面
const UserManage = () => import('../views/system/user.vue')
const RoleManage = () => import('../views/system/role.vue')
const MenuManage = () => import('../views/system/menu.vue')
const LogManage = () => import('../views/system/log.vue')

export const appRouter = [
  {
    title: '首页',
    path: '/home',
    name: 'home',
    component: Home
  },
  {
    title: '组态管理',
    path: '',
    redirect: '/graphs',
    name: 'Graphs',
    component: Abstract,
    children: [
      { title: '当前时间', name: 'dateTime', path: 'dateTime', component: DateTime },
      { title: '时间范围', name: 'dateRange', path: 'dateRange', component: DateRange },
      { title: '组态列表一', name: 'appView', path: 'appView', component: AppView },
      { title: '组态列表二', name: 'graph_list', path: 'graphList', component: GraphList },
      {
        title: '查看状态',
        name: 'lookStatus',
        path: 'lookStatus',
        component: LookStatus,
        // 全屏页面：由页面自身撑满内容区，内容区不再产生滚动条
        meta: { fullHeight: true }
      },
      {
        title: 'graph详情页',
        name: 'grapheditor',
        meta: { hidden: true, fullHeight: true },
        path: 'grapheditor/:id?',
        component: Grapheditor
      }
    ]
  },
  {
    title: '系统管理',
    path: '',
    redirect: '/system/user',
    name: 'System',
    component: Abstract,
    children: [
      { title: '用户管理', name: 'system_user', path: 'system/user', component: UserManage },
      { title: '角色管理', name: 'system_role', path: 'system/role', component: RoleManage },
      { title: '菜单管理', name: 'system_menu', path: 'system/menu', component: MenuManage },
      { title: '操作日志', name: 'system_log', path: 'system/log', component: LogManage }
    ]
  }
]

const routes = [
  { path: '/login', name: 'login', meta: { title: '登录' }, component: Login },
  {
    path: '/',
    redirect: '/home',
    component: Main,
    children: appRouter
  },
  { path: '/:pathMatch(.*)*', redirect: '/home' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：未登录跳转登录页；已登录但菜单未加载（刷新场景）则拉取 /me 还原会话
let restoring = false
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  if (to.path === '/login') {
    if (userStore.isLogin) return next('/home')
    return next()
  }
  if (!userStore.isLogin) {
    return next('/login')
  }
  const layoutStore = useLayoutStore()
  // 菜单尚未构建（首次登录或刷新后）时，以服务端 /me 返回的菜单权限为准，本地缓存仅兜底
  if (!layoutStore.ready && !restoring) {
    restoring = true
    try {
      const res = await authApi.me()
      userStore.setProfile(res.data)
      layoutStore.setMenus(res.data.menus)
    } catch (e) {
      // 拉取失败时回退本地缓存；缓存也没有则回登录页重新认证
      if (userStore.menus && userStore.menus.length) {
        layoutStore.setMenus(userStore.menus)
      } else {
        userStore.logout()
        restoring = false
        return next('/login')
      }
    }
    restoring = false
  }
  next()
})

export default router
