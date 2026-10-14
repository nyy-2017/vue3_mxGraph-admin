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
import { message } from 'ant-design-vue'
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
    // 保留最后一个页签，不允许删除
    if (layoutStore.openedTabList.length <= 1) {
      message.warning('至少保留一个页签')
      return
    }
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
  padding: 5px 12px 0;
}
.tabs :deep(.ant-tabs-nav) {
  margin: 0;
}
.tabs :deep(.ant-tabs-nav::before) {
  border-bottom: none;
}
.tabs :deep(.ant-tabs-tab) {
  padding: 2px 10px !important;
  font-size: 12px;
  color: var(--app-text-sub);
  background: transparent;
  border: 1px solid var(--app-border) !important;
  border-radius: 6px 6px 0 0 !important;
  transition: all 0.2s;
}
.tabs :deep(.ant-tabs-tab + .ant-tabs-tab) {
  margin-left: 5px;
}
.tabs :deep(.ant-tabs-tab:hover) {
  color: var(--app-primary);
  border-color: var(--app-primary) !important;
}
.tabs :deep(.ant-tabs-tab-active) {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0.05) 100%) !important;
  border-color: var(--app-primary) !important;
}
.tabs :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #fff !important;
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
