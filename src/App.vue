<template>
  <a-config-provider :theme="antdTheme" :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>

<script setup>
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { antdTheme } from './theme'

// 日期选择器 / 分页等组件的中文文案
dayjs.locale('zh-cn')
</script>

<style>
/* 整页只允许一处（内容区）出现滚动条：
   html/body/#app 撑满视口且不滚动，避免出现"窗口滚动条 + 内容区滚动条 + 画布滚动条"多层嵌套 */
html,
body,
#app {
  height: 100%;
  overflow: hidden;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Avenir', Helvetica, Arial, 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--app-text);
  background: var(--app-bg);
}
</style>
