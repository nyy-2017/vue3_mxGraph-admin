<template>
  <div class="page">
    <div class="toolbar">
      <a-space>
        <a-input-search
          v-model:value="username"
          placeholder="操作人"
          style="width: 180px"
          allow-clear
          @search="loadData"
          @change="onChange"
        />
        <a-select v-model:value="action" placeholder="操作类型" style="width: 160px" allow-clear @change="loadData">
          <a-select-option v-for="a in actionOptions" :key="a" :value="a">{{ a }}</a-select-option>
        </a-select>
        <a-button @click="loadData">查询</a-button>
      </a-space>
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
          <a-tag :color="record.status < 400 ? 'success' : 'error'">{{ record.status }}</a-tag>
        </template>
        <template v-else-if="column.key === 'method'">
          <a-tag :color="methodColor(record.method)">{{ record.method }}</a-tag>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import systemApi from '../../api/system.api'

const list = ref([])
const loading = ref(false)
const username = ref('')
const action = ref(undefined)
const actionOptions = ['登录', '查询', '新增/创建', '更新', '删除', '修改密码']

const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: (t) => `共 ${t} 条` })

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
  { title: '操作人', dataIndex: 'username', key: 'username', width: 120 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 110 },
  { title: '方法', key: 'method', width: 90 },
  { title: '路径', dataIndex: 'path', key: 'path' },
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 140 },
  { title: '状态码', key: 'status', width: 90 },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 }
]

function methodColor(m) {
  return { GET: 'blue', POST: 'green', PUT: 'gold', DELETE: 'red' }[m] || 'default'
}
function onChange() {
  if (!username.value) loadData()
}
async function loadData() {
  loading.value = true
  try {
    const res = await systemApi.log.list({
      page: pagination.current,
      size: pagination.pageSize,
      username: username.value,
      action: action.value
    })
    list.value = res.data.data
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

pagination.onChange = (page, size) => {
  pagination.current = page
  pagination.pageSize = size
  loadData()
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
  justify-content: flex-start;
  margin-bottom: 12px;
}
</style>
