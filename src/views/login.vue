<template>
  <div class="login">
    <div class="glow glow-left"></div>
    <div class="glow glow-right"></div>

    <a-card class="log-form" :bordered="false">
      <div class="brand">
        <span class="logo-mark">MX</span>
        <div class="brand-text">
          <h1>组态管理系统</h1>
          <p>MX Graph Configuration Platform</p>
        </div>
      </div>

      <a-form :model="loginForm" layout="vertical" @finish="handleSubmit">
        <a-form-item
          label="用户名"
          name="userName"
          :rules="[{ required: true, message: '请填写用户名' }]"
        >
          <a-input v-model:value="loginForm.userName" size="large" placeholder="用户名" :disabled="loading">
            <template #prefix><user-outlined /></template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="密码"
          name="password"
          :rules="[
            { required: true, message: '请填写密码' },
            { min: 3, message: '密码长度不能小于3位' }
          ]"
        >
          <a-input-password
            v-model:value="loginForm.password"
            size="large"
            placeholder="密码"
            :disabled="loading"
            @press-enter="handleSubmit"
          />
        </a-form-item>
        <a-form-item class="row-between">
          <a-checkbox v-model:checked="loginForm.rememberMe">记住我</a-checkbox>
        </a-form-item>
        <a-form-item>
          <a-button
            type="primary"
            size="large"
            html-type="submit"
            block
            :loading="loading"
          >登 录</a-button>
        </a-form-item>
        <div class="hint">默认超级管理员账号：admin / admin</div>
      </a-form>
    </a-card>

    <div class="copyright">© 2026 MX Graph 组态管理系统</div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '../stores/user'
import { useLayoutStore } from '../stores/layout'
import authApi from '../api/auth.api'

const router = useRouter()
const userStore = useUserStore()

const loginForm = reactive({
  password: 'admin',
  rememberMe: true,
  userName: 'admin'
})
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    const res = await authApi.login({
      username: loginForm.userName.trim(),
      password: loginForm.password
    })
    // http 返回完整 axios 响应，需取 res.data
    userStore.setAuth(res.data)
    // 登录成功后，主动请求当前用户对应的菜单权限和拥有的所有菜单信息
    try {
      const profile = await authApi.me()
      userStore.setProfile(profile.data)
      useLayoutStore().setMenus(profile.data.menus || [])
    } catch (e) {
      // 拉取失败不阻断登录，路由守卫会兜底重试
    }
    message.success('登录成功')
    router.push({ name: 'home' })
  } catch (e) {
    // 错误消息由 http 拦截器统一处理，这里无需重复提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: radial-gradient(1000px 560px at 12% 8%, #12325a 0%, transparent 62%),
    radial-gradient(900px 520px at 88% 92%, #0b5a4a 0%, transparent 60%), #08101c;
}
/* 背景光斑，增强深色层次 */
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.45;
  pointer-events: none;
}
.glow-left {
  top: -120px;
  left: -80px;
  width: 380px;
  height: 380px;
  background: #1b6fd6;
}
.glow-right {
  right: -100px;
  bottom: -140px;
  width: 420px;
  height: 420px;
  background: #16c79a;
}
.log-form {
  position: relative;
  z-index: 1;
  width: 380px;
  background: rgba(16, 29, 46, 0.94);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.log-form :deep(.ant-card-body) {
  padding: 28px 28px 8px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;
}
.logo-mark {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 15px;
  font-weight: 700;
  color: var(--app-primary-contrast);
  background: linear-gradient(135deg, #1fe0ae 0%, var(--app-primary-strong) 100%);
  border-radius: 12px;
}
.brand-text h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text);
}
.brand-text p {
  margin: 2px 0 0;
  font-size: 11px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--app-text-weak);
}
.hint {
  margin: -6px 0 18px;
  font-size: 12px;
  color: var(--app-text-weak);
  text-align: center;
}
.copyright {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: var(--app-text-weak);
}
</style>
