import { createRouter, createWebHistory } from 'vue-router'

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

export default router
