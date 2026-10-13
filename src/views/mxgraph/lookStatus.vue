<template>
  <div>
    <!-- 设备树结构组件 -->
    <device-tree @send_selectID="checked_change" />
    <div id="graphContainer2"></div>
  </div>
</template>

<script>
import deviceTree from './statusModal/deviceTree.vue'
// grapheditor.css 必须全局导入：scoped 里的 @import 会被附加 data-v 属性，
// 与 mxgraph 动态创建的面板 DOM 不匹配，导致编辑器样式全部失效
import './styles/grapheditor.css'
import './graph/Init'
import mxgraph from './graph/index'
import Toolbar from './graph/Toolbar'
import EditorUi from './graph/EditorUi2'
import Editor from './graph/Editor'
import './graph/Shapes'
import UrlParams from './graph/UrlParams'
import { Menus } from './graph/Menus'
import grapheditorTxt from './resources/grapheditor.txt?raw'
import defaultXml from './styles/default.xml?raw'
import graphApi from '../../api/graph.api'
import { io } from 'socket.io-client'

const {
  mxGraph,
  mxConstants,
  mxOutline,
  mxEvent,
  mxCell,
  mxGeometry,
  mxUtils,
  mxEventObject,
  mxConnectionHandler,
  mxRubberband,
  mxToolbar,
  mxResources,
  mxCodec
} = mxgraph

import { Graph } from './graph/Graph'

// socket 服务地址（按实际后端调整）
const SOCKET_URL = 'ws://192.168.25.41:7001/'

export default {
  name: 'LookStatus',
  components: { deviceTree },
  data() {
    return {
      mGraph: null,
      socket: null,
      send_socketArr: [],
      new_arry: [],
      checkedId: '',
      name: '',
      xml: null,
      showXmlData: [],
      new_showXmlData: [],
      flage: false
    }
  },
  methods: {
    // 子组件 deviceTree.vue 传过来的 selectid
    checked_change(id) {
      if (id) {
        this.checkedId = id
        graphApi.detail(this.checkedId).then((res) => {
          if (this.socket) this.socket.close()
          const data = res.data.data
          this.name = data.name
          this.xml = data.xml
          this.init()
          if (this.send_socketArr.length > 0) this.connectSocket()
        })
      }
    },
    init() {
      const self = this
      const editorUiInit = EditorUi.prototype.init
      EditorUi.prototype.init = function () {
        editorUiInit.apply(this, arguments)
      }

      mxResources.loadDefaultBundle = false
      mxResources.parse(grapheditorTxt)

      const themes = new Object()
      themes[Graph.prototype.defaultThemeName] = mxUtils.parseXml(defaultXml).documentElement

      const mEditorUi = new EditorUi(
        new Editor(UrlParams['chrome'] == '0', themes),
        document.getElementById('graphContainer2')
      )
      const mGraph = mEditorUi.editor.graph
      self.mGraph = mGraph
      mGraph.setEnabled(false)
      mGraph.getView().updateStyle = true
      mGraph.setResizeContainer(true)
      mGraph.setCellsResizable(false)
      mGraph.edgeLabelsMovable = false
      mGraph.setVertexLabelsMovable(true)

      if (self.xml) {
        mEditorUi.editor._id = self.id
        mEditorUi.editor.filename = self.name
        mGraph.getModel().beginUpdate()
        try {
          const doc = mxUtils.parseXml(self.xml)
          const root = doc.documentElement
          const dec = new mxCodec(root.ownerDocument)
          dec.decode(root, mGraph.getModel())

          const xmlArry = []
          dec.objects.map((k) => {
            if (k) xmlArry.push(k)
          })
          self.showXmlData = xmlArry
          xmlArry.forEach((v) => {
            if (v.deviceId && v.deviceId !== undefined) {
              v.deviceId = v.deviceId.toString()
              const _num = v.deviceId
              const m = 17
              v.deviceId = (Array(m).join(0) + _num).slice(-m)
              self.send_socketArr.push(v.deviceId)
              self.send_socketArr = [...new Set(self.send_socketArr)]
            }
          })
        } finally {
          mGraph.getModel().endUpdate()
        }
      }
    },
    // socket 返回的状态改变
    changeStatus() {
      const mGraph = this.mGraph
      const allCells = Object.values(mGraph.getModel().cells)
      const xmlArry = allCells.filter((k) => k)
      this.showXmlData = xmlArry
      xmlArry.forEach((v) => {
        if (v.deviceId && v.deviceId !== undefined) {
          v.deviceId = v.deviceId.toString()
          const _num = v.deviceId
          const m = 17
          v.deviceId = (Array(m).join(0) + _num).slice(-m)
          this.send_socketArr.push(v.deviceId)
          this.send_socketArr = [...new Set(this.send_socketArr)]
        }
      })

      if (this.flage) {
        this.new_showXmlData.forEach((v) => {
          mGraph.getModel().beginUpdate()
          try {
            let imgNumber = '11'
            let showStatusName = ''
            if (v && v.deviceId && v.deviceId !== undefined && v.deviceName && v.statusLevel) {
              showStatusName = v.statusValue
              if (v.statusLevel === 0) imgNumber = '11'
              else if (v.statusLevel === 1) imgNumber = '02'
              else if (v.statusLevel === 2) imgNumber = '10'
              else if (v.statusLevel === 3) imgNumber = '11'
              else if (v.statusLevel === 4) imgNumber = '03'
              else if (v.statusLevel === -1) imgNumber = '04'
              else {
                showStatusName = v.statusValue
                imgNumber = '11'
              }
            }
            const newCell = xmlArry[this.new_showXmlData.indexOf(v)]
            if (newCell && newCell.style) {
              const _str = newCell.style
              if (_str.indexOf('html=1') !== -1 && _str.indexOf('image') !== -1 && _str.indexOf('image=') !== -1) {
                const temp = newCell.style.split(';')
                temp.forEach((vv, index) => {
                  if (temp[index].indexOf('image=') !== -1) {
                    const imgStyle1 = temp[index]
                    const font = imgStyle1.substring(0, imgStyle1.lastIndexOf('/'))
                    const behind = imgStyle1.substring(imgStyle1.lastIndexOf('/') + 1)
                    const end1 = behind.split('-')[0]
                    const end2 = behind.substring(0, 0) + imgNumber.toString() + behind.substring(2)
                    temp[index] = font + '/' + end1 + '-' + end2
                    newCell.style = 'image;html=1;' + temp[index] + ';'
                  }
                })
              }
              mGraph.setAttributeForCell(newCell, '设备名称', v.deviceName)
              mGraph.setAttributeForCell(newCell, '在线状态', showStatusName)
              mGraph.setAttributeForCell(newCell, '状态级别', showStatusName)
            }
          } finally {
            mGraph.getModel().endUpdate()
          }
        })
      }
    },
    // 封装 websocket（socket.io-client）
    connectSocket() {
      if (typeof io !== 'function') {
        this.$message && this.$message.error('socket.io-client 未加载')
        return
      }
      this.socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true })
      this.socket.on('connect', () => {
        this.socket.emit('subscribe', this.send_socketArr)
      })
      // 兼容任意事件名的服务端推送
      this.socket.onAny((event, ...args) => {
        const payload = args[0] !== undefined ? args[0] : event
        this.onMessage(payload)
      })
      this.socket.on('disconnect', () => {
        // 断线由 reconnection 自动重连
      })
    },
    onMessage(message) {
      const webstockArr = typeof message === 'string' ? JSON.parse(message) : message
      if (!webstockArr) return
      if (this.showXmlData.length <= 0 || webstockArr.length <= 0) return
      webstockArr.forEach((k) => {
        const index = this.new_arry.findIndex((v) => v.id === k.deviceId)
        if (index > -1) {
          this.new_arry[index].name = k.deviceName
          this.new_arry[index].level = k.alarmLevel
          this.new_arry[index].status = k.alarmValue
        } else {
          this.new_arry.push({ id: k.deviceId, name: k.deviceName, level: k.alarmLevel, status: k.alarmValue })
        }
      })
      this.showXmlData.forEach((v) => {
        this.new_arry.forEach((k) => {
          if (v.deviceName && v.deviceId && v.deviceId === k.id) {
            v.statusLevel = k.level
            v.statusValue = k.status
          }
        })
      })
      this.new_showXmlData = this.showXmlData
    }
  },
  watch: {
    new_showXmlData(val) {
      for (let i = 0; i < val.length; i++) {
        if (val[i].deviceId && val[i].deviceId !== undefined && val[i].deviceName && val[i].statusLevel) {
          this.flage = true
        }
      }
      if (this.flage) this.changeStatus()
    }
  },
  mounted() {},
  beforeUnmount() {
    if (this.socket) this.socket.close()
    this.showXmlData = []
    this.new_showXmlData = []
    this.send_socketArr = []
  }
}
</script>

<style scoped>
#graphContainer2 {
  width: 100%;
  height: 100%;
  min-height: 780px !important;
  position: relative;
  top: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
#graphContainer2 .geDiagramContainer.geDiagramBackdrop {
  top: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
}
#graphContainer2 .geBackgroundPage {
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
}
#graphContainer2 .geDiagramContainer.geDiagramBackdrop svg {
  cursor: pointer;
  background: url('/static/images/bgimg.png') no-repeat !important;
}
</style>
