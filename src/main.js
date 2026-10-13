import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import { useLayoutStore } from './stores/layout'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

// 初始化布局菜单 / 标签页状态
const layoutStore = useLayoutStore()
layoutStore.initLayout()

app.mount('#app')
