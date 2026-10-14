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
        <span v-if="roleName" class="role-tag">{{ roleName }}</span>
        <DownOutlined class="caret" />
      </span>
      <template #overlay>
        <a-menu>
          <a-menu-item key="pwd" @click="openChangePwd">
            <LockOutlined />
            <span>修改密码</span>
          </a-menu-item>
          <a-menu-item key="logout" @click="logout">
            <LogoutOutlined />
            <span>退出登录</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>

    <a-modal
      v-model:open="pwdVisible"
      title="修改密码"
      :confirm-loading="pwdLoading"
      @ok="submitPwd"
      @cancel="resetPwdForm"
      :mask-closable="false"
    >
      <a-form :model="pwdForm" layout="vertical" ref="pwdFormRef">
        <a-form-item label="原密码" name="oldPassword" :rules="[{ required: true, message: '请输入原密码' }]">
          <a-input-password v-model:value="pwdForm.oldPassword" placeholder="请输入原密码" />
        </a-form-item>
        <a-form-item
          label="新密码"
          name="newPassword"
          :rules="[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '新密码至少 6 位' }
          ]"
        >
          <a-input-password v-model:value="pwdForm.newPassword" placeholder="至少 6 位" />
        </a-form-item>
        <a-form-item
          label="确认新密码"
          name="confirm"
          :rules="[
            { required: true, message: '请再次输入新密码' },
            { validator: validateConfirm }
          ]"
        >
          <a-input-password v-model:value="pwdForm.confirm" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LockOutlined,
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '../../stores/user'
import authApi from '../../api/auth.api'

const router = useRouter()
const userStore = useUserStore()

const loginUser = computed(() => userStore.nickname || userStore.userName || 'admin')
const roleName = computed(() => userStore.roleName || '')

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

// 修改密码
const pwdVisible = ref(false)
const pwdLoading = ref(false)
const pwdFormRef = ref()
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirm: '' })

function openChangePwd() {
  resetPwdForm()
  pwdVisible.value = true
}
function resetPwdForm() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirm = ''
  pwdFormRef.value && pwdFormRef.value.clearValidate && pwdFormRef.value.clearValidate()
}
function validateConfirm(_rule, value) {
  if (!value) return Promise.reject('请再次输入新密码')
  if (value !== pwdForm.newPassword) return Promise.reject('两次输入的密码不一致')
  return Promise.resolve()
}
async function submitPwd() {
  try {
    await pwdFormRef.value.validate()
  } catch (e) {
    return
  }
  pwdLoading.value = true
  try {
    await authApi.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    message.success('密码修改成功，请重新登录')
    pwdVisible.value = false
    userStore.logout()
    router.push('/login')
  } catch (e) {
    // 错误由拦截器统一提示
  } finally {
    pwdLoading.value = false
  }
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
.role-tag {
  font-size: 11px;
  padding: 1px 7px;
  color: var(--app-primary);
  background: var(--app-primary-soft);
  border-radius: 999px;
  white-space: nowrap;
}
.caret {
  font-size: 11px;
  color: var(--app-text-sub);
}
</style>
