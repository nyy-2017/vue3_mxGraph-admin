import router from './index'

// 跳到编辑页
export function custom_href(id) {
  return router.push('/grapheditor/' + id)
}

// 跳到新建页
export function to_add() {
  return router.push('/graphList')
}

// 跳转到列表页面
export function to_list() {
  return router.push('/graphList')
}
