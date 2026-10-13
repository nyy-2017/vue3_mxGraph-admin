<template>
  <div class="tabs-bar">
    <a-tabs
      v-model:activeKey="activeKey"
      type="editable-card"
      hide-add
      size="small"
      class="tabs"
      @change="onChange"
      @edit="onEdit"
    >
      <a-tab-pane v-for="t in tabs" :key="t.name" :tab="t.title" />
    </a-tabs>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLayoutStore } from '../../stores/layout'

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()

const tabs = computed(() => layoutStore.openedTabList)
const activeKey = computed({
  get: () => route.name,
  set: (name) => router.push({ name })
})

function onChange(name) {
  router.push({ name })
}
function onEdit(targetKey, action) {
  if (action === 'remove') {
    layoutStore.removeTab(targetKey)
    if (route.name === targetKey) {
      const rest = layoutStore.openedTabList
      if (rest.length) router.push({ name: rest[rest.length - 1].name })
    }
  }
}

watch(
  () => route.name,
  (name) => {
    if (name) layoutStore.openTab(name)
  },
  { immediate: true }
)
</script>

<style scoped>
/* 多页签条：与顶部栏同一底色，选中页签用主色实心块 */
.tabs-bar {
  flex: none;
  background: var(--app-bg-panel);
  border-bottom: 1px solid var(--app-border);
  padding: 6px 12px 0;
}
.tabs :deep(.ant-tabs-nav) {
  margin: 0;
}
.tabs :deep(.ant-tabs-nav::before) {
  border-bottom: none;
}
.tabs :deep(.ant-tabs-tab) {
  padding: 5px 14px !important;
  color: var(--app-text-sub);
  background: transparent;
  border: 1px solid var(--app-border) !important;
  border-radius: 8px 8px 0 0 !important;
  transition: all 0.2s;
}
.tabs :deep(.ant-tabs-tab + .ant-tabs-tab) {
  margin-left: 6px;
}
.tabs :deep(.ant-tabs-tab:hover) {
  color: var(--app-primary);
  border-color: var(--app-primary) !important;
}
.tabs :deep(.ant-tabs-tab-active) {
  background: var(--app-primary) !important;
  border-color: var(--app-primary) !important;
}
.tabs :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: var(--app-primary-contrast) !important;
  font-weight: 600;
}
.tabs :deep(.ant-tabs-tab .ant-tabs-tab-remove) {
  margin-left: 4px;
  font-size: 10px;
  color: inherit;
}
.tabs :deep(.ant-tabs-tab:not(.ant-tabs-tab-active) .ant-tabs-tab-remove:hover) {
  color: #ff7875;
}
.tabs :deep(.ant-tabs-nav-more) {
  color: var(--app-text-sub);
}
</style>
