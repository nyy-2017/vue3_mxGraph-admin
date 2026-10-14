<template>
  <div class="page">
    <div class="toolbar">
      <span class="title">角色管理</span>
      <a-button type="primary" :disabled="!can('role:create')" @click="openCreate">
        <template #icon><plus-outlined /></template>新增角色
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="openMenus(record)" :class="{ disabled: !can('role:menu') }">分配菜单</a>
            <a @click="openEdit(record)" :class="{ disabled: !can('role:update') }">编辑</a>
            <a-popconfirm title="确认删除该角色？" :disabled="!can('role:delete')" @confirm="onDelete(record)">
              <a danger :class="{ disabled: !can('role:delete') }">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新增 / 编辑 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editing ? '编辑角色' : '新增角色'"
      :confirm-loading="modalLoading"
      @ok="submit"
      @cancel="modalVisible = false"
      :mask-closable="false"
    >
      <a-form :model="form" layout="vertical" ref="formRef">
        <a-form-item label="角色名称" name="name" :rules="[{ required: true, message: '请输入角色名称' }]">
          <a-input v-model:value="form.name" placeholder="如 运维人员" />
        </a-form-item>
        <a-form-item
          label="角色编码"
          name="code"
          :rules="[{ required: true, message: '请输入角色编码' }]"
        >
          <a-input v-model:value="form.code" :disabled="!!editing" placeholder="如 operator" />
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="form.remark" :rows="2" placeholder="可选" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 分配菜单 -->
    <a-modal
      v-model:open="menuVisible"
      title="分配菜单权限"
      :confirm-loading="menuLoading"
      @ok="saveMenus"
      @cancel="menuVisible = false"
      :mask-closable="false"
      width="520px"
    >
      <a-tree
        v-if="menuTree.length"
        v-model:checked-keys="checkedKeys"
        :tree-data="menuTree"
        checkable
        default-expand-all
        :selectable="false"
        @check="onCheck"
      />
      <a-empty v-else description="暂无菜单数据" />
      <div class="menu-tip">勾选的菜单 / 按钮权限将授予该角色（超级管理员默认拥有全部权限）。</div>
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
  { title: '角色名称', dataIndex: 'name', key: 'name' },
  { title: '角色编码', dataIndex: 'code', key: 'code' },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '用户数', dataIndex: 'userCount', key: 'userCount', width: 90 },
  { title: '操作', key: 'action', width: 200 }
]

const modalVisible = ref(false)
const modalLoading = ref(false)
const editing = ref(null)
const formRef = ref()
const form = reactive({ name: '', code: '', remark: '' })

const menuVisible = ref(false)
const menuLoading = ref(false)
const menuTree = ref([])
const checkedKeys = ref([])
const halfChecked = ref([])
const currentRole = ref(null)

function toTree(menus) {
  return menus.map((m) => ({
    key: m.id,
    title: m.title + (m.type === 2 ? '（按钮）' : ''),
    children: m.children && m.children.length ? toTree(m.children) : undefined
  }))
}

async function loadData() {
  loading.value = true
  try {
    const res = await systemApi.role.list()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', code: '', remark: '' })
  modalVisible.value = true
}
function openEdit(record) {
  editing.value = record
  Object.assign(form, { name: record.name, code: record.code, remark: record.remark })
  modalVisible.value = true
}
async function submit() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  modalLoading.value = true
  try {
    if (editing.value) {
      await systemApi.role.update(editing.value.id, { name: form.name, remark: form.remark })
      message.success('更新成功')
    } else {
      await systemApi.role.create({ name: form.name, code: form.code, remark: form.remark })
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
  } finally {
    modalLoading.value = false
  }
}
async function onDelete(record) {
  await systemApi.role.remove(record.id)
  message.success('删除成功')
  loadData()
}

async function openMenus(record) {
  currentRole.value = record
  const [tree, ids] = await Promise.all([systemApi.menu.tree(), systemApi.role.menus(record.id)])
  menuTree.value = toTree(tree.data)
  checkedKeys.value = ids.data
  menuVisible.value = true
}
function onCheck(checked, info) {
  checkedKeys.value = checked
  halfChecked.value = info.halfCheckedKeys || []
}
async function saveMenus() {
  menuLoading.value = true
  try {
    // 合并半选父节点，保证父级菜单也入库
    const all = [...checkedKeys.value, ...halfChecked.value]
    await systemApi.role.saveMenus(currentRole.value.id, all)
    message.success('菜单权限已保存')
    menuVisible.value = false
    // 若修改的是当前账号角色，刷新本地菜单
    if (currentRole.value.id === userStore.roleId) {
      const me = await (await import('../../api/auth.api')).default.me()
      userStore.setProfile(me.data)
    }
  } finally {
    menuLoading.value = false
  }
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
.menu-tip {
  margin-top: 10px;
  font-size: 12px;
  color: var(--app-text-weak);
}
.disabled {
  color: var(--app-text-weak);
  cursor: not-allowed;
  pointer-events: none;
}
</style>
