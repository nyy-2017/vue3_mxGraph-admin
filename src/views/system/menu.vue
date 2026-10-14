<template>
  <div class="page">
    <div class="toolbar">
      <span class="title">菜单管理</span>
      <a-button type="primary" :disabled="!can('menu:create')" @click="openCreate(null)">
        <template #icon><plus-outlined /></template>新增菜单
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      size="middle"
      :default-expand-all-rows="true"
      :scroll="{ y: 'calc(100vh - 280px)' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="record.type === 1 ? 'blue' : 'orange'">
            {{ record.type === 1 ? '菜单' : '按钮' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a v-if="record.type === 1" @click="openCreate(record)" :class="{ disabled: !can('menu:create') }">新增子项</a>
            <a @click="openEdit(record)" :class="{ disabled: !can('menu:update') }">编辑</a>
            <a-popconfirm title="确认删除该菜单及其子项？" :disabled="!can('menu:delete')" @confirm="onDelete(record)">
              <a danger :class="{ disabled: !can('menu:delete') }">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="editing ? '编辑菜单' : '新增菜单'"
      :confirm-loading="modalLoading"
      @ok="submit"
      @cancel="modalVisible = false"
      :mask-closable="false"
    >
      <a-form :model="form" layout="vertical" ref="formRef">
        <a-form-item label="上级菜单" name="parentId">
          <a-tree-select
            v-model:value="form.parentId"
            :tree-data="parentOptions"
            :allow-clear="true"
            placeholder="根级菜单"
            tree-default-expand-all
          />
        </a-form-item>
        <a-form-item label="菜单类型" name="type">
          <a-radio-group v-model:value="form.type">
            <a-radio :value="1">菜单</a-radio>
            <a-radio :value="2">按钮</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="菜单名称" name="title" :rules="[{ required: true, message: '请输入显示名称' }]">
          <a-input v-model:value="form.title" placeholder="侧边栏显示名称" />
        </a-form-item>
        <a-form-item label="路由标识(name)" name="name" :rules="[{ required: true, message: '请输入唯一标识' }]">
          <a-input v-model:value="form.name" placeholder="如 system_user（需与前端路由 name 一致）" />
        </a-form-item>
        <a-form-item v-if="form.type === 1" label="路由路径(path)" name="path">
          <a-input v-model:value="form.path" placeholder="如 /system/user 或 graphList" />
        </a-form-item>
        <a-form-item label="权限标识(permission)" name="permission">
          <a-input v-model:value="form.permission" placeholder="如 user:list" />
        </a-form-item>
        <a-form-item label="图标(icon)" name="icon">
          <a-input v-model:value="form.icon" placeholder="如 UserOutlined（菜单项）" />
        </a-form-item>
        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import systemApi from '../../api/system.api'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const can = (perm) => userStore.hasPerm(perm)

const list = ref([])
const loading = ref(false)

const columns = [
  { title: '名称', dataIndex: 'title', key: 'title' },
  { title: '标识', dataIndex: 'name', key: 'name' },
  { title: '类型', key: 'type', width: 90 },
  { title: '路径', dataIndex: 'path', key: 'path' },
  { title: '权限', dataIndex: 'permission', key: 'permission' },
  { title: '图标', dataIndex: 'icon', key: 'icon', width: 120 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '操作', key: 'action', width: 200 }
]

// 树形表格需要 children 字段
function toTableTree(menus) {
  return menus.map((m) => ({
    ...m,
    children: m.children && m.children.length ? toTableTree(m.children) : undefined
  }))
}
// 上级菜单下拉（仅 type=1，且排除自身及后代在编辑时处理）
function toParentOptions(menus, excludeId) {
  const res = []
  menus.forEach((m) => {
    if (excludeId && m.id === excludeId) return
    const node = { label: m.title, value: m.id }
    if (m.children && m.children.length) {
      const child = toParentOptions(m.children, excludeId)
      if (child.length) node.children = child
    }
    res.push(node)
  })
  return res
}
const parentOptions = computed(() => {
  const root = { label: '根级菜单', value: 0 }
  const children = toParentOptions(list.value, editing.value ? editing.value.id : null)
  if (children.length) root.children = children
  return [root]
})

const modalVisible = ref(false)
const modalLoading = ref(false)
const editing = ref(null)
const formRef = ref()
const form = reactive({
  parentId: 0,
  type: 1,
  title: '',
  name: '',
  path: '',
  permission: '',
  icon: '',
  sort: 0
})

async function loadData() {
  loading.value = true
  try {
    const res = await systemApi.menu.tree()
    list.value = toTableTree(res.data)
  } finally {
    loading.value = false
  }
}
function resetForm(parentId) {
  Object.assign(form, {
    parentId: parentId || 0,
    type: 1,
    title: '',
    name: '',
    path: '',
    permission: '',
    icon: '',
    sort: 0
  })
}
function openCreate(parent) {
  editing.value = null
  resetForm(parent ? parent.id : 0)
  modalVisible.value = true
}
function openEdit(record) {
  editing.value = record
  Object.assign(form, {
    parentId: record.parentId || 0,
    type: record.type,
    title: record.title,
    name: record.name,
    path: record.path,
    permission: record.permission,
    icon: record.icon,
    sort: record.sort
  })
  modalVisible.value = true
}
async function submit() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  const payload = {
    parentId: form.parentId || 0,
    type: form.type,
    title: form.title,
    name: form.name,
    path: form.path,
    permission: form.permission,
    icon: form.icon,
    sort: form.sort
  }
  modalLoading.value = true
  try {
    if (editing.value) {
      await systemApi.menu.update(editing.value.id, payload)
      message.success('更新成功')
    } else {
      await systemApi.menu.create(payload)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
  } finally {
    modalLoading.value = false
  }
}
async function onDelete(record) {
  await systemApi.menu.remove(record.id)
  message.success('删除成功')
  loadData()
  // 若删除了当前角色的菜单，刷新本地菜单
  const me = await (await import('../../api/auth.api')).default.me()
  userStore.setProfile(me.data)
}

onMounted(loadData)
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
  margin-bottom: 12px;
}
.title {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text);
}
.disabled {
  color: var(--app-text-weak);
  cursor: not-allowed;
  pointer-events: none;
}
</style>
