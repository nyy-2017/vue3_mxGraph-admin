<template>
  <div class="header-right">
    <a-tooltip title="刷新当前页" placement="bottomRight">
      <button type="button" class="app-icon-btn" @click="refresh">
        <ReloadOutlined />
      </button>
    </a-tooltip>
    <a-tooltip :title="isFullscreen ? '退出全屏' : '全屏显示'" placement="bottomRight">
      <button type="button" class="app-icon-btn" @click="toggleFullscreen">
        <FullscreenExitOutlined v-if="isFullscreen" />
        <FullscreenOutlined v-else />
      </button>
    </a-tooltip>
    <a-dropdown placement="bottomRight">
      <span class="user">
        <span class="avatar"><UserOutlined /></span>
        <span class="user-name">{{ loginUser }}</span>
        <DownOutlined class="caret" />
      </span>
      <template #overlay>
        <a-menu>
          <a-menu-item key="logout" @click="logout">
            <LogoutOutlined />
            <span>退出登录</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginUser = computed(() => userStore.userName || 'admin')

const isFullscreen = ref(false)

function refresh() {
  window.location.reload()
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen && document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen && document.documentElement.requestFullscreen()
  }
}

function syncFullscreen() {
  isFullscreen.value = !!document.fullscreenElement
}

function logout() {
  userStore.logout()
  router.push('/login')
}

onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen))
</script>

<style scoped>
.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px 0 6px;
  margin-left: 6px;
  color: var(--app-text);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.user:hover {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
}
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 13px;
  color: var(--app-primary-contrast);
  background: linear-gradient(135deg, #1fe0ae 0%, var(--app-primary-strong) 100%);
  border-radius: 50%;
}
.user-name {
  font-size: 13px;
  max-width: 120px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.caret {
  font-size: 11px;
  color: var(--app-text-sub);
}
</style>
