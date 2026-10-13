<template>
  <div class="geEditor">
    <div id="graphContainer"></div>
    <!-- 添加设备信息弹层 -->
    <add-device-dialog
      ref="addDeviceDialog1"
      :device-data="sendDeviceInfoData"
      @submit-device="getDevices_childChange"
    />
    <!-- 添加设备类型弹层 -->
    <add-type-dialog
      ref="addTypeDialog1"
      :type-data="sendTypeData"
      @submit="get_childChange"
    />
  </div>
</template>

<script>
import addDeviceDialog from './addDeviceDialog.vue'
import addTypeDialog from './addTypeDialog.vue'
import './graph/Init'
import mxgraph from './graph/index'
import Toolbar from './graph/Toolbar'
import EditorUi from './graph/EditorUi'
import Editor from './graph/Editor'
import './graph/Shapes'
import UrlParams from './graph/UrlParams'
import { Menus } from './graph/Menus'
import grapheditorTxt from './resources/grapheditor.txt?raw'
import defaultXml from './styles/default.xml?raw'
import graphApi from '../../api/graph.api'

import { sendThis } from './graph/Actions.js'
import { editorThis } from './graph/EditorUi.js'
import { _this } from './graph/Graph.js'
import { createEditorBridge } from '../../bridge/editorBridge'
import deviceLayoutData from './resources/deviceLayout.json'

const {
  mxGraph,
  mxOutline,
  mxEvent,
  mxCell,
  mxClient,
  mxGeometry,
  mxUtils,
  mxEventObject,
  mxConnectionHandler,
  mxRubberband,
  mxToolbar,
  mxResources,
  mxCodec,
  mxCodecRegistry,
  MXUTILITIES
} = mxgraph

import { Graph } from './graph/Graph'

export default {
  name: 'Grapheditor',
  components: { addTypeDialog, addDeviceDialog },
  data() {
    return {
      returnAutoDrawData: null,
      sendTypeData: {},
      sendDeviceInfoData: {},
      child_devicesData: null,
      child_typeData: null,
      id: '',
      name: '',
      xml: '',
      bridge: null
    }
  },
  methods: {
    init() {
      const self = this
      const editorUiInit = EditorUi.prototype.init
      EditorUi.prototype.init = function () {
        editorUiInit.apply(this, arguments)
        // Updates action states which require a backend
        this.actions.get('open').setEnabled(true)
      }
      // Adds required resources (disables loading of fallback properties)
      mxResources.loadDefaultBundle = false
      mxResources.parse(grapheditorTxt)

      // Configures the default graph theme
      const themes = new Object()
      themes[Graph.prototype.defaultThemeName] = mxUtils.parseXml(defaultXml).documentElement

      // Main
      const mEditorUi = new EditorUi(
        new Editor(UrlParams['chrome'] == '0', themes),
        document.getElementById('graphContainer')
      )
      const mGraph = mEditorUi.editor.graph

      if (self.xml) {
        mEditorUi.editor._id = self.id
        mEditorUi.editor.filename = self.name
        mGraph.getModel().beginUpdate()
        try {
          const doc = mxUtils.parseXml(self.xml)
          const root = doc.documentElement
          const dec = new mxCodec(root.ownerDocument)
          dec.decode(root, mGraph.getModel()) // 渲染图形
          mGraph.refresh()
          // 去掉虚线
          mEditorUi.setPageVisible(!mGraph.pageVisible)
        } finally {
          mGraph.getModel().endUpdate()
        }
      }
    },
    // 绑定设备信息 子传父 -> 转发给编辑器核心
    getDevices_childChange(val) {
      this.bridge.$emit('transfer_device', val)
    },
    // 添加设备类型 子传给父 -> 转发给编辑器核心
    get_childChange(data) {
      this.bridge.$emit('transfer_type', data, deviceLayoutData)
    },
    loadDetail() {
      if (this.$route.params.hasOwnProperty('id')) {
        this.id = this.$route.params.id
        graphApi.detail(this.id).then((res) => {
          const data = res.data.data
          this.name = data.name
          this.xml = data.xml
          this.init()
        })
      } else {
        this.init()
      }
    }
  },
  watch: {
    $route() {
      // 绑定 xml 跳转时重新加载
      this.loadDetail()
    }
  },
  mounted() {
    // 构建编辑器核心与 Vue3 之间的桥接外观对象
    this.bridge = createEditorBridge(this.$router)
    sendThis(this.bridge) // 传给 Actions.js
    editorThis(this.bridge) // 传给 EditorUi.js
    _this(this.bridge) // 传给 Graph.js

    // 填充子组件引用，供编辑器核心打开弹层
    this.bridge.$refs.addTypeDialog1 = this.$refs.addTypeDialog1
    this.bridge.$refs.addDeviceDialog1 = this.$refs.addDeviceDialog1

    // 编辑器核心通过事件把弹层数据回传给 Vue 层
    this.bridge.$on('watchForm_type', (val) => {
      this.sendTypeData = val
    })
    this.bridge.$on('watchForm_device', (data) => {
      this.sendDeviceInfoData = data
    })

    this.loadDetail()
  },
  beforeUnmount() {
    if (this.bridge) {
      this.bridge.$off('watchForm_type')
      this.bridge.$off('watchForm_device')
    }
  }
}
</script>

<style scoped>
@import './styles/grapheditor.css';
</style>
