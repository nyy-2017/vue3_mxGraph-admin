<template>
  <div class="page">
    <div class="toolbar">
      <a-input-search
        v-model:value="keyword"
        placeholder="搜索用户名 / 昵称"
        style="width: 240px"
        allow-clear
        @search="loadData"
        @change="onKeywordChange"
      />
      <a-button type="primary" :disabled="!can('user:create')" @click="openCreate">
        <template #icon><user-add-outlined /></template>新增用户
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      size="middle"
      :scroll="{ y: 'calc(100vh - 280px)' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status ? 'success' : 'default'">
            {{ record.status ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a @click="openEdit(record)" :class="{ disabled: !can('user:update') }">编辑</a>
            <a @click="onReset(record)" :class="{ disabled: !can('user:reset') }">重置密码</a>
            <a-popconfirm
              title="确认删除该用户？"
              :disabled="!can('user:delete')"
              @confirm="onDelete(record)"
            >
              <a danger :class="{ disabled: !can('user:delete') }">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="editing ? '编辑用户' : '新增用户'"
      :confirm-loading="modalLoading"
      @ok="submit"
      @cancel="closeModal"
      :mask-closable="false"
    >
      <a-form :model="form" layout="vertical" ref="formRef">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="form.username" :disabled="!!editing" placeholder="登录用户名" />
        </a-form-item>
        <a-form-item label="昵称" name="nickname">
          <a-input v-model:value="form.nickname" placeholder="显示名称" />
        </a-form-item>
        <a-form-item label="角色" name="roleId" :rules="[{ required: true, message: '请选择角色' }]">
          <a-select v-model:value="form.roleId" placeholder="请选择角色" :options="roleOptions" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="form.email" placeholder="可选" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-switch v-model:checked="form.status" checked-children="启用" un-checked-children="禁用" />
        </a-form-item>
        <a-form-item
          :label="editing ? '重置密码（留空则不修改）' : '初始密码（留空默认 123456）'"
          name="password"
        >
          <a-input-password v-model:value="form.password" placeholder="至少 6 位" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { UserAddOutlined } from '@ant-design/icons-vue'
import systemApi from '../../api/system.api'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const can = (perm) => userStore.hasPerm(perm)

const list = ref([])
const loading = ref(false)
const keyword = ref('')
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: (t) => `共 ${t} 条` })

const roles = ref([])
const roleOptions = computed(() => roles.value.map((r) => ({ label: r.name, value: r.id })))

const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
  { title: '角色', dataIndex: 'roleName', key: 'roleName' },
  { title: '状态', key: 'status', width: 90 },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 190, fixed: 'right' }
]

const modalVisible = ref(false)
const modalLoading = ref(false)
const editing = ref(null)
const formRef = ref()
const form = reactive({
  username: '',
  nickname: '',
  roleId: undefined,
  email: '',
  status: true,
  password: ''
})

function onKeywordChange() {
  if (!keyword.value) loadData()
}
async function loadData() {
  loading.value = true
  try {
    const res = await systemApi.user.list({
      page: pagination.current,
      size: pagination.pageSize,
      keyword: keyword.value
    })
    list.value = res.data
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}
async function loadRoles() {
  const res = await systemApi.role.list()
  roles.value = res.data
}

function openCreate() {
  editing.value = null
  Object.assign(form, {
    username: '',
    nickname: '',
    roleId: roleOptions.value[0] ? roleOptions.value[0].value : undefined,
    email: '',
    status: true,
    password: ''
  })
  modalVisible.value = true
}
function openEdit(record) {
  editing.value = record
  Object.assign(form, {
    username: record.username,
    nickname: record.nickname,
    roleId: record.roleId,
    email: record.email,
    status: !!record.status,
    password: ''
  })
  modalVisible.value = true
}
function closeModal() {
  modalVisible.value = false
}
async function submit() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  modalLoading.value = true
  const payload = {
    username: form.username,
    nickname: form.nickname,
    roleId: form.roleId,
    email: form.email,
    status: form.status ? 1 : 0
  }
  if (form.password) payload.password = form.password
  try {
    if (editing.value) {
      await systemApi.user.update(editing.value.id, payload)
      message.success('更新成功')
    } else {
      await systemApi.user.create(payload)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
  } finally {
    modalLoading.value = false
  }
}
async function onReset(record) {
  await systemApi.user.resetPassword(record.id)
  message.success(`已重置为 123456`)
}
async function onDelete(record) {
  await systemApi.user.remove(record.id)
  message.success('删除成功')
  loadData()
}

pagination.onChange = (page, size) => {
  pagination.current = page
  pagination.pageSize = size
  loadData()
}

onMounted(() => {
  loadRoles()
  loadData()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.disabled {
  color: var(--app-text-weak);
  cursor: not-allowed;
  pointer-events: none;
}
</style>
