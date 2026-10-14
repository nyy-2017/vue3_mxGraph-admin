<template>
  <a-menu
    v-model:openKeys="openKeys"
    theme="dark"
    mode="inline"
    :selectedKeys="selectedKeys"
    @click="onClick"
  >
    <template v-for="item in menuList" :key="item.name">
      <a-menu-item v-if="!item.children" :key="item.name">
        <template #icon><component :is="iconOf(item)" /></template>
        <span>{{ item.title }}</span>
      </a-menu-item>
      <a-sub-menu v-else :key="item.name">
        <template #icon><component :is="iconOf(item)" /></template>
        <template #title>{{ item.title }}</template>
        <a-menu-item v-for="child in item.children" :key="child.name">
          <template #icon><component :is="iconOf(child)" /></template>
          <span>{{ child.title }}</span>
        </a-menu-item>
      </a-sub-menu>
    </template>
  </a-menu>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  ApartmentOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  FileSearchOutlined,
  FolderOutlined
} from '@ant-design/icons-vue'
import { useLayoutStore } from '../../stores/layout'

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()

const menuList = computed(() => layoutStore.sidebarMenuList)
const selectedKeys = computed(() => [route.name])

// 菜单图标按后端返回的 icon 字段（图标组件名）匹配
const ICONS = {
  HomeOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  ApartmentOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  FileSearchOutlined
}
function iconOf(item) {
  return (item.icon && ICONS[item.icon]) || FolderOutlined
}

// 支持手动展开/收起，同时自动展开当前页面所属的父级菜单
const openKeys = ref([])
watch(
  () => route.name,
  (name) => {
    const parent = menuList.value.find((m) => m.children && m.children.some((c) => c.name === name))
    if (parent && !openKeys.value.includes(parent.name)) {
      openKeys.value = [...openKeys.value, parent.name]
    }
  },
  { immediate: true }
)

function onClick({ key }) {
  router.push({ name: key })
}
</script>

<style scoped>
/* 深蓝菜单：选中项用深蓝块 + 青色高亮，文字更清晰 */
:deep(.ant-menu) {
  background: transparent;
  border-inline-end: none;
  padding: 4px 0 12px;
}
:deep(.ant-menu-item),
:deep(.ant-menu-submenu-title) {
  position: relative;
  height: 42px;
  line-height: 42px;
  margin: 2px 10px;
  width: calc(100% - 20px);
  border-radius: 8px;
  color: var(--app-text-sub);
  transition: background 0.2s, color 0.2s;
}
:deep(.ant-menu-item .anticon),
:deep(.ant-menu-submenu-title .anticon) {
  font-size: 15px;
  color: inherit;
}
/* 未选中项 hover */
:deep(.ant-menu-dark .ant-menu-item:not(.ant-menu-item-selected):hover),
:deep(.ant-menu-dark .ant-menu-submenu-title:hover) {
  background: rgba(56, 189, 248, 0.1);
  color: #fff;
}
/* 选中项：深蓝背景 + 左侧青色竖线 + 白色文字 */
:deep(.ant-menu-dark .ant-menu-item-selected) {
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.22) 0%, rgba(56, 189, 248, 0.06) 100%);
}
:deep(.ant-menu-dark .ant-menu-item-selected::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 2px;
  background: var(--app-primary);
}
:deep(.ant-menu-dark .ant-menu-item-selected:hover) {
  color: #fff;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.28) 0%, rgba(56, 189, 248, 0.1) 100%);
}
/* 展开的父级菜单高亮为青色 */
:deep(.ant-menu-dark .ant-menu-submenu-selected > .ant-menu-submenu-title) {
  font-weight: 600;
  color: var(--app-primary);
  background: rgba(56, 189, 248, 0.08);
}
/* 展开的子菜单去掉默认底色 */
:deep(.ant-menu-dark .ant-menu-sub.ant-menu-inline) {
  background: transparent;
}
/* 折叠态 */
:deep(.ant-menu-inline-collapsed .ant-menu-item),
:deep(.ant-menu-inline-collapsed .ant-menu-submenu-title) {
  margin: 2px 6px;
  width: calc(100% - 12px);
}
:deep(.ant-menu-inline-collapsed .ant-menu-item-selected::before) {
  top: 6px;
  bottom: 6px;
}
</style>
