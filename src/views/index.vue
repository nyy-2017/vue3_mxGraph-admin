<template>
  <a-layout class="app-layout">
    <a-layout-sider collapsible v-model:collapsed="collapsed" theme="dark" width="200" class="sider">
      <div class="logo">{{ collapsed ? 'MX' : 'vue3_mxGraph' }}</div>
      <sidebar />
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <ceiling />
      </a-layout-header>
      <tabs />
      <a-layout-content class="content">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref } from 'vue'
import sidebar from './layout/sidebar.vue'
import ceiling from './layout/ceiling.vue'
import tabs from './layout/tabs.vue'

const collapsed = ref(false)
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}
.logo {
  height: 40px;
  line-height: 40px;
  color: #fff;
  text-align: center;
  font-weight: 600;
  letter-spacing: 1px;
  background: #001529;
}
.header {
  background: #001529;
  padding: 0 16px;
  height: 48px;
  line-height: 48px;
}
.content {
  margin: 12px;
  padding: 16px;
  background: #fff;
  min-height: 280px;
}
</style>
