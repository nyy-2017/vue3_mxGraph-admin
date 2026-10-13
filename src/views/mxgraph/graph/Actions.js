import graphApi from "../../../api/graph.api";
import axios from 'axios';
import mxgraph from './index';
import Editor from './Editor';
import {ChangePageSetup} from './EditorUi';
import mxFreehand from './mxFreehand'
import mxSettings from './Settings'
import { mxRuler, mxDualRuler} from './mxRuler'
import {HoverIcons} from './Graph'
import {OpenFile, Dialog, ErrorDialog, PrintDialog, PageSetupDialog} from './Editor';

import deviceTypeLegendName from '../resources/legend.json'
import resultData from '../../mxgraph/resources/deviceLayout.json'

// vm 是vue实例
var vm = null;
export function sendThis( _this ) {
  vm = _this;
}

import {
  AddDeviceTypeDialog,
  AboutDialog,
  BindXMLDialog,
  ColorDialog,
  EditDiagramDialog,
  ExportDialog,
  EditDataDialog,
  EditShapeDialog,
  FilenameDialog,
  FreehandWindow,
  LayersWindow,
  LinkDialog,
  createLegendDialog,
  SelectDialog,
  OpenDialog,
  OpenFileDialog2,
  OutlineWindow,
  TextareaDialog,
} from './Dialogs';

import {to_add} from '../../../router/navigate'; //跳转到新建页
import {to_list} from '../../../router/navigate'; //跳转到列表页
const {
  mxGraph,
  mxVertexHandler,
  mxConstants,
  mxCell,
  mxCellState,
  mxPerimeter,
  mxCellEditor,
  mxClient,
  mxClipboard,
  mxCodec,
  mxCodecRegistry,
  mxConnectionConstraint,
  mxGraphHandler,
  mxGeometry,
  mxEvent,
  mxEdgeHandler,
  mxEventObject,
  mxEventSource,
  mxShape,
  mxPoint,
  mxObjectCodec,
  mxUtils,
  mxImageExport,
  mxXmlCanvas2D,
  mxResources,
  mxPopupMenu,
  mxRectangle,
} = mxgraph;

/**
 * Copyright (c) 2006-2020, JGraph Ltd
 * Copyright (c) 2006-2020, draw.io AG
 *
 * Constructs the actions object for the given UI.
 */
function Actions(editorUi) {
  this.editorUi = editorUi;
  this.actions = new Object();
  this.init();
};

/**
 * Adds the default actions.
 */
Actions.prototype.init = function () {
  var ui = this.editorUi;
  var editor = ui.editor;
  var graph = editor.graph;
  var isGraphEnabled = function () {
    return Action.prototype.isEnabled.apply(this, arguments) && graph.isEnabled();
  };

  //返回上一步
  this.addAction('backToPreviousStep', function () {
    // window.location.href = document.referrer;
    window.history.back(-1);
  }, null, null, '快捷键');

  //返回列表页
  this.addAction('backToList', function () {
    to_list(); //跳转到列表页面
  });

  //自动绘制按钮、
  this.addAction('autoDraw', function (click) {
    if (click){
      //调查询图例的接口
      graphApi.detail("886600005").then((res) => {
        if (res.status == '200') {
          console.log("查询:", res.data.data);
          let set_xml = res.data.data.xml;
          //存xml的内容
          localStorage.setItem('set_xml', JSON.stringify(set_xml));
  
          // 拿到接口里面的xml 更新画布
          if (set_xml) {
            ui.editor._id = res.data.data.id;
            ui.editor.filename = res.data.data.name;
            graph.getModel().beginUpdate();
            try {
              var doc = mxUtils.parseXml(set_xml);
              ui.editor.graph.importGraphModel(doc.documentElement)
            } finally {
              graph.getModel().endUpdate();
            }
          }
        }
      }).catch(()=>{}).then(()=> {

        //调自动布局的接口
        // 自己写, 下面一堆东西都放在接口里面

        //3. 获取画布中隐藏的数据
        var flage1 = false;
        var styles = [];
        //当前画布的cell
        graph.selectAll(null, true); // 全选
        let currentCells = Object.values(graph.getModel().cells);
        console.log("currentCells:", currentCells);
        currentCells.forEach(v=> {
          if(v.style && v.type && v.style.indexOf("image;html=1;") !== -1){
            // console.log("v.style:", v.style)
            flage1 = true;
            styles.push({type: v.type, style: v.style})
          }
        });

        //styles过滤
        let new_types = [];
        let new_styles = []
        styles.map(v => {
          if(new_types.indexOf(v.type) == -1){
            new_types.push(v.type.toString());
            new_styles.push(v)
          }
        });
        new_types = [...new Set(new_types)];
        console.log("过滤后的数据:", new_styles, new_types);

        //取出来后台返回数据里面的所有 type
        let result_type = [];
        resultData.deviceList.map(v=>{
          result_type.push(v.type)
        })
        result_type = [...new Set(result_type)];

        //回调
        var drawFlag = false;
        isInclude(new_types, result_type, drawFlag);
        //判断 当前绑定的数组 new_types 是否 包含后台返回的数组 result_type 里面的每一项
        function isInclude(ary, bry){
          var itemAry = [];
          // console.log("+++++", ary, bry)
          ary.map(item=>{
            bry.map(k=>{
              if(item == k){
                itemAry.push(k)
              }
            })
          })
          // console.log("+++++", itemAry, bry)
          if(itemAry.length == bry.length){
            return drawFlag = true
          }else{
            return drawFlag = false
          }
        }
      // console.log("状态:", drawFlag);
      // console.log("自动绘制后台返回数据:", resultData);
      //模拟后台返回数据才加载下面自定义的组装结构
        var raw = resultData;
        //组装自己需要的数据结构
        var resultTopoData = [];
        raw.deviceList.map(v=>{
          let target_node = [];
          raw.lines.map(line=>{
            if (v.deviceId === line.id1){
              target_node.push(line.id2)
            }
          })
          resultTopoData.push({
            ...v,
            target_node: target_node
          })
        })
        // console.log("模拟后台返回数据:", resultTopoData);

        //typeStyles: 取出
        let typeStyles = JSON.parse(localStorage.getItem('typeStyles'));

        // console.log("new_styles????:", new_styles, typeStyles);

        //三元表达式判断一下
        new_styles = new_styles.length > 0 ? new_styles : typeStyles ;

 
        if(flage1 && drawFlag === true ) {
          // 1. 渲染前删除所有以前的数据
            //替换最新的数据
            graph.selectAll(null, true); // 全选
            let selectionCells = graph.getSelectionCells();
            console.log("selectionCells:", selectionCells);
            selectionCells.map(v=>{
              if(v.value && v.style && v.showFlage ){
                graph.removeCells([v], true);//删除
              } 
            })
            graph.clearSelection(); //全不选

          //2. 根据type值做一个图形的映射表 渲染树状图部分结构
          //let allLine_Style = 'endArrow=none;html=1;'; // 直线 
          //let allLine_Style = 'endArrow=none;html=1;strokeColor=#00FF80;'; // 线的变色
          let allLine_Style = 'endArrow=none;html=1;strokeColor=#2398ce;entryX=0.5;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=0;exitX=0.5;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=0';

          // let allLine_Style = 'rounded: "0"; jettySize:"auto"; orthogonalLoop:"1"'; //单箭头，直线箭头
          let new_cellData = [];
          //2.1 根据图例组装cell
          resultTopoData.map( (v, i)=>{
            let source = new mxCell();
            new_styles.map(k=>{
              if( v.type == k.type){
                source.style = k.style;
                source.showFlage = true;
              }
            })

            //从上往下布局
            if( v.target_node.length >1 ){

              source.geometry = new mxGeometry( 100 * i, 180 * v.level + 20, 65, 60);

            } else if( v.target_node.length <= 0 ){

              source.geometry = new mxGeometry( ((90 * v.type) - 350), 180 * v.level + 20, 65, 60);
    
            } else {

              source.geometry = new mxGeometry( 100 * (i+1), 180 * v.level + 20, 65, 60);
            }
    
            source.vertex = true;
            source.value = "名称:" + v.name;
            source.autoMark = 'autoMark';
            source.deviceId = v.deviceId;
            source.deviceName = v.name;
            source.statusLevel = "0"; 
            source.statusValue = "";
            source.target_node = v.target_node;
            new_cellData.push(source);
          })
          //2...1 把组装好的cell 添加到画布上去
          // graph.addCells(new_cellData);
          //2.2 添加关系指向箭头
          new_cellData.map((cell) => {
            let source = cell;
            let targets = cell.target_node;
            targets.map(id => { 
              new_cellData.map(v => { 
                if(v.deviceId == id) {
                  let target = v;
                  let ce = graph.insertEdge(graph.model.getParent(source), null, '', source, target, allLine_Style);
                  graph.setSelectionCell(ce)
                }
              })
            })
          })
            //先画线、在画图 线就会置于图片底层
            graph.addCells(new_cellData);
          
            //布局方式一、
            // 水平树状布局   
            var tmp = graph.getSelectionCell();
            var roots = null;

            if (tmp == null || graph.getModel().getChildCount(tmp) == 0) {
              if (graph.getModel().getEdgeCount(tmp) == 0) {
                roots = graph.findTreeRoots(graph.getDefaultParent());
              }
            } else {
              roots = graph.findTreeRoots(tmp);
            }

            if (roots != null && roots.length > 0) {
              tmp = roots[0];
            }

            if (tmp != null) {
              //水平树状布局 
              // var layout = new mxCompactTreeLayout(graph) 
              
              //垂直树状布局
              var layout = new mxCompactTreeLayout(graph, false); 
              layout.edgeRouting = false;
              layout.levelDistance = 30;
              layout.execute(graph.getDefaultParent(), tmp);

                //最后清除
                graph.selectAll(null, true); // 全选
                const selectionCells = graph.getSelectionCells();
                console.log("最后选中所有cell:", selectionCells);
                selectionCells.map(v=>{
                  if (v.value && v.value.indexOf("......") != -1){
                    graph.removeCells([v], true); //删除
                  }

                  if (v.value == "" && v.style.indexOf("image;html=1;") != -1){
                    graph.removeCells([v], true); //删除
                  }
                })
                //更新视图
                graph.refresh()

                graph.selectAll(null, true); // 全选
                const resultCells = graph.getSelectionCells();
                console.log("resultCells+++++:", resultCells);
            }
            graph.clearSelection(); //全不选
        } else {
          //当绑定的设备类型不足时，提示一下
          vm.$Message.error('当前需要的设备类型数量不足!!!');
        }
      })
    }
  });

  //图例获取、
  this.addAction('legendObtain', function () {

    //调查询图例的接口
    graphApi.detail("886600005").then((res) => {
      if (res.status == '200') {
        // console.log("查询:", res.data.data);
        let set_xml = res.data.data.xml;
        localStorage.setItem('set_xml',JSON.stringify(set_xml));
        // 拿到接口里面的xml 更新画布
        if (set_xml) {
          ui.editor._id = res.data.data.id;
          ui.editor.filename = res.data.data.name;
          graph.getModel().beginUpdate();
          try {
            var doc = mxUtils.parseXml(set_xml);
            ui.editor.graph.importGraphModel(doc.documentElement)
          } finally {
            graph.getModel().endUpdate();
          }
        }
      }
    })

  });

  // 图例保存、
  this.addAction('legendSave', function () {

    //获取当前画布的xml文件内容
    var xml = mxUtils.getXml(ui.editor.getGraphXml());
    console.log("图例保存xml:", xml);

    //图例保存的接口
    axios.put(SAVE_URL, {
      id: '886600005',
      name:'布局测试.xml',  //deviceTypeLegendName.legendname ? deviceTypeLegendName.legendname : 'deviceTypeLegend',
      xml: xml
    }).then((res) => {
      if (res.status == '200') {
        console.log("图例保存:", res.data);
      }
    })

  });
  
  // File actions //  new open  import export print 后面的 ... 去除
  //新建
  this.addAction('new', function () {
    to_add(); //跳转到新建页
    // graph.openLink(ui.getUrl());
  });
  // open 菜单
  // this.addAction('open', function () {
  //   window.openNew = false;
  //   window.openKey = 'open';
  //   ui.openFile();
  // });

  //open 打开本地xml文件
  this.addAction('open', mxUtils.bind(this, function () {
    window.openNew = false;
    window.openKey = 'open';
    // ui.openFile();
    var dlg = new OpenFileDialog2(this.editorUi, mxResources.get('open') + ':',
      null,
      function (val) {
        console.log("open xml数据：", val);
        if (val != null) {
          ui.open2(val.xml, val.filename, val.id)
        }
      }, null, null, 300, 200);
    this.editorUi.showDialog(dlg.container, 370, 180, true, true);
    dlg.init();
  }));

  //导入xml文件菜单
  this.addAction('import...', mxUtils.bind(this, function () {
    window.openNew = false;
    window.openKey = 'import';
    var dlg = new OpenFileDialog2(this.editorUi, mxResources.get('import') + ':', null,
      function (val) {
        console.log("导入xml数据：", val);
        if (val != null) {
          ui.open2(val.xml, val.filename, val.id)
          try {
            var doc = mxUtils.parseXml(val.xml);
            editor.graph.setSelectionCells(editor.graph.importGraphModel(doc.documentElement));
          } catch (e) {
            //导入时提示无效的文件
            mxUtils.alert(mxResources.get('invalidOrMissingFile') + ': ' + e.message);
          }
        }
      }, null, null, 300, 200);

    this.editorUi.showDialog(dlg.container, 370, 180, true, true);
    dlg.init();

  })).isEnabled = isGraphEnabled;



  //此方法暂时不用！！！
  this.addAction('import', function () {
    window.openNew = false;
    window.openKey = 'import';

    // Closes dialog after open
    window.openFile = new OpenFile(mxUtils.bind(this, function () {
      ui.hideDialog();
    }));

    window.openFile.setConsumer(mxUtils.bind(this, function (xml, filename) {
      try {
        var doc = mxUtils.parseXml(xml);
        editor.graph.setSelectionCells(editor.graph.importGraphModel(doc.documentElement));
      } catch (e) {
        mxUtils.alert(mxResources.get('invalidOrMissingFile') + ': ' + e.message);
      }
    }));

    // Removes openFile if dialog is closed
    ui.showDialog(new OpenDialog(this).container, 320, 220, true, true, function () {
      window.openFile = null;
    });
  }).isEnabled = isGraphEnabled;

  //保存TOPO图
  this.addAction('saveTopo', function () {
    // ui.saveFile(false);
    ui.savePutFile(false); //最新的保存接口
  });

  //保存
  // this.addAction('save', function () {
  //   ui.saveFile(false);
  // }, null, null, Editor.ctrlKey + '+S').isEnabled = isGraphEnabled;

  //另存为
  // this.addAction('saveAs...', function () {
  //   ui.saveFile(true);
  // }, null, null, Editor.ctrlKey + '+Shift+S').isEnabled = isGraphEnabled;

  //导出
  this.addAction('export', function () {
    ui.showDialog(new ExportDialog(ui).container, 300, 296, true, true);
  });

  // 页面设置
  this.addAction('pageSetup...', function () {
    ui.showDialog(new PageSetupDialog(ui).container, 320, 220, true, true);
  }).isEnabled = isGraphEnabled;

  //打印
  this.addAction('print', function () {
    ui.showDialog(new PrintDialog(ui).container, 300, 180, true, true);
  }, null, 'sprite-print', Editor.ctrlKey + '+P');

  // 编辑图形
  this.addAction('editDiagram...', function () {
    var dlg = new EditDiagramDialog(ui);
    ui.showDialog(dlg.container, 620, 420, true, false);
    dlg.init();
  });

  //预览——打印地方
  this.addAction('preview', function () {
    mxUtils.show(graph, null, 10, 10);
  });

  // Edit actions
  //撤销
  this.addAction('undo', function () {
    ui.undo();
  }, null, 'sprite-undo', Editor.ctrlKey + '+Z');

  //重做
  this.addAction('redo', function () {
    ui.redo();
  }, null, 'sprite-redo', (!mxClient.IS_WIN) ? Editor.ctrlKey + '+Shift+Z' : Editor.ctrlKey + '+Y');

  //裁切
  this.addAction('cut', function () {
    mxClipboard.cut(graph);
  }, null, 'sprite-cut', Editor.ctrlKey + '+X');

  //拷贝
  this.addAction('copy', function () {
   	try {
		mxClipboard.copy(graph);
	} catch (e) {
		ui.handleError(e);
	}  
  }, null, 'sprite-copy', Editor.ctrlKey + '+C');

  //粘贴
  this.addAction('paste', function () {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      mxClipboard.paste(graph);
    }
  }, false, 'sprite-paste', Editor.ctrlKey + '+V');

  //粘贴到此处
  this.addAction('pasteHere', function (evt) {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      graph.getModel().beginUpdate();
      try {
        var cells = mxClipboard.paste(graph);
        if (cells != null) {
          var includeEdges = true;
          for (var i = 0; i < cells.length && includeEdges; i++) {
            includeEdges = includeEdges && graph.model.isEdge(cells[i]);
          }
          var t = graph.view.translate;
          var s = graph.view.scale;
          var dx = t.x;
          var dy = t.y;
          var bb = null;
          if (cells.length == 1 && includeEdges) {
            var geo = graph.getCellGeometry(cells[0]);
            if (geo != null) {
              bb = geo.getTerminalPoint(true);
            }
          }

          bb = (bb != null) ? bb : graph.getBoundingBoxFromGeometry(cells, includeEdges);
          if (bb != null) {
            var x = Math.round(graph.snap(graph.popupMenuHandler.triggerX / s - dx));
            var y = Math.round(graph.snap(graph.popupMenuHandler.triggerY / s - dy));
            graph.cellsMoved(cells, x - bb.x, y - bb.y);
          }
        }
      } finally {
        graph.getModel().endUpdate();
      }
    }
  });

  //拷贝尺寸
  this.addAction('copySize', function (evt) {
    var cell = graph.getSelectionCell();
    if (graph.isEnabled() && cell != null && graph.getModel().isVertex(cell)) {
      var geo = graph.getCellGeometry(cell);
      if (geo != null) {
        ui.copiedSize = new mxRectangle(geo.x, geo.y, geo.width, geo.height);
      }
    }
  }, null, null, 'Alt+Shift+X');

  //粘贴大小
  this.addAction('pasteSize', function (evt) {
    if (graph.isEnabled() && !graph.isSelectionEmpty() && ui.copiedSize != null) {
      graph.getModel().beginUpdate();
      try {
        var cells = graph.getSelectionCells();
        for (var i = 0; i < cells.length; i++) {
          if (graph.getModel().isVertex(cells[i])) {
            var geo = graph.getCellGeometry(cells[i]);
            if (geo != null) {
              geo = geo.clone();
              geo.width = ui.copiedSize.width;
              geo.height = ui.copiedSize.height;
              graph.getModel().setGeometry(cells[i], geo);
            }
          }
        }
      } finally {
        graph.getModel().endUpdate();
      }
    }
  }, null, null, 'Alt+Shift+V');
  
  //删除cells
	function deleteCells(includeEdges) {
		// Cancels interactive operations
		graph.escape();
		var select = graph.deleteCells(graph.getDeletableCells(graph.getSelectionCells()), includeEdges);

		if (select != null) {
			graph.setSelectionCells(select);
		}
	};

  //添加设备类型--deviceType
  this.addAction('addDeviceType', mxUtils.bind(this, function (e) {
    var cells = graph.getSelectionCells();
    // console.log("cells[0]:", cells[0]);
    var preDeviceInfo = {
      type: cells[0].type,
      name: cells[0].name,
      style:  cells[0].type ? cells[0].style : '',
      isVisibleName:  cells[0].isVisibleName || '1',
    };
    console.log('vm:', vm);
    vm.$refs.addTypeDialog1.type_modal = true; //打开设备类型弹层
    vm.$emit( 'watchForm_type', preDeviceInfo);
    let _flag = true;
    vm.$on('transfer_type', (val) => { 
      if(_flag){
        console.log('val+++++:', val);
        let cells = graph.getSelectionCells();
        var allCells = Object.values(graph.getModel().cells); //当前页面所有的
        addTypeFnc(val, cells, allCells)
      }
      _flag = false;
    })

    function addTypeFnc(get_typeData, cells, allCells) { 
      //get_typeData是形参,可以自定义
      if (get_typeData) {
        console.log('点击应用后设备类型数据：', get_typeData);
        console.log("设备类型数据：", cells[0]);
        var typeArry = [{
          style: get_typeData.style,
          type: get_typeData.type,
          name: get_typeData.name,
          visible: get_typeData.isVisibleName,
          bindMark: 'bindMark',
          x: 150,
          y: (-40),
        }]
        
        // 新增cell
        if (!get_typeData.style) {
          console.log('新增设备类型：', typeArry);
          for (var i = 0; i < typeArry.length; i++) {
            console.log('图例title', cells[0], typeArry[i])
            cells.push(graph.addTextNodeStyle(e, cells[0], typeArry[i]))
          }
          cells[0].type = get_typeData.type;
          cells[0].name = get_typeData.name;
          cells[0].isVisibleName = get_typeData.isVisibleName;

        } else{
          //修改cell
          console.log('修改设备图型：', cells);
          // 1 修改绑定名的隐藏和显示
          let cellsId = cells[0].id
          let textCell
          allCells.map(v=>{
            if(v.data_id == cellsId) {
              console.log(v, '设备名称cell')
              v.visible = get_typeData.isVisibleName == '1'
              console.log(v, '设备名称cell2')
              textCell = v
            }
          })
          // 2 修改图形样式
          cells[0].style = get_typeData.style;
          cells[0].isVisibleName = get_typeData.isVisibleName;
          var model = graph.getModel();
          var clone = model.cloneCell(cells[0], true)
          clone.style = get_typeData.style;
          graph.removeCells(cells, true);//删除
          graph.addCell(clone);
          textCell.data_id = clone.id
          console.log(clone, clone.id, textCell,'clone新图形')
  
          //更新视图
          graph.refresh()
        }
        // console.log("typeArry1:",typeArry,allCells);

        // 1. 收集已创建好的图列数据
        //typeStyles: 先清除
        localStorage.removeItem('typeStyles'); 
        var typeStyles = [];
        allCells.map(v=>{
          if(v.type && v.value == ""){
            typeStyles.push({ type: v.type, style: v.style });
          }
          //清除之前存在的styles
          if( v.styles) {
            // delete v.styles
            graph.removeCells([v], true);
          }

        })

        //typeStyles: 手动创建的时候存里面
        localStorage.setItem('typeStyles', JSON.stringify(typeStyles)); 

        console.log("typeStyles:", typeStyles);
        //2. 画布  存储图例信息在 types_cell 中，以便于渲染的时候使用
        let types = new mxCell();
        types.geometry = new mxGeometry();
        types.vertex = true;
        types.styles = typeStyles;
        graph.addCell(types);
        console.log("graph:", allCells)

        //更新视图
        graph.refresh()  
      }
    }
    
  }), null, null, '快捷键');

  //绑定设备--deviceId
  this.addAction('bindingDeviceId', mxUtils.bind(this, function (e) {
    var cells = graph.getSelectionCells();
    // var allCells = Object.values(graph.getModel().cells); //当前页面所有的
    var preDeviceInfo = {};
    console.log("cells[0]:", cells[0]);
    // 1 点击的cell 为组
    if(cells[0].style.startsWith('group')){
      preDeviceInfo = {
        deviceId: cells[0].allDeviceIds || [],
        deviceName: cells[0].allDeviceNames,
        name: cells[0].allDeviceNames,
        desc: cells[0].allDeviceDesc,
        isVisibleName: cells[0].isVisibleName || '1',
        isVisibleDesc: cells[0].isVisibleDesc || '1',
        isVisibleGroup: cells[0].isVisibleGroup || '1',
        isVisiblePosition: cells[0].isVisiblePosition || '1'
      };
      
    } else {
      // 2 点击的cell 不为组
      preDeviceInfo = {
        deviceId: cells[0].deviceId ? [ String(cells[0].deviceId).length == 17 ? String(cells[0].deviceId) : '0'+ String(cells[0].deviceId)] : [],
        deviceName: cells[0].deviceName,
        name: cells[0].deviceName,
        desc: cells[0].desc,
        isVisibleName: cells[0].isVisibleName || '1',
        isVisibleDesc: cells[0].isVisibleDesc || '1',
        isVisibleGroup: cells[0].isVisibleGroup || '1',
        isVisiblePosition: cells[0].isVisiblePosition || '1'
      };

    }
    console.log('vm222:', vm, preDeviceInfo);
    vm.$refs.addDeviceDialog1.device_modal = true; //打开设备信息弹层

    vm.$emit( 'watchForm_device', preDeviceInfo);
    let _flag1 = true;
    vm.$on('transfer_device', (val) => { 
      if(_flag1){
        // console.log('val:', val);
        let cells = graph.getSelectionCells();
        var id = cells[0].id;
        var allCells = Object.values(graph.getModel().cells); //当前页面所有的
        editDeviceFun(cells); //
        addDevicesFnc(val, cells, allCells, id); //新增
      }
      _flag1= false;
    })
    
    function addDevicesFnc(get_DeviceData, cells, allCells, id) { 
      //get_DeviceData 形参
      if (get_DeviceData && get_DeviceData.length > 0) {
        console.log('点击应用后得到的绑定设备数据：', preDeviceInfo, get_DeviceData);
        //编辑
        if (preDeviceInfo.deviceId.length > 0) {
          //组内修改单独 一个 
          if (cells[0].deviceId && !cells[0].style.startsWith('group')) {

            let parentIds = cells[0].parent.allDeviceIds;
            let parentNames = cells[0].parent.allDeviceNames;
            parentIds.map((v, i)=>{
              if( parentIds[i] == cells[0].deviceId){
                parentIds[i] =  get_DeviceData[0].deviceId
              }
            })
            parentNames = parentNames.split(",");
            parentNames.map((k, index)=>{
              if ( parentNames[index] == cells[0].deviceName){
                parentNames[index] = get_DeviceData[0].deviceName
              }
            })
            //方法一、赋值
            // allCells.map(v => {
            //   if(v.id == cells[0].parent.id){
            //     console.log(v, 'parent cell', parentIds, parentNames)
            //     v.allDeviceIds = parentIds;
            //     v.allDeviceNames = parentNames.join(',');
            //   }
            // })

            //方法二、赋值
            cells[0].parent.allDeviceIds = parentIds;
            cells[0].parent.allDeviceNames = parentNames.join(',');

            //更新视图
            graph.refresh()

            cells[0].parent.children.map(v => {
              if (v.deviceId == cells[0].deviceId && v.infoType) {
                console.log(v, '要删除的cell text')
                v.deviceId = get_DeviceData[0].deviceId
                if (v.infoType == '名称') {
                  v.info = get_DeviceData[0].deviceName
                  v.value = '名称: ' + get_DeviceData[0].deviceName
                  v.style = '"text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;';
                } else {
                  v.info = get_DeviceData[0].desc
                  v.value = '描述: ' + get_DeviceData[0].desc
                  v.style = '"text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;';
                }
              }
            })
            // 组内单个修改
            // bindTextAndId(cells[0], get_DeviceData[0])
            cells[0].deviceId = (get_DeviceData[0].deviceId).toString();
            cells[0].deviceName = get_DeviceData[0].deviceName;
            cells[0].desc = get_DeviceData[0].desc;
            cells[0].isVisibleName = get_DeviceData[0].isVisibleName;
            cells[0].isVisibleDesc = get_DeviceData[0].isVisibleDesc;
            cells[0].isVisibleGroup = get_DeviceData[0].isVisibleGroup;
            cells[0].isVisiblePosition = get_DeviceData[0].isVisiblePosition;
            cells[0].statusLevel = "";
            cells[0].statusValue = "";
            //更新视图
            graph.refresh()
          }

          //一整组全部修改
          if (cells[0].style.startsWith('group')) {
            // 整组修改
            graph.setSelectionCells(cells); // 全选
            //取消组合
            // graph.setCellStyles('container', '0');
            graph.setSelectionCells(graph.ungroupCells(cells)); //取消组合

            cells = graph.getSelectionCells();
            console.log("cells编辑数据：", cells);
            let source = cells.filter(v => v.isSource)
            // console.log('source:', source);
            cells.map(v => {
              if (!v.isSource) {
                //删除
                graph.removeCells([v], true);
              }
            })
            let copySource = null;
            //如果修改时，必须选中有值才执行
            if (get_DeviceData[0].deviceId) {
              copySource = graph.duplicateCells([source[0]], false)[0];
              copySource.isSource = false
            }

            deleteCells(cells, true); //删除所有
            // console.log(source,copySource, cells,'source');

            if (copySource) {
              let updateCells = [copySource]
              updateCells[0].isSource = true
              //添加 名称 和描述
              updateCells.push(...bindTextAndId(updateCells[0], get_DeviceData[0]))
              addCell2(updateCells, get_DeviceData);
            }

          }

        } else {
          //新增
          //添加 名称 和描述
          cells[0].isSource = true;
          cells.push(...bindTextAndId(cells[0], get_DeviceData[0]))
          console.log("cells[0] 新增数据：", cells[0]);
          addCell2(cells, get_DeviceData);

        }
        //添加cell2方法
        function addCell2(cells, newDeviceData) {
          // 绑定多个设备复制出来的cell
          let state = graph.view.getState(cells[0]);
          let direction = ['east', 'west', 'south', 'north'];
          // console.log(state, direction,graph.defaultEdgeLength, e);
          let hoverIcons = new HoverIcons(graph)
          console.log( '----传过来绑定设备数据:', newDeviceData);
          hoverIcons.click2(state, direction[2], e, function (copyCells, tempDevice) {
            console.log("tempDevice:", tempDevice);
            copyCells[0].deviceId = tempDevice.deviceId;
            copyCells.push(...bindTextAndId(copyCells[1], tempDevice))
            cells.push(...copyCells)
            // console.log("copyCells:",copyCells);
          }, newDeviceData.length, 0, newDeviceData);


          //判断当前绑定的的设备是否 > 1, 只有 >= 2 才可以进入组里面
          if (newDeviceData.length >= 2){
            graph.setSelectionCells(cells); // 全选
            graph.setSelectionCell(graph.groupCells(null, 0, cells)); //组合了
  
            //给组 里面 塞进去值
            let group = graph.getSelectionCell();
            group.allDeviceIds = newDeviceData.map(v => v.deviceId);
            group.allDeviceNames = newDeviceData.map(v => v.deviceName).join(',');
            group.allDeviceDesc = newDeviceData[0].desc;
            // group.value = '设备组';
            // console.log("group:",group);
            // 设置可折叠方法
            let selectState = graph.view.getState(graph.getSelectionCell());
            var value = '1';
            if (selectState != null && graph.getFoldingImage(selectState) != null) {
              value = '0';
            }
            graph.setCellStyles('collapsible', value);
            ui.fireEvent(new mxEventObject('styleChanged', 'keys', ['collapsible'], 'values', [value], 'cells', graph.getSelectionCells()));
            
          } else {
            graph.setSelectionCells(cells); // 全选
            graph.setSelectionCell(graph.groupCells(null, 0, cells)); //组合了
  
            //给组 里面 塞进去值
            let group = graph.getSelectionCell();
            group.allDeviceIds = newDeviceData.map(v => v.deviceId);
            group.allDeviceNames = newDeviceData.map(v => v.deviceName).join(',');
            group.allDeviceDesc = newDeviceData[0].desc;
          }

          // graph.foldCells(true);  // 设置折叠
          //更新视图
          graph.refresh()

        }
        //名称和描述
        function bindTextAndId(cell, bindInfo) {
          cell.deviceId = bindInfo.deviceId;
          cell.deviceName = bindInfo.deviceName;
          cell.desc = bindInfo.desc;
          cell.isVisibleName = bindInfo.isVisibleName
          cell.isVisibleDesc = bindInfo.isVisibleDesc

          cell.statusLevel = "";
          cell.statusValue = "";
          let textArr = [{
              title: '名称',
              value: bindInfo.name,
              visible: bindInfo.isVisibleName,
              deviceId: bindInfo.deviceId,
              x: 0,
              y: 0,
              id: id
            },
            {
              title: '描述',
              value: bindInfo.desc,
              visible: bindInfo.isVisibleDesc,
              deviceId: bindInfo.deviceId,
              x: 0,
              y: 20,
              id: id
            },
          ];
          graph.getModel().beginUpdate();
          let textCells = [];
          for (var i = 0; i < textArr.length; i++) {
            textCells.push(graph.addTextNode({
              clientX: e.clientX + 10 * i,
              clientY: e.clientY + 160 * i
            }, cell, textArr[i]))
          }
          //给绑定svg图标的设备设置样式
          // graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, 'green');
          // graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, 'blue');
          graph.getModel().endUpdate();
          return textCells;
        }
      }
    }

    function editDeviceFun(cells){
      if (cells[0].style.startsWith('group')) {
        // 整个组修改  判断条件待完善
        console.log('是个组',cells[0]);
  
      } else if (cells[0].deviceId && !cells[0].style.startsWith('group')) {
        // 单个修改 
        console.log('组内单个修改', cells);
        preDeviceInfo = {
          deviceId: [(cells[0].deviceId).toString()],
          // deviceId: [ String(cells[0].deviceId) ],
          deviceName: cells[0].deviceName,
          name: cells[0].deviceName,
          desc: cells[0].desc,
          isVisibleName: cells[0].isVisibleName,
          isVisibleDesc: cells[0].isVisibleDesc,
          isVisibleGroup: cells[0].isVisibleGroup,
          isVisiblePosition: cells[0].isVisiblePosition,
        };
  
      } else if (!cells[0].deviceId && !cells[0].style.startsWith('group')) {
        // 单个添加
        console.log('组内添加');
      }
    }

    // console.log("cells:", cells, allCells, cells[0].value, preDeviceInfo);

  }), null, null, '快捷键');


  //之前的方法:
  // this.addAction('bindingDeviceId', mxUtils.bind(this, function (e) {
  //   var cells = graph.getSelectionCells();
  //   var allCells = Object.values(graph.getModel().cells); //当前页面所有的
  //   var preDeviceInfo = {
  //     deviceId: cells[0].allDeviceIds || "",
  //     deviceName: cells[0].allDeviceNames || "",
  //     name: cells[0].allDeviceNames || "",
  //     desc: cells[0].allDeviceDesc || "",
  //     isVisibleName: true,
  //     isVisibleDesc: true
  //   };
  //   if (cells[0].style.startsWith('group')) {
  //     // 整个组修改  判断条件待完善
  //     console.log('是个组');

  //   } else if (cells[0].deviceId && !cells[0].style.startsWith('group')) {
  //     // 单个修改 
  //     console.log('组内单个修改', cells);
  //     preDeviceInfo = {
  //       deviceId: [(cells[0].deviceId).toString()],
  //       // deviceId: [ String(cells[0].deviceId) ],
  //       deviceName: cells[0].deviceName,
  //       name: cells[0].deviceName,
  //       desc: cells[0].desc,
  //       isVisibleName: cells[0].isVisibleName,
  //       isVisibleDesc: cells[0].isVisibleDesc
  //     };

  //   } else if (!cells[0].deviceId && !cells[0].style.startsWith('group')) {
  //     // 单个添加
  //     console.log('组内添加');
  //   }

  //   console.log("cells:", cells, allCells, cells[0].value, preDeviceInfo);

  //   if (cells != null && cells.length > 0) {
  //     var id = cells[0].id;
  //     var model = graph.getModel();
  //     // console.log("model:",model);
  //     var dlg = new SelectDialog(this.editorUi, mxResources.get('bindingDeviceId') + ':',
  //       model.getStyle(cells[0]) || '', preDeviceInfo,
  //       function (get_DeviceData) { 
  //         //get_DeviceData 形参
  //         console.log("")
  //         if (get_DeviceData && get_DeviceData.length > 0) {
  //           console.log('点击应用后得到的绑定设备数据：', preDeviceInfo, get_DeviceData);
  //           //编辑
  //           if (preDeviceInfo.deviceId) {
  //             //组内修改单独 一个 
  //             if (cells[0].deviceId && !cells[0].style.startsWith('group')) {
  //               cells[0].parent.children.map(v => {
  //                 if (v.deviceId == cells[0].deviceId && v.infoType) {
  //                   console.log(v, '要删除的cell text')
  //                   v.deviceId = get_DeviceData[0].deviceId
  //                   if (v.infoType == '名称') {
  //                     v.info = get_DeviceData[0].deviceName
  //                     v.value = '名称: ' + get_DeviceData[0].deviceName
  //                   } else {
  //                     v.info = get_DeviceData[0].desc
  //                     v.value = '描述: ' + get_DeviceData[0].desc
  //                   }
  //                 }
  //               })
  //               // 组内单个修改
  //               // bindTextAndId(cells[0], get_DeviceData[0])
  //               cells[0].deviceId = (get_DeviceData[0].deviceId).toString();
  //               cells[0].deviceName = get_DeviceData[0].deviceName;
  //               cells[0].desc = get_DeviceData[0].desc;
  //               cells[0].isVisibleName = get_DeviceData[0].isVisibleName
  //               cells[0].isVisibleDesc = get_DeviceData[0].isVisibleDesc
  //               cells[0].statusLevel = "";
  //               cells[0].statusValue = "";
                    //更新视图
                    //graph.refresh()
  //             }

  //             //一整组全部修改
  //             if (cells[0].style.startsWith('group')) {
  //               // 整组修改
  //               graph.setSelectionCells(cells); // 全选
  //               console.log("编辑:", cells);
  //               //取消组合
  //               // graph.setCellStyles('container', '0');
  //               graph.setSelectionCells(graph.ungroupCells(cells)); //取消组合

  //               cells = graph.getSelectionCells();
  //               console.log("cells编辑数据：", cells);
  //               let source = cells.filter(v => v.isSource)
  //               console.log(source, 'source')
  //               cells.map(v => {
  //                 if (!v.isSource) {
  //                   //删除
  //                   graph.removeCells([v], true);
  //                 }
  //               })
  //               let copySource = null;
  //               //如果修改时，必须选中有值才执行
  //               if (get_DeviceData[0].deviceId) {
  //                 copySource = graph.duplicateCells([source[0]], false)[0];
  //                 copySource.isSource = false
  //               }

  //               deleteCells(cells, true); //删除所有
  //               // console.log(source,copySource, cells,'source');

  //               if (copySource) {
  //                 let updateCells = [copySource]
  //                 updateCells[0].isSource = true
  //                 //添加 名称 和描述
  //                 updateCells.push(...bindTextAndId(updateCells[0], get_DeviceData[0]))
  //                 addCell2(updateCells, get_DeviceData);
  //               }

  //             }

  //           } else {
  //             //新增
  //             // 原有的cell 绑定数据
  //             // cells[0].deviceIds = get_DeviceData.map(v => v.deviceId);
  //             // cells[0].deviceNames = get_DeviceData.map(v => v.deviceName).join(',');
  //             // cells[0].statusLevel = "";
  //             // cells[0].statusValue = "";
  //             // cells[0].desc = get_DeviceData[0].desc;

  //             //添加 名称 和描述
  //             cells[0].isSource = true;
  //             cells.push(...bindTextAndId(cells[0], get_DeviceData[0]))
  //             console.log("cells[0] 新增数据：", cells[0]);
  //             addCell2(cells, get_DeviceData);
  //           }
  //           //添加cell2方法
  //           function addCell2(cells, newDeviceData) {
  //             // 绑定多个设备复制出来的cell
  //             let state = graph.view.getState(cells[0]);
  //             let direction = ['east', 'west', 'south', 'north'];
  //             // console.log(state, direction,graph.defaultEdgeLength, e);
  //             let hoverIcons = new HoverIcons(graph)
  //             // console.log( '传过来绑定设备数据：',newDeviceData);
  //             hoverIcons.click2(state, direction[2], e, function (copyCells, tempDevice) {
  //               // console.log("tempDevice",tempDevice);
  //               copyCells[0].deviceId = tempDevice.deviceId;
  //               copyCells.push(...bindTextAndId(copyCells[1], tempDevice))
  //               cells.push(...copyCells)
  //               // console.log("copyCells:",copyCells);
  //             }, newDeviceData.length, 0, newDeviceData);

  //             graph.setSelectionCells(cells); // 全选
  //             graph.setSelectionCell(graph.groupCells(null, 0, cells)); //组合了

  //             //给组 里面 塞进去值
  //             let group = graph.getSelectionCell();
  //             group.allDeviceIds = newDeviceData.map(v => v.deviceId)
  //             group.allDeviceNames = newDeviceData.map(v => v.deviceName).join(',')
  //             group.allDeviceDesc = newDeviceData[0].desc
  //             // console.log("group:",group);
  //             // 设置可折叠方法
  //             let selectState = graph.view.getState(graph.getSelectionCell());
  //             var value = '1';
  //             if (selectState != null && graph.getFoldingImage(selectState) != null) {
  //               value = '0';
  //             }
  //             graph.setCellStyles('collapsible', value);
  //             ui.fireEvent(new mxEventObject('styleChanged', 'keys', ['collapsible'], 'values', [value], 'cells', graph.getSelectionCells()));

  //             // 设置折叠
  //             graph.foldCells(true);
                //更新视图
                // graph.refresh()
  
  //           }
  //           //名称和描述
  //           function bindTextAndId(cell, bindInfo) {
  //             cell.deviceId = bindInfo.deviceId;
  //             cell.deviceName = bindInfo.deviceName;
  //             cell.desc = bindInfo.desc;
  //             cell.isVisibleName = bindInfo.isVisibleName
  //             cell.isVisibleDesc = bindInfo.isVisibleDesc
  //             cell.statusLevel = "";
  //             cell.statusValue = "";
  //             let textArr = [{
  //                 title: '名称',
  //                 value: bindInfo.name,
  //                 visible: bindInfo.isVisibleName,
  //                 deviceId: bindInfo.deviceId,
  //                 x: 0,
  //                 y: 0,
  //                 id: id
  //               },
  //               {
  //                 title: '描述',
  //                 value: bindInfo.desc,
  //                 visible: bindInfo.isVisibleDesc,
  //                 deviceId: bindInfo.deviceId,
  //                 x: 0,
  //                 y: 20,
  //                 id: id
  //               },
  //             ];
  //             graph.getModel().beginUpdate();
  //             let textCells = [];
  //             for (var i = 0; i < textArr.length; i++) {
  //               textCells.push(graph.addTextNode({
  //                 clientX: e.clientX + 10 * i,
  //                 clientY: e.clientY + 160 * i
  //               }, cell, textArr[i]))
  //             }
  //             //给绑定的设备设置样式
  //             graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, 'green');
  //             graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, 'blue');
  //             graph.getModel().endUpdate();
  //             return textCells;
  //           }
  //         }
  //       }, null, null, 400, 310);
  //     this.editorUi.showDialog(dlg.container, 400, 310, true, true);
  //     dlg.init();
  //   }
  // }), null, null, '快捷键');

  //绑定XML文件
  this.addAction('bindXMLName', mxUtils.bind(this, function (e) {
    var cells = graph.getSelectionCells();
    var allCells = Object.values(graph.getModel().cells)
    var xmlInfo = {
      xmlId: '',
      name: '',
      isVisibleName: true,
    };
    // console.log("cells:", allCells, cells, cells[0].value, xmlInfo);
    if (cells != null && cells.length > 0) {
      var id = cells[0].id;
      var flag = true;
      // 修改cell
      for (var i = 0; i < allCells.length; i++) {
        if (allCells[i].data_id === id) {
          // 是当前cell 绑定的 name/desc 数据
          if (allCells[i].infoType && allCells[i].infoType == 'XML文件名称') {
            flag = false;
            xmlInfo.xmlId = cells[0].xmlId;
            xmlInfo.name = allCells[i].info;
            xmlInfo.isVisibleName = allCells[i].visible;
          }
        }
      }
      var model = graph.getModel();
      var dlg = new BindXMLDialog(this.editorUi, mxResources.get('bindXMLName') + ':',
        model.getStyle(cells[0]) || '', xmlInfo,
        function (get_xmlData) { //get_xmlData是形参,可以自定义
          if (get_xmlData) {
            console.log('点击确定得到的XML的list：', get_xmlData);
            // console.log("xml数据：", cells[0]);
            var xmlArr = [{
              title: "XML文件名称",
              xmlId: get_xmlData.id,
              name: get_xmlData.name,
              visible: get_xmlData.isVisibleName,
              x: 0,
              y: 0,
              id: id
            }]
            cells[0].xmlId = get_xmlData.id
            // 新增cell
            if (flag) {
              console.log('新增：', xmlArr);
              for (var i = 0; i < xmlArr.length; i++) {
                cells.push(graph.addTextNodeXml(e, cells[0], xmlArr[i]))
              }
            } else {
              //修改cell
              console.log('修改：');
              for (var i = 0; i < allCells.length; i++) {
                if (allCells[i].data_id === id) {
                  if (allCells[i].infoType && allCells[i].infoType == 'XML文件名称') {
                    allCells[i].value = 'XML文件名称: ' + xmlArr[0].name;
                    allCells[i].xmlId = xmlArr[0].xmlId;
                    allCells[i].info = xmlArr[0].name;
                    allCells[i].visible = xmlArr[0].visible;
                    // console.log("XML文件名称:", allCells[i].info);
                  }
                }
              }
            }
            //更新视图
            graph.refresh()
          }
        }, null, null, 400, 220);
      this.editorUi.showDialog(dlg.container, 400, 220, true, true);
      // dlg.init();
    }
  }), null, null, '快捷键');

  //删除
  this.addAction('delete', function (evt) {
    deleteCells(evt != null && mxEvent.isShiftDown(evt));
  }, null, null, 'Delete');

  //删除所有
  this.addAction('deleteAll', function () {
    deleteCells(true);
  }, null, null, Editor.ctrlKey + '+Delete');

  //复制
  this.addAction('duplicate', function () {
	try {
		graph.setSelectionCells(graph.duplicateCells());
		graph.scrollCellToVisible(graph.getSelectionCell());
	} catch (e) {
		ui.handleError(e);
	}
  }, null, null, Editor.ctrlKey + '+D');

  //旋转90°/翻转
  this.put('turn', new Action(mxResources.get('turn') + ' / ' + mxResources.get('reverse'), function (evt) {
    	graph.turnShapes(graph.getSelectionCells(), (evt != null) ? mxEvent.isShiftDown(evt) : false);
  }, null, null, Editor.ctrlKey + '+R'));

  //选择顶点
  this.addAction('selectVertices', function () {
    graph.selectVertices();
  }, null, null, Editor.ctrlKey + '+Shift+I');

  //选择边
  this.addAction('selectEdges', function () {
    graph.selectEdges();
  }, null, null, Editor.ctrlKey + '+Shift+E');

  //全选
  this.addAction('selectAll', function () {
    graph.selectAll(null, true);
  }, null, null, Editor.ctrlKey + '+A');

  //全不选
  this.addAction('selectNone', function () {
    graph.clearSelection();
  }, null, null, Editor.ctrlKey + '+Shift+A');

  //锁定/解除锁定
  this.addAction('lockUnlock', function () {
    if (!graph.isSelectionEmpty()) {
      graph.getModel().beginUpdate();
      try {
        var defaultValue = graph.isCellMovable(graph.getSelectionCell()) ? 1 : 0;
        graph.toggleCellStyles(mxConstants.STYLE_MOVABLE, defaultValue);
        graph.toggleCellStyles(mxConstants.STYLE_RESIZABLE, defaultValue);
        graph.toggleCellStyles(mxConstants.STYLE_ROTATABLE, defaultValue);
        graph.toggleCellStyles(mxConstants.STYLE_DELETABLE, defaultValue);
        graph.toggleCellStyles(mxConstants.STYLE_EDITABLE, defaultValue);
        graph.toggleCellStyles('connectable', defaultValue);
      } finally {
        graph.getModel().endUpdate();
      }
    }
  }, null, null, Editor.ctrlKey + '+L');

  // Navigation actions
  this.addAction('home', function () {
    graph.home();
  }, null, null, 'Shift+Home');

  //退出编辑组
  this.addAction('exitGroup', function () {
    graph.exitGroup();
  }, null, null, Editor.ctrlKey + '+Shift+Home');

  //进入编辑组
  this.addAction('enterGroup', function () {
    graph.enterGroup();
  }, null, null, Editor.ctrlKey + '+Shift+End');

  //折叠
  this.addAction('collapse', function () {
    graph.foldCells(true);
  }, null, null, Editor.ctrlKey + '+Home');

  //展开
  this.addAction('expand', function () {
    graph.foldCells(false);
  }, null, null, Editor.ctrlKey + '+End');

  // Arrange actions
  //置于顶层
  this.addAction('toFront', function () {
    graph.orderCells(false);
  }, null, null, Editor.ctrlKey + '+Shift+F');

  //置于底层
  this.addAction('toBack', function () {
    graph.orderCells(true);
  }, null, null, Editor.ctrlKey + '+Shift+B');

  //组合
  this.addAction('group', function () {
    console.log("组合了：", graph.getSelectionCount());
    if (graph.getSelectionCount() == 1) {
      graph.setCellStyles('container', '1');
    } else {
      //组合了
      graph.setSelectionCell(graph.groupCells(null, 0));
    }
  }, null, null, Editor.ctrlKey + '+G');

  //取消组合
  this.addAction('ungroup', function () {
		if (graph.isEnabled() && !graph.isSelectionEmpty()) {
			var cells = graph.getSelectionCells();
			graph.model.beginUpdate();
			try {
				var temp = graph.ungroupCells();

				// Unsets container flag for remaining cells
				if (cells != null) {
					for (var i = 0; i < cells.length; i++) {
						if (graph.model.contains(cells[i])) {
							if (graph.model.getChildCount(cells[i]) == 0 &&
								graph.model.isVertex(cells[i])) {
								graph.setCellStyles('container', '0', [cells[i]]);
							}

							temp.push(cells[i]);
						}
					}
				}
			} finally {
				graph.model.endUpdate();
			}
			graph.setSelectionCells(temp);
    }

  }, null, null, Editor.ctrlKey + '+Shift+U');

  //从组合中移出
  this.addAction('removeFromGroup', function () {
    graph.removeCellsFromParent();
  });

  // Adds action
  //编辑
  this.addAction('edit', function () {
    if (graph.isEnabled()) {
      graph.startEditingAtCell();
    }
  }, null, null, 'F2/Enter');

  //编辑数据
  this.addAction('editData...', function () {
    var cell = graph.getSelectionCell() || graph.getModel().getRoot();
    ui.showDataDialog(cell);
  }, null, null, Editor.ctrlKey + '+M');

  //编辑提示文字
  this.addAction('editTooltip...', function () {
    var graph = ui.editor.graph;
    if (graph.isEnabled() && !graph.isSelectionEmpty()) {
      var cell = graph.getSelectionCell();
      var tooltip = '';
      if (mxUtils.isNode(cell.value)) {
        var tmp = cell.value.getAttribute('tooltip');
        if (tmp != null) {
          tooltip = tmp;
        }
      }
      var dlg = new TextareaDialog(ui, mxResources.get('editTooltip') + ':', tooltip, function (newValue) {
        graph.setTooltipForCell(cell, newValue);
      });
      ui.showDialog(dlg.container, 320, 200, true, true);
      dlg.init();
    }
  }, null, null, 'Alt+Shift+T');

  //打开链接
  this.addAction('openLink', function () {
    var link = graph.getLinkForCell(graph.getSelectionCell());
    if (link != null) {
      graph.openLink(link);
    }
  });

  //编辑链接
  this.addAction('editLink...', function () {
    var graph = ui.editor.graph;
    if (graph.isEnabled() && !graph.isSelectionEmpty()) {
      var cell = graph.getSelectionCell();
      var value = graph.getLinkForCell(cell) || '';
      ui.showLinkDialog(value, mxResources.get('apply'), function (link) {
        link = mxUtils.trim(link);
        graph.setLinkForCell(cell, (link.length > 0) ? link : null);
      });
    }
  }, null, null, 'Alt+Shift+L');

  //搜索
  this.put('search', new Action(mxResources.get('search'), function () {
    if (graph.isEnabled()) {
      ui.actions.get('search').funct();
    }
  })).isEnabled = isGraphEnabled;

  //素材库
  this.put('scratchpad', new Action(mxResources.get('scratchpad') + '...', function () {
    if (graph.isEnabled()) {
      ui.actions.get('scratchpad').funct();
    }
  })).isEnabled = isGraphEnabled;

  //形状库
  this.put('shapesLibrary', new Action(mxResources.get('shapesLibrary') + '...', function () {

  })).isEnabled = isGraphEnabled;

  //创建图例
  this.put('createLegend', new Action(mxResources.get('legend') + '...', function () {
    if (graph.isEnabled()) {
      ui.actions.get('legend').funct();
    }
  })).isEnabled = function () {
    return isGraphEnabled && mxClient.IS_SVG;
  };

  //创建形状
  this.put('createShape', new Action(mxResources.get('shape') + '...', function () {
    if (graph.isEnabled()) {
      var cell = new mxCell('', new mxGeometry(0, 0, 120, 120), ui.defaultCustomShapeStyle);
      cell.vertex = true;
      var dlg = new EditShapeDialog(ui, cell, mxResources.get('editShape') + ':', 630, 400);
      ui.showDialog(dlg.container, 640, 480, true, false);
      dlg.init();
    }
  })).isEnabled = isGraphEnabled;

  //自由绘制
  this.put('insertFreehand', new Action(mxResources.get('freehand') + '...', function () {
    if (graph.isEnabled()) {
      ui.actions.get('freehand').funct();
    }
  })).isEnabled = function () {
    return isGraphEnabled && mxClient.IS_SVG;
  };


  //定义变量 insertVertex
  var insertVertex = function (value, w, h, style) {
    var pt = (graph.isMouseInsertPoint()) ? graph.getInsertPoint() : graph.getFreeInsertPoint();
    var cell = new mxCell(value, new mxGeometry(pt.x, pt.y, w, h), style);
    cell.vertex = true;
    graph.getModel().beginUpdate();
    try {
      cell = graph.addCell(cell);
      graph.fireEvent(new mxEventObject('cellsInserted', 'cells', [cell]));
    } finally {
      graph.getModel().endUpdate();
    }
    graph.scrollCellToVisible(cell);
    graph.setSelectionCell(cell);
    graph.container.focus();

    if (graph.editAfterInsert) {
      graph.startEditing(cell);
    }
    // Async call is workaroun for touch events resetting hover icons
    window.setTimeout(function () {
      if (ui.hoverIcons != null) {
        ui.hoverIcons.update(graph.view.getState(cell));
      }
    }, 0);
    return cell;
  };

  //插入矩形
  this.put('insertRectangle', new Action(mxResources.get('rectangle') + '...', function () {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      insertVertex('', 120, 60, 'whiteSpace=wrap;html=1;');
    }
    // insertVertex( 'value值','width','height','style');
  })).isEnabled = isGraphEnabled;

  //插入椭圆
  this.put('insertEllipse', new Action(mxResources.get('ellipse') + '...', function () {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      insertVertex('', 120, 80, 'ellipse;whiteSpace=wrap;html=1;');
    }
  })).isEnabled = isGraphEnabled;

  //插入菱形
  this.put('insertRhombus', new Action(mxResources.get('rhombus') + '...', function () {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      insertVertex('', 80, 80, 'rhombus;whiteSpace=wrap;html=1;');
    }
  })).isEnabled = isGraphEnabled;

  //插入文本
  this.put('insertText', new Action(mxResources.get('text') + '...', function () {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      graph.startEditingAtCell(insertVertex('Text', 40, 20, 'text;html=1;resizable=0;autosize=1;' +
        'align=center;verticalAlign=middle;points=[];fillColor=none;strokeColor=none;rounded=0;'));
    }
  })).isEnabled = isGraphEnabled;

  //插入图片
  this.put('insertImage', new Action(mxResources.get('image') + '...', function () {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      graph.clearSelection();
      ui.actions.get('image').funct();
    }
  })).isEnabled = isGraphEnabled;

  //插入链接
  this.put('insertLink', new Action(mxResources.get('link') + '...', function () {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      ui.showLinkDialog('', mxResources.get('insert'), function (link, docs) {
        link = mxUtils.trim(link);
        if (link.length > 0) {
          var icon = null;
          var title = graph.getLinkTitle(link);
          if (docs != null && docs.length > 0) {
            icon = docs[0].iconUrl;
            title = docs[0].name || docs[0].type;
            title = title.charAt(0).toUpperCase() + title.substring(1);
            if (title.length > 30) {
              title = title.substring(0, 30) + '...';
            }
          }
          //var pt = graph.getFreeInsertPoint();
          //var linkCell = new mxCell(title, new mxGeometry(pt.x, pt.y, 100, 40),

          var linkCell = new mxCell(title, new mxGeometry(0, 0, 100, 40),
            'fontColor=#0000EE;fontStyle=4;rounded=1;overflow=hidden;' + ((icon != null) ?
              'shape=label;imageWidth=16;imageHeight=16;spacingLeft=26;align=left;image=' + icon :
              'spacing=10;'));
          linkCell.vertex = true;
          var pt = graph.getCenterInsertPoint(graph.getBoundingBoxFromGeometry([linkCell], true));
          linkCell.geometry.x = pt.x;
          linkCell.geometry.y = pt.y;
          graph.setLinkForCell(linkCell, link);
          graph.cellSizeUpdated(linkCell, true);
          graph.getModel().beginUpdate();
          try {
            linkCell = graph.addCell(linkCell);
            graph.fireEvent(new mxEventObject('cellsInserted', 'cells', [linkCell]));
          } finally {
            graph.getModel().endUpdate();
          }
          graph.setSelectionCell(linkCell);
          graph.scrollCellToVisible(graph.getSelectionCell());
        }
      });
    }
  })).isEnabled = isGraphEnabled;

  //链接
  this.addAction('link...', mxUtils.bind(this, function () {
    var graph = ui.editor.graph;
    if (graph.isEnabled()) {
      if (graph.cellEditor.isContentEditing()) {
        var elt = graph.getSelectedElement();
        var link = graph.getParentByName(elt, 'A', graph.cellEditor.textarea);
        var oldValue = '';
        // Workaround for FF returning the outermost selected element after double
        // click on a DOM hierarchy with a link inside (but not as topmost element)
        if (link == null && elt != null && elt.getElementsByTagName != null) {
          // Finds all links in the selected DOM and uses the link
          // where the selection text matches its text content
          var links = elt.getElementsByTagName('a');
          for (var i = 0; i < links.length && link == null; i++) {
            if (links[i].textContent == elt.textContent) {
              link = links[i];
            }
          }
        }
        if (link != null && link.nodeName == 'A') {
          oldValue = link.getAttribute('href') || '';
          graph.selectNode(link);
        }
        var selState = graph.cellEditor.saveSelection();
        ui.showLinkDialog(oldValue, mxResources.get('apply'), mxUtils.bind(this, function (value) {
          graph.cellEditor.restoreSelection(selState);
          if (value != null) {
            graph.insertLink(value);
          }
        }));
      } else if (graph.isSelectionEmpty()) {
        this.get('insertLink').funct();
      } else {
        this.get('editLink').funct();
      }
    }
  })).isEnabled = isGraphEnabled;

  //自动调整
  this.addAction('autosize', function () {
    var cells = graph.getSelectionCells();
    if (cells != null) {
      graph.getModel().beginUpdate();
      try {
        for (var i = 0; i < cells.length; i++) {
          var cell = cells[i];

          if (graph.getModel().getChildCount(cell)) {
            graph.updateGroupBounds([cell], 20);
          } else {
            var state = graph.view.getState(cell);
            var geo = graph.getCellGeometry(cell);

            if (graph.getModel().isVertex(cell) && state != null && state.text != null &&
              geo != null && graph.isWrapping(cell)) {
              geo = geo.clone();
              geo.height = state.text.boundingBox.height / graph.view.scale;
              graph.getModel().setGeometry(cell, geo);
            } else {
              graph.updateCellSize(cell);
            }
          }
        }
      } finally {
        graph.getModel().endUpdate();
      }
    }
  }, null, null, Editor.ctrlKey + '+Shift+Y');

  //格式化文本
  this.addAction('formattedText', function () {
    var refState = graph.getView().getState(graph.getSelectionCell());

    if (refState != null) {
      graph.stopEditing();
      var value = (refState.style['html'] == '1') ? null : '1';

      graph.getModel().beginUpdate();
      try {
        var cells = graph.getSelectionCells();

        for (var i = 0; i < cells.length; i++) {
          var state = graph.getView().getState(cells[i]);

          if (state != null) {
            var html = mxUtils.getValue(state.style, 'html', '0');

            if (html == '1' && value == null) {
              var label = graph.convertValueToString(state.cell);

              if (mxUtils.getValue(state.style, 'nl2Br', '1') != '0') {
                // Removes newlines from HTML and converts breaks to newlines
                // to match the HTML output in plain text
                label = label.replace(/\n/g, '').replace(/<br\s*.?>/g, '\n');
              }

							// Removes HTML tags
							var temp = document.createElement('div');
							temp.innerHTML = graph.sanitizeHtml(label);
							label = mxUtils.extractTextWithWhitespace(temp.childNodes);

              graph.cellLabelChanged(state.cell, label);
              graph.setCellStyles('html', value, [cells[i]]);
            } else if (html == '0' && value == '1') {
              // Converts HTML tags to text
              var label = mxUtils.htmlEntities(graph.convertValueToString(state.cell), false);

              if (mxUtils.getValue(state.style, 'nl2Br', '1') != '0') {
                // Converts newlines in plain text to breaks in HTML
                // to match the plain text output
                label = label.replace(/\n/g, '<br/>');
              }

              graph.cellLabelChanged(state.cell, graph.sanitizeHtml(label));
              graph.setCellStyles('html', value, [cells[i]]);
            }
          }
        }

        ui.fireEvent(new mxEventObject('styleChanged', 'keys', ['html'],
          'values', [(value != null) ? value : '0'], 'cells', cells));
      } finally {
        graph.getModel().endUpdate();
      }
    }
  });

  //自动换行
  this.addAction('wordWrap', function () {
    var state = graph.getView().getState(graph.getSelectionCell());
    var value = 'wrap';
    graph.stopEditing();
    if (state != null && state.style[mxConstants.STYLE_WHITE_SPACE] == 'wrap') {
      value = null;
    }
    graph.setCellStyles(mxConstants.STYLE_WHITE_SPACE, value);
  });

  //旋转
  this.addAction('rotation', function () {
    var value = '0';
    var state = graph.getView().getState(graph.getSelectionCell());
    if (state != null) {
      value = state.style[mxConstants.STYLE_ROTATION] || value;
    }
    var dlg = new FilenameDialog(ui, value, mxResources.get('apply'), function (newValue) {
      if (newValue != null && newValue.length > 0) {
        graph.setCellStyles(mxConstants.STYLE_ROTATION, newValue);
      }
    }, mxResources.get('enterValue') + ' (' + mxResources.get('rotation') + ' 0-360)');
    ui.showDialog(dlg.container, 375, 80, true, true);
    dlg.init();
  });

  // View actions
  //重置视图
  this.addAction('resetView', function () {
    graph.zoomTo(1);
    ui.resetScrollbars();
  }, null, null,  'Home');

  //导航栏的放大镜--放大
  this.addAction('zoomIn', function (evt) {
    if (graph.isFastZoomEnabled()) {
			graph.lazyZoom(true, true, ui.buttonZoomDelay);
		} else {
			graph.zoomIn();
		}
  }, null, null, Editor.ctrlKey + ' + (数字键) / Alt+鼠标滚轮');

  //导航栏的缩小镜--缩小
  this.addAction('zoomOut', function (evt) {
    if (graph.isFastZoomEnabled()) {
			graph.lazyZoom(false, true, ui.buttonZoomDelay);
		} else {
			graph.zoomOut();
		}
  }, null, null, Editor.ctrlKey + ' - (数字键) / Alt+鼠标滚轮');

  //适应视窗大小
  this.addAction('fitWindow', function () {
	var bounds = (graph.isSelectionEmpty()) ? graph.getGraphBounds() :
		graph.getBoundingBox(graph.getSelectionCells())
	var t = graph.view.translate;
	var s = graph.view.scale;

	bounds.x = bounds.x / s - t.x;
	bounds.y = bounds.y / s - t.y;
	bounds.width /= s;
	bounds.height /= s;

	if (graph.backgroundImage != null) {
		bounds.add(new mxRectangle(0, 0, graph.backgroundImage.width, graph.backgroundImage.height));
	}

	if (bounds.width == 0 || bounds.height == 0) {
		graph.zoomTo(1);
		ui.resetScrollbars();
	} else {
		graph.fitWindow(bounds);
	}
	
    //graph.fit();
  }, null, null, Editor.ctrlKey + '+Shift+H');

  //整页显示
  this.addAction('fitPage', mxUtils.bind(this, function () {
    if (!graph.pageVisible) {
      this.get('pageView').funct();
    }
    var fmt = graph.pageFormat;
    var ps = graph.pageScale;
    var cw = graph.container.clientWidth - 10;
    var ch = graph.container.clientHeight - 10;
    var scale = Math.floor(20 * Math.min(cw / fmt.width / ps, ch / fmt.height / ps)) / 20;
    graph.zoomTo(scale);
    if (mxUtils.hasScrollbars(graph.container)) {
      var pad = graph.getPagePadding();
      graph.container.scrollTop = pad.y * graph.view.scale - 1;
      graph.container.scrollLeft = Math.min(pad.x * graph.view.scale, (graph.container.scrollWidth - graph.container.clientWidth) / 2) - 1;
    }
  }), null, null, Editor.ctrlKey + '+J');

  //双页
  this.addAction('fitTwoPages', mxUtils.bind(this, function () {
    if (!graph.pageVisible) {
      this.get('pageView').funct();
    }
    var fmt = graph.pageFormat;
    var ps = graph.pageScale;
    var cw = graph.container.clientWidth - 10;
    var ch = graph.container.clientHeight - 10;
    var scale = Math.floor(20 * Math.min(cw / (2 * fmt.width) / ps, ch / fmt.height / ps)) / 20;
    graph.zoomTo(scale);
    if (mxUtils.hasScrollbars(graph.container)) {
      var pad = graph.getPagePadding();
      graph.container.scrollTop = Math.min(pad.y, (graph.container.scrollHeight - graph.container.clientHeight) / 2);
      graph.container.scrollLeft = Math.min(pad.x, (graph.container.scrollWidth - graph.container.clientWidth) / 2);
    }
  }), null, null, Editor.ctrlKey + '+Shift+J');

  //适应页面宽度
  this.addAction('fitPageWidth', mxUtils.bind(this, function () {
    if (!graph.pageVisible) {
      this.get('pageView').funct();
    }
    var fmt = graph.pageFormat;
    var ps = graph.pageScale;
    var cw = graph.container.clientWidth - 10;
    var scale = Math.floor(20 * cw / fmt.width / ps) / 20;
    graph.zoomTo(scale);
    if (mxUtils.hasScrollbars(graph.container)) {
      var pad = graph.getPagePadding();
      graph.container.scrollLeft = Math.min(pad.x * graph.view.scale,
        (graph.container.scrollWidth - graph.container.clientWidth) / 2);
    }
  }));

  //自定义缩放
  this.put('customZoom', new Action(mxResources.get('custom') + '...', mxUtils.bind(this, function () {
    var dlg = new FilenameDialog(this.editorUi, parseInt(graph.getView().getScale() * 100), mxResources.get('apply'), mxUtils.bind(this, function (newValue) {
      // console.log("自定义缩放",newValue);
      var val = parseInt(newValue);
      if (!isNaN(val) && val > 0) {
        graph.zoomTo(val / 100);
      }
    }), mxResources.get('zoom') + ' (%)');
    this.editorUi.showDialog(dlg.container, 300, 80, true, true);
    dlg.init();
  }), null, null, Editor.ctrlKey + '+0'));

  //页面比列
  this.addAction('pageScale...', mxUtils.bind(this, function () {
    var dlg = new FilenameDialog(this.editorUi, parseInt(graph.pageScale * 100), mxResources.get('apply'), mxUtils.bind(this, function (newValue) {
      // console.log("页面比列:",newValue);
      var val = parseInt(newValue);
      if (!isNaN(val) && val > 0) {
        //ui.setPageScale(val / 100);
	var change = new ChangePageSetup(ui, null, null, null, val / 100);
	change.ignoreColor = true;
	change.ignoreImage = true;

	graph.model.execute(change);
	
      }
    }), mxResources.get('pageScale') + ' (%)');
    this.editorUi.showDialog(dlg.container, 300, 80, true, true);
    dlg.init();
  }));

  // Option actions
  var action = null;
  //搜索的方法控制搜索框是否显示/隐藏
  // action = this.addAction('search', function () {
  //   let display = ui.sidebar.palettes.search[1].style.display;
  //   var visible = display ? (display == 'none' ? false : true) : true;
  //   ui.sidebar.palettes.search[1].style.display = visible ? 'none' : 'block';
  // });

  // action.setToggleAction(true);
  // action.setSelectedCallback(function () {
  //   return ui.sidebar.palettes.search[1].style.display !== 'none';
  // });

  //素材库的方法
  action = this.addAction('scratchpad', mxUtils.bind(this, function () {
    ui.toggleScratchpad();
  }));

  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return ui.scratchpad != null;
  });

  //网格
  action = this.addAction('grid', function () {
    graph.setGridEnabled(!graph.isGridEnabled());
    ui.fireEvent(new mxEventObject('gridEnabledChanged'));
  }, null, null, Editor.ctrlKey + '+Shift+G');

  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.isGridEnabled();
  });
  action.setEnabled(false); //设置启用,就是允不允许你改变CELL的形状内容。 

  //参考线
  action = this.addAction('guides', function () {
    graph.graphHandler.guidesEnabled = !graph.graphHandler.guidesEnabled;
    ui.fireEvent(new mxEventObject('guidesEnabledChanged'));
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.graphHandler.guidesEnabled;
  });
  action.setEnabled(false); //设置启用,就是允不允许你改变CELL的形状内容。 

  //提示
  action = this.addAction('tooltips', function () {
    graph.tooltipHandler.setEnabled(!graph.tooltipHandler.isEnabled());
    ui.fireEvent(new mxEventObject('tooltipsEnabledChanged'));
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.tooltipHandler.isEnabled();
  });

  //标尺
  action = this.addAction('ruler', function () {
    mxSettings.setRulerOn(!mxSettings.isRulerOn());
    mxSettings.save();
    if (ui.ruler != null) {
      ui.ruler.destroy();
      ui.ruler = null;
      ui.refresh();
    } else {
      ui.ruler = new mxDualRuler(ui, ui.editor.graph.view.unit);
      ui.refresh();
    } 
  });

  action.setEnabled(ui.canvasSupported && document.documentMode != 9);
  action.setToggleAction(false); //默认是否打开
  action.setSelectedCallback(function () {
    // return graph.tooltipHandler.isEnabled();
    return ui.ruler != null;
  });


  //折叠 / 展开 (默认选中)的方法
  action = this.addAction('collapseExpand', function () {
    var change = new ChangePageSetup(ui);
    change.ignoreColor = true;
    change.ignoreImage = true;
    change.foldingEnabled = !graph.foldingEnabled;
    graph.model.execute(change);
    console.log("折叠/展开(默认选中):", change);
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.foldingEnabled;
  });
  action.isEnabled = isGraphEnabled;

  //滚动条
  action = this.addAction('scrollbars', function () {
    ui.setScrollbars(!ui.hasScrollbars());
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.scrollbars;
  });

  //页面视图
  action = this.addAction('pageView', mxUtils.bind(this, function () {
    console.log("+++++++页面视图")
    ui.setPageVisible(!graph.pageVisible);
  }));
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.pageVisible;
  });

  //连接箭头
  action = this.addAction('connectionArrows', function () {
    graph.connectionArrowsEnabled = !graph.connectionArrowsEnabled;
    ui.fireEvent(new mxEventObject('connectionArrowsChanged'));
  }, null, null, 'Alt+Shift+A');
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.connectionArrowsEnabled;
  });

  //连接点
  action = this.addAction('connectionPoints', function () {
    graph.setConnectable(!graph.connectionHandler.isEnabled());
    ui.fireEvent(new mxEventObject('connectionPointsChanged'));
  }, null, null, 'Alt+Shift+P');
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.connectionHandler.isEnabled();
  });

  //连接时拷贝
  action = this.addAction('copyConnect', function () {
    graph.connectionHandler.setCreateTarget(!graph.connectionHandler.isCreateTarget());
    ui.fireEvent(new mxEventObject('copyConnectChanged'));
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return graph.connectionHandler.isCreateTarget();
  });
  action.isEnabled = isGraphEnabled;

  //自动保存
  action = this.addAction('autosave', function () {
    ui.editor.setAutosave(!ui.editor.autosave);
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return ui.editor.autosave;
  });
  action.isEnabled = isGraphEnabled;
  action.visible = false;

  // Help actions--帮助菜单
  //帮助
  this.addAction('help', function () {
    var ext = '';
    if (mxResources.isLanguageSupported(mxClient.language)) {
      ext = '_' + mxClient.language;
    }
    graph.openLink(RESOURCES_PATH + '/help' + ext + '.html');
  });

  var showingAbout = false;
  //关于
  this.put('about', new Action(mxResources.get('about') + ' Graph Editor...', function () {
    if (!showingAbout) {
      ui.showDialog(new AboutDialog(ui).container, 320, 280, true, true, function () {
        showingAbout = false;
      });
      showingAbout = true;
    }
  }));

  // Font style actions
  var toggleFontStyle = mxUtils.bind(this, function (key, style, fn, shortcut) {
    return this.addAction(key, function () {
      if (fn != null && graph.cellEditor.isContentEditing()) {
        fn();
      } else {

        graph.stopEditing(false);
        graph.getModel().beginUpdate();

        try {
          var cells = graph.getSelectionCells();
          graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, style, cells);

          // Removes bold and italic tags and CSS styles inside labels
          if ((style & mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD) {
            graph.updateLabelElements(graph.getSelectionCells(), function (elt) {
              elt.style.fontWeight = null;

              if (elt.nodeName == 'B') {
                graph.replaceElement(elt);
              }
            });
          } else if ((style & mxConstants.FONT_ITALIC) == mxConstants.FONT_ITALIC) {
            graph.updateLabelElements(graph.getSelectionCells(), function (elt) {
              elt.style.fontStyle = null;

              if (elt.nodeName == 'I') {
                graph.replaceElement(elt);
              }
            });
          } else if ((style & mxConstants.FONT_UNDERLINE) == mxConstants.FONT_UNDERLINE) {
            graph.updateLabelElements(graph.getSelectionCells(), function (elt) {
              elt.style.textDecoration = null;

              if (elt.nodeName == 'U') {
                graph.replaceElement(elt);
              }
            });
          }

          for (var i = 0; i < cells.length; i++) {
            if (graph.model.getChildCount(cells[i]) == 0) {
              graph.autoSizeCell(cells[i], false);
            }
          }

        } finally {
          graph.getModel().endUpdate();
        }
      }
    }, null, null, shortcut);
  });

  toggleFontStyle('bold', mxConstants.FONT_BOLD, function () {
    document.execCommand('bold', false, null);
  }, Editor.ctrlKey + '+B');
  toggleFontStyle('italic', mxConstants.FONT_ITALIC, function () {
    document.execCommand('italic', false, null);
  }, Editor.ctrlKey + '+I');
  toggleFontStyle('underline', mxConstants.FONT_UNDERLINE, function () {
    document.execCommand('underline', false, null);
  }, Editor.ctrlKey + '+U');

  // Color actions
  //字体颜色
  this.addAction('fontColor...', function () {
    ui.menus.pickColor(mxConstants.STYLE_FONTCOLOR, 'forecolor', '33ff99');
  });

  //线条颜色
  this.addAction('strokeColor...', function () {
    ui.menus.pickColor(mxConstants.STYLE_STROKECOLOR);
  });

  //填充色
  this.addAction('fillColor...', function () {
    ui.menus.pickColor(mxConstants.STYLE_FILLCOLOR);
  });

  //渐变颜色
  this.addAction('gradientColor...', function () {
    ui.menus.pickColor(mxConstants.STYLE_GRADIENTCOLOR);
  });

  //背景色
  this.addAction('backgroundColor...', function () {
    ui.menus.pickColor(mxConstants.STYLE_LABEL_BACKGROUNDCOLOR, 'backcolor');
  });

  //边框颜色
  this.addAction('borderColor...', function () {
    ui.menus.pickColor(mxConstants.STYLE_LABEL_BORDERCOLOR);
  });

  // Format actions
  //垂直
  this.addAction('vertical', function () {
    ui.menus.toggleStyle(mxConstants.STYLE_HORIZONTAL, true);
  });

  //阴影
  this.addAction('shadow', function () {
    ui.menus.toggleStyle(mxConstants.STYLE_SHADOW);
  });

  //固体
  this.addAction('solid', function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(mxConstants.STYLE_DASHED, null);
      graph.setCellStyles(mxConstants.STYLE_DASH_PATTERN, null);
      ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_DASHED, mxConstants.STYLE_DASH_PATTERN],
        'values', [null, null], 'cells', graph.getSelectionCells()));
    } finally {
      graph.getModel().endUpdate();
    }
  });

  //虚线
  this.addAction('dashed', function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(mxConstants.STYLE_DASHED, '1');
      graph.setCellStyles(mxConstants.STYLE_DASH_PATTERN, null);
      ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_DASHED, mxConstants.STYLE_DASH_PATTERN],
        'values', ['1', null], 'cells', graph.getSelectionCells()));
    } finally {
      graph.getModel().endUpdate();
    }
  });

  //点缀
  this.addAction('dotted', function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(mxConstants.STYLE_DASHED, '1');
      graph.setCellStyles(mxConstants.STYLE_DASH_PATTERN, '1 4');
      ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_DASHED, mxConstants.STYLE_DASH_PATTERN],
        'values', ['1', '1 4'], 'cells', graph.getSelectionCells()));
    } finally {
      graph.getModel().endUpdate();
    }
  });

  //尖角
  this.addAction('sharp', function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(mxConstants.STYLE_ROUNDED, '0');
      graph.setCellStyles(mxConstants.STYLE_CURVED, '0');
      ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_ROUNDED, mxConstants.STYLE_CURVED],
        'values', ['0', '0'], 'cells', graph.getSelectionCells()));
    } finally {
      graph.getModel().endUpdate();
    }
  });

  //圆角
  this.addAction('rounded', function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(mxConstants.STYLE_ROUNDED, '1');
      graph.setCellStyles(mxConstants.STYLE_CURVED, '0');
      ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_ROUNDED, mxConstants.STYLE_CURVED],
        'values', ['1', '0'], 'cells', graph.getSelectionCells()));
    } finally {
      graph.getModel().endUpdate();
    }
  });

  //切换
  this.addAction('toggleRounded', function () {
    if (!graph.isSelectionEmpty() && graph.isEnabled()) {
      graph.getModel().beginUpdate();
      try {
        var cells = graph.getSelectionCells();
        var state = graph.view.getState(cells[0]);
        var style = (state != null) ? state.style : graph.getCellStyle(cells[0]);
	      var style = graph.getCurrentCellStyle(cells[0]);
        var value = (mxUtils.getValue(style, mxConstants.STYLE_ROUNDED, '0') == '1') ? '0' : '1';
        graph.setCellStyles(mxConstants.STYLE_ROUNDED, value);
        graph.setCellStyles(mxConstants.STYLE_CURVED, null);
        ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_ROUNDED, mxConstants.STYLE_CURVED],
          'values', [value, '0'], 'cells', graph.getSelectionCells()));
      } finally {
        graph.getModel().endUpdate();
      }
    }
  });

  //曲线
  this.addAction('curved', function () {
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(mxConstants.STYLE_ROUNDED, '0');
      graph.setCellStyles(mxConstants.STYLE_CURVED, '1');
      ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_ROUNDED, mxConstants.STYLE_CURVED],
        'values', ['0', '1'], 'cells', graph.getSelectionCells()));
    } finally {
      graph.getModel().endUpdate();
    }
  });

  //可折叠
  this.addAction('collapsible', function () {
    var state = graph.view.getState(graph.getSelectionCell());
    var value = '1';
    console.log('1', state)
    if (state != null && graph.getFoldingImage(state) != null) {
      value = '0';
      console.log('0', state, graph.getFoldingImage(state))
    }

    graph.setCellStyles('collapsible', value);
    ui.fireEvent(new mxEventObject('styleChanged', 'keys', ['collapsible'],
      'values', [value], 'cells', graph.getSelectionCells()));
  });

  //编辑样式
  this.addAction('editStyle...', mxUtils.bind(this, function () {
    var cells = graph.getSelectionCells();

    if (cells != null && cells.length > 0) {
      var model = graph.getModel();

      var dlg = new TextareaDialog(this.editorUi, mxResources.get('editStyle') + ':',
        model.getStyle(cells[0]) || '',
        function (newValue) {
          if (newValue != null) {
            graph.setCellStyle(mxUtils.trim(newValue), cells);
          }
        }, null, null, 400, 220);
      this.editorUi.showDialog(dlg.container, 420, 300, true, true);
      dlg.init();
    }
  }), null, null, Editor.ctrlKey + '+E');

  //设置为默认样式
  this.addAction('setAsDefaultStyle', function () {
    if (graph.isEnabled() && !graph.isSelectionEmpty()) {
      ui.setDefaultStyle(graph.getSelectionCell());
    }
  }, null, null, Editor.ctrlKey + '+Shift+D');

  //清除默认样式
  this.addAction('clearDefaultStyle', function () {
    if (graph.isEnabled()) {
      ui.clearDefaultStyle();
    }
  }, null, null, Editor.ctrlKey + '+Shift+R');

  
  //新加的---名称显示与隐藏
  this.addAction('showDeviceName', function () {
    // !graph.isEnabled()  非编辑的画布
    // graph.isEnabled()  编辑的画布
    var allCells = Object.values(graph.getModel().cells);//当前页面所有的
    // console.log("显示隐藏--allCells:", allCells);
    graph.getModel().beginUpdate(); // 开启更新
    try {
      allCells.map(v=>{
        if (v.show || v.show == undefined ){
          if (v.infoType){
            //绑定设备的
            v.value = v.setValue(v, v.value)
            v.value = v.infoType + ':' + v.info

            //绑定设备的
            if( v.infoType == '名称' || v.infoType == "描述") {
              v.visible = !v.visible
            } 

          } else{
            // 其他的
            //图例的文字显示与隐藏
            if (v.value && v.style.indexOf('text;html=1;resizable=0;points=[];autosize=1;align=left;verticalAlign=top;spacingTop=-4;') !== -1){
              v.visible = !v.visible
            }

            //自动绘制---名称隐藏
            if (v.autoMark === 'autoMark' && v.deviceName){
              // console.log("+++", v, v.value)
              // var doc = mxUtils.createXmlDocument();
              // var value = doc.createElement('UserObject');
              // v.value = value.setAttribute('label', '');

              v.value = '';
              v.show = false;

              graph.setAttributeForCell(v, '设备名称',  v.deviceName);
              graph.setAttributeForCell(v, '在线状态', v.statusValue);
              graph.setAttributeForCell(v, '状态级别', v.statusValue);
            }
          }
        } 
        // 自动绘制---名称显示
        else if ( v.value.getAttribute('label') == '' && v.deviceName && v.style && v.autoMark === 'autoMark'){
          v.show = true;
          v.value = '名称:' + v.deviceName
          graph.setAttributeForCell(v, '设备名称', v.deviceName);
          graph.setAttributeForCell(v, '在线状态', v.statusValue);
          graph.setAttributeForCell(v, '状态级别', v.statusValue);

        }
      })
       graph.refresh(); //更新视图
      // var change = new ChangePageSetup(ui);
      // graph.model.execute(change);
    } finally {
      graph.getModel().endUpdate(); // 结束更新
    }
 
  });

  //添加锚点
  this.addAction('addWaypoint', function () {
    var cell = graph.getSelectionCell();
    if (cell != null && graph.getModel().isEdge(cell)) {
      var handler = editor.graph.selectionCellsHandler.getHandler(cell);
      if (handler instanceof mxEdgeHandler) {
        var t = graph.view.translate;
        var s = graph.view.scale;
        var dx = t.x;
        var dy = t.y;

        var parent = graph.getModel().getParent(cell);
        var pgeo = graph.getCellGeometry(parent);

        while (graph.getModel().isVertex(parent) && pgeo != null) {
          dx += pgeo.x;
          dy += pgeo.y;
          parent = graph.getModel().getParent(parent);
          pgeo = graph.getCellGeometry(parent);
        }

        var x = Math.round(graph.snap(graph.popupMenuHandler.triggerX / s - dx));
        var y = Math.round(graph.snap(graph.popupMenuHandler.triggerY / s - dy));
        handler.addPointAt(handler.state, x, y);
      }
    }
  });

  //移除锚点
  this.addAction('removeWaypoint', function () {
    // TODO: Action should run with "this" set to action
    var rmWaypointAction = ui.actions.get('removeWaypoint');
    if (rmWaypointAction.handler != null) {
      // NOTE: Popupevent handled and action updated in Menus.createPopupMenu
      rmWaypointAction.handler.removePoint(rmWaypointAction.handler.state, rmWaypointAction.index);
    }
  });

  //清除曲线锚点
  this.addAction('clearWaypoints', function () {
    var cells = graph.getSelectionCells();
    if (cells != null) {
      cells = graph.addAllEdges(cells);
      graph.getModel().beginUpdate();
      try {
        for (var i = 0; i < cells.length; i++) {
          var cell = cells[i];
          if (graph.getModel().isEdge(cell)) {
            var geo = graph.getCellGeometry(cell);
            if (geo != null) {
              geo = geo.clone();
              geo.points = null;
              graph.getModel().setGeometry(cell, geo);
            }
          }
        }
      } finally {
        graph.getModel().endUpdate();
      }
    }
  }, null, null, 'Alt+Shift+C');

  //下标
  action = this.addAction('subscript', mxUtils.bind(this, function () {
    if (graph.cellEditor.isContentEditing()) {
      document.execCommand('subscript', false, null);
    }
  }), null, null, Editor.ctrlKey + '+,');

  //上标
  action = this.addAction('superscript', mxUtils.bind(this, function () {
    if (graph.cellEditor.isContentEditing()) {
      document.execCommand('superscript', false, null);
    }
  }), null, null, Editor.ctrlKey + '+.');
action = this.addAction('indent', mxUtils.bind(this, function () {
	// NOTE: Alt+Tab for outdent implemented via special code in
	// keyHandler.getFunction in EditorUi.js. Ctrl+Tab is reserved.
	if (graph.cellEditor.isContentEditing()) {
		document.execCommand('indent', false, null);
	}
}), null, null, 'Shift+Tab');


  //图片
  this.addAction('image...', function () {
    if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())) {
      var title = mxResources.get('image') + ' (' + mxResources.get('url') + '):';
      var state = graph.getView().getState(graph.getSelectionCell());
      var value = '';
      if (state != null) {
        value = state.style[mxConstants.STYLE_IMAGE] || value;
      }
      var selectionState = graph.cellEditor.saveSelection();
      ui.showImageDialog(title, value, function (newValue, w, h) {
        // Inserts image into HTML text
        if (graph.cellEditor.isContentEditing()) {
          graph.cellEditor.restoreSelection(selectionState);
          graph.insertImage(newValue, w, h);
        } else {
          var cells = graph.getSelectionCells();
          if (newValue != null && (newValue.length > 0 || cells.length > 0)) {
            var select = null;
            graph.getModel().beginUpdate();
            try {
              // Inserts new cell if no cell is selected
              if (cells.length == 0) {
                cells = [graph.insertVertex(graph.getDefaultParent(), null, '', 0, 0, w, h,
                  'shape=image;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;')];
                var pt = graph.getCenterInsertPoint(graph.getBoundingBoxFromGeometry(cells, true));
                cells[0].geometry.x = pt.x;
                cells[0].geometry.y = pt.y;
                select = cells;
                graph.fireEvent(new mxEventObject('cellsInserted', 'cells', select));
              }
              graph.setCellStyles(mxConstants.STYLE_IMAGE, (newValue.length > 0) ? newValue : null, cells);

              // Sets shape only if not already shape with image (label or image)
              // var state = graph.view.getState(cells[0]);
              // var style = (state != null) ? state.style : graph.getCellStyle(cells[0]);

              var style = graph.getCurrentCellStyle(cells[0]);
              if (style[mxConstants.STYLE_SHAPE] != 'image' && style[mxConstants.STYLE_SHAPE] != 'label') {
                graph.setCellStyles(mxConstants.STYLE_SHAPE, 'image', cells);
              } else if (newValue.length == 0) {
                graph.setCellStyles(mxConstants.STYLE_SHAPE, null, cells);
              }

              if (graph.getSelectionCount() == 1) {
                if (w != null && h != null) {
                  var cell = cells[0];
                  var geo = graph.getModel().getGeometry(cell);
                  if (geo != null) {
                    geo = geo.clone();
                    geo.width = w;
                    geo.height = h;
                    graph.getModel().setGeometry(cell, geo);
                  }
                }
              }
            } finally {
              graph.getModel().endUpdate();
            }

            if (select != null) {
              graph.setSelectionCells(select);
              graph.scrollCellToVisible(select[0]);
            }
          }
        }
      }, graph.cellEditor.isContentEditing(), !graph.cellEditor.isContentEditing());
    }
  }).isEnabled = isGraphEnabled;

  //图层
  action = this.addAction('layers', mxUtils.bind(this, function () {
    if (this.layersWindow == null) {
      // LATER: Check outline window for initial placement
      this.layersWindow = new LayersWindow(ui, document.body.offsetWidth - 280, 120, 220, 196);
      this.layersWindow.window.addListener('show', function () {
        ui.fireEvent(new mxEventObject('layers'));
      });
      this.layersWindow.window.addListener('hide', function () {
        ui.fireEvent(new mxEventObject('layers'));
      });
      this.layersWindow.window.setVisible(true);
      ui.fireEvent(new mxEventObject('layers'));

      this.layersWindow.init();
    } else {
      this.layersWindow.window.setVisible(!this.layersWindow.window.isVisible());
    }
  }), null, null, Editor.ctrlKey + '+Shift+L');
  action.setToggleAction(true);
  action.setSelectedCallback(mxUtils.bind(this, function () {
    return this.layersWindow != null && this.layersWindow.window.isVisible();
  }));

  //格式面板
  action = this.addAction('formatPanel', mxUtils.bind(this, function () {
    ui.toggleFormatPanel();
  }), null, null, Editor.ctrlKey + '+Shift+P');
  action.setToggleAction(true);
  action.setSelectedCallback(mxUtils.bind(this, function () {
    return ui.formatWidth > 0;
  }));

  //缩略图
  action = this.addAction('outline', mxUtils.bind(this, function () {
    if (this.outlineWindow == null) {
      // LATER: Check layers window for initial placement
      this.outlineWindow = new OutlineWindow(ui, document.body.offsetWidth - 260, 100, 180, 180);
      this.outlineWindow.window.addListener('show', function () {
        ui.fireEvent(new mxEventObject('outline'));
      });
      this.outlineWindow.window.addListener('hide', function () {
        ui.fireEvent(new mxEventObject('outline'));
      });
      this.outlineWindow.window.setVisible(true);
      ui.fireEvent(new mxEventObject('outline'));
    } else {
      this.outlineWindow.window.setVisible(!this.outlineWindow.window.isVisible());
    }
  }), null, null, Editor.ctrlKey + '+Shift+O');

  //创建图例 legend
  action = this.addAction('legend', mxUtils.bind(this, function () {
    if (mxFreehand) {
      if (this.createLegendDialog == null) {
          this.createLegendDialog = new createLegendDialog(ui, document.body.offsetWidth - 420-38, 110, 220, 280);
      } else {
        this.createLegendDialog.window.setVisible(!this.createLegendDialog.window.isVisible());
      }
    }
  }), null, null);
  action.setToggleAction(true);

  //自由绘制
  action = this.addAction('freehand', mxUtils.bind(this, function () {
    if (mxFreehand) {
      if (this.freehandWindow == null) {
        this.freehandWindow = new FreehandWindow(ui, document.body.offsetWidth - 420, 110, 176, 104);
        this.freehandWindow.window.addListener('show', function () {
          ui.fireEvent(new mxEventObject('freehand'));
        });
        this.freehandWindow.window.addListener('hide', function () {
          ui.fireEvent(new mxEventObject('freehand'));
        });
        this.freehandWindow.window.setVisible(true);
        ui.fireEvent(new mxEventObject('freehand'));
      } else {
        this.freehandWindow.window.setVisible(!this.freehandWindow.window.isVisible());
      }

      if (graph.freehand.isDrawing()) {
        graph.freehand.stopDrawing();
      } else {
        graph.freehand.startDrawing();
      }
      this.freehandWindow.window.setVisible(graph.freehand.isDrawing());
    }

  }), null, null);

  action.setToggleAction(true);
  action.setSelectedCallback(mxUtils.bind(this, function () {
    return this.outlineWindow != null && this.outlineWindow.window.isVisible();
  }));
};

/**
 * Registers the given action under the given name.
 */
Actions.prototype.addAction = function (key, funct, enabled, iconCls, shortcut) {
  var title;
  if (key.substring(key.length - 3) == '...') {
    key = key.substring(0, key.length - 3);
    title = mxResources.get(key) + '...';
  } else {
    title = mxResources.get(key);
  }
  return this.put(key, new Action(title, funct, enabled, iconCls, shortcut));
};

/**
 * Registers the given action under the given name.
 */
Actions.prototype.put = function (name, action) {
  this.actions[name] = action;
  return action;
};

/**
 * Returns the action for the given name or null if no such action exists.
 */
Actions.prototype.get = function (name) {
  return this.actions[name];
};

/**
 * Constructs a new action for the given parameters.
 */
function Action(label, funct, enabled, iconCls, shortcut) {
  mxEventSource.call(this);
  this.label = label;
  this.funct = this.createFunction(funct);
  this.enabled = (enabled != null) ? enabled : true;
  this.iconCls = iconCls;
  this.shortcut = shortcut;
  this.visible = true;
};

// Action inherits from mxEventSource
mxUtils.extend(Action, mxEventSource);

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.createFunction = function (funct) {
  return funct;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setEnabled = function (value) {
  if (this.enabled != value) {
    this.enabled = value;
    this.fireEvent(new mxEventObject('stateChanged'));
  }
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.isEnabled = function () {
  return this.enabled;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setToggleAction = function (value) {
  this.toggleAction = value;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setSelectedCallback = function (funct) {
  this.selectedCallback = funct;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.isSelected = function () {
  return this.selectedCallback();
};

export default Actions;