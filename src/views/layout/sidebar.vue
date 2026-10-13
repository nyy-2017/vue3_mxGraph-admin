<template>
  <a-menu
    theme="dark"
    mode="inline"
    :selectedKeys="selectedKeys"
    :openKeys="openKeys"
    @click="onClick"
  >
    <template v-for="item in menuList" :key="item.name">
      <a-menu-item v-if="!item.children" :key="item.name">
        <span>{{ item.title }}</span>
      </a-menu-item>
      <a-sub-menu v-else :key="item.name">
        <template #title>{{ item.title }}</template>
        <a-menu-item v-for="child in item.children" :key="child.name">{{ child.title }}</a-menu-item>
      </a-sub-menu>
    </template>
  </a-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLayoutStore } from '../../stores/layout'

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()

const menuList = computed(() => layoutStore.sidebarMenuList)
const selectedKeys = computed(() => [route.name])
const openKeys = computed(() => {
  const names = []
  menuList.value.forEach((m) => {
    if (m.children && m.children.some((c) => c.name === route.name)) names.push(m.name)
  })
  return names
})

function onClick({ key }) {
  router.push({ name: key })
}
</script>
