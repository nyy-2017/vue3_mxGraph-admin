<template>
  <a-tabs
    v-model:activeKey="activeKey"
    type="editable-card"
    hide-add
    class="tabs"
    @change="onChange"
    @edit="onEdit"
  >
    <a-tab-pane v-for="t in tabs" :key="t.name" :tab="t.title" />
  </a-tabs>
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
.tabs {
  background: #fff;
  padding: 0 8px;
}
</style>
