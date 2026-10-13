import { message, Modal, notification } from 'ant-design-vue'

/**
 * 兼容层（bridge）：原 Vue2 项目通过 sendThis/editorThis/_this 把 Vue 实例 vm 传递给
 * mxGraph 编辑器核心（graph/*.js），核心代码大量使用 vm.$on / vm.$emit / vm.$refs /
 * vm.$message / vm.$Modal / vm.$alert / vm.$router 等实例方法。
 * Vue3 已移除 $on/$off/$once，这里用一个轻量外观对象（facade）实现相同的接口，
 * 使框架无关的编辑器核心代码可以零改动地在 Vue3 中运行。
 */
function createEmitter() {
  const map = Object.create(null)
  return {
    on(event, cb) {
      ;(map[event] = map[event] || []).push(cb)
      return this
    },
    once(event, cb) {
      const wrap = (...args) => {
        this.off(event, wrap)
        cb(...args)
      }
      return this.on(event, wrap)
    },
    off(event, cb) {
      if (!map[event]) return this
      if (cb) {
        map[event] = map[event].filter((f) => f !== cb)
      } else {
        delete map[event]
      }
      return this
    },
    emit(event, ...args) {
      ;(map[event] || []).slice().forEach((cb) => cb(...args))
      return this
    }
  }
}

export function createEditorBridge(router) {
  const emitter = createEmitter()
  const bridge = {
    // 由组件在挂载后填充子组件实例：bridge.$refs.addTypeDialog1 等
    $refs: {},
    $on(event, cb) {
      emitter.on(event, cb)
      return this
    },
    $once(event, cb) {
      emitter.once(event, cb)
      return this
    },
    $off(event, cb) {
      emitter.off(event, cb)
      return this
    },
    $emit(event, ...args) {
      emitter.emit(event, ...args)
      return this
    },
    $message: message,
    $Modal: Modal,
    $confirm: Modal.confirm,
    $alert(content, title) {
      Modal.warning({ title: title || '提示', content })
    },
    $notice: notification,
    $Notice: notification,
    $router: router
  }
  return bridge
}
