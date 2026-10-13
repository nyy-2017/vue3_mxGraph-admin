<template>
  <div class="header-right">
    <a-dropdown>
      <span class="user">
        {{ loginUser }}
        <down-outlined />
      </span>
      <template #overlay>
        <a-menu>
          <a-menu-item key="logout" @click="logout">退出登录</a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DownOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginUser = computed(() => userStore.userName || 'admin')

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header-right {
  text-align: right;
}
.user {
  color: #fff;
  cursor: pointer;
}
</style>
