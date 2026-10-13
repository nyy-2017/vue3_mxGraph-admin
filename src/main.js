import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import { useLayoutStore } from './stores/layout'

// mxgraph 的 build.js 在非严格（sloppy）脚本上下文下会隐式创建一批全局配置变量
// （mxLoadResources / mxLoadStylesheets / mxForceIncludes / mxResourceExtension）。
// 但在 Vite 预构建后的 ESM 严格模式中，这类 `var x = true` 之外的裸赋值会抛
// ReferenceError。提前在 window 上定义它们，可让 mxgraph 内部的
// `if (typeof(x) == 'undefined')` 守卫跳过这些会抛错的赋值。
window.mxLoadResources = true
window.mxLoadStylesheets = true
window.mxForceIncludes = false
window.mxResourceExtension = ''

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

// 初始化布局菜单 / 标签页状态
const layoutStore = useLayoutStore()
layoutStore.initLayout()

app.mount('#app')
