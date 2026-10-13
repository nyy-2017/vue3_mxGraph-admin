<template>
  <a-layout class="app-layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      theme="dark"
      :width="208"
      class="sider"
    >
      <div class="logo">
        <span class="logo-mark">MX</span>
        <span v-show="!collapsed" class="logo-text">组态管理系统</span>
      </div>
      <div class="sider-body">
        <sidebar />
      </div>
    </a-layout-sider>
    <a-layout class="main">
      <a-layout-header class="header">
        <div class="header-left">
          <button class="app-icon-btn" type="button" @click="collapsed = !collapsed">
            <menu-unfold-outlined v-if="collapsed" />
            <menu-fold-outlined v-else />
          </button>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <ceiling />
      </a-layout-header>
      <tabs />
      <a-layout-content class="content" :class="{ 'content--full': isFullHeight }">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'
import sidebar from './layout/sidebar.vue'
import ceiling from './layout/ceiling.vue'
import tabs from './layout/tabs.vue'
import { useLayoutStore } from '../stores/layout'

const route = useRoute()
const layoutStore = useLayoutStore()
const collapsed = ref(false)

// 路由 meta.fullHeight 的页面（组态编辑器、查看状态）自己撑满内容区，
// 内容区不再叠加第二层滚动条
const isFullHeight = computed(() => !!route.meta.fullHeight)

const pageTitle = computed(() => layoutStore.currentTitle || '首页')
</script>

<style scoped>
.app-layout {
  height: 100%;
  overflow: hidden;
  background: var(--app-bg);
}

/* ---------- 侧边栏 ---------- */
.sider {
  background: var(--app-bg-sider);
  border-right: 1px solid var(--app-border);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.25);
}
.sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  overflow: hidden;
  white-space: nowrap;
  border-bottom: 1px solid var(--app-border-soft);
}
.logo-mark {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--app-primary-contrast);
  background: linear-gradient(135deg, #1fe0ae 0%, var(--app-primary-strong) 100%);
  border-radius: 8px;
}
.logo-text {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #eaf4ff;
}
/* 折叠态：只留图标并居中 */
.sider.ant-layout-sider-collapsed .logo {
  justify-content: center;
  padding: 0;
}
.sider-body {
  flex: 1;
  min-height: 0;
  padding-top: 8px;
  overflow-x: hidden;
  overflow-y: auto;
}

/* ---------- 顶部栏 ---------- */
.main {
  background: var(--app-bg);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  line-height: normal;
  background: var(--app-bg-panel);
  border-bottom: 1px solid var(--app-border);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.page-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text);
}
/* ---------- 内容区 ---------- */
.content {
  margin: 12px;
  padding: 16px;
  background: var(--app-bg-card);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  flex: 1;
  min-height: 0;
  /* 普通页面：内容区自身滚动，全页只有这一层滚动条 */
  overflow: auto;
}
/* 全屏页面：容器固定，页面内部自行分配高度，避免嵌套滚动条 */
.content--full {
  overflow: hidden;
}
</style>
