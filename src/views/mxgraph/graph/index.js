// 必须最先执行：Init.js 在 window 上定义 STENCIL_PATH / IMAGE_PATH 等全局，
// 后续 EditorUi.js / Sidebar.js / Graph.js 等模块顶层代码会读取这些全局
import './Init';

import mx from 'mxgraph';

// 该工厂函数内部通过 `this[name] = opts[name]` 拷贝参数，
// ESM 严格模式下直接 mx({...}) 调用会导致 this 为 undefined，
// 因此用 call 显式传入 this
const mxgraph = mx.call(mx, {
  mxBasePath: '/static/mxgraph',
});

// decode bug https://github.com/jgraph/mxgraph/issues/49
// window.mxGraph = mxgraph.mxGraph;
// window.mxGraphModel = mxgraph.mxGraphModel;
// window.mxEditor = mxgraph.mxEditor;
// window.mxGeometry = mxgraph.mxGeometry;
// window.mxDefaultKeyHandler = mxgraph.mxDefaultKeyHandler;
// window.mxDefaultPopupMenu = mxgraph.mxDefaultPopupMenu;
// window.mxStylesheet = mxgraph.mxStylesheet;
// window.mxDefaultToolbar = mxgraph.mxDefaultToolbar;

//vue用法，把上面所有的都注册了一遍
Object.keys(mxgraph).forEach((key)=>{
  window[key] = mxgraph[key]
});

// vue可以从这边导入(暂时没用)
export default mxgraph;