<template>
  <div class="login">
    <a-card class="log-form" title="请登录">
      <a-form :model="loginForm" layout="vertical" @finish="handleSubmit">
        <a-form-item
          label="用户名"
          name="userName"
          :rules="[{ required: true, message: '请填写用户名' }]"
        >
          <a-input v-model:value="loginForm.userName" placeholder="用户名">
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
          <a-input-password v-model:value="loginForm.password" placeholder="密码" />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model:checked="loginForm.rememberMe">记住我</a-checkbox>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" block>登录</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '../stores/user'
import { nowTime } from '../libs/time.js'

const router = useRouter()
const userStore = useUserStore()

const loginForm = reactive({
  password: '111111',
  rememberMe: false,
  userId: '0711000001',
  userName: 'admin',
  loginTime: nowTime()
})

function handleSubmit() {
  userStore.setUser(loginForm)
  message.success('登录成功')
  router.push({ name: 'home' })
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b3a4b;
}
.log-form {
  width: 360px;
}
</style>
