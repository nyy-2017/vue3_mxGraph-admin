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
// 编辑器面板样式必须全局导入：不能放在 <style scoped> 里用 @import，
// scoped 会给选择器附加 data-v 属性，而 mxgraph 动态创建的面板 DOM
// 没有 data-v 属性，导致 .geMenubarContainer 等样式全部失效、面板堆叠错乱
import './styles/grapheditor.css'
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
      // 防止重复初始化：再次 init 前清掉上一次 EditorUi 挂进容器的面板 DOM
      const container = document.getElementById('graphContainer')
      if (container) container.innerHTML = ''
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
      const id = this.$route.params.id
      if (id) {
        this.id = id
        graphApi.detail(id).then((res) => {
          const data = (res.data && res.data.data) || {}
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
    $route(to) {
      // 仅当仍停留在编辑器路由时才重新加载，避免离开页面时误触发 init
      if (to.name === 'grapheditor') {
        // 绑定 xml 跳转时重新加载
        this.loadDetail()
      }
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
/* 编辑器布局修复：
   EditorUi 会把菜单栏/工具栏/形状面板/画布等 absolute 定位的面板全部塞进
   #graphContainer，并按其 clientWidth/clientHeight 计算各面板尺寸。
   原先 .geEditor / #graphContainer 没有高度（在布局内容区里塌陷为 0），
   导致画布空白、面板错位。
   这里用 100% 撑满内容区可用高度（该路由 meta.fullHeight = true，
   内容区不滚动），不再写死 calc(100vh - 152px)，避免头部/页签高度变化
   时算不准而产生滚动条 */
.geEditor {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#graphContainer {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
