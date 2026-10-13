<template>
  <div class="topoList">
    <a-space style="margin-bottom: 20px">
      <a-button type="primary" @click="modal1 = true">新建TOPO图</a-button>
      <a-button @click="reportTopo">上报TOPO图</a-button>
    </a-space>

    <a-modal
      v-model:open="modal1"
      title="新增TOPO图"
      width="620"
      :mask-closable="false"
      @cancel="cancel"
      @ok="saveTopos"
    >
      <a-form layout="horizontal" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="Topo图名称">
          <a-input v-model:value="save_DiagramIdName" placeholder="请输入Topo图名称" allow-clear />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-table
      :columns="columns"
      :data-source="topoData"
      :pagination="pagination"
      row-key="id"
      bordered
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="onEdit(record.id, record.name)">编辑</a-button>
            <a-button type="link" danger @click="onDelete(record.id)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script>
import axios from 'axios'
import { message } from 'ant-design-vue'
import graphApi from '../../api/graph.api'
import { deviceTopoCode } from './resources/serialPort'
import { nowTime } from '../../libs/time.js'
// 导入时用到的 id 和 name，传给 dialogs.js
import { sendImport_data } from './graph/Dialogs.js'

const DEFAULT_XML =
  '<mxGraphModel dx="320" dy="514" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'

export default {
  name: 'GraphList',
  data() {
    return {
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10,
        showTotal: (total) => `共 ${total} 条`
      },
      modal1: false,
      current_obj: { id: '', name: '' },
      reviewTime: nowTime(),
      save_DiagramIdName: '',
      diagramid: '',
      columns: [
        { title: '序号', key: 'index', width: 70, align: 'center', customRender: ({ index }) => index + 1 },
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: '大图名称', dataIndex: 'name', key: 'name' },
        { title: '操作人', dataIndex: 'createUserName', key: 'createUserName' },
        { title: '修改时间', dataIndex: 'createTime', key: 'createTime' },
        { title: '操作', key: 'action', width: 200 }
      ],
      topoData: [],
      page_Data: []
    }
  },
  created() {
    this.get_list()
  },
  methods: {
    handleTableChange(pag) {
      this.pagination.current = pag.current
    },
    cancel() {
      message.info('已取消')
    },
    saveTopos() {
      const name = this.save_DiagramIdName
      if (name) {
        graphApi.list().then((res) => {
          const last_Max = res.data.data.length
          const _one = '00'
          let _last = last_Max + 1
          this.diagramid = deviceTopoCode(_one, _last.toString())
          axios
            .post(window.SAVE_URL, {
              nowTime: this.reviewTime,
              id: this.diagramid,
              name,
              xml: DEFAULT_XML,
              userId: '0711000001',
              userName: 'admin'
            })
            .then((response) => {
              if (response.status === 200) {
                message.success(response.data.msg || '创建成功')
                this.modal1 = false
                this.get_list()
              }
            })
            .catch(() => {})
        })
      } else {
        message.warning('请输入Topo图名称')
      }
    },
    reportTopo() {},
    get_list() {
      graphApi.list().then((response) => {
        this.topoData = response.data.data
        this.pagination.total = response.data.data.length
      })
    },
    onEdit(id, name) {
      localStorage.removeItem('importObj')
      this.current_obj.id = id
      this.current_obj.name = name
      sendImport_data(this.current_obj) // 传给 dialogs.js
      this.$router.push('/grapheditor/' + id)
    },
    onDelete(id) {
      graphApi.delete(id).then((res) => {
        if (res.status === 200) {
          message.success((res.data && res.data.msg) || '删除成功')
          this.get_list()
        } else {
          message.error((res.data && res.data.msg) || '删除失败')
        }
      })
    }
  }
}
</script>

<style scoped>
.topoList {
  padding: 8px;
}
</style>
