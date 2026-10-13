import mxgraph from './index';
import EditorUi from './EditorUi';
import Editor from './Editor';
import {Dialog} from './Editor';
import {Graph} from './Graph';
import jscolor from './jscolor';
import axios from 'axios';
//api
import graphApi from '../../../api/graph.api'

// 导入的数据，从列表拿到的
var importObj = null;
export function sendImport_data(obj) {
  importObj = obj;
  localStorage.setItem('importObj',JSON.stringify(importObj));
}

const {
  mxCell,
  mxCellRenderer,
  mxCellOverlay,
  mxCellState,
  mxCircleLayout,
  mxClient,
  mxClipboard,
  mxCompactTreeLayout,
  mxConstants,
  mxUtils,
  mxEdgeHandler,
  mxEvent,
  mxEventObject,
  mxFastOrganicLayout,
  mxForm,
  mxHierarchicalLayout,
  mxRadialTreeLayout,
  mxResources,
  mxWindow,
  mxRectangle,
  mxOutline,
  mxParallelEdgeLayout,
  mxMorphing,
  mxXmlCanvas2D,
  mxXmlRequest,
  mxImage,
  mxImageExport,
  mxUrlConverter,
} = mxgraph;

//全局定义
var App = {MODE_DEVICE: 'device'};
var isLocalStorage = true;

//select 多选
import selectMultip from '../resources/selectMultip.js'
// 设备列表json数据
import devices from '../resources/deviceInfo.json'
// 设备类型Data
import deviceTypeData from '../resources/deviceTypeData.json'

//生成大图ID的js
// import {deviceTopoCode} from '../resources/serialPort'
/**
 * Constructs a new open dialog.
 */
// 此弹层暂时没有使用！！！
var OpenDialog = function () {
  var iframe = document.createElement('iframe');
  iframe.style.backgroundColor = 'transparent';
  iframe.allowTransparency = 'true';
  iframe.style.borderStyle = 'none';
  iframe.style.borderWidth = '0px';
  iframe.style.overflow = 'hidden';
  iframe.frameBorder = '0';
  // Adds padding as a workaround for box model in older IE versions
  var dx = (mxClient.IS_VML && (document.documentMode == null || document.documentMode < 8)) ? 20 : 0;
  iframe.setAttribute('width', (((Editor.useLocalStorage) ? 640 : 320) + dx) + 'px');
  iframe.setAttribute('height', (((Editor.useLocalStorage) ? 480 : 220) + dx) + 'px');
  iframe.setAttribute('src', OPEN_FORM);
  this.container = iframe;
};

/**
 * Constructs a new color dialog.
 * 构造新的颜色对话框
 */
var ColorDialog = function (editorUi, color, apply, cancelFn) {
  //从EditorUi.js: pickColor(color, apply) 传过来的color
  // console.log("color???:", color);
  this.editorUi = editorUi;

  var input = document.createElement('input');
  input.style.marginBottom = '10px';
  input.style.width = '216px';

  // Required for picker to render in IE
  if (mxClient.IS_IE) {
    input.style.marginTop = '10px';
    document.body.appendChild(input);
  }

	var applyFunction = (apply != null) ? apply : this.createApplyFunction();

	function doApply() {
		var color = input.value;

		// Blocks any non-alphabetic chars in colors
		if (/(^#?[a-zA-Z0-9]*$)/.test(color)) {
			if (color != 'none' && color.charAt(0) != '#') {
				color = '#' + color;
			}

			ColorDialog.addRecentColor((color != 'none') ? color.substring(1) : color, 12);
			applyFunction(color);
			editorUi.hideDialog();
		} else {
			editorUi.handleError({
				message: mxResources.get('invalidInput')
			});
		}
	};

	this.init = function () {
		if (!mxClient.IS_TOUCH) {
			input.focus();
		}
	};

	var picker = new jscolor.color(input);
	picker.pickerOnfocus = false;
	picker.showPicker();

	var div = document.createElement('div');
	jscolor.picker.box.style.position = 'relative';
	jscolor.picker.box.style.width = '230px';
	jscolor.picker.box.style.height = '100px';
	jscolor.picker.box.style.paddingBottom = '10px';
	div.appendChild(jscolor.picker.box);

	var center = document.createElement('center');

	function createRecentColorTable() {
		var table = addPresets((ColorDialog.recentColors.length == 0) ? ['FFFFFF'] :
			ColorDialog.recentColors, 11, 'FFFFFF', true);
		table.style.marginBottom = '8px';

		return table;
	};

  function addPresets(presets, rowLength, defaultColor, addResetOption) {
    rowLength = (rowLength != null) ? rowLength : 12;
    var table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.setAttribute('cellspacing', '0');
    table.style.marginBottom = '20px';
    table.style.cellSpacing = '0px';
    var tbody = document.createElement('tbody');
    table.appendChild(tbody);
    var rows = presets.length / rowLength;
    for (var row = 0; row < rows; row++) {
      var tr = document.createElement('tr');

      for (var i = 0; i < rowLength; i++) {
        (function (clr) {
          var td = document.createElement('td');
          td.style.border = '1px solid black';
          td.style.padding = '0px';
          td.style.width = '16px';
          td.style.height = '16px';

          if (clr == null) {
            clr = defaultColor;
          }

          if (clr == 'none') {
            td.style.background = 'url(\'' + Dialog.prototype.noColorImage + '\')';
          } else {
            td.style.backgroundColor = '#' + clr;
          }
          tr.appendChild(td);
          if (clr != null) {
            td.style.cursor = 'pointer';

						mxEvent.addListener(td, 'click', function () {
							if (clr == 'none') {
								picker.fromString('ffffff');
								input.value = 'none';
							} else {
								picker.fromString(clr);
							}
						});

						mxEvent.addListener(td, 'dblclick', doApply);
					}
				})(presets[row * rowLength + i]);
			}

			tbody.appendChild(tr);
		}

    if (addResetOption) {
      var td = document.createElement('td');
      td.setAttribute('title', mxResources.get('reset'));
      td.style.border = '1px solid black';
      td.style.padding = '0px';
      td.style.width = '16px';
      td.style.height = '16px';
      td.style.backgroundImage = 'url(\'' + Dialog.prototype.closeImage + '\')';
      td.style.backgroundPosition = 'center center';
      td.style.backgroundRepeat = 'no-repeat';
      td.style.cursor = 'pointer';

      tr.appendChild(td);
      mxEvent.addListener(td, 'click', function () {
        ColorDialog.resetRecentColors();
        table.parentNode.replaceChild(createRecentColorTable(), table);
      });
    }

    center.appendChild(table);
    return table;
  };

  div.appendChild(input);
  mxUtils.br(div);

  // Adds recent colors
  createRecentColorTable();

  // Adds presets
  var table = addPresets(this.presetColors);
  table.style.marginBottom = '8px';
  table = addPresets(this.defaultColors);
  table.style.marginBottom = '16px';
  div.appendChild(center);

  var buttons = document.createElement('div');
  buttons.style.textAlign = 'right';
  buttons.style.whiteSpace = 'nowrap';

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    editorUi.hideDialog();

    if (cancelFn != null) {
      cancelFn();
    }
  });
  cancelBtn.className = 'geBtn';
  if (editorUi.editor.cancelFirst) {
    buttons.appendChild(cancelBtn);
  }

	var applyBtn = mxUtils.button(mxResources.get('apply'), doApply);
	applyBtn.className = 'geBtn gePrimaryBtn';
	buttons.appendChild(applyBtn);

  if (!editorUi.editor.cancelFirst) {
    buttons.appendChild(cancelBtn);
  }

  if (color != null) {
    if (color == 'none') {
      picker.fromString('ffffff');
      input.value = 'none';
    } else {
      picker.fromString(color);
    }
  }

  div.appendChild(buttons);
  this.picker = picker;
  this.colorInput = input;

  // LATER: Only fires if input if focused, should always
  // fire if this dialog is showing.
  mxEvent.addListener(div, 'keydown', function (e) {
    if (e.keyCode == 27) {
      editorUi.hideDialog();
      if (cancelFn != null) {
        cancelFn();
      }
      mxEvent.consume(e);
    }
  });
  this.container = div;
};

/**
 * Creates function to apply value
 * 创建应用值的函数
 */
ColorDialog.prototype.presetColors = ['E6D0DE', 'CDA2BE', 'B5739D', 'E1D5E7', 'C3ABD0', 'A680B8', 'D4E1F5', 'A9C4EB', '7EA6E0', 'D5E8D4', '9AC7BF', '67AB9F', 'D5E8D4', 'B9E0A5', '97D077', 'FFF2CC', 'FFE599', 'FFD966', 'FFF4C3', 'FFCE9F', 'FFB570', 'F8CECC', 'F19C99', 'EA6B66'];

/**
 * Creates function to apply value
 * 创建应用值的函数
 */
ColorDialog.prototype.defaultColors = ['none', 'FFFFFF', 'E6E6E6', 'CCCCCC', 'B3B3B3', '999999', '808080', '666666', '4D4D4D', '333333', '1A1A1A', '000000', 'FFCCCC', 'FFE6CC', 'FFFFCC', 'E6FFCC', 'CCFFCC', 'CCFFE6', 'CCFFFF', 'CCE5FF', 'CCCCFF', 'E5CCFF', 'FFCCFF', 'FFCCE6',
  'FF9999', 'FFCC99', 'FFFF99', 'CCFF99', '99FF99', '99FFCC', '99FFFF', '99CCFF', '9999FF', 'CC99FF', 'FF99FF', 'FF99CC', 'FF6666', 'FFB366', 'FFFF66', 'B3FF66', '66FF66', '66FFB3', '66FFFF', '66B2FF', '6666FF', 'B266FF', 'FF66FF', 'FF66B3', 'FF3333', 'FF9933', 'FFFF33',
  '99FF33', '33FF33', '33FF99', '33FFFF', '3399FF', '3333FF', '9933FF', 'FF33FF', 'FF3399', 'FF0000', 'FF8000', 'FFFF00', '80FF00', '00FF00', '00FF80', '00FFFF', '007FFF', '0000FF', '7F00FF', 'FF00FF', 'FF0080', 'CC0000', 'CC6600', 'CCCC00', '66CC00', '00CC00', '00CC66',
  '00CCCC', '0066CC', '0000CC', '6600CC', 'CC00CC', 'CC0066', '990000', '994C00', '999900', '4D9900', '009900', '00994D', '009999', '004C99', '000099', '4C0099', '990099', '99004D', '660000', '663300', '666600', '336600', '006600', '006633', '006666', '003366', '000066',
  '330066', '660066', '660033', '330000', '331A00', '333300', '1A3300', '003300', '00331A', '003333', '001933', '000033', '190033', '330033', '33001A'
];

/**
 * Creates function to apply value
 */
ColorDialog.prototype.createApplyFunction = function () {
  return mxUtils.bind(this, function (color) {
    var graph = this.editorUi.editor.graph;
    graph.getModel().beginUpdate();
    try {
      graph.setCellStyles(this.currentColorKey, color);
      this.editorUi.fireEvent(new mxEventObject('styleChanged', 'keys', [this.currentColorKey],
        'values', [color], 'cells', graph.getSelectionCells()));
    } finally {
      graph.getModel().endUpdate();
    }
  });
};

/**
 * 最新颜色
 */
ColorDialog.recentColors = [];

/**
 * Adds recent color for later use.
 * 添加最新颜色供以后使用。
 */
ColorDialog.addRecentColor = function (color, max) {
  if (color != null) {
    mxUtils.remove(color, ColorDialog.recentColors);
    ColorDialog.recentColors.splice(0, 0, color);

    if (ColorDialog.recentColors.length >= max) {
      ColorDialog.recentColors.pop();
    }
  }
};

/**
 * Adds recent color for later use.
 * 添加最新颜色供以后使用。
 *
 */
ColorDialog.resetRecentColors = function () {
  ColorDialog.recentColors = [];
};

/**
 * Constructs a new about dialog.帮助子菜单--关于GrapherDitor
 */
var AboutDialog = function (editorUi) {
  var div = document.createElement('div');
  div.setAttribute('align', 'center');
  var h3 = document.createElement('h3');
  mxUtils.write(h3, mxResources.get('about') + ' GraphEditor');
  div.appendChild(h3);
  var img = document.createElement('img');
  img.style.border = '0px';
  img.setAttribute('width', '176');
  img.setAttribute('width', '151');
  // img.setAttribute('src', IMAGE_PATH + '/logo.png');
  img.setAttribute('src', ABOUT_PATH + '/logo.png');
  div.appendChild(img);
  mxUtils.br(div);
  mxUtils.write(div, 'Powered by mxGraph ' + mxClient.VERSION);
  mxUtils.br(div);
  var link = document.createElement('a');
  link.setAttribute('href', 'http://www.jgraph.com/');
  link.setAttribute('target', '_self');
  mxUtils.write(link, 'www.jgraph.com');
  div.appendChild(link);
  mxUtils.br(div);
  mxUtils.br(div);
  var closeBtn = mxUtils.button(mxResources.get('close'), function () {
    editorUi.hideDialog();
  });
  closeBtn.className = 'geBtn gePrimaryBtn';
  div.appendChild(closeBtn);
  this.container = div;
};

/**
 *  filename dialog. 大图保存,填写大图name的dialog
 */
var FilenameDialog = function (editorUi, filename, buttonText, fn, label, validateFn, content, helpLink, closeOnBtn, cancelFn, hints, w) {
  closeOnBtn = (closeOnBtn != null) ? closeOnBtn : true;
  var row, td;
  var table = document.createElement('table');
  var tbody = document.createElement('tbody');
  table.style.marginTop = '8px';
  row = document.createElement('tr');
  td = document.createElement('td');
  td.style.whiteSpace = 'nowrap';
  td.style.fontSize = '10pt';
  td.style.width = '120px';
  mxUtils.write(td, (label || mxResources.get('filename')) + ':');
  row.appendChild(td);

  let nameInput = document.createElement('input');
  nameInput.setAttribute('value', filename || '');
  nameInput.style.marginLeft = '4px';
  nameInput.style.width = (w != null) ? w + 'px' : '180px';
  // nameInput.placeholder = '大图name不能为空!';
  //大图名称的on-change事件
  // var diagramid = '';//大图id
  // nameInput.onchange = function (data) {
  //   console.log("大图名称:", data.target.value);
  //   if (data.target.value) {
  //     //调查询列表的接口
  //     graphApi.list().then(res => {
  //       var last_Max = res.data.data.length;
  //       // 自动生成的状态图id
  //       var _one = "00";
  //       var  _last = last_Max;
  //       _last++;
  //       var _maxNo = _last;
  //       _maxNo = _maxNo.toString(); //转为字符串
  //       diagramid = deviceTopoCode(_one,_maxNo);
  //       console.log(" diagramid:", diagramid,_maxNo);
  //     });
  //   }
  // }
  var genericBtn = mxUtils.button(buttonText, function () {

    if (validateFn == null || validateFn(nameInput.value)) {
      if (closeOnBtn) {
        editorUi.hideDialog();
      }
      fn(nameInput.value);

      // var obj = {
      //   id: diagramid,
      //   name: nameInput.value,
      // };
      // //验证大图名称是否已经存在
      // axios.get('/validateName?name=' + obj.name).then(res => {
      //   // console.log(res)
      //   if(res.data.status == 'error') {
      //     alert(res.data.data);//数据库里面大图名称已经存在
      //   } else {
      //     fn(obj);
      //     editorUi.hideDialog();
      //   }
      // }).catch()

    }

  });
  genericBtn.className = 'geBtn gePrimaryBtn';
  this.init = function () {
    if (label == null && content != null) {
      return;
    }
    nameInput.focus();

    if (mxClient.IS_GC || mxClient.IS_FF || document.documentMode >= 5 || mxClient.IS_QUIRKS) {
      nameInput.select();
    } else {
      document.execCommand('selectAll', false, null);
    }

    // Installs drag and drop handler for links
    if (Graph.fileSupport) {
      // Setup the dnd listeners
      var dlg = table.parentNode;
      if (dlg != null) {
        var graph = editorUi.editor.graph;
        var dropElt = null;
        mxEvent.addListener(dlg, 'dragleave', function (evt) {
          if (dropElt != null) {
            dropElt.style.backgroundColor = '';
            dropElt = null;
          }
          evt.stopPropagation();
          evt.preventDefault();
        });

        mxEvent.addListener(dlg, 'dragover', mxUtils.bind(this, function (evt) {
          // IE 10 does not implement pointer-events so it can't have a drop highlight
          if (dropElt == null && (!mxClient.IS_IE || document.documentMode > 10)) {
            dropElt = nameInput;
            dropElt.style.backgroundColor = '#ebf2f9';
          }
          evt.stopPropagation();
          evt.preventDefault();
        }));
        mxEvent.addListener(dlg, 'drop', mxUtils.bind(this, function (evt) {
          if (dropElt != null) {
            dropElt.style.backgroundColor = '';
            dropElt = null;
          }
          if (mxUtils.indexOf(evt.dataTransfer.types, 'text/uri-list') >= 0) {
            nameInput.value = decodeURIComponent(evt.dataTransfer.getData('text/uri-list'));
            genericBtn.click();
          }
          evt.stopPropagation();
          evt.preventDefault();
        }));
      }
    }
  };

  td = document.createElement('td');
  td.style.whiteSpace = 'nowrap';
  td.appendChild(nameInput);
  row.appendChild(td);

  if (label != null || content == null) {
    tbody.appendChild(row);
    if (hints != null) {

      // td.appendChild(FilenameDialog.createTypeHint(editorUi, nameInput, hints));

      if (editorUi.editor.diagramFileTypes != null) {
        var typeSelect = FilenameDialog.createFileTypes(editorUi, nameInput, editorUi.editor.diagramFileTypes);
        typeSelect.style.marginLeft = '6px';
        typeSelect.style.width = '74px';

        td.appendChild(typeSelect);
        nameInput.style.width = (w != null) ? (w - 40) + 'px' : '140px';
      }
      td.appendChild(FilenameDialog.createTypeHint(editorUi, nameInput, hints));
    }
  }

  if (content != null) {
    row = document.createElement('tr');
    td = document.createElement('td');
    td.colSpan = 2;
    td.appendChild(content);
    row.appendChild(td);
    tbody.appendChild(row);
  }

  row = document.createElement('tr');
  td = document.createElement('td');
  td.colSpan = 2;
  td.style.paddingTop = '20px';
  td.style.whiteSpace = 'nowrap';
  td.setAttribute('align', 'right');

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    editorUi.hideDialog();
    if (cancelFn != null) {
      cancelFn();
    }
  });
  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    td.appendChild(cancelBtn);
  }

  if (helpLink != null) {
    var helpBtn = mxUtils.button(mxResources.get('help'), function () {
      editorUi.editor.graph.openLink(helpLink);
    });

    helpBtn.className = 'geBtn';
    td.appendChild(helpBtn);
  }

  mxEvent.addListener(nameInput, 'keypress', function (e) {
    if (e.keyCode == 13) {
      genericBtn.click();
    }
  });

  td.appendChild(genericBtn);

  if (!editorUi.editor.cancelFirst) {
    td.appendChild(cancelBtn);
  }

  row.appendChild(td);
  tbody.appendChild(row);
  table.appendChild(tbody);
  this.container = table;
};

/**
 *
 */
FilenameDialog.filenameHelpLink = null;

/**
 *
 */
FilenameDialog.createTypeHint = function (ui, nameInput, hints) {
  var hint = document.createElement('img');
  hint.style.cssText = 'vertical-align:top;height:16px;width:16px;margin-left:4px;background-repeat:no-repeat;background-position:center bottom;cursor:pointer;';
  mxUtils.setOpacity(hint, 70);

  var nameChanged = function () {
    hint.setAttribute('src', Editor.helpImage);
    hint.setAttribute('title', mxResources.get('help'));

    for (var i = 0; i < hints.length; i++) {
      if (hints[i].ext.length > 0 &&
        nameInput.value.substring(nameInput.value.length -
          hints[i].ext.length - 1) == '.' + hints[i].ext) {
        hint.setAttribute('src', mxClient.imageBasePath + '/warning.png');
        hint.setAttribute('title', mxResources.get(hints[i].title));
        break;
      }
    }
  };

  mxEvent.addListener(nameInput, 'keyup', nameChanged);
  mxEvent.addListener(nameInput, 'change', nameChanged);
  mxEvent.addListener(hint, 'click', function (evt) {
    var title = hint.getAttribute('title');

    if (hint.getAttribute('src') == Editor.helpImage) {
      ui.editor.graph.openLink(FilenameDialog.filenameHelpLink);
    } else if (title != '') {
      ui.showError(null, title, mxResources.get('help'), function () {
        ui.editor.graph.openLink(FilenameDialog.filenameHelpLink);
      }, null, mxResources.get('ok'), null, null, null, 340, 90);
    }

    mxEvent.consume(evt);
  });
  nameChanged();
  return hint;
};

/**
 *
 */
FilenameDialog.createFileTypes = function (editorUi, nameInput, types) {
  var typeSelect = document.createElement('select');

  for (var i = 0; i < types.length; i++) {
    var typeOption = document.createElement('option');
    typeOption.setAttribute('value', i);
    mxUtils.write(typeOption, mxResources.get(types[i].description) +
      ' (.' + types[i].extension + ')');
    typeSelect.appendChild(typeOption);
  }

  mxEvent.addListener(typeSelect, 'change', function (evt) {
    var ext = types[typeSelect.value].extension;
    var idx = nameInput.value.lastIndexOf('.');

    if (idx > 0) {
      var ext = types[typeSelect.value].extension;
      nameInput.value = nameInput.value.substring(0, idx + 1) + ext;
    } else {
      nameInput.value = nameInput.value + '.' + ext;
    }

    if ('createEvent' in document) {
      var changeEvent = document.createEvent('HTMLEvents');
      changeEvent.initEvent('change', false, true);
      nameInput.dispatchEvent(changeEvent);
    } else {
      nameInput.fireEvent('onchange');
    }
  });

  var nameInputChanged = function (evt) {
    var idx = nameInput.value.lastIndexOf('.');
    var active = 0;

    // Finds current extension
    if (idx > 0) {
      var ext = nameInput.value.toLowerCase().substring(idx + 1);

      for (var i = 0; i < types.length; i++) {
        if (ext == types[i].extension) {
          active = i;
          break;
        }
      }
    }

    typeSelect.value = active;
  };

  mxEvent.addListener(nameInput, 'change', nameInputChanged);
  mxEvent.addListener(nameInput, 'keyup', nameInputChanged);
  nameInputChanged();

  return typeSelect;
};

/**
 * 添加设备类型 deviceTypeData-- 弹层
 */
var AddDeviceTypeDialog = function (editorUi, title, url, typeInfo, fn, cancelFn, cancelTitle, w, h,
  addButtons, noHide, noWrap, applyTitle, helpLink) {
    // console.log("添加设备类型弹层", typeInfo);
    var contentHtml = document.createElement('div')
    // console.log("deviceTypeData::",deviceTypeData);
    w = (w != null) ? w : 300;
    h = (h != null) ? h : 120;
    noHide = (noHide != null) ? noHide : false;

    var h3 = document.createElement('h3')
    h3.style.textAlign = 'center'
    h3.style.height = '40px'
    mxUtils.write(h3, typeInfo.type ? '修改设备类型' : '添加设备类型'); //加标题

    // 选择设备类型的 html
    var typeLabel = document.createElement('label')
    var span1 = document.createElement('span')
    // span1.style.display = 'inline-block'
    span1.style.width = '100px'
    span1.style.display = typeInfo.type ?  'none' : 'inline-block'
    mxUtils.write(span1, '设备类型：')
    typeLabel.appendChild(span1)
    var select = document.createElement('select');
    select.style.width = '250px'
    select.style.height = '28px'
    select.style.borderRadius = '5px'
    select.style.marginTop = '10px'
    select.style.paddingLeft = '15px';
    select.style.display = typeInfo.type ?  'none' : 'inline-block'

    for (var i = 0; i < deviceTypeData.length; i++) {
      var option = document.createElement('option');
      option.setAttribute('value', deviceTypeData[i].type);
      option.text = deviceTypeData[i].name;
      select.appendChild(option);
    }
    typeLabel.appendChild(select);

    //选择设备类型的 on-change事件
    select.onchange = function (data) {
      // console.log("选中设备类型:", data.target.value);
      var select_DeviceType = data.target.value;
      var select_DeviceTypeName = '';
      for (let i = 0; i < deviceTypeData.length; i++) {
        if (select_DeviceType == deviceTypeData[i].type) {
          select_DeviceTypeName = deviceTypeData[i].name;
        }
      }
      nameInput.value = select_DeviceTypeName;
    }

    // 选择图形类型的 html
    var styleLabel = document.createElement('label')
    var styleSpan1 = document.createElement('span')
    // styleSpan1.style.display = 'inline-block'
    styleSpan1.style.width = '100px'
    styleSpan1.style.display = typeInfo.type ? 'inline-block': 'none';
    mxUtils.write(styleSpan1, '图形：')
    styleLabel.appendChild(styleSpan1)
    var styleSelect = document.createElement('select');
    styleSelect.style.width = '250px'
    styleSelect.style.height = '28px'
    styleSelect.style.borderRadius = '5px'
    styleSelect.style.marginTop = '20px'
    styleSelect.style.paddingLeft = '15px';
    styleSelect.style.display = typeInfo.type ? 'inline-block': 'none';



    for (var i = 0; i < deviceTypeData.length; i++) {
      var styleOption = document.createElement('option');
      styleOption.setAttribute('value', deviceTypeData[i].style);
      styleOption.text = deviceTypeData[i].styleName;
      styleSelect.appendChild(styleOption);
    }
    styleLabel.appendChild(styleSelect);


    //选择图形的 on-change事件
    styleSelect.onchange = function (data) {
      // console.log("选中设备类型:", data.target.value);
      var select_Style = data.target.value;
      var select_StyleName = '';
      for (let i = 0; i < deviceTypeData.length; i++) {
        if (select_Style == deviceTypeData[i].style) {
          select_StyleName = deviceTypeData[i].styleName;
        }
      }
    }

    //添加设备类型名称 html
    var nameLabel = document.createElement('label');
    var span2 = document.createElement('span');
    span2.style.display = 'inline-block';
    span2.style.width = '100px';
    mxUtils.write(span2, '设备类型名称：');
    nameLabel.appendChild(span2);
    var nameInput = document.createElement('input');
    nameInput.value = typeInfo.name || '';
    nameInput.disabled = "disabled"
    nameInput.style.width = '250px';
    nameInput.style.height = '28px';
    nameInput.style.borderRadius = '5px';
    nameInput.style.marginTop = '20px';
    nameInput.style.border = '1px solid #999';
    nameInput.style.paddingLeft = '15px';
    nameLabel.appendChild(nameInput);
    nameInput.setAttribute('placeholder', '请输入添加设备类型名称');

    //隐藏设备类型名称
    var hideName = document.createElement('div');
    hideName.style.marginTop = '20px';
    var hideTitle1 = document.createElement('label');
    hideName.appendChild(hideTitle1);
    mxUtils.write(hideTitle1, '设备类型名称是否显示：');
    var hideSpan1 = document.createElement('sapn');
    mxUtils.write(hideSpan1, '是：');
    var showName = document.createElement('input');


    showName.setAttribute('type', 'radio');
    showName.setAttribute('name', 'nameRadio');
    hideTitle1.appendChild(hideSpan1);
    hideSpan1.appendChild(showName);

    var hideSpan2 = document.createElement('sapn');
    hideSpan2.style.marginLeft = '30px';
    hideSpan2.style.display = 'inlineBlock';
    mxUtils.write(hideSpan2, '否：');
    var closeName = document.createElement('input');
    closeName.setAttribute('name', 'nameRadio');
    closeName.setAttribute('type', 'radio');
    hideTitle1.appendChild(hideSpan2)
    hideSpan2.appendChild(closeName)

    if (typeInfo.isVisibleName) {
      showName.checked = true
      closeName.checked = false
    } else {
      showName.checked = false
      closeName.checked = true
    }

    contentHtml.appendChild(h3);

    contentHtml.appendChild(typeLabel);
    contentHtml.appendChild(document.createElement('br'));
    contentHtml.appendChild(styleLabel);
    contentHtml.appendChild(document.createElement('br'));
    contentHtml.appendChild(nameLabel);
    contentHtml.appendChild(hideName);

    var buttonWrap = document.createElement('div');
    buttonWrap.style.margin = "35px 40px 0px";
    buttonWrap.style.textAlign = "right";

    // if (noWrap) {
    //   nameInput.setAttribute('wrap', 'off');
    // }
    select.focus();
    styleSelect.focus();
    select.value = typeInfo.type || deviceTypeData[0].type
    styleSelect.value = typeInfo.style || deviceTypeData[0].style
    nameInput.value = typeInfo.name || deviceTypeData[0].name;

    // if (helpLink != null) {
    //   var helpBtn = mxUtils.button(mxResources.get('help'), function () {
    //     editorUi.editor.graph.openLink(helpLink);
    //   });
    //   helpBtn.className = 'geBtn';
    //   buttonWrap.appendChild(helpBtn);
    // }

    var cancelBtn = mxUtils.button(cancelTitle || mxResources.get('cancel'), function () {
      editorUi.hideDialog();
      if (cancelFn != null) {
        cancelFn();
      }
    });
    cancelBtn.className = 'geBtn';

    if (editorUi.editor.cancelFirst) {
      buttonWrap.appendChild(cancelBtn);
    }

    if (addButtons != null) {
      addButtons(td, select);
    }

    if (fn != null) {
      var genericBtn = mxUtils.button(applyTitle || mxResources.get('apply'), function () {
        if (!noHide) {
          editorUi.hideDialog();
        }
        //添加设备类型--type 赋值 name
        var name = '';
        var styleName = "";
        for (var i = 0; i < deviceTypeData.length; i++) {
          deviceTypeData[i].type = deviceTypeData[i].type.toString(); //转成字符串类型
          if (select.value === deviceTypeData[i].type) {
            name = deviceTypeData[i].name
          }
          if(styleSelect.value === deviceTypeData[i].style){
            styleName = deviceTypeData[i].styleName
          }
        }
        // console.log(nameInput.value)
        var obj = {
          name: name,
          type: select.value,
          style: styleSelect.value,
          styleName: styleName,
          isVisibleName: showName.checked,
        }
        fn(obj); // 回调函数 传值到 action.js 里面的   this.addAction('addDeviceType',...) 里面
      });

      genericBtn.className = 'geBtn gePrimaryBtn';
      buttonWrap.appendChild(genericBtn);
    }

    if (!editorUi.editor.cancelFirst) {
      buttonWrap.appendChild(cancelBtn);
    }
    contentHtml.appendChild(buttonWrap)

  this.container = contentHtml;
}


/**
 * 之前的原生js写的绑定设备弹层的dialog
 * select dialog.绑定设备的dialog
 *
 */
var SelectDialog = function (editorUi, title, url, preDeviceInfo, fn, cancelFn, cancelTitle, w, h,
  addButtons, noHide, noWrap, applyTitle, helpLink) {
  console.log("打开绑定设备弹层：", preDeviceInfo);
  w = (w != null) ? w : 300;
  h = (h != null) ? h : 120;
  noHide = (noHide != null) ? noHide : false;

  var contentHtml = document.createElement('div');
  var h3 = document.createElement('h3');
  h3.style.textAlign = 'center';
  h3.style.height = '40px';
  mxUtils.write(h3, '绑定设备信息'); //加标题'绑定设备'

  // 选择设备 html
  var deviceLabel = document.createElement('label');
  var span1 = document.createElement('span');
  span1.style.display = 'inline-block';
  span1.style.width = '70px';
  mxUtils.write(span1, '选择设备：');
  deviceLabel.appendChild(span1);
  var select = document.createElement('select');
  select.style.width = '250px';
  select.style.height = '26px';
  select.style.borderRadius = '5px';
  select.style.marginTop = '10px';
  select.style.paddingLeft = '8px';
  select.style.border = '1px solid #dcdee2';
  select.style.outline = 'none';
  //选择多个设备，超出框隐藏
  select.style.textOverflow = 'ellipsis';
  select.style.whiteSpace = 'nowrap';
  select.style.overflow = 'hidden';

  select.setAttribute('id', 'deviceSelect');
  select.setAttribute('multip', true);


  // console.log(devices, 'devices')
  // for (var i = 0; i < devices.length; i++) {
  //   var option = document.createElement('option');
  //   option.setAttribute('value', devices[i].deviceId);
  //   option.text = devices[i].deviceName;
  //   select.appendChild(option);
  // }
  deviceLabel.appendChild(select);

  var new_devices = [];
  for (let i = 0; i < devices.length; i++) {
    new_devices.push({
      value: devices[i].deviceId,
      text: devices[i].deviceName
    })
  }
  // console.log("new_devices:",new_devices);

  var allDeviceData = [];
  //选择设备的on-change事件
  select.onchange = function (data) {
    var select_Id_Arry = selectMultip.getVal("deviceSelect").split(",");

    allDeviceData = select_Id_Arry.map(item => ({
      deviceId: item,
      deviceName: "",
      name: "",
      desc: "",
      isVisibleName: "",
      isVisibleDesc: "",
    }));
    console.log("allDeviceData111:",allDeviceData);

    for (let i = 0; i < devices.length; i++) {
      for (let k = 0; k < allDeviceData.length; k++) {
        if (allDeviceData[k].deviceId == devices[i].deviceId) {
          allDeviceData[k].deviceName = devices[i].deviceName
          allDeviceData[k].name = devices[i].deviceName
        }
      }
    }
    //名称
    nameInput.value = allDeviceData.map(v => v.deviceName).join(',')
  }

  // 输入名称 html
  var nameLabel = document.createElement('label');
  var span2 = document.createElement('span');
  span2.style.display = 'inline-block';
  span2.style.width = '70px';
  mxUtils.write(span2, '名称：');
  nameLabel.appendChild(span2);
  var nameInput = document.createElement('input');
  nameInput.value = preDeviceInfo.name || ''
  nameInput.style.width = '250px';
  nameInput.style.height = '26px';
  nameInput.style.borderRadius = '5px';
  nameInput.style.marginTop = '10px';
  nameInput.style.border = '1px solid #999';
  nameInput.style.paddingLeft = '8px';
  nameInput.style.border = '1px solid #dcdee2';
  nameLabel.appendChild(nameInput);
  nameInput.setAttribute('placeholder', '请输入名称');

  // 输入描述 html
  var descLabel = document.createElement('label');
  var span3 = document.createElement('span');
  span3.style.display = 'inline-block';
  span3.style.width = '70px';
  mxUtils.write(span3, '描述：');
  descLabel.appendChild(span3);
  var descInput = document.createElement('input');
  descInput.value = preDeviceInfo.desc || ''
  descInput.style.width = '250px';
  descInput.style.height = '26px';
  descInput.style.borderRadius = '5px';
  descInput.style.border = '1px solid #999';
  descInput.style.marginTop = '10px';
  descInput.style.paddingLeft = '8px';
  descInput.style.border = '1px solid #dcdee2';
  descLabel.appendChild(descInput);
  descInput.setAttribute('placeholder', '请输入描述');

  // 隐藏名称
  var hideName = document.createElement('div');
  hideName.style.marginTop = '20px';
  var hideTitle1 = document.createElement('label');
  hideName.appendChild(hideTitle1);
  mxUtils.write(hideTitle1, '名称显示：');
  var hideSpan1 = document.createElement('sapn');
  mxUtils.write(hideSpan1, '是：');
  var showName = document.createElement('input');


  showName.setAttribute('type', 'radio');
  showName.setAttribute('name', 'nameRadio');
  hideTitle1.appendChild(hideSpan1);
  hideSpan1.appendChild(showName);

  var hideSpan2 = document.createElement('sapn');
  hideSpan2.style.marginLeft = '30px';
  hideSpan2.style.display = 'inlineBlock';
  mxUtils.write(hideSpan2, '否：');
  var closeName = document.createElement('input');
  closeName.setAttribute('name', 'nameRadio');
  closeName.setAttribute('type', 'radio');
  hideTitle1.appendChild(hideSpan2)
  hideSpan2.appendChild(closeName)

  if (preDeviceInfo.isVisibleName) {
    showName.checked = true
    closeName.checked = false
  } else {
    showName.checked = false
    closeName.checked = true
  }

  // 隐藏描述Hide description
  var hideDescription = document.createElement('div');
  hideDescription.style.marginTop = '20px';
  var descTitle1 = document.createElement('label');
  hideDescription.appendChild(descTitle1);
  mxUtils.write(descTitle1, '描述显示：');
  var descSpan1 = document.createElement('sapn');
  mxUtils.write(descSpan1, '是：');
  var showDesc = document.createElement('input');
  showDesc.setAttribute('name', 'descRadio');
  showDesc.setAttribute('type', 'radio');

  descTitle1.appendChild(descSpan1);
  descSpan1.appendChild(showDesc);

  var descSpan2 = document.createElement('sapn');
  descSpan2.style.marginLeft = '30px';
  descSpan2.style.display = 'inline-block';
  mxUtils.write(descSpan2, '否：');
  var closeDesc = document.createElement('input');
  closeDesc.setAttribute('name', 'descRadio');
  closeDesc.setAttribute('type', 'radio');
  descTitle1.appendChild(descSpan2)
  descSpan2.appendChild(closeDesc)

  if (preDeviceInfo.isVisibleDesc) {
    showDesc.checked = true
    closeDesc.checked = false
  } else {
    showDesc.checked = false
    closeDesc.checked = true
  }


  //当前绑定的一组数据---是否组合（可折叠）
  var hideGroup = document.createElement('div');
  hideGroup.style.marginTop = '20px';
  var groupTitle1 = document.createElement('label');
  hideGroup.appendChild(groupTitle1);
  mxUtils.write(groupTitle1, '设备组合：');
  var groupSpan1 = document.createElement('sapn');
  mxUtils.write(groupSpan1, '是：');
  var showGroup = document.createElement('input');
  showGroup.setAttribute('name', 'groupRadio');
  showGroup.setAttribute('type', 'radio');

  groupTitle1.appendChild(groupSpan1);
  groupSpan1.appendChild(showGroup);

  var groupSpan2 = document.createElement('sapn');
  groupSpan2.style.marginLeft = '30px';
  groupSpan2.style.display = 'inline-block';
  mxUtils.write(groupSpan2, '否：');
  var closeGroup = document.createElement('input');
  closeGroup.setAttribute('name', 'groupRadio');
  closeGroup.setAttribute('type', 'radio');
  groupTitle1.appendChild(groupSpan2)
  groupSpan2.appendChild(closeGroup)

  if (preDeviceInfo.isVisibleDesc) {
    showGroup.checked = true
    closeGroup.checked = false
  } else {
    showGroup.checked = false
    closeGroup.checked = true
  }


  //当前绑定的设备自动移动位置---是否移动
  var hidePosition = document.createElement('div');
  hidePosition.style.marginTop = '20px';
  var positionTitle1 = document.createElement('label');
  hidePosition.appendChild(positionTitle1);
  mxUtils.write(positionTitle1, '位置调整：');
  var positionSpan1 = document.createElement('sapn');
  mxUtils.write(positionSpan1, '是：');
  var showPosition = document.createElement('input');
  showPosition.setAttribute('name', 'positionRadio');
  showPosition.setAttribute('type', 'radio');

  positionTitle1.appendChild(positionSpan1);
  positionSpan1.appendChild(showPosition);

  var positionSpan2 = document.createElement('sapn');
  positionSpan2.style.marginLeft = '30px';
  positionSpan2.style.display = 'inline-block';
  mxUtils.write(positionSpan2, '否：');
  var closePosition = document.createElement('input');
  closePosition.setAttribute('name', 'positionRadio');
  closePosition.setAttribute('type', 'radio');
  positionTitle1.appendChild(positionSpan2)
  positionSpan2.appendChild(closePosition)

  if (preDeviceInfo.isVisibleDesc) {
    showPosition.checked = true
    closePosition.checked = false
  } else {
    showPosition.checked = false
    closePosition.checked = true
  }


  var br = document.createElement('br');
  var br2 = document.createElement('br');
  contentHtml.appendChild(h3);
  contentHtml.appendChild(deviceLabel);
  contentHtml.appendChild(br);
  contentHtml.appendChild(nameLabel);
  contentHtml.appendChild(br2);
  contentHtml.appendChild(descLabel);
  contentHtml.appendChild(hideName);
  contentHtml.appendChild(hideDescription);
  contentHtml.appendChild(hideGroup);
  contentHtml.appendChild(hidePosition);


  var buttonWrap = document.createElement('div');
  buttonWrap.style.margin = "40px 40px 0px";
  buttonWrap.style.textAlign = "right";

  // if (noWrap) {
  //   nameInput.setAttribute('wrap', 'off');
  // }

  this.init = function () {
    select.focus();
    select.value = preDeviceInfo.deviceId || devices[0].deviceId;
    nameInput.value = preDeviceInfo.deviceName || devices[0].deviceName;
    descInput.value = preDeviceInfo.desc || ''
    // selectMultip.register();
    //传值
    selectMultip.reload("deviceSelect", new_devices, preDeviceInfo.deviceId)

  };

  // if (helpLink != null) {
  //   var helpBtn = mxUtils.button(mxResources.get('help'), function () {
  //     editorUi.editor.graph.openLink(helpLink);
  //   });
  //   helpBtn.className = 'geBtn';
  //   buttonWrap.appendChild(helpBtn);
  // }

  var cancelBtn = mxUtils.button(cancelTitle || mxResources.get('cancel'), function () {
    editorUi.hideDialog();
    if (cancelFn != null) {
      cancelFn();
    }
  });
  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    buttonWrap.appendChild(cancelBtn);
  }

  if (addButtons != null) {
    addButtons(td, select);
  }

  if (fn != null) {
    var genericBtn = mxUtils.button(applyTitle || mxResources.get('apply'), function () {
      if (!noHide) {
        editorUi.hideDialog();
      }
      //绑定设备id赋值deviceName
      // var name = '';
      // for (var i = 0; i < devices.length; i++) {
      //   devices[i].deviceId = devices[i].deviceId.toString(); //转成字符串类型
      //   if (select.value === devices[i].deviceId) {
      //     name = devices[i].deviceName
      //   }
      // }
      // console.log(nameInput.value, descInput.value, showDesc.checked,closeDesc.checked)
      // var obj = {
      //   deviceName: name,
      //   id: select.value,
      //   name: nameInput.value,
      //   desc: descInput.value,
      //   isVisibleName: showName.checked,
      //   isVisibleDesc: showDesc.checked,
      // }

      for (let i = 0; i < allDeviceData.length; i++) {
        allDeviceData[i].desc = descInput.value
        allDeviceData[i].isVisibleName = showName.checked
        allDeviceData[i].isVisibleDesc = showName.checked
      }
      // console.log("result：",allDeviceData);
      fn(allDeviceData);

      //fn(obj); // 回调函数 传值到 action.js 里面的   this.addAction('bindingDeviceId'，...) 里面
    });

    genericBtn.className = 'geBtn gePrimaryBtn';
    buttonWrap.appendChild(genericBtn);
  }

  if (!editorUi.editor.cancelFirst) {
    buttonWrap.appendChild(cancelBtn);
  }
  contentHtml.appendChild(buttonWrap)
  this.container = contentHtml;
}

/**
 * 绑定xml--名称弹层
 */
var BindXMLDialog = function (editorUi, title, url, xmlInfo, fn, cancelFn, cancelTitle, w, h,
  addButtons, noHide, noWrap, applyTitle, helpLink) {
  // console.log("绑定xml--名称弹层", xmlInfo);
  var contentHtml = document.createElement('div')

  graphApi.list().then(mxUtils.bind(this, function (res) {
    var xmlList = res.data.data;
    // console.log("xmlList::",xmlList);
    w = (w != null) ? w : 300;
    h = (h != null) ? h : 120;
    noHide = (noHide != null) ? noHide : false;

    var h3 = document.createElement('h3')
    h3.style.textAlign = 'center'
    h3.style.height = '40px'
    mxUtils.write(h3, '超链接XML文件信息'); //加标题

    // 选择XML文件 html
    var xmlLabel = document.createElement('label')
    var span1 = document.createElement('span')
    span1.style.display = 'inline-block'
    span1.style.width = '100px'
    mxUtils.write(span1, '选择XML文件：')
    xmlLabel.appendChild(span1)
    var select = document.createElement('select');
    select.style.width = '250px'
    select.style.height = '28px'
    select.style.borderRadius = '5px'
    select.style.marginTop = '10px'
    select.style.paddingLeft = '15px';

    for (var i = 0; i < xmlList.length; i++) {
      var option = document.createElement('option');
      option.setAttribute('value', xmlList[i].id);
      option.text = xmlList[i].name;
      select.appendChild(option);
    }
    xmlLabel.appendChild(select);


    //选择XML文件on-change事件
    select.onchange = function (data) {
      // console.log("选中的xml文件:", data.target.value);
      var select_xmlId = data.target.value;
      var select_xmlName = '';
      for (let i = 0; i < xmlList.length; i++) {
        if (select_xmlId == xmlList[i].id) {
          select_xmlName = xmlList[i].name;
        }
      }
      nameInput.value = select_xmlName;
    }

    // 绑定xml名称 html
    var nameLabel = document.createElement('label');
    var span2 = document.createElement('span');
    span2.style.display = 'inline-block';
    span2.style.width = '100px';
    mxUtils.write(span2, '绑定XML名称：');
    nameLabel.appendChild(span2);
    var nameInput = document.createElement('input');
    nameInput.value = xmlInfo.name || '';
    nameInput.disabled = "disabled"
    nameInput.style.width = '250px';
    nameInput.style.height = '28px';
    nameInput.style.borderRadius = '5px';
    nameInput.style.marginTop = '20px';
    nameInput.style.border = '1px solid #999';
    nameInput.style.paddingLeft = '15px';
    nameLabel.appendChild(nameInput);
    nameInput.setAttribute('placeholder', '请输入绑定的XML名称');

    //隐藏XML名称
    var hideName = document.createElement('div');
    hideName.style.marginTop = '20px';
    var hideTitle1 = document.createElement('label');
    hideName.appendChild(hideTitle1);
    mxUtils.write(hideTitle1, 'XML名称是否显示：');
    var hideSpan1 = document.createElement('sapn');
    mxUtils.write(hideSpan1, '是：');
    var showName = document.createElement('input');


    showName.setAttribute('type', 'radio');
    showName.setAttribute('name', 'nameRadio');
    hideTitle1.appendChild(hideSpan1);
    hideSpan1.appendChild(showName);

    var hideSpan2 = document.createElement('sapn');
    hideSpan2.style.marginLeft = '30px';
    hideSpan2.style.display = 'inlineBlock';
    mxUtils.write(hideSpan2, '否：');
    var closeName = document.createElement('input');
    closeName.setAttribute('name', 'nameRadio');
    closeName.setAttribute('type', 'radio');
    hideTitle1.appendChild(hideSpan2)
    hideSpan2.appendChild(closeName)

    if (xmlInfo.isVisibleName) {
      showName.checked = true
      closeName.checked = false
    } else {
      showName.checked = false
      closeName.checked = true
    }

    contentHtml.appendChild(h3);
    contentHtml.appendChild(xmlLabel);
    contentHtml.appendChild(nameLabel);
    contentHtml.appendChild(hideName);

    var buttonWrap = document.createElement('div');
    buttonWrap.style.margin = "35px 40px 0px";
    buttonWrap.style.textAlign = "right";

    // if (noWrap) {
    //   nameInput.setAttribute('wrap', 'off');
    // }
    select.focus();
    select.value = xmlInfo.xmlId || xmlList[0].id
    nameInput.value = xmlInfo.name || xmlList[0].name;

    // if (helpLink != null) {
    //   var helpBtn = mxUtils.button(mxResources.get('help'), function () {
    //     editorUi.editor.graph.openLink(helpLink);
    //   });
    //   helpBtn.className = 'geBtn';
    //   buttonWrap.appendChild(helpBtn);
    // }

    var cancelBtn = mxUtils.button(cancelTitle || mxResources.get('cancel'), function () {
      editorUi.hideDialog();
      if (cancelFn != null) {
        cancelFn();
      }
    });
    cancelBtn.className = 'geBtn';

    if (editorUi.editor.cancelFirst) {
      buttonWrap.appendChild(cancelBtn);
    }

    if (addButtons != null) {
      addButtons(td, select);
    }

    if (fn != null) {
      var genericBtn = mxUtils.button(applyTitle || mxResources.get('apply'), function () {
        if (!noHide) {
          editorUi.hideDialog();
        }
        //绑定xml--id赋值 name
        var name = '';
        for (var i = 0; i < xmlList.length; i++) {
          xmlList[i].id = xmlList[i].id.toString(); //转成字符串类型
          if (select.value === xmlList[i].id) {
            name = xmlList[i].name
          }
        }
        // console.log(nameInput.value)
        var obj = {
          name: name,
          id: select.value,
          isVisibleName: showName.checked,
        }
        fn(obj); // 回调函数 传值到 action.js 里面的   this.addAction('bindXMLName'，...) 里面
      });

      genericBtn.className = 'geBtn gePrimaryBtn';
      buttonWrap.appendChild(genericBtn);
    }

    if (!editorUi.editor.cancelFirst) {
      buttonWrap.appendChild(cancelBtn);
    }
    contentHtml.appendChild(buttonWrap)
  })).catch()

  this.container = contentHtml;
}

/**
 * 导入文件 dialog
 * @param {*} editorUi
 * @param {*} title
 * @param {*} url
 * @param {*} fn
 * @param {*} cancelFn
 * @param {*} cancelTitle
 * @param {*} w
 * @param {*} h
 * @param {*} addButtons
 * @param {*} noHide
 * @param {*} noWrap
 * @param {*} applyTitle
 * @param {*} helpLink
 */
//打开本地xml文件弹层 和 导入本地xml文件
var OpenFileDialog2 = function (editorUi, title, url, fn, cancelFn, cancelTitle, w, h,
  addButtons, noHide, noWrap, applyTitle, helpLink) {
  w = (w != null) ? w : 300;
  h = (h != null) ? h : 120;
  noHide = (noHide != null) ? noHide : false;

  var input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('name', 'upfile')
  input.style.marginTop = '20px'
  input.style.marginBottom = '40px'

  console.log('Editor.useLocalStorage:', Editor.useLocalStorage);
  var row, td;
  var table = document.createElement('table');
  var tbody = document.createElement('tbody');
  row = document.createElement('tr');
  td = document.createElement('td');
  td.style.fontSize = '10pt';
  td.style.width = '100px';
  mxUtils.write(td, title);

  row.appendChild(td);
  tbody.appendChild(row);

  row = document.createElement('tr');
  td = document.createElement('td');

  if (noWrap) {
    // nameInput.setAttribute('wrap', 'off');
  }

  this.init = function () {
    // nameInput.focus();
    // nameInput.scrollTop = 0;
  };

  td.appendChild(input);
  row.appendChild(td);

  tbody.appendChild(row);

  row = document.createElement('tr');
  td = document.createElement('td');
  td.style.paddingTop = '14px';
  td.style.whiteSpace = 'nowrap';
  td.setAttribute('align', 'right');

  function handleSubmit() {
    // Checks for support of the File API for local file access
    // except for files where the parse is on the server
    if (Graph.fileSupport && input.files.length > 0) {
      handleFiles(input.files);
      return false;
    } else {
      if (/(\.xml)$/i.test(input.value) || /(\.txt)$/i.test(input.value) ||
        /(\.mxe)$/i.test(input.value)) {
        // Small hack to support import
        if (window.openNew) {
          window.open(window.location.href);
        }
        // NOTE: File is loaded via JS injection into the iframe, which in turn sets the
        // file contents in the parent window. The new window asks its opener if any file
        // contents are available or waits for the contents to become available.
        return true;
      } else {
        mxUtils.alert(mxResources.get('invalidOrMissingFile'));
        return false;
      }
    }
  };
  // open/导入xml数据
  var xml, fileName

  function handleFiles(files) {
    for (var i = 0; i < files.length; i++) {
      (function (file) {
        // Small hack to support import
        if (window.openNew) {
          window.open(window.location.href);
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          xml = e.target.result;
          // fileName = file.name;
          // var id = "";
          //读完文件后,用读取的name  ==  接口里面的name  赋值id给obj
          // graphApi.list().then(res => {
            // for (var i = 0; i < res.data.data.length; i++) {
            //   if (fileName == res.data.data[i].name) {
            //     id = res.data.data[i].id
            //   }
            // }
            // console.log(e.target.result, file.name)
            // editorUi.open2(e.target.result, file.name)
          // })
          importObj = JSON.parse(localStorage.getItem('importObj')); //取数据
          console.log("importObj:", importObj);
          if (importObj){
            var obj = {
              id: importObj.id,
              filename: importObj.name,
              xml: xml,
            };
            console.log('open/导入的xml数据:', obj);
            fn(obj);
          } else {
            return false;
          }
        };
        reader.onerror = function (e) {
          console.log("onerror:", e);
        };
        reader.readAsText(file);
      })(files[i]);
    }
  };

  if (helpLink != null) {
    var helpBtn = mxUtils.button(mxResources.get('help'), function () {
      editorUi.editor.graph.openLink(helpLink);
    });
    helpBtn.className = 'geBtn';
    td.appendChild(helpBtn);
  }

  var cancelBtn = mxUtils.button(cancelTitle || mxResources.get('cancel'), function () {
    editorUi.hideDialog();
    if (cancelFn != null) {
      cancelFn();
    }
  });
  cancelBtn.className = 'geBtn';
  if (editorUi.editor.cancelFirst) {
    td.appendChild(cancelBtn);
  }

  if (addButtons != null) {
    addButtons(td, nameInput);
  }

  if (fn != null) {
    var genericBtn = mxUtils.button(applyTitle || mxResources.get('apply'), function () {
      if (!noHide) {
        editorUi.hideDialog();
      }
      handleSubmit();
      // var obj = {xml:xml, filename:fileName}
      // console.log(obj)
      // fn(obj); // 回调 到action 这里不写了，上步 handleSubmit直接打开文件到界面了
    });
    genericBtn.id = 'openButton';

    genericBtn.className = 'geBtn gePrimaryBtn';
    genericBtn.setAttribute('disabled', 'disabled');
    td.appendChild(genericBtn);
    input.onchange = function () {
      if (input.files.length > 0) {
        genericBtn.removeAttribute('disabled');
      } else {
        genericBtn.setAttribute('disabled', 'disabled');
      }
    }
  }

  // if (!editorUi.editor.cancelFirst) {
  //   td.appendChild(cancelBtn);
  // }

  row.appendChild(td);
  tbody.appendChild(row);
  table.appendChild(tbody);
  // form.appendChild(table)
  this.container = table;
};

/**
 * Constructs a new textarea dialog.
 */
var TextareaDialog = function (editorUi, title, url, fn, cancelFn, cancelTitle, w, h,
	addButtons, noHide, noWrap, applyTitle, helpLink, customButtons) {
	w = (w != null) ? w : 300;
	h = (h != null) ? h : 120;
	noHide = (noHide != null) ? noHide : false;
	var row, td;

  var table = document.createElement('table');
  var tbody = document.createElement('tbody');

  row = document.createElement('tr');

  td = document.createElement('td');
  td.style.fontSize = '10pt';
  td.style.width = '100px';
  mxUtils.write(td, title);

  row.appendChild(td);
  tbody.appendChild(row);

  row = document.createElement('tr');
  td = document.createElement('td');

  var nameInput = document.createElement('textarea');

  if (noWrap) {
    nameInput.setAttribute('wrap', 'off');
  }

  nameInput.setAttribute('spellcheck', 'false');
  nameInput.setAttribute('autocorrect', 'off');
  nameInput.setAttribute('autocomplete', 'off');
  nameInput.setAttribute('autocapitalize', 'off');

  mxUtils.write(nameInput, url || '');
  nameInput.style.resize = 'none';
  nameInput.style.width = w + 'px';
  nameInput.style.height = h + 'px';

  this.textarea = nameInput;

  this.init = function () {
    nameInput.focus();
    nameInput.scrollTop = 0;
  };

  td.appendChild(nameInput);
  row.appendChild(td);

  tbody.appendChild(row);

  row = document.createElement('tr');
  td = document.createElement('td');
  td.style.paddingTop = '14px';
  td.style.whiteSpace = 'nowrap';
  td.setAttribute('align', 'right');
  //帮助按钮先不要显示
	if (helpLink != null) {
		var helpBtn = mxUtils.button(mxResources.get('help'), function () {
			editorUi.editor.graph.openLink(helpLink);
		});
		helpBtn.className = 'geBtn';

		td.appendChild(helpBtn);
	}

	if (customButtons != null) {
		for (var i = 0; i < customButtons.length; i++) {
			(function (label, fn) {
				var customBtn = mxUtils.button(label, function (e) {
					fn(e, nameInput);
				});
				customBtn.className = 'geBtn';

				td.appendChild(customBtn);
			})(customButtons[i][0], customButtons[i][1]);
		}
	}

  var cancelBtn = mxUtils.button(cancelTitle || mxResources.get('cancel'), function () {
    editorUi.hideDialog();
    if (cancelFn != null) {
      cancelFn();
    }
  });
  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    td.appendChild(cancelBtn);
  }

  if (addButtons != null) {
    addButtons(td, nameInput);
  }

  if (fn != null) {
    var genericBtn = mxUtils.button(applyTitle || mxResources.get('apply'), function () {
      if (!noHide) {
        editorUi.hideDialog();
      }
      fn(nameInput.value);
    });

    genericBtn.className = 'geBtn gePrimaryBtn';
    td.appendChild(genericBtn);
  }

  if (!editorUi.editor.cancelFirst) {
    td.appendChild(cancelBtn);
  }

  row.appendChild(td);
  tbody.appendChild(row);
  table.appendChild(tbody);
  this.container = table;
};

/**
 * Constructs a new edit file dialog.
 */
var EditDiagramDialog = function (editorUi) {
  var div = document.createElement('div');
  div.style.textAlign = 'right';
  var textarea = document.createElement('textarea');
  textarea.setAttribute('wrap', 'off');
  textarea.setAttribute('spellcheck', 'false');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('autocapitalize', 'off');
  textarea.style.overflow = 'auto';
  textarea.style.resize = 'none';
  textarea.style.width = '600px';
  textarea.style.height = '360px';
  textarea.style.marginBottom = '16px';

  textarea.value = mxUtils.getPrettyXml(editorUi.editor.getGraphXml());
  div.appendChild(textarea);
  this.init = function () {
    textarea.focus();
  };

  // Enables dropping files
  if (Graph.fileSupport) {
    function handleDrop(evt) {
      evt.stopPropagation();
      evt.preventDefault();

      if (evt.dataTransfer.files.length > 0) {
        var file = evt.dataTransfer.files[0];
        var reader = new FileReader();

        reader.onload = function (e) {
          textarea.value = e.target.result;
        };

        reader.readAsText(file);
      } else {
        textarea.value = editorUi.extractGraphModelFromEvent(evt);
      }
    };

    function handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
    };

    // Setup the dnd listeners.
    textarea.addEventListener('dragover', handleDragOver, false);
    textarea.addEventListener('drop', handleDrop, false);
  }

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    editorUi.hideDialog();
  });
  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    div.appendChild(cancelBtn);
  }

  var select = document.createElement('select');
  select.style.width = '180px';
  select.className = 'geBtn';

  if (editorUi.editor.graph.isEnabled()) {
    var replaceOption = document.createElement('option');
    replaceOption.setAttribute('value', 'replace');
    mxUtils.write(replaceOption, mxResources.get('replaceExistingDrawing'));
    select.appendChild(replaceOption);
  }

  var newOption = document.createElement('option');
  newOption.setAttribute('value', 'new');
  mxUtils.write(newOption, mxResources.get('openInNewWindow'));

  if (EditDiagramDialog.showNewWindowOption) {
    select.appendChild(newOption);
  }

  if (editorUi.editor.graph.isEnabled()) {
    var importOption = document.createElement('option');
    importOption.setAttribute('value', 'import');
    mxUtils.write(importOption, mxResources.get('addToExistingDrawing'));
    select.appendChild(importOption);
  }
  div.appendChild(select);

  var okBtn = mxUtils.button(mxResources.get('ok'), function () {
    // Removes all illegal control characters before parsing
    var data = Graph.zapGremlins(mxUtils.trim(textarea.value));
    var error = null;

    if (select.value == 'new') {
      editorUi.hideDialog();
      editorUi.editor.editAsNew(data);
    } else if (select.value == 'replace') {
      editorUi.editor.graph.model.beginUpdate();
      try {
        editorUi.editor.setGraphXml(mxUtils.parseXml(data).documentElement);
        // LATER: Why is hideDialog between begin-/endUpdate faster?
        editorUi.hideDialog();
      } catch (e) {
        error = e;
      } finally {
        editorUi.editor.graph.model.endUpdate();
      }
    } else if (select.value == 'import') {
      editorUi.editor.graph.model.beginUpdate();
      try {
        var doc = mxUtils.parseXml(data);
        var model = new mxGraphModel();
        var codec = new mxCodec(doc);
        codec.decode(doc.documentElement, model);

        var children = model.getChildren(model.getChildAt(model.getRoot(), 0));
        editorUi.editor.graph.setSelectionCells(editorUi.editor.graph.importCells(children));

        // LATER: Why is hideDialog between begin-/endUpdate faster?
        editorUi.hideDialog();
      } catch (e) {
        error = e;
      } finally {
        editorUi.editor.graph.model.endUpdate();
      }
    }
    if (error != null) {
      mxUtils.alert(error.message);
    }
  });
  okBtn.className = 'geBtn gePrimaryBtn';
  div.appendChild(okBtn);

  if (!editorUi.editor.cancelFirst) {
    div.appendChild(cancelBtn);
  }
  this.container = div;
};

/**
 *
 */
EditDiagramDialog.showNewWindowOption = true;

/**
 * Constructs a new export dialog.
 * 导出的弹层
 */
var ExportDialog = function (editorUi) {
  var graph = editorUi.editor.graph;
  var bounds = graph.getGraphBounds();
  var scale = graph.view.scale;

  var width = Math.ceil(bounds.width / scale);
  var height = Math.ceil(bounds.height / scale);

  var row, td;

  var table = document.createElement('table');
  var tbody = document.createElement('tbody');
  table.setAttribute('cellpadding', (mxClient.IS_SF) ? '0' : '2');

  row = document.createElement('tr');

  td = document.createElement('td');
  td.style.fontSize = '10pt';
  td.style.width = '100px';
  mxUtils.write(td, mxResources.get('filename') + ':');

  row.appendChild(td);

  var nameInput = document.createElement('input');
  nameInput.setAttribute('value', editorUi.editor.getOrCreateFilename());
  nameInput.style.width = '180px';
  nameInput.style.marginBottom = '10px';
  td = document.createElement('td');
  td.appendChild(nameInput);
  row.appendChild(td);

  tbody.appendChild(row);

  row = document.createElement('tr');

  td = document.createElement('td');
  td.style.fontSize = '10pt';
  mxUtils.write(td, mxResources.get('format') + ':');

  row.appendChild(td);

  var imageFormatSelect = document.createElement('select');
  imageFormatSelect.style.width = '180px';
  imageFormatSelect.style.marginBottom = '10px';

  //PNG
  var pngOption = document.createElement('option');
  pngOption.setAttribute('value', 'png');
  mxUtils.write(pngOption, mxResources.get('formatPng'));
  imageFormatSelect.appendChild(pngOption);

  //GIF
  // var gifOption = document.createElement('option');
  // if (ExportDialog.showGifOption) {
  //   gifOption.setAttribute('value', 'gif');
  //   mxUtils.write(gifOption, mxResources.get('formatGif'));
  //   imageFormatSelect.appendChild(gifOption);
  // }

  //JPG
  var jpgOption = document.createElement('option');
  jpgOption.setAttribute('value', 'jpg');
  mxUtils.write(jpgOption, mxResources.get('formatJpg'));
  imageFormatSelect.appendChild(jpgOption);

  //PGF
  // var pdfOption = document.createElement('option');
  // pdfOption.setAttribute('value', 'pdf');
  // mxUtils.write(pdfOption, mxResources.get('formatPdf'));
  // imageFormatSelect.appendChild(pdfOption);

  //SVG
  var svgOption = document.createElement('option');
  svgOption.setAttribute('value', 'svg');
  mxUtils.write(svgOption, mxResources.get('formatSvg'));
  imageFormatSelect.appendChild(svgOption);

  //XML
  if (ExportDialog.showXmlOption) {
    var xmlOption = document.createElement('option');
    xmlOption.setAttribute('value', 'xml');
    mxUtils.write(xmlOption, mxResources.get('formatXml'));
    imageFormatSelect.appendChild(xmlOption);
  }

  td = document.createElement('td');
  td.appendChild(imageFormatSelect);
  row.appendChild(td);

  tbody.appendChild(row);

  row = document.createElement('tr');

  td = document.createElement('td');
  td.style.fontSize = '10pt';
  mxUtils.write(td, mxResources.get('zoom') + ' (%):');

  row.appendChild(td);

  var zoomInput = document.createElement('input');
  zoomInput.setAttribute('type', 'number');
  zoomInput.setAttribute('value', '100');
  zoomInput.style.width = '180px';
  zoomInput.style.marginBottom = '10px'; //

  td = document.createElement('td');
  td.appendChild(zoomInput);
  row.appendChild(td);

  tbody.appendChild(row);

  row = document.createElement('tr');

  td = document.createElement('td');
  td.style.fontSize = '10pt';
  mxUtils.write(td, mxResources.get('width') + ':');

  row.appendChild(td);

  var widthInput = document.createElement('input');
  widthInput.setAttribute('value', width);
  widthInput.style.width = '180px';
  widthInput.style.marginBottom = '10px'; //

  td = document.createElement('td');
  td.appendChild(widthInput);
  row.appendChild(td);

  tbody.appendChild(row);

  row = document.createElement('tr');

  td = document.createElement('td');
  td.style.fontSize = '10pt';
  mxUtils.write(td, mxResources.get('height') + ':');

  row.appendChild(td);

  var heightInput = document.createElement('input');
  heightInput.setAttribute('value', height);
  heightInput.style.width = '180px';
  heightInput.style.marginBottom = '10px'; //

  td = document.createElement('td');
  td.appendChild(heightInput);
  row.appendChild(td);

  tbody.appendChild(row);

  row = document.createElement('tr');

  td = document.createElement('td');
  td.style.fontSize = '10pt';
  mxUtils.write(td, mxResources.get('dpi') + ':');

  row.appendChild(td);

  var dpiSelect = document.createElement('select');
  dpiSelect.style.width = '180px';
  dpiSelect.style.marginBottom = '10px'; //

  var dpi100Option = document.createElement('option');
  dpi100Option.setAttribute('value', '100');
  mxUtils.write(dpi100Option, '100dpi');
  dpiSelect.appendChild(dpi100Option);

  var dpi200Option = document.createElement('option');
  dpi200Option.setAttribute('value', '200');
  mxUtils.write(dpi200Option, '200dpi');
  dpiSelect.appendChild(dpi200Option);

  var dpi300Option = document.createElement('option');
  dpi300Option.setAttribute('value', '300');
  mxUtils.write(dpi300Option, '300dpi');
  dpiSelect.appendChild(dpi300Option);

  var dpi400Option = document.createElement('option');
  dpi400Option.setAttribute('value', '400');
  mxUtils.write(dpi400Option, '400dpi');
  dpiSelect.appendChild(dpi400Option);

  var dpiCustOption = document.createElement('option');
  dpiCustOption.setAttribute('value', 'custom');
  mxUtils.write(dpiCustOption, mxResources.get('custom'));
  dpiSelect.appendChild(dpiCustOption);

  var customDpi = document.createElement('input');
  customDpi.style.width = '180px';
  customDpi.style.marginBottom = '10px'; //

  customDpi.style.display = 'none';
  customDpi.setAttribute('value', '100');
  customDpi.setAttribute('type', 'number');
  customDpi.setAttribute('min', '50');
  customDpi.setAttribute('step', '50');

  var zoomUserChanged = false;

  mxEvent.addListener(dpiSelect, 'change', function () {
    if (this.value == 'custom') {
      this.style.display = 'none';
      customDpi.style.display = '';
      customDpi.focus();
    } else {
      customDpi.value = this.value;
      if (!zoomUserChanged) {
        zoomInput.value = this.value;
      }
    }
  });

  mxEvent.addListener(customDpi, 'change', function () {
    var dpi = parseInt(customDpi.value);
    if (isNaN(dpi) || dpi <= 0) {
      customDpi.style.backgroundColor = 'red';
    } else {
      customDpi.style.backgroundColor = '';
      if (!zoomUserChanged) {
        zoomInput.value = dpi;
      }
    }
  });

  td = document.createElement('td');
  td.appendChild(dpiSelect);
  td.appendChild(customDpi);
  row.appendChild(td);

  tbody.appendChild(row);

  row = document.createElement('tr');

  td = document.createElement('td');
  td.style.fontSize = '10pt';
  mxUtils.write(td, mxResources.get('background') + ':');

  row.appendChild(td);

  var transparentCheckbox = document.createElement('input');
  transparentCheckbox.style.marginBottom = '10px'; //

  transparentCheckbox.setAttribute('type', 'checkbox');

  transparentCheckbox.checked = graph.background == null || graph.background == mxConstants.NONE;

  td = document.createElement('td');
  td.appendChild(transparentCheckbox);
  mxUtils.write(td, mxResources.get('transparent'));

  row.appendChild(td);

  tbody.appendChild(row);

  row = document.createElement('tr');

  td = document.createElement('td');
  td.style.fontSize = '10pt';
  mxUtils.write(td, mxResources.get('borderWidth') + ':');

  row.appendChild(td);

  var borderInput = document.createElement('input');
  borderInput.setAttribute('type', 'number');
  borderInput.setAttribute('value', ExportDialog.lastBorderValue);
  borderInput.style.width = '180px';

  td = document.createElement('td');
  td.appendChild(borderInput);
  row.appendChild(td);

  tbody.appendChild(row);
  table.appendChild(tbody);

  // Handles changes in the export format
  function formatChanged() {
    var name = nameInput.value;
    var dot = name.lastIndexOf('.');

    if (dot > 0) {
      nameInput.value = name.substring(0, dot + 1) + imageFormatSelect.value;
    } else {
      nameInput.value = name + '.' + imageFormatSelect.value;
    }

    if (imageFormatSelect.value === 'xml') {
      zoomInput.setAttribute('disabled', 'true');
      widthInput.setAttribute('disabled', 'true');
      heightInput.setAttribute('disabled', 'true');
      borderInput.setAttribute('disabled', 'true');
    } else {
      zoomInput.removeAttribute('disabled');
      widthInput.removeAttribute('disabled');
      heightInput.removeAttribute('disabled');
      borderInput.removeAttribute('disabled');
    }

		if (imageFormatSelect.value === 'png' || imageFormatSelect.value === 'svg' || imageFormatSelect.value === 'pdf') {
			transparentCheckbox.removeAttribute('disabled');
		} else {
			transparentCheckbox.setAttribute('disabled', 'disabled');
		}

    if (imageFormatSelect.value === 'png') {
      dpiSelect.removeAttribute('disabled');
      customDpi.removeAttribute('disabled');
    } else {
      dpiSelect.setAttribute('disabled', 'disabled');
      customDpi.setAttribute('disabled', 'disabled');
    }
  };

  mxEvent.addListener(imageFormatSelect, 'change', formatChanged);
  formatChanged();

  function checkValues() {
    if (widthInput.value * heightInput.value > MAX_AREA || widthInput.value <= 0) {
      widthInput.style.backgroundColor = 'red';
    } else {
      widthInput.style.backgroundColor = '';
    }

    if (widthInput.value * heightInput.value > MAX_AREA || heightInput.value <= 0) {
      heightInput.style.backgroundColor = 'red';
    } else {
      heightInput.style.backgroundColor = '';
    }
  };

  mxEvent.addListener(zoomInput, 'change', function () {
    zoomUserChanged = true;
    var s = Math.max(0, parseFloat(zoomInput.value) || 100) / 100;
    zoomInput.value = parseFloat((s * 100).toFixed(2));
    if (width > 0) {
      widthInput.value = Math.floor(width * s);
      heightInput.value = Math.floor(height * s);
    } else {
      zoomInput.value = '100';
      widthInput.value = width;
      heightInput.value = height;
    }
    checkValues();
  });

  mxEvent.addListener(widthInput, 'change', function () {
    var s = parseInt(widthInput.value) / width;
    if (s > 0) {
      zoomInput.value = parseFloat((s * 100).toFixed(2));
      heightInput.value = Math.floor(height * s);
    } else {
      zoomInput.value = '100';
      widthInput.value = width;
      heightInput.value = height;
    }
    checkValues();
  });

  mxEvent.addListener(heightInput, 'change', function () {
    var s = parseInt(heightInput.value) / height;
    if (s > 0) {
      zoomInput.value = parseFloat((s * 100).toFixed(2));
      widthInput.value = Math.floor(width * s);
    } else {
      zoomInput.value = '100';
      widthInput.value = width;
      heightInput.value = height;
    }
    checkValues();
  });

  row = document.createElement('tr');
  td = document.createElement('td');
  td.setAttribute('align', 'right');
  td.style.paddingTop = '22px';
  td.colSpan = 2;

	var saveBtn = mxUtils.button(mxResources.get('export'), mxUtils.bind(this, function () {
		if (parseInt(zoomInput.value) <= 0) {
			mxUtils.alert(mxResources.get('drawingEmpty'));
		} else {
			var name = nameInput.value;
			var format = imageFormatSelect.value;
			var s = Math.max(0, parseFloat(zoomInput.value) || 100) / 100;
			var b = Math.max(0, parseInt(borderInput.value));
			var bg = graph.background;
			var dpi = Math.max(1, parseInt(customDpi.value));

			if ((format == 'svg' || format == 'png' || format == 'pdf') && transparentCheckbox.checked) {
				bg = null;
			} else if (bg == null || bg == mxConstants.NONE) {
				bg = '#ffffff';
			}

			ExportDialog.lastBorderValue = b;
			ExportDialog.exportFile(editorUi, name, format, bg, s, b, dpi);
		}
	}));
	saveBtn.className = 'geBtn gePrimaryBtn';

	var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
		editorUi.hideDialog();
	});
	cancelBtn.className = 'geBtn';

	if (editorUi.editor.cancelFirst) {
		td.appendChild(cancelBtn);
		td.appendChild(saveBtn);
	} else {
		td.appendChild(saveBtn);
		td.appendChild(cancelBtn);
	}

  row.appendChild(td);
  tbody.appendChild(row);
  table.appendChild(tbody);
  this.container = table;
};

/**
 * Remembers last value for border.
 */
ExportDialog.lastBorderValue = 0;

/**
 * Global switches for the export dialog.
 */
ExportDialog.showGifOption = true;

/**
 * Global switches for the export dialog.
 */
ExportDialog.showXmlOption = true;


/**
 * Constructs a new parse dialog.
 * 插入高级布局的弹层方法
 */
var ParseDialog = function (editorUi, title, defaultType) {
  // console.log("defaultType:",defaultType);
  var enablePlantUmlFun = editorUi.enablePlantUml;
  var isOfflineFun = !editorUi.isOffline();
	var plantUmlExample = '@startuml\nskinparam shadowing false\nAlice -> Bob: Authentication Request\nBob --> Alice: Authentication Response\n\nAlice -> Bob: Another authentication Request\nAlice <-- Bob: Another authentication Response\n@enduml';
	var insertPoint = editorUi.editor.graph.getFreeInsertPoint();

	function parse(text, type, evt) {
		var lines = text.split('\n');
		if (type == 'plantUmlPng' || type == 'plantUmlSvg' || type == 'plantUmlTxt') {
			if (editorUi.spinner.spin(document.body, mxResources.get('inserting'))) {
				var graph = editorUi.editor.graph;
				var format = (type == 'plantUmlTxt') ? 'txt' :
					((type == 'plantUmlPng') ? 'png' : 'svg');

				function insertPlantUmlImage(text, format, data, w, h) {
					insertPoint = (mxEvent.isAltDown(evt)) ? insertPoint : graph.getCenterInsertPoint(new mxRectangle(0, 0, w, h));
					var cell = null;

					graph.getModel().beginUpdate();
					try {
						cell = (format == 'txt') ?
							editorUi.insertAsPreText(data, insertPoint.x, insertPoint.y) :
							graph.insertVertex(null, null, null, insertPoint.x, insertPoint.y,
								w, h, 'shape=image;noLabel=1;verticalAlign=top;aspect=fixed;imageAspect=0;' +
								'image=' + editorUi.convertDataUri(data) + ';')
						graph.setAttributeForCell(cell, 'plantUmlData',
							JSON.stringify({
									data: text,
									format: format
								},
								null, 2));
					} finally {
						graph.getModel().endUpdate();
					}

					if (cell != null) {
						graph.setSelectionCell(cell);
						graph.scrollCellToVisible(cell);
					}
				};

				// Hardcoded response for default settings
        // 默认设置的硬编码响应
				if (text == plantUmlExample && format == 'svg') {
					window.setTimeout(function () {
						editorUi.spinner.stop();
						insertPlantUmlImage(text, format, 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBjb250ZW50U2NyaXB0VHlwZT0iYXBwbGljYXRpb24vZWNtYXNjcmlwdCIgY29udGVudFN0eWxlVHlwZT0idGV4dC9jc3MiIGhlaWdodD0iMjEycHgiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHN0eWxlPSJ3aWR0aDoyOTVweDtoZWlnaHQ6MjEycHg7IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyOTUgMjEyIiB3aWR0aD0iMjk1cHgiIHpvb21BbmRQYW49Im1hZ25pZnkiPjxkZWZzLz48Zz48bGluZSBzdHlsZT0ic3Ryb2tlOiAjQTgwMDM2OyBzdHJva2Utd2lkdGg6IDEuMDsgc3Ryb2tlLWRhc2hhcnJheTogNS4wLDUuMDsiIHgxPSIzMSIgeDI9IjMxIiB5MT0iMzQuNDg4MyIgeTI9IjE3MS43MzA1Ii8+PGxpbmUgc3R5bGU9InN0cm9rZTogI0E4MDAzNjsgc3Ryb2tlLXdpZHRoOiAxLjA7IHN0cm9rZS1kYXNoYXJyYXk6IDUuMCw1LjA7IiB4MT0iMjY0LjUiIHgyPSIyNjQuNSIgeTE9IjM0LjQ4ODMiIHkyPSIxNzEuNzMwNSIvPjxyZWN0IGZpbGw9IiNGRUZFQ0UiIGhlaWdodD0iMzAuNDg4MyIgc3R5bGU9InN0cm9rZTogI0E4MDAzNjsgc3Ryb2tlLXdpZHRoOiAxLjU7IiB3aWR0aD0iNDciIHg9IjgiIHk9IjMiLz48dGV4dCBmaWxsPSIjMDAwMDAwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgbGVuZ3RoQWRqdXN0PSJzcGFjaW5nQW5kR2x5cGhzIiB0ZXh0TGVuZ3RoPSIzMyIgeD0iMTUiIHk9IjIzLjUzNTIiPkFsaWNlPC90ZXh0PjxyZWN0IGZpbGw9IiNGRUZFQ0UiIGhlaWdodD0iMzAuNDg4MyIgc3R5bGU9InN0cm9rZTogI0E4MDAzNjsgc3Ryb2tlLXdpZHRoOiAxLjU7IiB3aWR0aD0iNDciIHg9IjgiIHk9IjE3MC43MzA1Ii8+PHRleHQgZmlsbD0iIzAwMDAwMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGxlbmd0aEFkanVzdD0ic3BhY2luZ0FuZEdseXBocyIgdGV4dExlbmd0aD0iMzMiIHg9IjE1IiB5PSIxOTEuMjY1NiI+QWxpY2U8L3RleHQ+PHJlY3QgZmlsbD0iI0ZFRkVDRSIgaGVpZ2h0PSIzMC40ODgzIiBzdHlsZT0ic3Ryb2tlOiAjQTgwMDM2OyBzdHJva2Utd2lkdGg6IDEuNTsiIHdpZHRoPSI0MCIgeD0iMjQ0LjUiIHk9IjMiLz48dGV4dCBmaWxsPSIjMDAwMDAwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgbGVuZ3RoQWRqdXN0PSJzcGFjaW5nQW5kR2x5cGhzIiB0ZXh0TGVuZ3RoPSIyNiIgeD0iMjUxLjUiIHk9IjIzLjUzNTIiPkJvYjwvdGV4dD48cmVjdCBmaWxsPSIjRkVGRUNFIiBoZWlnaHQ9IjMwLjQ4ODMiIHN0eWxlPSJzdHJva2U6ICNBODAwMzY7IHN0cm9rZS13aWR0aDogMS41OyIgd2lkdGg9IjQwIiB4PSIyNDQuNSIgeT0iMTcwLjczMDUiLz48dGV4dCBmaWxsPSIjMDAwMDAwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgbGVuZ3RoQWRqdXN0PSJzcGFjaW5nQW5kR2x5cGhzIiB0ZXh0TGVuZ3RoPSIyNiIgeD0iMjUxLjUiIHk9IjE5MS4yNjU2Ij5Cb2I8L3RleHQ+PHBvbHlnb24gZmlsbD0iI0E4MDAzNiIgcG9pbnRzPSIyNTIuNSw2MS43OTg4LDI2Mi41LDY1Ljc5ODgsMjUyLjUsNjkuNzk4OCwyNTYuNSw2NS43OTg4IiBzdHlsZT0ic3Ryb2tlOiAjQTgwMDM2OyBzdHJva2Utd2lkdGg6IDEuMDsiLz48bGluZSBzdHlsZT0ic3Ryb2tlOiAjQTgwMDM2OyBzdHJva2Utd2lkdGg6IDEuMDsiIHgxPSIzMS41IiB4Mj0iMjU4LjUiIHkxPSI2NS43OTg4IiB5Mj0iNjUuNzk4OCIvPjx0ZXh0IGZpbGw9IiMwMDAwMDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEzIiBsZW5ndGhBZGp1c3Q9InNwYWNpbmdBbmRHbHlwaHMiIHRleHRMZW5ndGg9IjE0NyIgeD0iMzguNSIgeT0iNjEuMDU2NiI+QXV0aGVudGljYXRpb24gUmVxdWVzdDwvdGV4dD48cG9seWdvbiBmaWxsPSIjQTgwMDM2IiBwb2ludHM9IjQyLjUsOTEuMTA5NCwzMi41LDk1LjEwOTQsNDIuNSw5OS4xMDk0LDM4LjUsOTUuMTA5NCIgc3R5bGU9InN0cm9rZTogI0E4MDAzNjsgc3Ryb2tlLXdpZHRoOiAxLjA7Ii8+PGxpbmUgc3R5bGU9InN0cm9rZTogI0E4MDAzNjsgc3Ryb2tlLXdpZHRoOiAxLjA7IHN0cm9rZS1kYXNoYXJyYXk6IDIuMCwyLjA7IiB4MT0iMzYuNSIgeDI9IjI2My41IiB5MT0iOTUuMTA5NCIgeTI9Ijk1LjEwOTQiLz48dGV4dCBmaWxsPSIjMDAwMDAwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMyIgbGVuZ3RoQWRqdXN0PSJzcGFjaW5nQW5kR2x5cGhzIiB0ZXh0TGVuZ3RoPSIxNTciIHg9IjQ4LjUiIHk9IjkwLjM2NzIiPkF1dGhlbnRpY2F0aW9uIFJlc3BvbnNlPC90ZXh0Pjxwb2x5Z29uIGZpbGw9IiNBODAwMzYiIHBvaW50cz0iMjUyLjUsMTIwLjQxOTksMjYyLjUsMTI0LjQxOTksMjUyLjUsMTI4LjQxOTksMjU2LjUsMTI0LjQxOTkiIHN0eWxlPSJzdHJva2U6ICNBODAwMzY7IHN0cm9rZS13aWR0aDogMS4wOyIvPjxsaW5lIHN0eWxlPSJzdHJva2U6ICNBODAwMzY7IHN0cm9rZS13aWR0aDogMS4wOyIgeDE9IjMxLjUiIHgyPSIyNTguNSIgeTE9IjEyNC40MTk5IiB5Mj0iMTI0LjQxOTkiLz48dGV4dCBmaWxsPSIjMDAwMDAwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMyIgbGVuZ3RoQWRqdXN0PSJzcGFjaW5nQW5kR2x5cGhzIiB0ZXh0TGVuZ3RoPSIxOTkiIHg9IjM4LjUiIHk9IjExOS42Nzc3Ij5Bbm90aGVyIGF1dGhlbnRpY2F0aW9uIFJlcXVlc3Q8L3RleHQ+PHBvbHlnb24gZmlsbD0iI0E4MDAzNiIgcG9pbnRzPSI0Mi41LDE0OS43MzA1LDMyLjUsMTUzLjczMDUsNDIuNSwxNTcuNzMwNSwzOC41LDE1My43MzA1IiBzdHlsZT0ic3Ryb2tlOiAjQTgwMDM2OyBzdHJva2Utd2lkdGg6IDEuMDsiLz48bGluZSBzdHlsZT0ic3Ryb2tlOiAjQTgwMDM2OyBzdHJva2Utd2lkdGg6IDEuMDsgc3Ryb2tlLWRhc2hhcnJheTogMi4wLDIuMDsiIHgxPSIzNi41IiB4Mj0iMjYzLjUiIHkxPSIxNTMuNzMwNSIgeTI9IjE1My43MzA1Ii8+PHRleHQgZmlsbD0iIzAwMDAwMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTMiIGxlbmd0aEFkanVzdD0ic3BhY2luZ0FuZEdseXBocyIgdGV4dExlbmd0aD0iMjA5IiB4PSI0OC41IiB5PSIxNDguOTg4MyI+QW5vdGhlciBhdXRoZW50aWNhdGlvbiBSZXNwb25zZTwvdGV4dD48IS0tTUQ1PVs3ZjNlNGQwYzkwMWVmZGJjNTdlYjQ0MjQ5YTNiODE5N10KQHN0YXJ0dW1sDQpza2lucGFyYW0gc2hhZG93aW5nIGZhbHNlDQpBbGljZSAtPiBCb2I6IEF1dGhlbnRpY2F0aW9uIFJlcXVlc3QNCkJvYiAtIC0+IEFsaWNlOiBBdXRoZW50aWNhdGlvbiBSZXNwb25zZQ0KDQpBbGljZSAtPiBCb2I6IEFub3RoZXIgYXV0aGVudGljYXRpb24gUmVxdWVzdA0KQWxpY2UgPC0gLSBCb2I6IEFub3RoZXIgYXV0aGVudGljYXRpb24gUmVzcG9uc2UNCkBlbmR1bWwNCgpQbGFudFVNTCB2ZXJzaW9uIDEuMjAyMC4wMihTdW4gTWFyIDAxIDA0OjIyOjA3IENTVCAyMDIwKQooTUlUIHNvdXJjZSBkaXN0cmlidXRpb24pCkphdmEgUnVudGltZTogT3BlbkpESyBSdW50aW1lIEVudmlyb25tZW50CkpWTTogT3BlbkpESyA2NC1CaXQgU2VydmVyIFZNCkphdmEgVmVyc2lvbjogMTIrMzMKT3BlcmF0aW5nIFN5c3RlbTogTWFjIE9TIFgKRGVmYXVsdCBFbmNvZGluZzogVVRGLTgKTGFuZ3VhZ2U6IGVuCkNvdW50cnk6IFVTCi0tPjwvZz48L3N2Zz4=',
							295, 212);
					}, 200);

				} else {
					editorUi.generatePlantUmlImage(text, format, function (data, w, h) {
						editorUi.spinner.stop();
						insertPlantUmlImage(text, format, data, w, h);

					}, function (e) {
						editorUi.handleError(e);
					});
				}
      }

		} else if (type == 'mermaid') {

			if (editorUi.spinner.spin(document.body, mxResources.get('inserting'))) {
				var graph = editorUi.editor.graph;

				editorUi.generateMermaidImage(text, format, function (data, w, h) {
					insertPoint = (mxEvent.isAltDown(evt)) ? insertPoint : graph.getCenterInsertPoint(new mxRectangle(0, 0, w, h));
					editorUi.spinner.stop();
					var cell = null;

					graph.getModel().beginUpdate();
					try {
						cell = graph.insertVertex(null, null, null, insertPoint.x, insertPoint.y,
							w, h, 'shape=image;noLabel=1;verticalAlign=top;imageAspect=1;' +
							'image=' + data + ';')
						graph.setAttributeForCell(cell, 'mermaidData',
							JSON.stringify({
								data: text,
								config: EditorUi.defaultMermaidConfig
							}, null, 2));
					} finally {
						graph.getModel().endUpdate();
					}

					if (cell != null) {
						graph.setSelectionCell(cell);
						graph.scrollCellToVisible(cell);
					}
				}, function (e) {
					editorUi.handleError(e);
				});
			}
		} else if (type == 'table') {

			var tableCell = null;
			var rows = null;
			var cells = [];
			var dx = 0;

			for (var i = 0; i < lines.length; i++) {
				var tmp = mxUtils.trim(lines[i]);

				if (tmp.substring(0, 12).toLowerCase() == 'create table') {
					var name = mxUtils.trim(tmp.substring(12));

					if (name.charAt(name.length - 1) == '(') {
						name = name.substring(0, name.lastIndexOf(' '));
					}

					tableCell = new mxCell(name, new mxGeometry(dx, 0, 160, 40),
						'shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;');
					tableCell.vertex = true;
					cells.push(tableCell);

					var size = editorUi.editor.graph.getPreferredSizeForCell(rowCell);

					if (size != null) {
						tableCell.geometry.width = size.width + 10;
					}
				} else if (tableCell != null && tmp.charAt(0) == ')') {
					dx += tableCell.geometry.width + 40;
					tableCell = null;
				} else if (tmp != '(' && tableCell != null) {
					var name = tmp.substring(0, (tmp.charAt(tmp.length - 1) == ',') ? tmp.length - 1 : tmp.length);

					if (name.substring(0, 11).toLowerCase() != 'primary key') {
						var pk = name.toLowerCase().indexOf('primary key');
						name = name.replace(/primary key/i, '');

						var rowCell = new mxCell('', new mxGeometry(0, 0, 160, 30),
							'shape=partialRectangle;collapsible=0;dropTarget=0;pointerEvents=0;fillColor=none;' +
							'points=[[0,0.5],[1,0.5]];portConstraint=eastwest;top=0;left=0;right=0;bottom=' +
							((pk > 0) ? '1' : '0') + ';');
						rowCell.vertex = true;

						var left = new mxCell((pk > 0) ? 'PK' : '', new mxGeometry(0, 0, 30, 30),
							'shape=partialRectangle;overflow=hidden;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;' + ((pk > 0) ? 'fontStyle=1;' : ''));
						left.vertex = true;
						rowCell.insert(left);

						var right = new mxCell(name, new mxGeometry(30, 0, 130, 30),
							'shape=partialRectangle;overflow=hidden;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=left;spacingLeft=6;' + ((pk > 0) ? 'fontStyle=5;' : ''));
						right.vertex = true;
						rowCell.insert(right);

						var size = editorUi.editor.graph.getPreferredSizeForCell(right);

						if (size != null && tableCell.geometry.width < size.width + 30) {
							tableCell.geometry.width = Math.min(320, Math.max(tableCell.geometry.width, size.width + 30));
						}

						tableCell.insert(rowCell);
						tableCell.geometry.height += 30;
					}
				}
			}

			if (cells.length > 0) {
				var graph = editorUi.editor.graph;
				insertPoint = (mxEvent.isAltDown(evt)) ? insertPoint :
					graph.getCenterInsertPoint(graph.getBoundingBoxFromGeometry(cells, true));
				graph.setSelectionCells(graph.importCells(cells, insertPoint.x, insertPoint.y));
				graph.scrollCellToVisible(graph.getSelectionCell());
			}
		} else if (type == 'list') {

			if (lines.length > 0) {
				var graph = editorUi.editor.graph;
				var listCell = null;
				var cells = [];
				var x0 = 0;

				for (var i = 0; i < lines.length; i++) {
					if (lines[i].charAt(0) != ';') {
						if (lines[i].length == 0) {
							listCell = null;
						} else {
							if (listCell == null) {
								listCell = new mxCell(lines[i], new mxGeometry(x0, 0, 160, 26 + 4),
									'swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;');
								listCell.vertex = true;
								cells.push(listCell);

								var size = graph.getPreferredSizeForCell(listCell);

								if (size != null && listCell.geometry.width < size.width + 10) {
									listCell.geometry.width = size.width + 10;
								}

								x0 += listCell.geometry.width + 40;
							} else if (lines[i] == '--') {
								var divider = new mxCell('', new mxGeometry(0, 0, 40, 8), 'line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;');
								divider.vertex = true;
								listCell.geometry.height += divider.geometry.height;
								listCell.insert(divider);
							} else if (lines[i].length > 0) {
								var field = new mxCell(lines[i], new mxGeometry(0, 0, 60, 26), 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;');
								field.vertex = true;

								var size = graph.getPreferredSizeForCell(field);

								if (size != null && field.geometry.width < size.width) {
									field.geometry.width = size.width;
								}

								listCell.geometry.width = Math.max(listCell.geometry.width, field.geometry.width);
								listCell.geometry.height += field.geometry.height;
								listCell.insert(field);
							}
						}
					}
				}

				if (cells.length > 0) {
					insertPoint = (mxEvent.isAltDown(evt)) ? insertPoint :
						graph.getCenterInsertPoint(graph.getBoundingBoxFromGeometry(cells, true));

					graph.getModel().beginUpdate();
					try {
						cells = graph.importCells(cells, insertPoint.x, insertPoint.y);
						var inserted = [];

						for (var i = 0; i < cells.length; i++) {
							inserted.push(cells[i]);
							inserted = inserted.concat(cells[i].children);
						}

						graph.fireEvent(new mxEventObject('cellsInserted', 'cells', inserted));
					} finally {
						graph.getModel().endUpdate();
					}

					graph.setSelectionCells(cells);
					graph.scrollCellToVisible(graph.getSelectionCell());
				}
			}
		} else {

			var vertices = new Object();
			var cells = [];

			function getOrCreateVertex(id) {
				var vertex = vertices[id];

				if (vertex == null) {
					vertex = new mxCell(id, new mxGeometry(0, 0, 80, 30), 'whiteSpace=wrap;html=1;');
					vertex.vertex = true;
					vertices[id] = vertex;
					cells.push(vertex);
				}

				return vertex;
			};

			for (var i = 0; i < lines.length; i++) {
				if (lines[i].charAt(0) != ';') {
					var values = lines[i].split('->');

					if (values.length >= 2) {
						var source = getOrCreateVertex(values[0]);
						var target = getOrCreateVertex(values[values.length - 1]);

						var edge = new mxCell((values.length > 2) ? values[1] : '', new mxGeometry());
						edge.edge = true;
						source.insertEdge(edge, true);
						target.insertEdge(edge, false);
						cells.push(edge);
					}
				}
			}

			if (cells.length > 0) {
				var container = document.createElement('div');
				container.style.visibility = 'hidden';
				document.body.appendChild(container);

				// Temporary graph for running the layout
				var graph = new Graph(container);

				graph.getModel().beginUpdate();
				try {
					cells = graph.importCells(cells);

					for (var i = 0; i < cells.length; i++) {
						if (graph.getModel().isVertex(cells[i])) {
							var size = graph.getPreferredSizeForCell(cells[i]);
							cells[i].geometry.width = Math.max(cells[i].geometry.width, size.width);
							cells[i].geometry.height = Math.max(cells[i].geometry.height, size.height);
						}
					}

					var layout = new mxFastOrganicLayout(graph);
					layout.disableEdgeStyle = false;
					layout.forceConstant = 120;
					layout.execute(graph.getDefaultParent());

					var edgeLayout = new mxParallelEdgeLayout(graph);
					edgeLayout.spacing = 20;
					edgeLayout.execute(graph.getDefaultParent());
				} finally {
					graph.getModel().endUpdate();
				}

				graph.clearCellOverlays();

				// Copy to actual graph
				var inserted = [];

				editorUi.editor.graph.getModel().beginUpdate();
				try {
					cells = graph.getModel().getChildren(graph.getDefaultParent());
					insertPoint = (mxEvent.isAltDown(evt)) ? insertPoint :
						editorUi.editor.graph.getCenterInsertPoint(graph.getBoundingBoxFromGeometry(cells, true));
					inserted = editorUi.editor.graph.importCells(cells, insertPoint.x, insertPoint.y)
					editorUi.editor.graph.fireEvent(new mxEventObject('cellsInserted', 'cells', inserted));
				} finally {
					editorUi.editor.graph.getModel().endUpdate();
				}

				editorUi.editor.graph.setSelectionCells(inserted);
				editorUi.editor.graph.scrollCellToVisible(editorUi.editor.graph.getSelectionCell());
				graph.destroy();
				container.parentNode.removeChild(container);
			}
		}
	};

	var div = document.createElement('div');
	div.style.textAlign = 'right';

	var textarea = document.createElement('textarea');
	textarea.style.resize = 'none';
	textarea.style.width = '100%';
	textarea.style.height = '354px';
	textarea.style.marginBottom = '16px';

	var typeSelect = document.createElement('select');

	if (defaultType == 'formatSql' || defaultType == 'mermaid') {
		typeSelect.style.display = 'none';
	}

	var listOption = document.createElement('option');
	listOption.setAttribute('value', 'list');
	mxUtils.write(listOption, mxResources.get('list'));

	if (defaultType != 'plantUml') {
		typeSelect.appendChild(listOption);
	}

	if (defaultType == null || defaultType == 'fromText') {
		listOption.setAttribute('selected', 'selected');
	}

	var tableOption = document.createElement('option');
	tableOption.setAttribute('value', 'table');
	mxUtils.write(tableOption, mxResources.get('formatSql'));

	if (defaultType == 'formatSql') {
		typeSelect.appendChild(tableOption);
		tableOption.setAttribute('selected', 'selected');
	}

	var mermaidOption = document.createElement('option');
	mermaidOption.setAttribute('value', 'mermaid');
	mxUtils.write(mermaidOption, mxResources.get('formatSql'));

	if (defaultType == 'mermaid') {
		typeSelect.appendChild(mermaidOption);
		mermaidOption.setAttribute('selected', 'selected');
	}

	var diagramOption = document.createElement('option');
	diagramOption.setAttribute('value', 'diagram');
	mxUtils.write(diagramOption, mxResources.get('diagram'));

	if (defaultType != 'plantUml') {
		typeSelect.appendChild(diagramOption);
	}

	var plantUmlSvgOption = document.createElement('option');
	plantUmlSvgOption.setAttribute('value', 'plantUmlSvg');
	mxUtils.write(plantUmlSvgOption, mxResources.get('plantUml') + ' (' + mxResources.get('formatSvg') + ')');

	if (defaultType == 'plantUml') {
    plantUmlSvgOption.setAttribute('selected', 'selected');
	}

	var plantUmlPngOption = document.createElement('option');
	plantUmlPngOption.setAttribute('value', 'plantUmlPng');
	mxUtils.write(plantUmlPngOption, mxResources.get('plantUml') + ' (' + mxResources.get('formatPng') + ')');

	var plantUmlTxtOption = document.createElement('option');
	plantUmlTxtOption.setAttribute('value', 'plantUmlTxt');
	mxUtils.write(plantUmlTxtOption, mxResources.get('plantUml') + ' (' + mxResources.get('text') + ')');

  // Disabled for invalid hosts via CORS headers
  // isOfflineFun 和 enablePlantUmlFun 是新定义的变量
	if (enablePlantUmlFun && Graph.fileSupport &&
		isOfflineFun && defaultType == 'plantUml') {
		typeSelect.appendChild(plantUmlSvgOption);
		typeSelect.appendChild(plantUmlPngOption);
		typeSelect.appendChild(plantUmlTxtOption);
	}

	function getDefaultValue() {
		if (typeSelect.value == 'list') {
			return 'Person\n-name: String\n-birthDate: Date\n--\n+getName(): String\n+setName(String): void\n+isBirthday(): boolean\n\n' +
				'Address\n-street: String\n-city: String\n-state: String';
		} else if (typeSelect.value == 'mermaid') {
			return 'graph TD;\n  A-->B;\n  A-->C;\n  B-->D;\n  C-->D;';
		} else if (typeSelect.value == 'table') {
			return 'CREATE TABLE Suppliers\n(\nsupplier_id int NOT NULL PRIMARY KEY,\n' +
				'supplier_name char(50) NOT NULL,\ncontact_name char(50),\n);\n' +
				'CREATE TABLE Customers\n(\ncustomer_id int NOT NULL PRIMARY KEY,\n' +
				'customer_name char(50) NOT NULL,\naddress char(50),\n' +
				'city char(50),\nstate char(25),\nzip_code char(10)\n);\n';
		} else if (typeSelect.value == 'plantUmlPng') {
			return '@startuml\nskinparam backgroundcolor transparent\nskinparam shadowing false\nAlice -> Bob: Authentication Request\nBob --> Alice: Authentication Response\n\nAlice -> Bob: Another authentication Request\nAlice <-- Bob: Another authentication Response\n@enduml';
		} else if (typeSelect.value == 'plantUmlSvg' || typeSelect.value == 'plantUmlTxt') {
			return plantUmlExample;
		} else {
			return ';Example:\na->b\nb->edge label->c\nc->a\n';
		}
	};

	var defaultValue = getDefaultValue();
	textarea.value = defaultValue;
	div.appendChild(textarea);

	this.init = function () {
		textarea.focus();
	};

	// Enables dropping files
	if (Graph.fileSupport) {
		function handleDrop(evt) {
			evt.stopPropagation();
			evt.preventDefault();

			if (evt.dataTransfer.files.length > 0) {
				var file = evt.dataTransfer.files[0];

				var reader = new FileReader();
				reader.onload = function (e) {
					textarea.value = e.target.result;
				};
				reader.readAsText(file);
			}
		};

		function handleDragOver(evt) {
			evt.stopPropagation();
			evt.preventDefault();
		};

		// Setup the dnd listeners.
		textarea.addEventListener('dragover', handleDragOver, false);
		textarea.addEventListener('drop', handleDrop, false);
	}

	div.appendChild(typeSelect);

	mxEvent.addListener(typeSelect, 'change', function () {
		var newDefaultValue = getDefaultValue();

		if (textarea.value.length == 0 || textarea.value == defaultValue) {
			defaultValue = newDefaultValue;
			textarea.value = defaultValue;
		}
  });

  //帮助按钮不显示
	// if (!editorUi.isOffline() && (defaultType == 'mermaid' || defaultType == 'plantUml')) {
	// 	var helpBtn = mxUtils.button(mxResources.get('help'), function () {
	// 		editorUi.openLink((defaultType == 'mermaid') ?
	// 			'https://mermaid-js.github.io/mermaid/#/' :
	// 			'https://plantuml.com/');
	// 	});
	// 	helpBtn.className = 'geBtn';
	// 	div.appendChild(helpBtn);
	// }

	var cancelBtn = mxUtils.button(mxResources.get('close'), function () {
		if (textarea.value == defaultValue) {
			editorUi.hideDialog();
		} else {
			editorUi.confirm(mxResources.get('areYouSure'), function () {
				editorUi.hideDialog();
			});
		}
	});

	cancelBtn.className = 'geBtn';

	if (editorUi.editor.cancelFirst) {
		div.appendChild(cancelBtn);
	}

	var okBtn = mxUtils.button(mxResources.get('insert'), function (evt) {
		editorUi.hideDialog();
		parse(textarea.value, typeSelect.value, evt);
	});
	div.appendChild(okBtn);

	okBtn.className = 'geBtn gePrimaryBtn';

	if (!editorUi.editor.cancelFirst) {
		div.appendChild(cancelBtn);
	}
	this.container = div;
};

/**
 * Constructs a new parse dialog.
 * 插入思维导图布局的弹层
 */
var CreateGraphDialog = function (editorUi, title, type) {
	var div = document.createElement('div');
	div.style.textAlign = 'right';

	this.init = function () {
		var container = document.createElement('div');
		container.style.position = 'relative';
		container.style.border = '1px solid gray';
		container.style.width = '100%';
		container.style.height = '360px';
		container.style.overflow = 'hidden';
		container.style.marginBottom = '16px';
		mxEvent.disableContextMenu(container);
		div.appendChild(container);

		var graph = new Graph(container);

		graph.setCellsCloneable(true);
		graph.setPanning(true);
		graph.setAllowDanglingEdges(false);
		graph.connectionHandler.select = false;
		graph.view.setTranslate(20, 20);
		graph.border = 20;
		graph.panningHandler.useLeftButtonForPanning = true;

		var vertexStyle = 'rounded=1;';
		var edgeStyle = 'curved=1;';
		var startStyle = 'ellipse';

		// FIXME: Does not work in iPad
		var mxCellRendererInstallCellOverlayListeners = mxCellRenderer.prototype.installCellOverlayListeners;
		graph.cellRenderer.installCellOverlayListeners = function (state, overlay, shape) {
			mxCellRenderer.prototype.installCellOverlayListeners.apply(this, arguments);

			mxEvent.addListener(shape.node, (mxClient.IS_POINTER) ? 'pointerdown' : 'mousedown', function (evt) {
				overlay.fireEvent(new mxEventObject('pointerdown', 'event', evt, 'state', state));
			});

			if (!mxClient.IS_POINTER && mxClient.IS_TOUCH) {
				mxEvent.addListener(shape.node, 'touchstart', function (evt) {
					overlay.fireEvent(new mxEventObject('pointerdown', 'event', evt, 'state', state));
				});
			}
		};

		graph.getAllConnectionConstraints = function () {
			return null;
		};

		// Keeps highlight behind overlays
		graph.connectionHandler.marker.highlight.keepOnTop = false;

		graph.connectionHandler.createEdgeState = function (me) {
			var edge = graph.createEdge(null, null, null, null, null, edgeStyle);

			return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge));
		};

		// Gets the default parent for inserting new cells. This
		// is normally the first child of the root (ie. layer 0).
		var parent = graph.getDefaultParent();

		var addOverlay = mxUtils.bind(this, function (cell) {
			// Creates a new overlay with an image and a tooltip
			var overlay = new mxCellOverlay(this.connectImage, 'Add outgoing');
			overlay.cursor = 'hand';

			// Installs a handler for clicks on the overlay
			overlay.addListener(mxEvent.CLICK, function (sender, evt2) {
				// TODO: Add menu for picking next shape
				graph.connectionHandler.reset();
				graph.clearSelection();
				var geo = graph.getCellGeometry(cell);

				var v2;

				executeLayout(function () {
					v2 = graph.insertVertex(parent, null, 'Entry', geo.x, geo.y, 80, 30, vertexStyle);
					addOverlay(v2);
					graph.view.refresh(v2);
					var e1 = graph.insertEdge(parent, null, '', cell, v2, edgeStyle);
				}, function () {
					graph.scrollCellToVisible(v2);
				});
			});

			// FIXME: Does not work in iPad (inserts loop)
			overlay.addListener('pointerdown', function (sender, eo) {
				var evt2 = eo.getProperty('event');
				var state = eo.getProperty('state');

				graph.popupMenuHandler.hideMenu();
				graph.stopEditing(false);

				var pt = mxUtils.convertPoint(graph.container,
					mxEvent.getClientX(evt2), mxEvent.getClientY(evt2));
				graph.connectionHandler.start(state, pt.x, pt.y);
				graph.isMouseDown = true;
				graph.isMouseTrigger = mxEvent.isMouseEvent(evt2);
				mxEvent.consume(evt2);
			});

			// Sets the overlay for the cell in the graph
			graph.addCellOverlay(cell, overlay);
		});

		// Adds cells to the model in a single step
		graph.getModel().beginUpdate();
		var v1;
		try {
			v1 = graph.insertVertex(parent, null, 'Start', 0, 0, 80, 30, startStyle);
			addOverlay(v1);
		} finally {
			// Updates the display
			graph.getModel().endUpdate();
		}

		var layout;

		if (type == 'horizontalTree') {
			layout = new mxCompactTreeLayout(graph);
			layout.edgeRouting = false;
			layout.levelDistance = 30;
			edgeStyle = 'edgeStyle=elbowEdgeStyle;elbow=horizontal;';
		} else if (type == 'verticalTree') {
			layout = new mxCompactTreeLayout(graph, false);
			layout.edgeRouting = false;
			layout.levelDistance = 30;
			edgeStyle = 'edgeStyle=elbowEdgeStyle;elbow=vertical;';
		} else if (type == 'radialTree') {
			layout = new mxRadialTreeLayout(graph, false);
			layout.edgeRouting = false;
			layout.levelDistance = 80;
		} else if (type == 'verticalFlow') {
			layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_NORTH);
		} else if (type == 'horizontalFlow') {
			layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_WEST);
		} else if (type == 'organic') {
			layout = new mxFastOrganicLayout(graph, false);
			layout.forceConstant = 80;
		} else if (type == 'circle') {
			layout = new mxCircleLayout(graph);
		}

		if (layout != null) {
			var executeLayout = function (change, post) {
				graph.getModel().beginUpdate();
				try {
					if (change != null) {
						change();
					}

					layout.execute(graph.getDefaultParent(), v1);
				} catch (e) {
					throw e;
				} finally {
					// New API for animating graph layout results asynchronously
					var morph = new mxMorphing(graph);
					morph.addListener(mxEvent.DONE, mxUtils.bind(this, function () {
						graph.getModel().endUpdate();

						if (post != null) {
							post();
						}
					}));

					morph.startAnimation();
				}
			};

			var edgeHandleConnect = mxEdgeHandler.prototype.connect;
			mxEdgeHandler.prototype.connect = function (edge, terminal, isSource, isClone, me) {
				edgeHandleConnect.apply(this, arguments);
				executeLayout();
			};

			graph.resizeCell = function () {
				mxGraph.prototype.resizeCell.apply(this, arguments);

				executeLayout();
			};

			graph.connectionHandler.addListener(mxEvent.CONNECT, function () {
				executeLayout();
			});
		}

		var cancelBtn = mxUtils.button(mxResources.get('close'), function () {
			editorUi.confirm(mxResources.get('areYouSure'), function () {
				if (container.parentNode != null) {
					graph.destroy();
					container.parentNode.removeChild(container);
				}

				editorUi.hideDialog();
			});
		})

		cancelBtn.className = 'geBtn';

		if (editorUi.editor.cancelFirst) {
			div.appendChild(cancelBtn);
		}

		var okBtn = mxUtils.button(mxResources.get('insert'), function (evt) {
			graph.clearCellOverlays();

			var cells = graph.getModel().getChildren(graph.getDefaultParent());
			var pt = (mxEvent.isAltDown(evt)) ?
				editorUi.editor.graph.getFreeInsertPoint() :
				editorUi.editor.graph.getCenterInsertPoint(
					graph.getBoundingBoxFromGeometry(cells, true));
			cells = editorUi.editor.graph.importCells(cells, pt.x, pt.y);
			var view = editorUi.editor.graph.view;
			var temp = view.getBounds(cells);
			temp.x -= view.translate.x;
			temp.y -= view.translate.y;
			editorUi.editor.graph.scrollRectToVisible(temp);
			editorUi.editor.graph.setSelectionCells(cells);

			if (container.parentNode != null) {
				graph.destroy();
				container.parentNode.removeChild(container);
			}

			editorUi.hideDialog();
		});

		div.appendChild(okBtn);
		okBtn.className = 'geBtn gePrimaryBtn';

		if (!editorUi.editor.cancelFirst) {
			div.appendChild(cancelBtn);
		}
	};

	this.container = div;
};

/**
 *
 */
CreateGraphDialog.prototype.connectImage = new mxImage((mxClient.IS_SVG) ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RjQ3OTk0QjMyRDcyMTFFNThGQThGNDVBMjNBMjFDMzkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RjQ3OTk0QjQyRDcyMTFFNThGQThGNDVBMjNBMjFDMzkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyRjA0N0I2MjJENzExMUU1OEZBOEY0NUEyM0EyMUMzOSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpGNDc5OTRCMjJENzIxMUU1OEZBOEY0NUEyM0EyMUMzOSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjIf+MgAAATlSURBVHjanFZraFxFFD735u4ru3ls0yZG26ShgmJoKK1J2vhIYzBgRdtIURHyw1hQUH9IxIgI2h8iCEUF/1RRlNQYCsYfCTHVhiTtNolpZCEStqSC22xIsrs1bDfu7t37Gs/cO3Ozxs1DBw73zpk555vzmHNGgJ0NYatFgmNLYUHYUoHASMz5ijmgVLmxgfKCUiBxC4ACJAeSG8nb1dVVOTc3dyoSibwWDofPBIPBJzo7O8vpGtvjpDICGztxkciECpF2LS0tvZtOpwNkk5FKpcYXFxffwL1+JuPgllPj8nk1F6RoaGjoKCqZ5ApljZDZO4SMRA0SuG2QUJIQRV8HxMOM9vf3H0ZZH9Nhg20MMl2QkFwjIyNHWlpahtADnuUMwLcRHX5aNSBjCJYEsSSLUeLEbhGe3ytCmQtA1/XY+Pj46dbW1iDuyCJp9BC5ycBj4hoeHq5ra2sbw0Xn1ZgBZ+dVkA1Lc+6p0Ck2p0QS4Ox9EhwpEylYcmBg4LH29vYQLilIOt0u5FhDfevNZDI/u93uw6PLOrwTUtjxrbPYbhD42WgMrF8JmR894ICmCgnQjVe8Xu8pXEkzMJKbuo5oNPomBbm1ZsD7s2kwFA1JZ6QBUXWT1nmGNc/qoMgavDcrQzxjQGFh4aOYIJ0sFAXcEtui4uLiVjr5KpSBVFYDDZVrWUaKRRWSAYeK0fmKykgDXbVoNaPChRuyqdDv97czL5nXxQbq6empQmsaklkDBiNpSwFVrmr2P6UyicD5piI4f8wHh0oEm8/p4h8pyGiEWvVQd3e3nxtjAzU1NR2jP7NRBWQ8GbdEzzJAmc0V3RR4cI8Dvmwuhc8fKUFA0d6/ltHg5p+Kuaejo6OeY0jcNJ/PV00ZS0nFUoZRvvFS1bZFsKHCCQ2Pl8H0chY+C96B6ZUsrCQ1qKtwQVFRURW/QhIXMAzDPAZ6BgOr8tTa8dDxCmiYGApaJbJMxSzV+brE8pdgWkcpY5dbMF1AR9XH8/xu2ilef48bvn92n82ZwHh+8ssqTEXS9p7dHisiiURikd8PbpExNTU1UVNTA3V3Y7lC16n0gpB/NwpNcZjfa7dScC4Qh0kOQCwnlEgi3F/hMVl9fX0zvKrzSk2lfXjRhj0eT/2rvWG4+Pta3oJY7XfC3hInXAv/ldeFLx8shQ+eqQL0UAAz7ylkpej5eNZRVBWL6BU6ef14OYiY1oqyTtmsavr/5koaRucT1pzx+ZpL1+GV5nLutksUgIcmtwTRiuuVZXnU5XId7A2swJkfFsymRWC91hHg1Viw6x23+7vn9sPJ+j20BE1hCXqSWaNSQ8ScbknRZWxub1PGCw/fBV+c3AeijlUbY5bBjEqr9GuYZP4jP41WudGSC6erTRCqdGZm5i1WvXWeDHnbBCZGc2Nj4wBl/hZOwrmBBfgmlID1HmGJutHaF+tKoevp/XCgstDkjo2NtWKLuc6AVN4mNjY+s1XQxoenOoFuDPHGtnRbJj9ej5GvL0dI7+giuRyMk1giazc+DP6vgUDgOJVlOv7R+PJ12QIeL6SyeDz+Kfp8ZrNWjgDTsVjsQ7qXyTjztXJhm9ePxFLfMTg4eG9tbe1RTP9KFFYQfHliYmIS69kCC7jKYmKwxxD5P88tkVkqbPPcIps9t4T/+HjcuJ/s5BFJgf4WYABCtxGuxIZ90gAAAABJRU5ErkJggg==' :
	IMAGE_PATH + '/handle-connect.png', 26, 26);


/**
 * Constructs a new parse dialog.
 */
var BackgroundImageDialog = function (editorUi, applyFn) {
  var div = document.createElement('div');
  div.style.whiteSpace = 'nowrap';

  var h3 = document.createElement('h2');
  mxUtils.write(h3, mxResources.get('backgroundImage'));
  h3.style.marginTop = '0px';
  div.appendChild(h3);

  mxUtils.write(div, mxResources.get('image') + ' ' + mxResources.get('url') + ':');
  mxUtils.br(div);

  var img = editorUi.editor.graph.backgroundImage;

  var urlInput = document.createElement('input');
  urlInput.setAttribute('type', 'text');
  urlInput.style.marginTop = '4px';
  urlInput.style.marginBottom = '4px';
  urlInput.style.width = '350px';
  urlInput.value = (img != null) ? img.src : '';

  var resetting = false;

  var urlChanged = function () {
    if (!resetting && urlInput.value != '' && !editorUi.isOffline()) {
      editorUi.loadImage(mxUtils.trim(urlInput.value), function (img) {
        widthInput.value = img.width;
        heightInput.value = img.height;
      }, function () {
        editorUi.showError(mxResources.get('error'), mxResources.get('fileNotFound'), mxResources.get('ok'));
        urlInput.value = '';
        widthInput.value = '';
        heightInput.value = '';
      });
    } else {
      widthInput.value = '';
      heightInput.value = '';
    }
  };

  this.init = function () {
    urlInput.focus();

    // Installs drag and drop handler for local images and links
    if (Graph.fileSupport) {
      urlInput.setAttribute('placeholder', mxResources.get('dragImagesHere'));

      // Setup the dnd listeners
      var dlg = div.parentNode;
      var graph = editorUi.editor.graph;
      var dropElt = null;

      mxEvent.addListener(dlg, 'dragleave', function (evt) {
        if (dropElt != null) {
          dropElt.parentNode.removeChild(dropElt);
          dropElt = null;
        }

        evt.stopPropagation();
        evt.preventDefault();
      });

      mxEvent.addListener(dlg, 'dragover', mxUtils.bind(this, function (evt) {
        // IE 10 does not implement pointer-events so it can't have a drop highlight
        if (dropElt == null && (!mxClient.IS_IE || document.documentMode > 10)) {
          dropElt = editorUi.highlightElement(dlg);
        }

        evt.stopPropagation();
        evt.preventDefault();
      }));

      mxEvent.addListener(dlg, 'drop', mxUtils.bind(this, function (evt) {
        if (dropElt != null) {
          dropElt.parentNode.removeChild(dropElt);
          dropElt = null;
        }

        if (evt.dataTransfer.files.length > 0) {
          editorUi.importFiles(evt.dataTransfer.files, 0, 0, editorUi.maxBackgroundSize, function (data, mimeType, x, y, w, h) {
            urlInput.value = data;
            urlChanged();
          }, function () {
            // No post processing
          }, function (file) {
            // Handles only images
            return file.type.substring(0, 6) == 'image/';
          }, function (queue) {
            // Invokes elements of queue in order
            for (var i = 0; i < queue.length; i++) {
              queue[i]();
            }
          }, true, editorUi.maxBackgroundBytes, editorUi.maxBackgroundBytes, true);
        } else if (mxUtils.indexOf(evt.dataTransfer.types, 'text/uri-list') >= 0) {
          var uri = evt.dataTransfer.getData('text/uri-list');

          if ((/\.(gif|jpg|jpeg|tiff|png|svg)$/i).test(uri)) {
            urlInput.value = decodeURIComponent(uri);
            urlChanged();
          }
        }

        evt.stopPropagation();
        evt.preventDefault();
      }), false);
    }
  };

  div.appendChild(urlInput);
  mxUtils.br(div);
  mxUtils.br(div);

  mxUtils.write(div, mxResources.get('width') + ':');

  var widthInput = document.createElement('input');
  widthInput.setAttribute('type', 'text');
  widthInput.style.width = '60px';
  widthInput.style.marginLeft = '4px';
  widthInput.style.marginRight = '16px';
  widthInput.value = (img != null) ? img.width : '';

  div.appendChild(widthInput);

  mxUtils.write(div, mxResources.get('height') + ':');

  var heightInput = document.createElement('input');
  heightInput.setAttribute('type', 'text');
  heightInput.style.width = '60px';
  heightInput.style.marginLeft = '4px';
  heightInput.style.marginRight = '16px';
  heightInput.value = (img != null) ? img.height : '';

  div.appendChild(heightInput);

  var resetBtn = mxUtils.button(mxResources.get('reset'), function () {
    urlInput.value = '';
    widthInput.value = '';
    heightInput.value = '';
    resetting = false;
  });
  mxEvent.addListener(resetBtn, 'mousedown', function () {
    // Blocks processing a image URL while clicking reset
    resetting = true;
  });
  mxEvent.addListener(resetBtn, 'touchstart', function () {
    // Blocks processing a image URL while clicking reset
    resetting = true;
  });
  resetBtn.className = 'geBtn';
  resetBtn.width = '100';
  div.appendChild(resetBtn);
  mxUtils.br(div);

  mxEvent.addListener(urlInput, 'change', urlChanged);

  ImageDialog.filePicked = function (data) {
    if (data.action == google.picker.Action.PICKED) {
      if (data.docs[0].thumbnails != null) {
        var thumb = data.docs[0].thumbnails[data.docs[0].thumbnails.length - 1];

        if (thumb != null) {
          urlInput.value = thumb.url;
          urlChanged();
        }
      }
    }

    urlInput.focus();
  };

  var btns = document.createElement('div');
  btns.style.marginTop = '40px';
  btns.style.textAlign = 'right';

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    editorUi.hideDialog();
  });

  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  var applyBtn = mxUtils.button(mxResources.get('apply'), function () {
    editorUi.hideDialog();
    applyFn((urlInput.value != '') ? new mxImage(mxUtils.trim(urlInput.value), widthInput.value, heightInput.value) : null);
  });
  applyBtn.className = 'geBtn gePrimaryBtn';
  btns.appendChild(applyBtn);

  if (!editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  div.appendChild(btns);

  this.container = div;
};

/**
 * Constructs a new image dialog.
 */
var ImageDialog = function (editorUi, title, initialValue, fn, ignoreExisting, convertDataUri) {
  convertDataUri = (convertDataUri != null) ? convertDataUri : true;

  var graph = editorUi.editor.graph;
  var div = document.createElement('div');
  mxUtils.write(div, title);

  var inner = document.createElement('div');
  inner.className = 'geTitle';
  inner.style.backgroundColor = 'transparent';
  inner.style.borderColor = 'transparent';
  inner.style.whiteSpace = 'nowrap';
  inner.style.textOverflow = 'clip';
  inner.style.cursor = 'default';

  if (!mxClient.IS_VML) {
    inner.style.paddingRight = '20px';
  }

  var linkInput = document.createElement('input');
  linkInput.setAttribute('value', initialValue);
  linkInput.setAttribute('type', 'text');
  linkInput.setAttribute('spellcheck', 'false');
  linkInput.setAttribute('autocorrect', 'off');
  linkInput.setAttribute('autocomplete', 'off');
  linkInput.setAttribute('autocapitalize', 'off');
  linkInput.style.marginTop = '6px';
  var realWidth = (Graph.fileSupport) ? 460 : 340;
  linkInput.style.width = realWidth + ((mxClient.IS_QUIRKS) ? 20 : -20) + 'px';
  linkInput.style.backgroundImage = 'url(\'' + Dialog.prototype.clearImage + '\')';
  linkInput.style.backgroundRepeat = 'no-repeat';
  linkInput.style.backgroundPosition = '100% 50%';
  linkInput.style.paddingRight = '14px';

  var cross = document.createElement('div');
  cross.setAttribute('title', mxResources.get('reset'));
  cross.style.position = 'relative';
  cross.style.left = '-16px';
  cross.style.width = '12px';
  cross.style.height = '14px';
  cross.style.cursor = 'pointer';

  // Workaround for inline-block not supported in IE
  cross.style.display = (mxClient.IS_VML) ? 'inline' : 'inline-block';
  cross.style.top = ((mxClient.IS_VML) ? 0 : 3) + 'px';

  // Needed to block event transparency in IE
  cross.style.background = 'url(\'' + editorUi.editor.transparentImage + '\')';

  mxEvent.addListener(cross, 'click', function () {
    linkInput.value = '';
    linkInput.focus();
  });

  inner.appendChild(linkInput);
  inner.appendChild(cross);
  div.appendChild(inner);

  var insertImage = function (newValue, w, h, resize) {
    var dataUri = newValue.substring(0, 5) == 'data:';

    if (!editorUi.isOffline() || (dataUri && typeof chrome === 'undefined')) {
      if (newValue.length > 0 && editorUi.spinner.spin(document.body, mxResources.get('inserting'))) {
        var maxSize = 520;

        editorUi.loadImage(newValue, function (img) {
          editorUi.spinner.stop();
          editorUi.hideDialog();
          var s = (resize === false) ? 1 :
            (w != null && h != null) ? Math.max(w / img.width, h / img.height) :
            Math.min(1, Math.min(maxSize / img.width, maxSize / img.height));

          // Handles special case of data URI which needs to be rewritten
          // to be used in a cell style to remove the semicolon
          if (convertDataUri) {
            newValue = editorUi.convertDataUri(newValue);
          }

          fn(newValue, Math.round(Number(img.width) * s), Math.round(Number(img.height) * s));
        }, function () {
          editorUi.spinner.stop();
          fn(null);
          editorUi.showError(mxResources.get('error'), mxResources.get('fileNotFound'), mxResources.get('ok'));
        });
      } else {
        editorUi.hideDialog();
        fn(newValue);
      }
    } else {
      newValue = editorUi.convertDataUri(newValue);
      w = (w == null) ? 120 : w;
      h = (h == null) ? 100 : h;

      editorUi.hideDialog();
      fn(newValue, w, h);
    }
  };

  var apply = function (newValue, resize) {
    if (newValue != null) {
      var geo = (ignoreExisting) ? null : graph.getModel().getGeometry(graph.getSelectionCell());

      // Reuses width and height of existing cell
      if (geo != null) {
        insertImage(newValue, geo.width, geo.height, resize);
      } else {
        insertImage(newValue, null, null, resize);
      }
    } else {
      editorUi.hideDialog();
      fn(null);
    }
  };

  this.init = function () {
    linkInput.focus();

    // Installs drag and drop handler for local images and links
    if (Graph.fileSupport) {
      linkInput.setAttribute('placeholder', mxResources.get('dragImagesHere'));

      // Setup the dnd listeners
      var dlg = div.parentNode;
      var graph = editorUi.editor.graph;
      var dropElt = null;

      mxEvent.addListener(dlg, 'dragleave', function (evt) {
        if (dropElt != null) {
          dropElt.parentNode.removeChild(dropElt);
          dropElt = null;
        }

        evt.stopPropagation();
        evt.preventDefault();
      });

      mxEvent.addListener(dlg, 'dragover', mxUtils.bind(this, function (evt) {
        // IE 10 does not implement pointer-events so it can't have a drop highlight
        if (dropElt == null && (!mxClient.IS_IE || document.documentMode > 10)) {
          dropElt = editorUi.highlightElement(dlg);
        }

        evt.stopPropagation();
        evt.preventDefault();
      }));

      mxEvent.addListener(dlg, 'drop', mxUtils.bind(this, function (evt) {
        if (dropElt != null) {
          dropElt.parentNode.removeChild(dropElt);
          dropElt = null;
        }

        if (evt.dataTransfer.files.length > 0) {
          editorUi.importFiles(evt.dataTransfer.files, 0, 0, editorUi.maxImageSize, function (data, mimeType, x, y, w, h, fileName, resize) {
            apply(data, resize);
          }, function () {
            // No post processing
          }, function (file) {
            // Handles only images
            return file.type.substring(0, 6) == 'image/';
          }, function (queue) {
            // Invokes elements of queue in order
            for (var i = 0; i < queue.length; i++) {
              queue[i]();
            }
          }, !mxEvent.isControlDown(evt), null, null, true);
        } else if (mxUtils.indexOf(evt.dataTransfer.types, 'text/uri-list') >= 0) {
          var uri = evt.dataTransfer.getData('text/uri-list');

          if ((/\.(gif|jpg|jpeg|tiff|png|svg)($|\?)/i).test(uri)) {
            apply(decodeURIComponent(uri));
          }
        }

        evt.stopPropagation();
        evt.preventDefault();
      }), false);
    }
  };

  var btns = document.createElement('div');
  btns.style.marginTop = (mxClient.IS_QUIRKS) ? '22px' : '14px';
  btns.style.textAlign = 'center';

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    // Just in case a spinner is spinning, has no effect otherwise
    editorUi.spinner.stop();
    editorUi.hideDialog();
  });

  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  ImageDialog.filePicked = function (data) {
    if (data.action == google.picker.Action.PICKED) {
      if (data.docs[0].thumbnails != null) {
        var thumb = data.docs[0].thumbnails[data.docs[0].thumbnails.length - 1];

        if (thumb != null) {
          linkInput.value = thumb.url;
        }
      }
    }

    linkInput.focus();
  };

  if (Graph.fileSupport) {
    if (editorUi.imgDlgFileInputElt == null) {
      var fileInput = document.createElement('input');
      fileInput.setAttribute('multiple', 'multiple');
      fileInput.setAttribute('type', 'file');

      mxEvent.addListener(fileInput, 'change', function (evt) {
        if (fileInput.files != null) {
          editorUi.importFiles(fileInput.files, 0, 0, editorUi.maxImageSize, function (data, mimeType, x, y, w, h) {
            apply(data);
          }, function () {
            // No post processing
          }, function (file) {
            // Handles only images
            return file.type.substring(0, 6) == 'image/';
          }, function (queue) {
            // Invokes elements of queue in order
            for (var i = 0; i < queue.length; i++) {
              queue[i]();
            }
          }, true);

          // Resets input to force change event for same file (type reset required for IE)
          fileInput.type = '';
          fileInput.type = 'file';
          fileInput.value = '';
        }
      });

      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      editorUi.imgDlgFileInputElt = fileInput;
    }

    var btn = mxUtils.button(mxResources.get('open'), function () {
      editorUi.imgDlgFileInputElt.click();
    });

    btn.className = 'geBtn';
    btns.appendChild(btn);
  }

  // Image cropping (experimental)
  if (!!document.createElement('canvas').getContext && linkInput.value.substring(0, 11) == 'data:image/' &&
    linkInput.value.substring(0, 14) != 'data:image/svg') {
    var cropBtn = mxUtils.button(mxResources.get('crop'), function () {
      var dlg = new CropImageDialog(editorUi, linkInput.value, function (image) {
        linkInput.value = image;
      });

      editorUi.showDialog(dlg.container, 300, 380, true, true);
      dlg.init();
    });

    cropBtn.className = 'geBtn';
    btns.appendChild(cropBtn);
  }

  mxEvent.addListener(linkInput, 'keypress', function (e) {
    if (e.keyCode == 13) {
      apply(linkInput.value);
    }
  });

  var applyBtn = mxUtils.button(mxResources.get('apply'), function () {
    apply(linkInput.value);
  });

  applyBtn.className = 'geBtn gePrimaryBtn';
  btns.appendChild(applyBtn);

  if (!editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  // Shows drop icon in dialog background
  if (Graph.fileSupport) {
    btns.style.marginTop = '120px';
    div.style.backgroundImage = 'url(\'' + IMAGE_PATH + '/droptarget.png\')';
    div.style.backgroundPosition = 'center 65%';
    div.style.backgroundRepeat = 'no-repeat';

    var bg = document.createElement('div');
    bg.style.position = 'absolute';
    bg.style.width = '420px';
    bg.style.top = '58%';
    bg.style.textAlign = 'center';
    bg.style.fontSize = '18px';
    bg.style.color = '#a0c3ff';
    mxUtils.write(bg, mxResources.get('dragImagesHere'));
    div.appendChild(bg);
  }

  div.appendChild(btns);

  this.container = div;
};



/**
 * Hook for getting the export format. Returns null for the default
 * intermediate XML export format or a function that returns the
 * parameter and value to be used in the request in the form
 * key=value, where value should be URL encoded.
 */
ExportDialog.exportFile = function (editorUi, name, format, bg, s, b, dpi) {
  var graph = editorUi.editor.graph;
  console.log('exportFile：', name, format);
  if (format == 'xml') {

    if (editorUi.isLocalFileSave()) {
      //不请求接口保存xml  svg 标签的内容
      // editorUi.saveLocalFile(mxUtils.getXml(graph.getSvg(bg, s, b)), name, format, null, null, true);

      //不请求接口保存xml  mxGraphModel 标签的内容
      editorUi.saveLocalFile(mxUtils.getXml(editorUi.editor.getGraphXml()), name, format, null, null, true);

    } else {
      //请求接口
      new mxXmlRequest(SAVE_URL, 'filename=' + encodeURIComponent(filename) +
        '&format=xml&xml=' + encodeURIComponent(data)).simulate(document, '_blank');
    }
    // ExportDialog.saveLocalFile(editorUi, mxUtils.getXml(editorUi.editor.getGraphXml()), name, format);

  } else if (format == 'svg') {

    if (editorUi.isLocalFileSave()) {
      //不请求接口保存svg
      editorUi.saveLocalFile(mxUtils.getXml(graph.getSvg(bg, s, b)), name, format, null, null, true);
    } else {
      //请求接口
      new mxXmlRequest(SAVE_URL, 'filename=' + encodeURIComponent(filename) +
        '&format=xml&xml=' + encodeURIComponent(data)).simulate(document, '_blank');
    }
    // ExportDialog.saveLocalFile(editorUi, mxUtils.getXml(graph.getSvg(bg, s, b)), name, format);

  } else {
    var data = editorUi.getFileData(true, null, null, null, null, true);
    var bounds = graph.getGraphBounds();
    var w = Math.floor(bounds.width * s / graph.view.scale);
    var h = Math.floor(bounds.height * s / graph.view.scale);
    if (data.length <= MAX_REQUEST_SIZE && w * h < MAX_AREA) {
      editorUi.hideDialog();
      if ((format == 'png' || format == 'jpg' || format == 'jpeg') && editorUi.isExportToCanvas()) {
        if (format == 'png') {
          // console.log("导出是png:",name,editorUi.isExportToCanvas());
          editorUi.exportImage(name, s, bg == null || bg == 'none', true,
            false, false, b, true, false, null, null, dpi);
        } else {
          editorUi.exportImage(name, s, false, true, false, false, b, true, false, 'jpeg');
        }
      }
      // else {
      //   // console.log("导出是GIF和PDF");
      //   // var extras = {
      //   //   globalVars: graph.getExportVariables()
      //   // };
      //   // editorUi.saveRequest(name, format,
      //   //   function (newTitle, base64) {
      //   //     return new mxXmlRequest(EXPORT_URL, 'format=' + format + '&base64=' + (base64 || '0') +
      //   //       ((newTitle != null) ? '&filename=' + encodeURIComponent(newTitle) : '') +
      //   //       '&extras=' + encodeURIComponent(JSON.stringify(extras)) +
      //   //       (dpi > 0 ? '&dpi=' + dpi : '') +
      //   //       '&bg=' + ((bg != null) ? bg : 'none') + '&w=' + w + '&h=' + h +
      //   //       '&border=' + b + '&xml=' + encodeURIComponent(data));
      //   //   });
      // }
    } else {
      mxUtils.alert(mxResources.get('drawingTooLarge'));
    }
  }
};




/**
 * Hook for getting the export format. Returns null for the default
 * intermediate XML export format or a function that returns the
 * parameter and value to be used in the request in the form
 * key=value, where value should be URL encoded.
 */
ExportDialog.saveLocalFile = function (editorUi, data, filename, format) {
	if (data.length < MAX_REQUEST_SIZE) {
		editorUi.hideDialog();
		var req = new mxXmlRequest(SAVE_URL, 'xml=' + encodeURIComponent(data) + '&filename=' +
			encodeURIComponent(filename) + '&format=' + format);
		req.simulate(document, '_blank');
	} else {
		mxUtils.alert(mxResources.get('drawingTooLarge'));
		mxUtils.popup(xml);
	}
};

/**
 * Constructs a new metadata dialog.
 */
var EditDataDialog = function (ui, cell) {
  var div = document.createElement('div');
  var graph = ui.editor.graph;

  var value = graph.getModel().getValue(cell);

  // Converts the value to an XML node
  if (!mxUtils.isNode(value)) {
    var doc = mxUtils.createXmlDocument();
    var obj = doc.createElement('object');
    obj.setAttribute('label', value || '');
    value = obj;
  }

	var meta = {};

	try {
		var temp = mxUtils.getValue(ui.editor.graph.getCurrentCellStyle(cell), 'metaData', null);

		if (temp != null) {
			meta = JSON.parse(temp);
		}
	} catch (e) {
		// ignore
	}

	// Creates the dialog contents
	var form = new mxForm('properties');
	form.table.style.width = '100%';

  var attrs = value.attributes;
  var names = [];
  var texts = [];
  var count = 0;

  var id = (EditDataDialog.getDisplayIdForCell != null) ?
    EditDataDialog.getDisplayIdForCell(ui, cell) : null;

  var addRemoveButton = function (text, name) {
    var wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.paddingRight = '20px';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.width = '100%';
    wrapper.style.cursor = 'pointer';

    var removeAttr = document.createElement('a');
    var img = mxUtils.createImage(Dialog.prototype.closeImage);
    img.style.height = '10px';
    img.style.fontSize = '9px';
    img.style.marginBottom = (mxClient.IS_IE11) ? '-1px' : '5px';

    removeAttr.className = 'geButton';
    removeAttr.setAttribute('title', mxResources.get('delete'));
    removeAttr.style.position = 'absolute';
    removeAttr.style.top = '4px';
    removeAttr.style.right = '0px';
    removeAttr.style.margin = '0px';
    removeAttr.style.width = '9px';
    removeAttr.style.height = '10px';
    removeAttr.style.cursor = 'pointer';
    removeAttr.appendChild(img);
    var removeAttrFn = (function (name) {
      return function () {
        var count = 0;
        for (var j = 0; j < names.length; j++) {
          if (names[j] == name) {
            texts[j] = null;
            form.table.deleteRow(count + ((id != null) ? 1 : 0));
            break;
          }
          if (texts[j] != null) {
            count++;
          }
        }
      };
    })(name);

    mxEvent.addListener(removeAttr, 'click', removeAttrFn);
    var parent = text.parentNode;
    wrapper.appendChild(text);
    wrapper.appendChild(removeAttr);
    parent.appendChild(wrapper);
  };

	var addTextArea = function (index, name, value) {
		names[index] = name;
		texts[index] = form.addTextarea(names[count] + ':', value, 2);
		texts[index].style.width = '100%';

		if (value.indexOf('\n') > 0) {
			texts[index].setAttribute('rows', '2');
		}

		addRemoveButton(texts[index], name);

		if (meta[name] != null && meta[name].editable == false) {
			texts[index].setAttribute('disabled', 'disabled');
		}
	};

  var temp = [];
  var isLayer = graph.getModel().getParent(cell) == graph.getModel().getRoot();

  for (var i = 0; i < attrs.length; i++) {
    if ((isLayer || attrs[i].nodeName != 'label') && attrs[i].nodeName != 'placeholders') {
      temp.push({
        name: attrs[i].nodeName,
        value: attrs[i].nodeValue
      });
    }
  }

  // Sorts by name
  temp.sort(function (a, b) {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });

  if (id != null) {
    var text = document.createElement('div');
    text.style.width = '100%';
    text.style.fontSize = '11px';
    text.style.textAlign = 'center';
    mxUtils.write(text, id);

    form.addField(mxResources.get('id') + ':', text);
  }

  for (var i = 0; i < temp.length; i++) {
    addTextArea(count, temp[i].name, temp[i].value);
    count++;
  }

  var top = document.createElement('div');
  top.style.cssText = 'position:absolute;left:30px;right:30px;overflow-y:auto;top:30px;bottom:80px;';
  top.appendChild(form.table);

  var newProp = document.createElement('div');
  newProp.style.boxSizing = 'border-box';
  newProp.style.paddingRight = '160px';
  newProp.style.whiteSpace = 'nowrap';
  newProp.style.marginTop = '6px';
  newProp.style.width = '100%';

  var nameInput = document.createElement('input');
  nameInput.setAttribute('placeholder', mxResources.get('enterPropertyName')); //dialog 输入属性名样式
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('size', (mxClient.IS_IE || mxClient.IS_IE11) ? '36' : '40');
  nameInput.style.boxSizing = 'border-box';
  nameInput.style.padding = '3px 0'; //新增加
  nameInput.style.marginLeft = '2px';
  nameInput.style.width = '100%';

  newProp.appendChild(nameInput);
  top.appendChild(newProp);
  div.appendChild(top);

  var addBtn = mxUtils.button(mxResources.get('addProperty'), function () {
    var name = nameInput.value;

    // Avoid ':' in attribute names which seems to be valid in Chrome
    if (name.length > 0 && name != 'label' && name != 'placeholders' && name.indexOf(':') < 0) {
      try {
        var idx = mxUtils.indexOf(names, name);

        if (idx >= 0 && texts[idx] != null) {
          texts[idx].focus();
        } else {
          // Checks if the name is valid
          var clone = value.cloneNode(false);
          clone.setAttribute(name, '');

          if (idx >= 0) {
            names.splice(idx, 1);
            texts.splice(idx, 1);
          }

          names.push(name);
          var text = form.addTextarea(name + ':', '', 2);
          text.style.width = '100%';
          texts.push(text);
          addRemoveButton(text, name);

          text.focus();
        }

        addBtn.setAttribute('disabled', 'disabled');
        nameInput.value = '';
      } catch (e) {
        mxUtils.alert(e);
      }
    } else {
      mxUtils.alert(mxResources.get('invalidName'));
    }
  });

  this.init = function () {
    if (texts.length > 0) {
      texts[0].focus();
    } else {
      nameInput.focus();
    }
  };

  addBtn.setAttribute('title', mxResources.get('addProperty'));
  addBtn.setAttribute('disabled', 'disabled');
  addBtn.style.textOverflow = 'ellipsis';
  addBtn.style.position = 'absolute';
  addBtn.style.overflow = 'hidden';
  addBtn.style.width = '144px';
  addBtn.style.right = '0px';
  addBtn.className = 'geBtn';
  newProp.appendChild(addBtn);

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    ui.hideDialog.apply(ui, arguments);
  });

  cancelBtn.className = 'geBtn';

  var applyBtn = mxUtils.button(mxResources.get('apply'), function () {
    try {
      ui.hideDialog.apply(ui, arguments);

      // Clones and updates the value
      value = value.cloneNode(true);
      var removeLabel = false;

      for (var i = 0; i < names.length; i++) {
        if (texts[i] == null) {
          value.removeAttribute(names[i]);
        } else {
          value.setAttribute(names[i], texts[i].value);
          removeLabel = removeLabel || (names[i] == 'placeholder' &&
            value.getAttribute('placeholders') == '1');
        }
      }

      // Removes label if placeholder is assigned
      if (removeLabel) {
        value.removeAttribute('label');
      }

      // Updates the value of the cell (undoable)
      graph.getModel().setValue(cell, value);
    } catch (e) {
      mxUtils.alert(e);
    }
  });
  applyBtn.className = 'geBtn gePrimaryBtn';

  function updateAddBtn() {
    if (nameInput.value.length > 0) {
      addBtn.removeAttribute('disabled');
    } else {
      addBtn.setAttribute('disabled', 'disabled');
    }
  };

  mxEvent.addListener(nameInput, 'keyup', updateAddBtn);

  // Catches all changes that don't fire a keyup (such as paste via mouse)
  mxEvent.addListener(nameInput, 'change', updateAddBtn);

  var buttons = document.createElement('div');
  buttons.style.cssText = 'position:absolute;left:30px;right:30px;text-align:right;bottom:30px;height:40px;'

  if (ui.editor.graph.getModel().isVertex(cell) || ui.editor.graph.getModel().isEdge(cell)) {
    var replace = document.createElement('span');
    replace.style.marginRight = '10px';
    var input = document.createElement('input');
    input.setAttribute('type', 'checkbox');


    input.style.marginRight = '6px';

    if (value.getAttribute('placeholders') == '1') {
      input.setAttribute('checked', 'checked');
      input.defaultChecked = true;
    }

    mxEvent.addListener(input, 'click', function () {
      if (value.getAttribute('placeholders') == '1') {
        value.removeAttribute('placeholders');
      } else {
        value.setAttribute('placeholders', '1');
      }
    });

    replace.appendChild(input);
    mxUtils.write(replace, mxResources.get('placeholders'));

    if (EditDataDialog.placeholderHelpLink != null) {
      var link = document.createElement('a');
      link.setAttribute('href', EditDataDialog.placeholderHelpLink);
      link.setAttribute('title', mxResources.get('help'));
      link.setAttribute('target', '_blank');
      link.style.marginLeft = '8px';
      link.style.cursor = 'help';

      var icon = document.createElement('img');
      mxUtils.setOpacity(icon, 50);
      icon.style.height = '16px';
      icon.style.width = '16px';
      icon.setAttribute('border', '0');
      icon.setAttribute('valign', 'middle');
      icon.style.marginTop = (mxClient.IS_IE11) ? '0px' : '-4px';
      icon.setAttribute('src', Editor.helpImage);
      link.appendChild(icon);

      replace.appendChild(link);
    }

    buttons.appendChild(replace);
  }

  if (ui.editor.cancelFirst) {
    buttons.appendChild(cancelBtn);
    buttons.appendChild(applyBtn);
  } else {
    buttons.appendChild(applyBtn);
    buttons.appendChild(cancelBtn);
  }

  div.appendChild(buttons);
  this.container = div;
};

/**
 * Optional help link.
 */
EditDataDialog.getDisplayIdForCell = function (ui, cell) {
  var id = null;
  if (ui.editor.graph.getModel().getParent(cell) != null) {
    id = cell.getId();
  }
  return id;
};

/**
 * 创建图例的方法 createLegendDialog
 */
var createLegendDialog = function (editorUi, x, y, w, h) {
  var graph = editorUi.editor.graph;
  var div = document.createElement('div');
  div.style.userSelect = 'none';
  div.style.overflow = 'hidden';
  div.style.height = '100%';

  var img = document.createElement('img');
  img.style.border = '0px';
  img.setAttribute('width', '100%');
  img.setAttribute('height', '230');
  img.setAttribute('src', ABOUT_PATH + '/legend.svg');
  div.appendChild(img);

  //创建svg对象
  // var svg = "";
	// svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	// svg.setAttribute("width", "100%");
	// svg.setAttribute("height", "100%");
  // div.appendChild(svg);

  // var nodeRect = document.createElementNS("http://www.w3.org/2000/svg","rect");
  // nodeRect.setAttribute("height",20);
  // nodeRect.setAttribute("width",20);
  // nodeRect.setAttribute("x",10);
  // nodeRect.setAttribute("y",10);
  // nodeRect.setAttribute("fill","#FFFFFF");
  // nodeRect.setAttribute("stroke","#000000");
  // svg.appendChild(nodeRect);

  this.window = new mxWindow(mxResources.get('legend'), div, x, y, w, h, true, true);
  this.window.destroyOnClose = false;
  // this.window.setMaximizable(false);
  this.window.setResizable(false);
  this.window.setClosable(true);
  this.window.setVisible(true);

  this.window.setLocation = function (x, y) {
    var iw = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
    var ih = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight;

    x = Math.max(0, Math.min(x, iw - this.table.clientWidth));
    y = Math.max(0, Math.min(y, ih - this.table.clientHeight - 48));

    if (this.getX() != x || this.getY() != y) {
      mxWindow.prototype.setLocation.apply(this, arguments);
    }
  };

  var resizeListener = mxUtils.bind(this, function () {
    var x = this.window.getX();
    var y = this.window.getY();

    this.window.setLocation(x, y);
  });

  mxEvent.addListener(window, 'resize', resizeListener);
  this.destroy = function () {
    mxEvent.removeListener(window, 'resize', resizeListener);
    this.window.destroy();
  }
};


/**
 * 自由绘制的方法
 */
var FreehandWindow = function (editorUi, x, y, w, h) {
  var graph = editorUi.editor.graph;
  // console.log(graph, 'graph');
  var propertyName = 'tags';

  var div = document.createElement('div');
  div.style.userSelect = 'none';
  div.style.overflow = 'hidden';
  div.style.height = '100%';

  var startBtn = mxUtils.button(mxResources.get('startDrawing'), function () {
    if (graph.freehand.isDrawing()) {
      graph.freehand.stopDrawing();
    }
    graph.freehand.startDrawing();
  });

  startBtn.setAttribute('title', mxResources.get('startDrawing'));
  startBtn.style.marginTop = '8px';
  startBtn.style.marginRight = '4px';
  startBtn.style.width = '160px';
  startBtn.style.overflow = 'hidden';
  startBtn.style.textOverflow = 'ellipsis';
  startBtn.style.textAlign = 'center';
  startBtn.className = 'geBtn gePrimaryBtn';

  div.appendChild(startBtn);

  var stopBtn = startBtn.cloneNode(false);
  mxUtils.write(stopBtn, mxResources.get('stopDrawing'));
  stopBtn.setAttribute('title', mxResources.get('stopDrawing'));
  stopBtn.style.marginTop = '4px';

  mxEvent.addListener(stopBtn, 'click', function () {
    graph.freehand.stopDrawing();
  });

  div.appendChild(stopBtn);

  this.window = new mxWindow(mxResources.get('freehand'), div, x, y, w, h, true, true);
  this.window.destroyOnClose = false;
  this.window.setMaximizable(false);
  this.window.setResizable(false);
  this.window.setClosable(true);
  this.window.setVisible(true);

  graph.addListener('freehandStateChanged', mxUtils.bind(this, function () {
    stopBtn.className = 'geBtn' + (graph.freehand.isDrawing() ? ' gePrimaryBtn' : '');
  }));

  this.window.addListener('show', mxUtils.bind(this, function () {
    this.window.fit();
  }));

  this.window.addListener('hide', mxUtils.bind(this, function () {
    if (graph.freehand.isDrawing()) {
      graph.freehand.stopDrawing();
    }
  }));

  this.window.setLocation = function (x, y) {
    var iw = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
    var ih = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight;

    x = Math.max(0, Math.min(x, iw - this.table.clientWidth));
    y = Math.max(0, Math.min(y, ih - this.table.clientHeight - 48));

    if (this.getX() != x || this.getY() != y) {
      mxWindow.prototype.setLocation.apply(this, arguments);
    }
  };

  var resizeListener = mxUtils.bind(this, function () {
    var x = this.window.getX();
    var y = this.window.getY();

    this.window.setLocation(x, y);
  });

  mxEvent.addListener(window, 'resize', resizeListener);

  this.destroy = function () {
    mxEvent.removeListener(window, 'resize', resizeListener);
    this.window.destroy();
  }
};

/**
 * Optional help link.
 * 创建图形的弹层，编辑图形style方法
 */
EditDataDialog.placeholderHelpLink = null;

/**
 * Constructs a new link dialog.
 */
//编辑链接的dialog
var LinkDialog = function (editorUi, initialValue, btnLabel, fn) {
  var div = document.createElement('div');
  mxUtils.write(div, mxResources.get('editLink') + ':');

  var inner = document.createElement('div');
  inner.className = 'geTitle';
  inner.style.backgroundColor = 'transparent';
  inner.style.borderColor = 'transparent';
  inner.style.whiteSpace = 'nowrap';
  inner.style.textOverflow = 'clip';
  inner.style.cursor = 'default';

  if (!mxClient.IS_VML) {
    inner.style.paddingRight = '20px';
  }

  var linkInput = document.createElement('input');
  linkInput.setAttribute('value', initialValue);
  linkInput.setAttribute('placeholder', 'http://www.example.com/');
  linkInput.setAttribute('type', 'text');
  linkInput.style.marginTop = '6px';
  linkInput.style.width = '400px';
  linkInput.style.backgroundImage = 'url(\'' + Dialog.prototype.clearImage + '\')';
  linkInput.style.backgroundRepeat = 'no-repeat';
  linkInput.style.backgroundPosition = '100% 50%';
  linkInput.style.paddingRight = '14px';

  var cross = document.createElement('div');
  cross.setAttribute('title', mxResources.get('reset'));
  cross.style.position = 'relative';
  cross.style.left = '-16px';
  cross.style.width = '12px';
  cross.style.height = '14px';
  cross.style.cursor = 'pointer';

  // Workaround for inline-block not supported in IE
  cross.style.display = (mxClient.IS_VML) ? 'inline' : 'inline-block';
  cross.style.top = ((mxClient.IS_VML) ? 0 : 3) + 'px';

  // Needed to block event transparency in IE
  cross.style.background = 'url(' + IMAGE_PATH + '/transparent.gif)';

  mxEvent.addListener(cross, 'click', function () {
    linkInput.value = '';
    linkInput.focus();
  });

  inner.appendChild(linkInput);
  inner.appendChild(cross);
  div.appendChild(inner);

  this.init = function () {
    linkInput.focus();

    if (mxClient.IS_GC || mxClient.IS_FF || document.documentMode >= 5 || mxClient.IS_QUIRKS) {
      linkInput.select();
    } else {
      document.execCommand('selectAll', false, null);
    }
  };

  var btns = document.createElement('div');
  btns.style.marginTop = '25px';
  btns.style.textAlign = 'right';

  mxEvent.addListener(linkInput, 'keypress', function (e) {
    if (e.keyCode == 13) {
      editorUi.hideDialog();
      fn(linkInput.value);
    }
  });

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    editorUi.hideDialog();
  });
  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  var mainBtn = mxUtils.button(btnLabel, function () {
    editorUi.hideDialog();
    fn(linkInput.value);
  });
  mainBtn.className = 'geBtn gePrimaryBtn';
  btns.appendChild(mainBtn);

  if (!editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  div.appendChild(btns);

  this.container = div;
};

/**
 * 缩略图的方法
 */
var OutlineWindow = function (editorUi, x, y, w, h) {
	var graph = editorUi.editor.graph;

	var div = document.createElement('div');
	div.style.position = 'absolute';
	div.style.width = '100%';
	div.style.height = '100%';
	div.style.border = '1px solid whiteSmoke';
	div.style.overflow = 'hidden';

	this.window = new mxWindow(mxResources.get('outline'), div, x, y, w, h, true, true);
	this.window.minimumSize = new mxRectangle(0, 0, 80, 80);
	this.window.destroyOnClose = false;
	this.window.setMaximizable(false);
	this.window.setResizable(true);
	this.window.setClosable(true);
	this.window.setVisible(true);

	this.window.setLocation = function (x, y) {
		var iw = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
		var ih = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight;

		x = Math.max(0, Math.min(x, iw - this.table.clientWidth));
		y = Math.max(0, Math.min(y, ih - this.table.clientHeight - 48));

		if (this.getX() != x || this.getY() != y) {
			mxWindow.prototype.setLocation.apply(this, arguments);
		}
	};

	var resizeListener = mxUtils.bind(this, function () {
		var x = this.window.getX();
		var y = this.window.getY();

		this.window.setLocation(x, y);
	});

	mxEvent.addListener(window, 'resize', resizeListener);

	var outline = editorUi.createOutline(this.window);

	this.destroy = function () {
		mxEvent.removeListener(window, 'resize', resizeListener);
		this.window.destroy();
		outline.destroy();
	}

	this.window.addListener(mxEvent.RESIZE, mxUtils.bind(this, function () {
		outline.update(false);
		outline.outline.sizeDidChange();
	}));

	this.window.addListener(mxEvent.SHOW, mxUtils.bind(this, function () {
		this.window.fit();
		outline.suspended = false;
		outline.outline.refresh();
		outline.update();
	}));

	this.window.addListener(mxEvent.HIDE, mxUtils.bind(this, function () {
		outline.suspended = true;
	}));

	this.window.addListener(mxEvent.NORMALIZE, mxUtils.bind(this, function () {
		outline.suspended = false;
		outline.update();
	}));

	this.window.addListener(mxEvent.MINIMIZE, mxUtils.bind(this, function () {
		outline.suspended = true;
	}));

	var outlineCreateGraph = outline.createGraph;
	outline.createGraph = function (container) {
		var g = outlineCreateGraph.apply(this, arguments);
		g.gridEnabled = false;
		g.pageScale = graph.pageScale;
		g.pageFormat = graph.pageFormat;
		g.background = (graph.background == null || graph.background == mxConstants.NONE) ? graph.defaultPageBackgroundColor : graph.background;
		g.pageVisible = graph.pageVisible;

		var current = mxUtils.getCurrentStyle(graph.container);
		div.style.backgroundColor = current.backgroundColor;

		return g;
	};

	function update() {
		outline.outline.pageScale = graph.pageScale;
		outline.outline.pageFormat = graph.pageFormat;
		outline.outline.pageVisible = graph.pageVisible;
		outline.outline.background = (graph.background == null || graph.background == mxConstants.NONE) ? graph.defaultPageBackgroundColor : graph.background;;

		var current = mxUtils.getCurrentStyle(graph.container);
		div.style.backgroundColor = current.backgroundColor;

		if (graph.view.backgroundPageShape != null && outline.outline.view.backgroundPageShape != null) {
			outline.outline.view.backgroundPageShape.fill = graph.view.backgroundPageShape.fill;
		}

		outline.outline.refresh();
	};

	outline.init(div);

	editorUi.editor.addListener('resetGraphView', update);
	editorUi.addListener('pageFormatChanged', update);
	editorUi.addListener('backgroundColorChanged', update);
	editorUi.addListener('backgroundImageChanged', update);
	editorUi.addListener('pageViewChanged', function () {
		update();
		outline.update(true);
	});

	if (outline.outline.dialect == mxConstants.DIALECT_SVG) {
		var zoomInAction = editorUi.actions.get('zoomIn');
		var zoomOutAction = editorUi.actions.get('zoomOut');

		mxEvent.addMouseWheelListener(function (evt, up) {
			var outlineWheel = false;
			var source = mxEvent.getSource(evt);

			while (source != null) {
				if (source == outline.outline.view.canvas.ownerSVGElement) {
					outlineWheel = true;
					break;
				}

				source = source.parentNode;
			}

			if (outlineWheel) {
				if (up) {
					zoomInAction.funct();
				} else {
					zoomOutAction.funct();
				}
			}
		});
	}
};


/**
 * 图层dialog 方法
 */
var LayersWindow = function (editorUi, x, y, w, h) {
  //重新给背景色赋值
  Dialog.backdropColor = "#dcdcdc";
	var graph = editorUi.editor.graph;
	var div = document.createElement('div');
	div.style.userSelect = 'none';
	div.style.background = (Dialog.backdropColor == 'white') ? 'whiteSmoke' : Dialog.backdropColor;
	div.style.border = '1px solid whiteSmoke';
	div.style.height = '100%';
	div.style.marginBottom = '10px';
	div.style.overflow = 'auto';

	var tbarHeight = (!EditorUi.compactUi) ? '30px' : '26px';

	var listDiv = document.createElement('div')
	listDiv.style.backgroundColor = (Dialog.backdropColor == 'white') ? '#dcdcdc' : Dialog.backdropColor;
	listDiv.style.position = 'absolute';
	listDiv.style.overflow = 'auto';
	listDiv.style.left = '0px';
	listDiv.style.right = '0px';
	listDiv.style.top = '0px';
	listDiv.style.bottom = (parseInt(tbarHeight) + 7) + 'px';
	div.appendChild(listDiv);

	var dragSource = null;
	var dropIndex = null;

	mxEvent.addListener(div, 'dragover', function (evt) {
		evt.dataTransfer.dropEffect = 'move';
		dropIndex = 0;
		evt.stopPropagation();
		evt.preventDefault();
	});

	// Workaround for "no element found" error in FF
	mxEvent.addListener(div, 'drop', function (evt) {
		evt.stopPropagation();
		evt.preventDefault();
	});

	var layerCount = null;
	var selectionLayer = null;
	var ldiv = document.createElement('div');

	ldiv.className = 'geToolbarContainer';
	ldiv.style.position = 'absolute';
	ldiv.style.bottom = '0px';
	ldiv.style.left = '0px';
	ldiv.style.right = '0px';
	ldiv.style.height = tbarHeight;
	ldiv.style.overflow = 'hidden';
	ldiv.style.padding = (!EditorUi.compactUi) ? '1px' : '4px 0px 3px 0px';
	ldiv.style.backgroundColor =  (Dialog.backdropColor == 'white') ? 'whiteSmoke' : 'whiteSmoke'; // Dialog.backdropColor;
	ldiv.style.borderWidth = '1px 0px 0px 0px';
	ldiv.style.borderColor = '#c3c3c3';
	ldiv.style.borderStyle = 'solid';
	ldiv.style.display = 'block';
	ldiv.style.whiteSpace = 'nowrap';

	if (mxClient.IS_QUIRKS) {
		ldiv.style.filter = 'none';
	}

	var link = document.createElement('a');
	link.className = 'geButton';

	if (mxClient.IS_QUIRKS) {
		link.style.filter = 'none';
	}

	var removeLink = link.cloneNode();
	removeLink.innerHTML = '<div class="geSprite geSprite-delete" style="display:inline-block;"></div>';

  //删除图层的方法
	mxEvent.addListener(removeLink, 'click', function (evt) {
    // console.log("删除图层")
		if (graph.isEnabled()) {
			graph.model.beginUpdate();
			try {
				var index = graph.model.root.getIndex(selectionLayer);
				graph.removeCells([selectionLayer], false);

				// Creates default layer if no layer exists
				if (graph.model.getChildCount(graph.model.root) == 0) {
					graph.model.add(graph.model.root, new mxCell());
					graph.setDefaultParent(null);
				} else if (index > 0 && index <= graph.model.getChildCount(graph.model.root)) {
					graph.setDefaultParent(graph.model.getChildAt(graph.model.root, index - 1));
				} else {
					graph.setDefaultParent(null);
				}
			} finally {
				graph.model.endUpdate();
			}
		}

		mxEvent.consume(evt);
	});

	if (!graph.isEnabled()) {
		removeLink.className = 'geButton mxDisabled';
	}

	ldiv.appendChild(removeLink);

	var insertLink = link.cloneNode();
	insertLink.setAttribute('title', mxUtils.trim(mxResources.get('moveSelectionTo', ['...'])));
	insertLink.innerHTML = '<div class="geSprite geSprite-insert" style="display:inline-block;"></div>';

  //将所选的内容 移到哪个图层里面
	mxEvent.addListener(insertLink, 'click', function (evt) {
    // console.log("内容移到新图层")
		if (graph.isEnabled() && !graph.isSelectionEmpty()) {
			var offset = mxUtils.getOffset(insertLink);

			editorUi.showPopupMenu(mxUtils.bind(this, function (menu, parent) {
				for (var i = layerCount - 1; i >= 0; i--) {
					(mxUtils.bind(this, function (child) {
						var item = menu.addItem(graph.convertValueToString(child) ||
							mxResources.get('background'), null, mxUtils.bind(this, function () {
								graph.moveCells(graph.getSelectionCells(), 0, 0, false, child);
							}), parent);

						if (graph.getSelectionCount() == 1 && graph.model.isAncestor(child, graph.getSelectionCell())) {
							menu.addCheckmark(item, Editor.checkmarkImage);
						}

					}))(graph.model.getChildAt(graph.model.root, i));
				}
			}), offset.x, offset.y + insertLink.offsetHeight, evt);
		}
	});

	ldiv.appendChild(insertLink);

	var dataLink = link.cloneNode();
	dataLink.innerHTML = '<div class="geSprite geSprite-dots" style="display:inline-block;"></div>';
	dataLink.setAttribute('title', mxResources.get('rename'));

  //编辑图层
	mxEvent.addListener(dataLink, 'click', function (evt) {
    // console.log("编辑图层")
		if (graph.isEnabled()) {
			editorUi.showDataDialog(selectionLayer);
		}

		mxEvent.consume(evt);
	});

	if (!graph.isEnabled()) {
		dataLink.className = 'geButton mxDisabled';
	}

	ldiv.appendChild(dataLink);

	function renameLayer(layer) {
		if (graph.isEnabled() && layer != null) {
			var label = graph.convertValueToString(layer);
			var dlg = new FilenameDialog(editorUi, label || mxResources.get('background'), mxResources.get('rename'), mxUtils.bind(this, function (newValue) {
				if (newValue != null) {
					graph.cellLabelChanged(layer, newValue);
				}
			}), mxResources.get('enterName'));
			editorUi.showDialog(dlg.container, 300, 100, true, true);
			dlg.init();
		}
	};

	var duplicateLink = link.cloneNode();
	duplicateLink.innerHTML = '<div class="geSprite geSprite-duplicate" style="display:inline-block;"></div>';

  //复制未命名图层
	mxEvent.addListener(duplicateLink, 'click', function (evt) {
    // console.log("复制未命名图层")
		if (graph.isEnabled()) {
			var newCell = null;
			graph.model.beginUpdate();
			try {
				newCell = graph.cloneCell(selectionLayer);
        // 默认的未命名图层
				// graph.cellLabelChanged(newCell, mxResources.get('untitledLayer'));

        // 新命名--图例图层
        graph.cellLabelChanged(newCell, mxResources.get('ledLayer'));

				newCell.setVisible(true);
				newCell = graph.addCell(newCell, graph.model.root);
				graph.setDefaultParent(newCell);
			} finally {
				graph.model.endUpdate();
			}

			if (newCell != null && !graph.isCellLocked(newCell)) {
				graph.selectAll(newCell);
			}
		}
	});

	if (!graph.isEnabled()) {
		duplicateLink.className = 'geButton mxDisabled';
	}

	ldiv.appendChild(duplicateLink);

	var addLink = link.cloneNode();
	addLink.innerHTML = '<div class="geSprite geSprite-plus" style="display:inline-block;"></div>';
	addLink.setAttribute('title', mxResources.get('addLayer'));

  //添加新图层
	mxEvent.addListener(addLink, 'click', function (evt) {
    // console.log("添加新的图层:", graph.model.root)
		if (graph.isEnabled()) {
			graph.model.beginUpdate();
			try {
        // 默认的未命名图层
				// var cell = graph.addCell(new mxCell(mxResources.get('untitledLayer')), graph.model.root);
				// 新命名--图例图层
        var cell = graph.addCell(new mxCell(mxResources.get('ledLayer')), graph.model.root);

				graph.setDefaultParent(cell);
        //不让选中
        // graph.model.setVisible(cell, !graph.model.isVisible(cell));
			} finally {
				graph.model.endUpdate();
			}
		}
		mxEvent.consume(evt);
	});

	if (!graph.isEnabled()) {
		addLink.className = 'geButton mxDisabled';
	}

	ldiv.appendChild(addLink);
	div.appendChild(ldiv);

	function refresh() {
		layerCount = graph.model.getChildCount(graph.model.root)
		listDiv.innerHTML = '';

		function addLayer(index, label, child, defaultParent) {
			var ldiv = document.createElement('div');
			ldiv.className = 'geToolbarContainer';

			ldiv.style.overflow = 'hidden';
			ldiv.style.position = 'relative';
			ldiv.style.padding = '4px';
			ldiv.style.height = '30px'; //图层里面的每行的高度
			ldiv.style.display = 'block';
			ldiv.style.backgroundColor = (Dialog.backdropColor == 'white') ? 'whiteSmoke' : 'whiteSmoke';//Dialog.backdropColor;
			ldiv.style.borderWidth = '0px 0px 1px 0px';
			ldiv.style.borderColor = '#c3c3c3';
			ldiv.style.borderStyle = 'solid';
			ldiv.style.whiteSpace = 'nowrap';
			ldiv.setAttribute('title', label);

			var left = document.createElement('div');
			left.style.display = 'inline-block';
			left.style.width = '100%';
			left.style.textOverflow = 'ellipsis';
			left.style.overflow = 'hidden';

			mxEvent.addListener(ldiv, 'dragover', function (evt) {
				evt.dataTransfer.dropEffect = 'move';
				dropIndex = index;
				evt.stopPropagation();
				evt.preventDefault();
			});

			mxEvent.addListener(ldiv, 'dragstart', function (evt) {
				dragSource = ldiv;

				// Workaround for no DnD on DIV in FF
				if (mxClient.IS_FF) {
					// LATER: Check what triggers a parse as XML on this in FF after drop
					evt.dataTransfer.setData('Text', '<layer/>');
				}
			});

			mxEvent.addListener(ldiv, 'dragend', function (evt) {
				if (dragSource != null && dropIndex != null) {
					graph.addCell(child, graph.model.root, dropIndex);
				}

				dragSource = null;
				dropIndex = null;
				evt.stopPropagation();
				evt.preventDefault();
			});

			var btn = document.createElement('img');
			btn.setAttribute('draggable', 'false');
			btn.setAttribute('align', 'top');
			btn.setAttribute('border', '0');
			btn.style.padding = '4px';
			btn.setAttribute('title', mxResources.get('lockUnlock'));

			var style = graph.getCurrentCellStyle(child);

			if (mxUtils.getValue(style, 'locked', '0') == '1') {
				btn.setAttribute('src', Dialog.prototype.lockedImage);
			} else {
				btn.setAttribute('src', Dialog.prototype.unlockedImage);
			}

			if (graph.isEnabled()) {
				btn.style.cursor = 'pointer';
			}

      // 图层上锁
			mxEvent.addListener(btn, 'click', function (evt) {
        // console.log("图层上锁")
				if (graph.isEnabled()) {
					var value = null;
					graph.getModel().beginUpdate();
					try {
						value = (mxUtils.getValue(style, 'locked', '0') == '1') ? null : '1';
						graph.setCellStyles('locked', value, [child]);
					} finally {
						graph.getModel().endUpdate();
					}
					if (value == '1') {
						graph.removeSelectionCells(graph.getModel().getDescendants(child));
					}
					mxEvent.consume(evt);
				}
			});

			left.appendChild(btn);

			var inp = document.createElement('input');
			inp.setAttribute('type', 'checkbox');

			inp.setAttribute('title', mxResources.get('hideIt', [child.value || mxResources.get('background')]));
			inp.style.marginLeft = '4px';
			inp.style.marginRight = '6px';
			inp.style.marginTop = '4px';
			left.appendChild(inp);

			if (graph.model.isVisible(child)) {
				inp.setAttribute('checked', 'checked');
				inp.defaultChecked = true;
			}

      // 当前的选中项
			mxEvent.addListener(inp, 'click', function (evt) {
        // console.log("选中的项", evt)
        console.log("选中的图层", child)
				graph.model.setVisible(child, !graph.model.isVisible(child));
				mxEvent.consume(evt);
			});

			mxUtils.write(left, label);
			ldiv.appendChild(left);

			if (graph.isEnabled()) {
				// Fallback if no drag and drop is available
				if (mxClient.IS_TOUCH || mxClient.IS_POINTER || mxClient.IS_VML ||
					(mxClient.IS_IE && document.documentMode < 10)) {
					var right = document.createElement('div');
					right.style.display = 'block';
					right.style.textAlign = 'right';
					right.style.whiteSpace = 'nowrap';
					right.style.position = 'absolute';
					right.style.right = '6px';
					right.style.top = '6px';

					// Poor man's change layer order
					if (index > 0) {
						var img2 = document.createElement('a');

						img2.setAttribute('title', mxResources.get('toBack'));

						img2.className = 'geButton';
						img2.style.cssFloat = 'none';
						img2.innerHTML = '&#9660;';
						img2.style.width = '14px';
						img2.style.height = '14px';
						img2.style.fontSize = '14px';
						img2.style.margin = '0px';
						img2.style.marginTop = '-1px';
						right.appendChild(img2);

            // 图层下移
						mxEvent.addListener(img2, 'click', function (evt) {
              // console.log("图层下移")
							if (graph.isEnabled()) {
								graph.addCell(child, graph.model.root, index - 1);
							}
							mxEvent.consume(evt);
						});
					}

					if (index >= 0 && index < layerCount - 1) {
						var img1 = document.createElement('a');

						img1.setAttribute('title', mxResources.get('toFront'));

						img1.className = 'geButton';
						img1.style.cssFloat = 'none';
						img1.innerHTML = '&#9650;';
						img1.style.width = '14px';
						img1.style.height = '14px';
						img1.style.fontSize = '14px';
						img1.style.margin = '0px';
						img1.style.marginTop = '-1px';
						right.appendChild(img1);

            // 图层上移
						mxEvent.addListener(img1, 'click', function (evt) {
              // console.log("图层上移")
							if (graph.isEnabled()) {
								graph.addCell(child, graph.model.root, index + 1);
							}
							mxEvent.consume(evt);
						});
					}
					ldiv.appendChild(right);
				}

				if (mxClient.IS_SVG && (!mxClient.IS_IE || document.documentMode >= 10)) {
					ldiv.setAttribute('draggable', 'true');
					ldiv.style.cursor = 'move';
				}
			}
      // 双击图层name
			mxEvent.addListener(ldiv, 'dblclick', function (evt) {
        // console.log("双击图层name")
				var nodeName = mxEvent.getSource(evt).nodeName;
				if (nodeName != 'INPUT' && nodeName != 'IMG') {
					renameLayer(child);
					mxEvent.consume(evt);
				}
			});

			if (graph.getDefaultParent() == child) {
				ldiv.style.background = (Dialog.backdropColor == 'white') ? '#e6eff8' : '#e6eff8'; //'#505759';
				ldiv.style.fontWeight = (graph.isEnabled()) ? 'bold' : '';
				selectionLayer = child;
			} else {
        // 选中本行的图层
				mxEvent.addListener(ldiv, 'click', function (evt) {
          console.log("选中本行的图层", ldiv)
					if (graph.isEnabled()) {
						graph.setDefaultParent(defaultParent);
						graph.view.setCurrentRoot(null);
					}
				});
			}
			listDiv.appendChild(ldiv);
		};

		// Cannot be moved or deleted
		for (var i = layerCount - 1; i >= 0; i--) {
			(mxUtils.bind(this, function (child) {
				addLayer(i, graph.convertValueToString(child) ||
					mxResources.get('background'), child, child);
			}))(graph.model.getChildAt(graph.model.root, i));
		}

		var label = graph.convertValueToString(selectionLayer) || mxResources.get('background');
		removeLink.setAttribute('title', mxResources.get('removeIt', [label]));
		duplicateLink.setAttribute('title', mxResources.get('duplicateIt', [label]));
		dataLink.setAttribute('title', mxResources.get('editData'));

		if (graph.isSelectionEmpty()) {
			insertLink.className = 'geButton mxDisabled';
		}
	};

	refresh();
	graph.model.addListener(mxEvent.CHANGE, refresh);
	graph.addListener('defaultParentChanged', refresh);

	graph.selectionModel.addListener(mxEvent.CHANGE, function () {
		if (graph.isSelectionEmpty()) {
			insertLink.className = 'geButton mxDisabled';
		} else {
			insertLink.className = 'geButton';
		}
	});

	this.window = new mxWindow(mxResources.get('layers'), div, x, y, w, h, true, true);
	this.window.minimumSize = new mxRectangle(0, 0, 120, 120);
	this.window.destroyOnClose = false;
	this.window.setMaximizable(false);
	this.window.setResizable(true);
	this.window.setClosable(true);
	this.window.setVisible(true);

	this.init = function () {
		listDiv.scrollTop = listDiv.scrollHeight - listDiv.clientHeight;
	};

	this.window.addListener(mxEvent.SHOW, mxUtils.bind(this, function () {
		this.window.fit();
	}));

	// Make refresh available via instance
  // 通过实例使刷新可用
	this.refreshLayers = refresh;

	this.window.setLocation = function (x, y) {
		var iw = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
		var ih = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight;

		x = Math.max(0, Math.min(x, iw - this.table.clientWidth));
		y = Math.max(0, Math.min(y, ih - this.table.clientHeight - 48));

		if (this.getX() != x || this.getY() != y) {
			mxWindow.prototype.setLocation.apply(this, arguments);
		}
	};

	// var resizeListener = mxUtils.bind(this, function () {
	// 	var x = this.window.getX();
	// 	var y = this.window.getY();

	// 	this.window.setLocation(x, y);
	// });

	// mxEvent.addListener(window, 'resize', resizeListener);

	// this.destroy = function () {
	// 	mxEvent.removeListener(window, 'resize', resizeListener);
	// 	this.window.destroy();
	// }
};




/**
 * Constructs a new dialog for creating files from templates.  新加
 */
var LibraryDialog = function (editorUi, name, library, initialImages, file, mode) {

  // console.log(editorUi,"editorUi:");
  var images = [];
  var graph = editorUi.editor.graph;
  var outer = document.createElement('div');
  outer.style.height = '100%';

  var header = document.createElement('div');
  header.style.whiteSpace = 'nowrap';
  header.style.height = '40px';
  outer.appendChild(header);

  mxUtils.write(header, mxResources.get('filename') + ':');

  var nameValue = name;

  if (nameValue == null) {
    nameValue = editorUi.defaultLibraryName + '.xml';
  }

  var nameInput = document.createElement('input');
  nameInput.setAttribute('value', nameValue);
  nameInput.style.marginRight = '20px';
  nameInput.style.marginLeft = '10px';
  nameInput.style.width = '500px';

  if (file != null && !file.isRenamable()) {
    nameInput.setAttribute('disabled', 'true');
  }

  this.init = function () {
    if (file == null || file.isRenamable()) {
      nameInput.focus();

      if (mxClient.IS_GC || mxClient.IS_FF || document.documentMode >= 5 || mxClient.IS_QUIRKS) {
        nameInput.select();
      } else {
        document.execCommand('selectAll', false, null);
      }
    }
  };

  header.appendChild(nameInput);

  var div = document.createElement('div');
  div.style.borderWidth = '1px 0px 1px 0px';
  div.style.borderColor = '#d3d3d3';
  div.style.borderStyle = 'solid';
  div.style.marginTop = '6px';
  div.style.overflow = 'auto';
  div.style.height = '340px';
  div.style.backgroundPosition = 'center center';
  div.style.backgroundRepeat = 'no-repeat';

  if (images.length == 0 && Graph.fileSupport) {
    div.style.backgroundImage = 'url(\'' + IMAGE_PATH + '/droptarget.png\')';
  }

  var bg = document.createElement('div');
  bg.style.position = 'absolute';
  bg.style.width = '640px';
  bg.style.top = '260px';
  bg.style.textAlign = 'center';
  bg.style.fontSize = '22px';
  bg.style.color = '#a0c3ff';
  mxUtils.write(bg, mxResources.get('dragImagesHere'));
  outer.appendChild(bg);

  var entries = {};
  var ew = 100;
  var eh = 100;

  var dragSourceIndex = null;
  var dropTargetIndex = null;

  function getIndexForEvent(evt) {
    var dropTarget = document.elementFromPoint(evt.clientX, evt.clientY);

    while (dropTarget != null && dropTarget.parentNode != div) {
      dropTarget = dropTarget.parentNode;
    }

    var result = null;

    if (dropTarget != null) {
      var tmp = div.firstChild;
      result = 0;

      while (tmp != null && tmp != dropTarget) {
        tmp = tmp.nextSibling;
        result++;
      }
    }

    return result;
  };

  var stopEditing = null;
  var stopWrapper = function (evt) {
    var source = mxEvent.getSource(evt);

    if (source.getAttribute('contentEditable') != 'true' && stopEditing != null) {
      stopEditing();
      stopEditing = null;
      mxEvent.consume(evt);
    }
  };

  mxEvent.addListener(div, 'mousedown', stopWrapper);
  mxEvent.addListener(div, 'pointerdown', stopWrapper);
  mxEvent.addListener(div, 'touchstart', stopWrapper);

  // For converting image URLs
  var converter = new mxUrlConverter();
  var errorShowed = false;

  function addButton(data, mimeType, x, y, w, h, img, aspect, title) {
    // console.log(data, mimeType, x, y, w, h, img, aspect, title);
    // Ignores duplicates
    try {
      editorUi.spinner.stop();

      if (mimeType == null || mimeType.substring(0, 6) == 'image/') {
        if ((data == null && img != null) || entries[data] == null) {
          div.style.backgroundImage = '';
          bg.style.display = 'none';
          var iw = w;
          var ih = h;
          if (w > editorUi.maxImageSize || h > editorUi.maxImageSize) {
            var s = Math.min(1, Math.min(editorUi.maxImageSize / Math.max(1, w)),
              editorUi.maxImageSize / Math.max(1, h));
            w *= s;
            h *= s;
          }
          if (iw > ih) {
            ih = Math.round(ih * ew / iw);
            iw = ew;
          } else {
            iw = Math.round(iw * eh / ih);
            ih = eh;
          }
          var wrapper = document.createElement('div');
          wrapper.setAttribute('draggable', 'true');
          wrapper.style.display = (mxClient.IS_QUIRKS) ? 'inline' : 'inline-block';
          wrapper.style.position = 'relative';
          wrapper.style.cursor = 'move';
          mxUtils.setPrefixedStyle(wrapper.style, 'transition', 'transform .1s ease-in-out');

          if (data != null) {
            //如果素材导入时-图片的信息
            var elt = document.createElement('img');
            elt.setAttribute('src', converter.convert(data));
            elt.style.width = iw + 'px';
            elt.style.height = ih + 'px';
            elt.style.margin = '10px';

            elt.style.paddingBottom = Math.floor((eh - ih) / 2) + 'px';
            elt.style.paddingLeft = Math.floor((ew - iw) / 2) + 'px';

            // console.log('素材导入时-图片的信息:',elt);
            wrapper.appendChild(elt);

          } else if (img != null) {
            //导入的是 svg 绘制的形状

            console.log("img:", img);
            var cells = editorUi.stringToCells(Graph.decompress(img.xml));

            if (cells.length > 0) {

              //库里面有手动绘制的

              console.log("cells:", cells);

              editorUi.sidebar.createThumb(cells, ew, eh, wrapper, null, true, false);
              // Needs inline block on SVG for delete icon to appear on same line
              wrapper.firstChild.style.display = (mxClient.IS_QUIRKS) ? 'inline' : 'inline-block';
              wrapper.firstChild.style.cursor = '';
            }
          }
          var rem = document.createElement('img');
          rem.setAttribute('src', Editor.closeImage);
          rem.setAttribute('border', '0');
          rem.setAttribute('title', mxResources.get('delete'));
          rem.setAttribute('align', 'top');
          rem.style.paddingTop = '4px';
          rem.style.position = 'absolute';
          rem.style.marginLeft = '-12px';
          rem.style.zIndex = '1';
          rem.style.cursor = 'pointer';

          // Blocks dragging of remove icon
          mxEvent.addListener(rem, 'dragstart', function (evt) {
            mxEvent.consume(evt);
          });

          (function (wrapperDiv, dataParam, imgParam) {
            mxEvent.addListener(rem, 'click', function (evt) {
              entries[dataParam] = null;

              for (var i = 0; i < images.length; i++) {
                if ((images[i].data != null && images[i].data == dataParam) ||
                  (images[i].xml != null && imgParam != null &&
                    images[i].xml == imgParam.xml)) {
                  images.splice(i, 1);
                  break;
                }
              }
              wrapper.parentNode.removeChild(wrapperDiv);
              if (images.length == 0) {
                div.style.backgroundImage = 'url(\'' + IMAGE_PATH + '/droptarget.png\')';
                bg.style.display = '';
              }
              mxEvent.consume(evt);
            });
            // Workaround for accidental select all
            mxEvent.addListener(rem, 'dblclick', function (evt) {
              mxEvent.consume(evt);
            });
          })(wrapper, data, img);

          wrapper.appendChild(rem);
          wrapper.style.marginBottom = '30px';
          var label = document.createElement('div');
          label.style.position = 'absolute';
          label.style.boxSizing = 'border-box';
          label.style.bottom = '-18px';
          label.style.left = '10px';
          label.style.right = '10px';
          label.style.backgroundColor = '#ffffff';
          label.style.overflow = 'hidden';
          label.style.textAlign = 'center';
          var entry = null;
          if (data != null) {
            entry = {
              data: data,
              w: w,
              h: h,
              title: title
            };

            if (aspect != null) {
              entry.aspect = aspect;
            }

            entries[data] = elt;
            images.push(entry);
          } else if (img != null) {
            img.aspect = 'fixed';
            images.push(img);
            entry = img;
          }

          function updateLabel() {
            label.innerHTML = '';
            label.style.cursor = 'pointer';
            label.style.whiteSpace = 'nowrap';
            label.style.textOverflow = 'ellipsis';
            mxUtils.write(label, (entry.title != null && entry.title.length > 0) ?
              entry.title : mxResources.get('untitled'));

            if (entry.title == null || entry.title.length == 0) {
              label.style.color = '#d0d0d0';
            } else {
              label.style.color = '';
            }
          };

          mxEvent.addListener(label, 'keydown', function (evt) {
            if (evt.keyCode == 13 && stopEditing != null) {
              stopEditing();
              stopEditing = null;
              mxEvent.consume(evt);
            }
          });

          updateLabel();
          wrapper.appendChild(label);

          // Blocks dragging of label
          mxEvent.addListener(label, 'mousedown', function (evt) {
            if (label.getAttribute('contentEditable') != 'true') {
              mxEvent.consume(evt);
            }
          });

          var startEditing = function (evt) {
            // Workaround for various issues in IE
            if (!mxClient.IS_IOS && !mxClient.IS_QUIRKS && !mxClient.IS_FF &&
              (document.documentMode == null || document.documentMode > 9)) {
              if (label.getAttribute('contentEditable') != 'true') {
                if (stopEditing != null) {
                  stopEditing();
                  stopEditing = null;
                }

                if (entry.title == null || entry.title.length == 0) {
                  label.innerHTML = '';
                }

                label.style.textOverflow = '';
                label.style.whiteSpace = '';
                label.style.cursor = 'text';
                label.style.color = '';
                label.setAttribute('contentEditable', 'true');
                mxUtils.setPrefixedStyle(label.style, 'user-select', 'text');
                label.focus();
                document.execCommand('selectAll', false, null);

                stopEditing = function () {
                  label.removeAttribute('contentEditable');
                  label.style.cursor = 'pointer';
                  entry.title = label.innerHTML;
                  updateLabel();
                }
                mxEvent.consume(evt);
              }
            } else {
              var dlg = new FilenameDialog(editorUi, entry.title || '', mxResources.get('ok'), function (newTitle) {
                if (newTitle != null) {
                  entry.title = newTitle;
                  updateLabel();
                }
              }, mxResources.get('enterValue'));
              editorUi.showDialog(dlg.container, 300, 80, true, true);
              dlg.init();
              mxEvent.consume(evt);
            }
          };

          mxEvent.addListener(label, 'click', startEditing);
          mxEvent.addListener(wrapper, 'dblclick', startEditing);

          div.appendChild(wrapper);

          mxEvent.addListener(wrapper, 'dragstart', function (evt) {
            if (data == null && img != null) {
              rem.style.visibility = 'hidden';
              label.style.visibility = 'hidden';
            }

            // Workaround for no DnD on DIV in FF
            if (mxClient.IS_FF && img.xml != null) {
              evt.dataTransfer.setData('Text', img.xml);
            }

            dragSourceIndex = getIndexForEvent(evt);

            // Workaround for missing drag preview in Google Chrome
            if (mxClient.IS_GC) {
              wrapper.style.opacity = '0.9';
            }

            window.setTimeout(function () {
              mxUtils.setPrefixedStyle(wrapper.style, 'transform', 'scale(0.5,0.5)');
              mxUtils.setOpacity(wrapper, 30);
              rem.style.visibility = '';
              label.style.visibility = '';
            }, 0);
          });

          mxEvent.addListener(wrapper, 'dragend', function (evt) {
            if (rem.style.visibility == 'hidden') {
              rem.style.visibility = '';
              label.style.visibility = '';
            }

            dragSourceIndex = null;
            mxUtils.setOpacity(wrapper, 100);
            mxUtils.setPrefixedStyle(wrapper.style, 'transform', null);
          });
        } else if (!errorShowed) {
          errorShowed = true;
          editorUi.handleError({
            message: mxResources.get('fileExists')
          })
        }
      } else {
        var done = false;

        try {
          var doc = mxUtils.parseXml(data);

          if (doc.documentElement.nodeName == 'mxlibrary') {
            var temp = JSON.parse(mxUtils.getTextContent(doc.documentElement));

            if (temp != null && temp.length > 0) {
              for (var i = 0; i < temp.length; i++) {
                if (temp[i].xml != null) {
                  addButton(null, null, 0, 0, 0, 0, temp[i]);
                } else {
                  addButton(temp[i].data, null, 0, 0, temp[i].w, temp[i].h, null, 'fixed', temp[i].title);
                }
              }
            }

            done = true;
          } else if (doc.documentElement.nodeName == 'mxfile') {
            var pages = doc.documentElement.getElementsByTagName('diagram');

            for (var i = 0; i < pages.length; i++) {
              var temp = mxUtils.getTextContent(pages[i]);
              var cells = editorUi.stringToCells(Graph.decompress(temp));
              var size = editorUi.editor.graph.getBoundingBoxFromGeometry(cells);
              addButton(null, null, 0, 0, 0, 0, {
                xml: temp,
                w: size.width,
                h: size.height
              });
            }

            done = true;
          }
        } catch (e) {
          // ignore
        }

        if (!done) {
          editorUi.spinner.stop();
          editorUi.handleError({
            message: mxResources.get('errorLoadingFile')
          })
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  // 数组里面: xml："<mxGraphModel><mxGraphModel/>"是正确的格式
  console.log('素材库弹层打开后的数组', initialImages);

  if (initialImages != null) {

    for (var i = 0; i < initialImages.length; i++) {

      var img = initialImages[i];

      console.log("img:", img, img.data);
      //img.data ?
      addButton(img.data, null, 0, 0, img.w, img.h, img, img.aspect, img.title);
    }
  }

  // Setup the dnd listeners
  mxEvent.addListener(div, 'dragleave', function (evt) {

    bg.style.cursor = '';
    var source = mxEvent.getSource(evt);

    while (source != null) {
      if (source == div || source == bg) {
        evt.stopPropagation();
        evt.preventDefault();
        break;
      }
      source = source.parentNode;
    }
  });

  function dragOver(evt) {
    evt.dataTransfer.dropEffect = (dragSourceIndex != null) ? 'move' : 'copy';
    evt.stopPropagation();
    evt.preventDefault();
  };

  var createImportHandler = function (evt) {
    return function (data, mimeType, x, y, w, h, img, doneFn, file) {
      if (file != null && (/(\.v(dx|sdx?))($|\?)/i.test(file.name) || /(\.vs(x|sx?))($|\?)/i.test(file.name))) {
        editorUi.importVisio(file, mxUtils.bind(this, function (xml) {
          addButton(xml, mimeType, x, y, w, h, img, 'fixed', (mxEvent.isAltDown(evt)) ?
            null : img.substring(0, img.lastIndexOf('.')).replace(/_/g, ' '));
        }));
      } else if (file != null && !editorUi.isOffline() && new XMLHttpRequest().upload && editorUi.isRemoteFileFormat(data, file.name)) {
        editorUi.parseFile(file, mxUtils.bind(this, function (xhr) {
          if (xhr.readyState == 4) {
            editorUi.spinner.stop();

            if (xhr.status >= 200 && xhr.status <= 299) {
              var xml = xhr.responseText;
              addButton(xml, mimeType, x, y, w, h, img, 'fixed', (mxEvent.isAltDown(evt)) ?
                null : img.substring(0, img.lastIndexOf('.')).replace(/_/g, ' '));
              div.scrollTop = div.scrollHeight;
            }
          }
        }));
      } else {
        addButton(data, mimeType, x, y, w, h, img, 'fixed', (mxEvent.isAltDown(evt)) ?
          null : img.substring(0, img.lastIndexOf('.')).replace(/_/g, ' '));
        div.scrollTop = div.scrollHeight;
      }
    };
  };

  function dropHandler(evt) {

    evt.stopPropagation();
    evt.preventDefault();
    errorShowed = false;
    dropTargetIndex = getIndexForEvent(evt);

    if (dragSourceIndex != null) {
      if (dropTargetIndex != null && dropTargetIndex < div.children.length) {
        images.splice((dropTargetIndex > dragSourceIndex) ? dropTargetIndex - 1 : dropTargetIndex,
          0, images.splice(dragSourceIndex, 1)[0]);
        div.insertBefore(div.children[dragSourceIndex], div.children[dropTargetIndex]);
      } else {
        images.push(images.splice(dragSourceIndex, 1)[0]);
        div.appendChild(div.children[dragSourceIndex]);
      }
    } else if (evt.dataTransfer.files.length > 0) {

      editorUi.importFiles(evt.dataTransfer.files, 0, 0, editorUi.maxImageSize, createImportHandler(evt));

    } else if (mxUtils.indexOf(evt.dataTransfer.types, 'text/uri-list') >= 0) {
      var uri = decodeURIComponent(evt.dataTransfer.getData('text/uri-list'));

      if (/(\.jpg)($|\?)/i.test(uri) || /(\.png)($|\?)/i.test(uri) ||
        /(\.gif)($|\?)/i.test(uri) || /(\.svg)($|\?)/i.test(uri)) {
        editorUi.loadImage(uri, function (img) {
          addButton(uri, null, 0, 0, img.width, img.height);
          div.scrollTop = div.scrollHeight;
        });
      }
    }

    evt.stopPropagation();
    evt.preventDefault();
  };

  mxEvent.addListener(div, 'dragover', dragOver);
  mxEvent.addListener(div, 'drop', dropHandler);
  mxEvent.addListener(bg, 'dragover', dragOver);
  mxEvent.addListener(bg, 'drop', dropHandler);

  outer.appendChild(div);

  var btns = document.createElement('div');
  btns.style.textAlign = 'right';
  btns.style.marginTop = '20px';

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    editorUi.hideDialog(true);
  });

  cancelBtn.setAttribute('id', 'btnCancel');
  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  var btn = mxUtils.button(mxResources.get('export'), function () {
    var data = editorUi.createLibraryDataFromImages(images);
    var filename = nameInput.value;

    if (!/(\.xml)$/i.test(filename)) {
      filename += '.xml';
    }
    //素材库导出xml文件
    if (editorUi.isLocalFileSave()) {
      //本地导出xml文件
      editorUi.saveLocalFile(data, filename, 'text/xml', null, null, true);
    } else {
      //请求接口导出xml文件
      new mxXmlRequest(SAVE_URL, 'filename=' + encodeURIComponent(filename) +
        '&format=xml&xml=' + encodeURIComponent(data)).simulate(document, '_blank');
    }
  });

  btn.setAttribute('id', 'btnDownload');
  btn.className = 'geBtn';
  btns.appendChild(btn);

  if (Graph.fileSupport) {
    if (editorUi.libDlgFileInputElt == null) {
      var fileInput = document.createElement('input');
      fileInput.setAttribute('multiple', 'multiple');
      fileInput.setAttribute('type', 'file');

      mxEvent.addListener(fileInput, 'change', function (evt) {
        errorShowed = false;
        editorUi.importFiles(fileInput.files, 0, 0, editorUi.maxImageSize, function (data, mimeType, x, y, w, h, img, doneFn, file) {
          if (fileInput.files != null) {
            createImportHandler(evt)(data, mimeType, x, y, w, h, img, doneFn, file);

            // Resets input to force change event for same file (type reset required for IE)
            fileInput.type = '';
            fileInput.type = 'file';
            fileInput.value = '';
          }
        });

        div.scrollTop = div.scrollHeight;
      });

      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      editorUi.libDlgFileInputElt = fileInput;
    }

    var btn = mxUtils.button(mxResources.get('import'), function () {
      //素材 导入
      // console.log("import000000");

      if (stopEditing != null) {
        stopEditing();
        stopEditing = null;
      }

      editorUi.libDlgFileInputElt.click();
    });
    btn.setAttribute('id', 'btnAddImage');
    btn.className = 'geBtn';

    btns.appendChild(btn);
  }

  var btn = mxUtils.button(mxResources.get('addImageUrl'), function () {
    if (stopEditing != null) {
      stopEditing();
      stopEditing = null;
    }

    editorUi.showImageDialog(mxResources.get('addImageUrl'), '', function (url, w, h) {
      errorShowed = false;
      if (url != null) {
        // Image dialog returns modified data URLs which
        // must be converted back to real data URL
        if (url.substring(0, 11) == 'data:image/') {
          var comma = url.indexOf(',');

          if (comma > 0) {
            url = url.substring(0, comma) + ';base64,' + url.substring(comma + 1);
          }
        }

        addButton(url, null, 0, 0, w, h);
        div.scrollTop = div.scrollHeight;
      }
    });
  });

  btn.setAttribute('id', 'btnAddImageUrl');
  btn.className = 'geBtn';
  btns.appendChild(btn);

  // Indirection for overriding
  this.saveBtnClickHandler = function (name, images, file, mode) {

    editorUi.saveLibrary2(name, images, file, mode); //保存方法 saveLibrary2
  };

  var btn = mxUtils.button(mxResources.get('save'), mxUtils.bind(this, function () {
    if (stopEditing != null) {
      stopEditing();
      stopEditing = null;
    }
    this.saveBtnClickHandler(nameInput.value, images, file, mode);
  }));

  btn.setAttribute('id', 'btnSave');
  btn.className = 'geBtn gePrimaryBtn';
  btns.appendChild(btn);

  if (!editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  outer.appendChild(btns);

  this.container = outer;
};

/**
 * Constructs a new textarea dialog.
 */
var EditShapeDialog = function (editorUi, cell, title, w, h) {
	w = (w != null) ? w : 300;
	h = (h != null) ? h : 120;
	var row, td;

	var table = document.createElement('table');
	var tbody = document.createElement('tbody');
	table.style.cellPadding = '4px';

	row = document.createElement('tr');

	td = document.createElement('td');
	td.setAttribute('colspan', '2');
	td.style.fontSize = '10pt';
	mxUtils.write(td, title);

	row.appendChild(td);
	tbody.appendChild(row);

	row = document.createElement('tr');
	td = document.createElement('td');

	var nameInput = document.createElement('textarea');
	nameInput.style.outline = 'none';
	nameInput.style.resize = 'none';
	nameInput.style.width = (w - 200) + 'px';
	nameInput.style.height = h + 'px';

	this.textarea = nameInput;

	this.init = function () {
		nameInput.focus();
		nameInput.scrollTop = 0;
	};

	td.appendChild(nameInput);
	row.appendChild(td);

	td = document.createElement('td');

	var container = document.createElement('div');
	container.style.position = 'relative';
	container.style.border = '1px solid gray';
	container.style.top = '6px';
	container.style.width = '200px';
	container.style.height = (h + 4) + 'px';
	container.style.overflow = 'hidden';
	container.style.marginBottom = '16px';
	mxEvent.disableContextMenu(container);
	td.appendChild(container);

	var graph = new Graph(container);
	graph.setEnabled(false);

	var clone = editorUi.editor.graph.cloneCell(cell);
	graph.addCells([clone]);

	var state = graph.view.getState(clone);
	var stencil = '';

	if (state.shape != null && state.shape.stencil != null) {
		stencil = mxUtils.getPrettyXml(state.shape.stencil.desc);
	}

	mxUtils.write(nameInput, stencil || '');

	var b = graph.getGraphBounds();
	var ns = Math.min((200 - 40) / b.width, (h - 40) / b.height);
	graph.view.scaleAndTranslate(ns, 20 / ns - b.x, 20 / ns - b.y);

	row.appendChild(td);
	tbody.appendChild(row);

	row = document.createElement('tr');
	td = document.createElement('td');
	td.setAttribute('colspan', '2');
	td.style.paddingTop = '2px';
	td.style.whiteSpace = 'nowrap';
  td.setAttribute('align', 'right');

  //帮助不用显示
	if (!editorUi.isOffline()) {
		var helpBtn = mxUtils.button(mxResources.get('help'), function () {
			editorUi.openLink('https://desk.draw.io/support/solutions/articles/16000052874');
		});

		helpBtn.className = 'geBtn';
		td.appendChild(helpBtn);
	}

	var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
		editorUi.hideDialog();
	});
	cancelBtn.className = 'geBtn';

	if (editorUi.editor.cancelFirst) {
		td.appendChild(cancelBtn);
  }

	var updateShape = function (targetGraph, targetCell, hide) {
    var newValue = nameInput.value;
		// Checks if XML has changed (getPrettyXml "normalizes" DOM)
		var doc = mxUtils.parseXml(newValue);
		newValue = mxUtils.getPrettyXml(doc.documentElement);

		// Checks for validation errors
		// LATER: Validate against XSD
		var errors = doc.documentElement.getElementsByTagName('parsererror');

		if (errors != null && errors.length > 0) {
			editorUi.showError(mxResources.get('error'), mxResources.get('containsValidationErrors'), mxResources.get('ok'));
		} else {
			if (hide) {
				editorUi.hideDialog();
			}

			var isNew = !targetGraph.model.contains(targetCell);

			if (!hide || isNew || newValue != stencil) {
				// Transform XML value to be used in cell style
				newValue = Graph.compress(newValue);

				targetGraph.getModel().beginUpdate();
				try {
					// Inserts cell if required
					if (isNew) {
						var pt = editorUi.editor.graph.getFreeInsertPoint();
						targetCell.geometry.x = pt.x;
						targetCell.geometry.y = pt.y;
						targetGraph.addCell(targetCell)
					}
					targetGraph.setCellStyles(mxConstants.STYLE_SHAPE, 'stencil(' + newValue + ')', [targetCell]);
				} catch (e) {
					throw e;
				} finally {
					// Updates the display
					targetGraph.getModel().endUpdate();
				}

				// Updates selection after stencil was created for rendering
				if (isNew) {
					targetGraph.setSelectionCell(targetCell);
					targetGraph.scrollCellToVisible(targetCell);
				}
			}
		}
	};

	var previewBtn = mxUtils.button(mxResources.get('preview'), function () {
		updateShape(graph, clone, false);
	});

	previewBtn.className = 'geBtn';
	td.appendChild(previewBtn);

	var applyBtn = mxUtils.button(mxResources.get('apply'), function () {
		updateShape(editorUi.editor.graph, cell, true);
	});

	applyBtn.className = 'geBtn gePrimaryBtn';
	td.appendChild(applyBtn);

	if (!editorUi.editor.cancelFirst) {
		td.appendChild(cancelBtn);
	}

	row.appendChild(td);
	tbody.appendChild(row);
	table.appendChild(tbody);
	this.container = table;
};

/**
 * Constructs a dialog for creating new files from a template URL.
 * Also used for dialog choosing where to save or export resources
 */
var CreateDialog = function (editorUi, title, createFn, cancelFn, dlgTitle, btnLabel, overrideExtension, allowBrowser,
  allowTab, helpLink, showDeviceButton, rowLimit, data, mimeType, base64Encoded, hints, hideDialog) {
  overrideExtension = (overrideExtension != null) ? overrideExtension : true;
  allowBrowser = (allowBrowser != null) ? allowBrowser : true;
  rowLimit = (rowLimit != null) ? rowLimit : 4;
  hideDialog = (hideDialog != null) ? hideDialog : true;

  var div = document.createElement('div');
  div.style.whiteSpace = 'nowrap';
  var showButtons = true;
  if (cancelFn == null) {
    editorUi.addLanguageMenu(div);
  }

  var h3 = document.createElement('h2');
  mxUtils.write(h3, dlgTitle || mxResources.get('create'));
  h3.style.marginTop = '0px';
  h3.style.marginBottom = '24px';
  div.appendChild(h3);
  mxUtils.write(div, mxResources.get('filename') + ':');

  var nameInput = document.createElement('input');
  nameInput.setAttribute('value', title);
  nameInput.style.width = '200px';
  nameInput.style.marginLeft = '10px';
  nameInput.style.marginBottom = '20px';
  nameInput.style.maxWidth = '70%';

  this.init = function () {
    nameInput.focus();

    if (mxClient.IS_GC || mxClient.IS_FF || document.documentMode >= 5 || mxClient.IS_QUIRKS) {
      nameInput.select();
    } else {
      document.execCommand('selectAll', false, null);
    }
  };
  div.appendChild(nameInput);
  if (hints != null) {
    if (editorUi.editor.diagramFileTypes != null) {
      var typeSelect = FilenameDialog.createFileTypes(editorUi, nameInput, editorUi.editor.diagramFileTypes);
      typeSelect.style.marginLeft = '6px';
      typeSelect.style.width = '80px';
      div.appendChild(typeSelect);
    }

    div.appendChild(FilenameDialog.createTypeHint(editorUi, nameInput, hints));
  }

  // Disables SVG preview if SVG is not supported in browser
  if (data != null && mimeType != null && (mimeType.substring(0, 6) == 'image/' &&
      (mimeType.substring(0, 9) != 'image/svg' || mxClient.IS_SVG))) {
    nameInput.style.width = '160px';
    var preview = document.createElement('img');
    var temp = (base64Encoded) ? data : btoa(unescape(encodeURIComponent(data)));
    preview.setAttribute('src', 'data:' + mimeType + ';base64,' + temp);
    preview.style.position = 'absolute';
    preview.style.top = '70px';
    preview.style.right = '100px';
    preview.style.maxWidth = '120px';
    preview.style.maxHeight = '80px';
    mxUtils.setPrefixedStyle(preview.style, 'transform',
      'translate(50%,-50%)');
    div.appendChild(preview);

    if (allowTab && Editor.popupsAllowed) {
      preview.style.cursor = 'pointer';

      mxEvent.addGestureListeners(preview, null, null, function () {
        create('_blank');
      });
    }
  }
  mxUtils.br(div);
  var buttons = document.createElement('div');
  buttons.style.textAlign = 'center';
  var count = 0;

  function addLogo(img, title, mode, clientName) {
    var button = document.createElement('a');
    button.style.overflow = 'hidden';

    var logo = document.createElement('img');
    logo.src = img;
    logo.setAttribute('border', '0');
    logo.setAttribute('align', 'absmiddle');
    logo.style.width = '60px';
    logo.style.height = '60px';
    logo.style.paddingBottom = '6px';
    button.style.display = (mxClient.IS_QUIRKS) ? 'inline' : 'inline-block';
    button.className = 'geBaseButton';
    button.style.position = 'relative';
    button.style.margin = '4px';
    button.style.padding = '8px 8px 10px 8px';
    button.style.whiteSpace = 'nowrap';
    button.appendChild(logo);

    // Workaround for quirks is a vertical list (limited to max 2 items)
    if (mxClient.IS_QUIRKS) {
      button.style.cssFloat = 'left';
      button.style.zoom = '1';
    }
    button.style.color = 'gray';
    button.style.fontSize = '11px';

    var label = document.createElement('div');
    button.appendChild(label);
    mxUtils.write(label, title);

    function initButton() {
      mxEvent.addListener(button, 'click', function () {
        // Updates extension
        change(mode);
        create(mode);
      });
    };

    // Supports lazy loading
    if (clientName != null && editorUi[clientName] == null) {
      logo.style.visibility = 'hidden';
      mxUtils.setOpacity(label, 10);
      var size = 12;

      var spinner = new Spinner({
        lines: 12, // The number of lines to draw
        length: size, // The length of each line
        width: 5, // The line thickness
        radius: 10, // The radius of the inner circle
        rotate: 0, // The rotation offset
        color: '#000', // #rgb or #rrggbb
        speed: 1.5, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        top: '40%',
        zIndex: 2e9 // The z-index (defaults to 2000000000)
      });
      spinner.spin(button);

      // Timeout after 30 secs
      var timeout = window.setTimeout(function () {
        if (editorUi[clientName] == null) {
          spinner.stop();
          button.style.display = 'none';
        }
      }, 30000);

      editorUi.addListener('clientLoaded', mxUtils.bind(this, function () {
        if (editorUi[clientName] != null) {
          window.clearTimeout(timeout);
          mxUtils.setOpacity(label, 100);
          logo.style.visibility = '';
          spinner.stop();
          initButton();
        }
      }));
    } else {
      initButton();
    }
    buttons.appendChild(button);
    if (++count == rowLimit) {
      mxUtils.br(buttons);
      count = 0;
    }
  };

  if (!showButtons) {
    mxUtils.write(div, mxResources.get('chooseAnOption') + ':');
  } else {
    buttons.style.marginTop = '6px';
    div.appendChild(buttons);
  }

  // Adds all papersize options
  var serviceSelect = document.createElement('select');
  serviceSelect.style.marginLeft = '10px';

  if (!editorUi.isOfflineApp() && !editorUi.isOffline()) {
    if (typeof window.DriveClient === 'function') {
      var googleOption = document.createElement('option');
      googleOption.setAttribute('value', App.MODE_GOOGLE);
      mxUtils.write(googleOption, mxResources.get('googleDrive'));
      serviceSelect.appendChild(googleOption);
      addLogo(IMAGE_PATH + '/google-drive-logo.svg', mxResources.get('googleDrive'), App.MODE_GOOGLE, 'drive');
    }

    if (typeof window.OneDriveClient === 'function') {
      var oneDriveOption = document.createElement('option');
      oneDriveOption.setAttribute('value', App.MODE_ONEDRIVE);
      mxUtils.write(oneDriveOption, mxResources.get('oneDrive'));
      serviceSelect.appendChild(oneDriveOption);

      if (editorUi.mode == App.MODE_ONEDRIVE) {
        oneDriveOption.setAttribute('selected', 'selected');
      }
      addLogo(IMAGE_PATH + '/onedrive-logo.svg', mxResources.get('oneDrive'), App.MODE_ONEDRIVE, 'oneDrive');
    }

    if (typeof window.DropboxClient === 'function') {
      var dropboxOption = document.createElement('option');
      dropboxOption.setAttribute('value', App.MODE_DROPBOX);
      mxUtils.write(dropboxOption, mxResources.get('dropbox'));
      serviceSelect.appendChild(dropboxOption);

      if (editorUi.mode == App.MODE_DROPBOX) {
        dropboxOption.setAttribute('selected', 'selected');
      }
      addLogo(IMAGE_PATH + '/dropbox-logo.svg', mxResources.get('dropbox'), App.MODE_DROPBOX, 'dropbox');
    }

    if (editorUi.gitHub != null) {
      var gitHubOption = document.createElement('option');
      gitHubOption.setAttribute('value', App.MODE_GITHUB);
      mxUtils.write(gitHubOption, mxResources.get('github'));
      serviceSelect.appendChild(gitHubOption);
      addLogo(IMAGE_PATH + '/github-logo.svg', mxResources.get('github'), App.MODE_GITHUB, 'gitHub');
    }

    if (editorUi.gitLab != null) {
      var gitLabOption = document.createElement('option');
      gitLabOption.setAttribute('value', App.MODE_GITLAB);
      mxUtils.write(gitLabOption, mxResources.get('gitlab'));
      serviceSelect.appendChild(gitLabOption);
      addLogo(IMAGE_PATH + '/gitlab-logo.svg', mxResources.get('gitlab'), App.MODE_GITLAB, 'gitLab');
    }

    if (typeof window.TrelloClient === 'function') {
      var trelloOption = document.createElement('option');
      trelloOption.setAttribute('value', App.MODE_TRELLO);
      mxUtils.write(trelloOption, mxResources.get('trello'));
      serviceSelect.appendChild(trelloOption);
      addLogo(IMAGE_PATH + '/trello-logo.svg', mxResources.get('trello'), App.MODE_TRELLO, 'trello');
    }
  }

  if (!Editor.useLocalStorage || urlParams['storage'] == 'device' ||
    (editorUi.getCurrentFile() != null /* && !mxClient.IS_IOS*/ )) {
    var deviceOption = document.createElement('option');
    deviceOption.setAttribute('value', App.MODE_DEVICE);
    mxUtils.write(deviceOption, mxResources.get('device'));
    serviceSelect.appendChild(deviceOption);

    if (editorUi.mode == App.MODE_DEVICE || !allowBrowser) {
      deviceOption.setAttribute('selected', 'selected');
    }
    if (showDeviceButton) {
      addLogo(IMAGE_PATH + '/osa_drive-harddisk.png', mxResources.get('device'), App.MODE_DEVICE);
    }
  }

  if (allowBrowser && isLocalStorage && urlParams['browser'] != '0') {
    var browserOption = document.createElement('option');
    browserOption.setAttribute('value', App.MODE_BROWSER);
    mxUtils.write(browserOption, mxResources.get('browser'));
    serviceSelect.appendChild(browserOption);

    if (editorUi.mode == App.MODE_BROWSER) {
      browserOption.setAttribute('selected', 'selected');
    }
    addLogo(IMAGE_PATH + '/osa_database.png', mxResources.get('browser'), App.MODE_BROWSER);
  }

  function change(newMode) {
    if (overrideExtension) {
      var fn = nameInput.value;
      var idx = fn.lastIndexOf('.');
      if (title.lastIndexOf('.') < 0 && (!showButtons || idx < 0)) {
        newMode = (newMode != null) ? newMode : serviceSelect.value;
        var ext = '';
        if (newMode == App.MODE_GOOGLE) {
          ext = editorUi.drive.extension;
        } else if (newMode == App.MODE_GITHUB) {
          ext = editorUi.gitHub.extension;
        } else if (newMode == App.MODE_GITLAB) {
          ext = editorUi.gitLab.extension;
        } else if (newMode == App.MODE_TRELLO) {
          ext = editorUi.trello.extension;
        } else if (newMode == App.MODE_DROPBOX) {
          ext = editorUi.dropbox.extension;
        } else if (newMode == App.MODE_ONEDRIVE) {
          ext = editorUi.oneDrive.extension;
        } else if (newMode == App.MODE_DEVICE) {
          ext = '.drawio';
        }
        if (idx >= 0) {
          fn = fn.substring(0, idx);
        }
        nameInput.value = fn + ext;
      }
    }
  };

  var btns = document.createElement('div');
  btns.style.marginTop = (showButtons) ? '26px' : '38px';
  btns.style.textAlign = 'center';
  if (!showButtons) {
    div.appendChild(serviceSelect);
    mxEvent.addListener(serviceSelect, 'change', change);
    change();
  }

  if (helpLink != null) {
    var helpBtn = mxUtils.button(mxResources.get('help'), function () {
      editorUi.openLink(helpLink);
    });
    helpBtn.className = 'geBtn';
    btns.appendChild(helpBtn);
  }

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    if (cancelFn != null) {
      cancelFn();
    } else {
      editorUi.fileLoaded(null);
      editorUi.hideDialog();
      window.close();
      window.location.href = editorUi.getUrl();
    }
  });
  cancelBtn.className = 'geBtn';
  if (editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  function create(mode) {
    var title = nameInput.value;
    if (mode == null || (title != null && title.length > 0)) {
      if (hideDialog) {
        editorUi.hideDialog();
      }
      createFn(title, mode, nameInput);
    };
  }
  if (cancelFn == null) {
    var laterBtn = mxUtils.button(mxResources.get('decideLater'), function () {
      create(null);
    });
    laterBtn.className = 'geBtn';
    btns.appendChild(laterBtn);
  }

  if (allowTab && Editor.popupsAllowed) {
    var openBtn = mxUtils.button(mxResources.get('openInNewWindow'), function () {
      create('_blank');
    });
    openBtn.className = 'geBtn';
    btns.appendChild(openBtn);
  }

  if (CreateDialog.showDownloadButton) {
    var downloadButton = mxUtils.button(mxResources.get('download'), function () {
      create('download');
    });

    downloadButton.className = 'geBtn';
    btns.appendChild(downloadButton);
  }

  if ( /*!mxClient.IS_IOS || */ !showButtons) {
    var createBtn = mxUtils.button(btnLabel || mxResources.get('create'), function () {
      create((showDeviceButton) ? 'download' : ((showButtons) ? App.MODE_DEVICE : serviceSelect.value));
    });

    createBtn.className = 'geBtn gePrimaryBtn';
    btns.appendChild(createBtn);
  }

  if (!editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  mxEvent.addListener(nameInput, 'keypress', function (e) {
    if (e.keyCode == 13) {
      create((showButtons) ? App.MODE_DEVICE : serviceSelect.value);
    } else if (e.keyCode == 27) {
      editorUi.fileLoaded(null);
      editorUi.hideDialog();
      window.close();
    }
  });
  div.appendChild(btns);
  this.container = div;
};

/**
 *
 */
// CreateDialog.showDownloadButton = true;



export {
  AboutDialog,
  AddDeviceTypeDialog,
  BindXMLDialog,
  ColorDialog,
  CreateDialog,
  CreateGraphDialog,
  EditDiagramDialog,
  ExportDialog,
  EditDataDialog,
  EditShapeDialog,
  FreehandWindow,
  createLegendDialog,
  LinkDialog,
  LayersWindow,
  LibraryDialog,
  FilenameDialog,
  OpenDialog,
  OpenFileDialog2,
  OutlineWindow,
  ParseDialog,
  SelectDialog,
  TextareaDialog,
}
