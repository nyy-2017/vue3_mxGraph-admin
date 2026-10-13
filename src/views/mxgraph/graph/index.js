import mx from 'mxgraph';

const mxgraph = mx({
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