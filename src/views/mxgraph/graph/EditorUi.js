import axios from 'axios';
import mxgraph from './index';
import Actions from './Actions';
import Sidebar from './Sidebar';
import StorageFile from './StorageFile'
import StorageLibrary from './StorageLibrary'
import LocalLibrary from './LocalLibrary'
import mxSettings from './Settings'
import {Spinner} from 'spin.js'
import {Format} from './Format';
import Toolbar from './Toolbar';
import {Graph,HoverIcons} from './Graph';
import {Menus} from './Menus';
import Editor from './Editor';
import {OpenFile,Dialog,ErrorDialog,PrintDialog,PageSetupDialog} from './Editor';
import {
  OpenDialog,
  ColorDialog,
  AboutDialog,
  FilenameDialog,
  TextareaDialog,
  EditDiagramDialog,
  ExportDialog,
  EditDataDialog,
  LinkDialog,
  OutlineWindow,
  LayersWindow,
  LibraryDialog,
  CreateDialog
} from './Dialogs';
import pako from 'pako';

// vm 是vue实例
var vm = null;
export function editorThis( _this ) {
  vm = _this;
}


const {
  mxConstants,
  mxCell,
  mxCellState,
  mxCellEditor,
  mxClient,
  mxClipboard,
  mxCodec,
  mxCodecRegistry,
  mxConnectionConstraint,
  mxEvent,
  mxEventSource,
  mxEventObject,
  mxEdgeHandler,
  mxGraph,
  mxGraphHandler,
  mxHierarchicalLayout,
  mxKeyHandler,
  mxShape,
  mxStackLayout,
  mxObjectCodec,
  mxOutline,
  mxPerimeter,
  mxParallelEdgeLayout,
  mxPoint,
  mxPopupMenu,
  mxVertexHandler,
  mxUtils,
  mxImageExport,
  mxXmlCanvas2D,
  mxXmlRequest,
  mxResources,
  mxRectangle,
  mxMorphing,
  MXUTILITIES
} = mxgraph;

//全局变量
var isLocalStorage = true;
var uiTheme = 'atlas';
/**
 * Device Mode
 */
var App = {};
App.MODE_DEVICE = 'device';

/**
 * Copyright (c) 2006-2012, JGraph Ltd
 */
/**
 * Constructs a new graph editor
 */
const EditorUi = function (editor, container, lightbox) {
  mxEventSource.call(this);
  this.destroyFunctions = [];
  this.editor = editor || new Editor();
  this.container = container || document.body;

	var graph = this.editor.graph;
	graph.lightbox = lightbox;
	this.initialDefaultVertexStyle = mxUtils.clone(graph.defaultVertexStyle);
	this.initialDefaultEdgeStyle = mxUtils.clone(graph.defaultEdgeStyle);

  // Faster scrollwheel zoom is possible with CSS transforms
  if (graph.useCssTransforms) {
    this.lazyZoomDelay = 0;
  }

  // Pre-fetches submenu image or replaces with embedded image if supported
  if (mxClient.IS_SVG) {
    mxPopupMenu.prototype.submenuImage = 'data:image/gif;base64,R0lGODlhCQAJAIAAAP///zMzMyH5BAEAAAAALAAAAAAJAAkAAAIPhI8WebHsHopSOVgb26AAADs=';
  } else {
    new Image().src = mxPopupMenu.prototype.submenuImage;
  }

  // Pre-fetches connect image
  if (!mxClient.IS_SVG && mxConnectionHandler.prototype.connectImage != null) {
    new Image().src = mxConnectionHandler.prototype.connectImage.src;
  }

  // Disables graph and forced panning in chromeless mode
  if (this.editor.chromeless && !this.editor.editable) {
    this.footerHeight = 0;
    graph.isEnabled = function () {
      return false;
    };
    graph.panningHandler.isForcePanningEvent = function (me) {
      return !mxEvent.isPopupTrigger(me.getEvent());
    };
  }

  // Creates the user interface
  this.actions = new Actions(this);
  this.menus = this.createMenus();

  if (!graph.standalone) {
    this.createDivs();
    this.createUi();
    this.refresh();

    // Disables HTML and text selection
    var textEditing = mxUtils.bind(this, function (evt) {
      if (evt == null) {
        evt = window.event;
      }

      return graph.isEditing() || (evt != null && this.isSelectionAllowed(evt));
    });

    // Disables text selection while not editing and no dialog visible
    if (this.container == document.body) {
      this.menubarContainer.onselectstart = textEditing;
      this.menubarContainer.onmousedown = textEditing;
      this.toolbarContainer.onselectstart = textEditing;
      this.toolbarContainer.onmousedown = textEditing;
      this.diagramContainer.onselectstart = textEditing;
      this.diagramContainer.onmousedown = textEditing;
      this.sidebarContainer.onselectstart = textEditing;
      this.sidebarContainer.onmousedown = textEditing;
      this.formatContainer.onselectstart = textEditing;
      this.formatContainer.onmousedown = textEditing;
      this.footerContainer.onselectstart = textEditing;
      this.footerContainer.onmousedown = textEditing;

      if (this.tabContainer != null) {
        // Mouse down is needed for drag and drop
        this.tabContainer.onselectstart = textEditing;
      }
    }

    // And uses built-in context menu while editing
    if (!this.editor.chromeless || this.editor.editable) {
      // Allows context menu for links in hints
      var linkHandler = function (evt) {
        if (evt != null) {
          var source = mxEvent.getSource(evt);

          if (source.nodeName == 'A') {
            while (source != null) {
              if (source.className == 'geHint') {
                return true;
              }

              source = source.parentNode;
            }
          }
        }

        return textEditing(evt);
      };

      if (mxClient.IS_IE && (typeof (document.documentMode) === 'undefined' || document.documentMode < 9)) {
        mxEvent.addListener(this.diagramContainer, 'contextmenu', linkHandler);
      } else {
        // Allows browser context menu outside of diagram and sidebar
        this.diagramContainer.oncontextmenu = linkHandler;
      }
    } else {
      graph.panningHandler.usePopupTrigger = false;
    }

    // Contains the main graph instance inside the given panel
    graph.init(this.diagramContainer);

    // Improves line wrapping for in-place editor
    if (mxClient.IS_SVG && graph.view.getDrawPane() != null) {
      var root = graph.view.getDrawPane().ownerSVGElement;

      if (root != null) {
        root.style.position = 'absolute';
      }
    }

    // Creates hover icons
    this.hoverIcons = this.createHoverIcons();

    // Hides hover icons when cells are moved
    if (graph.graphHandler != null) {
      var graphHandlerStart = graph.graphHandler.start;

      graph.graphHandler.start = function () {
        if (ui.hoverIcons != null) {
          ui.hoverIcons.reset();
        }
        graphHandlerStart.apply(this, arguments);
      };
    }

    // Adds tooltip when mouse is over scrollbars to show space-drag panning option
    mxEvent.addListener(this.diagramContainer, 'mousemove', mxUtils.bind(this, function (evt) {
      var off = mxUtils.getOffset(this.diagramContainer);

      if (mxEvent.getClientX(evt) - off.x - this.diagramContainer.clientWidth > 0 ||
        mxEvent.getClientY(evt) - off.y - this.diagramContainer.clientHeight > 0) {
        this.diagramContainer.setAttribute('title', mxResources.get('panTooltip'));
      } else {
        this.diagramContainer.removeAttribute('title');
      }
    }));

    // Escape key hides dialogs, adds space+drag panning
    var spaceKeyPressed = false;

    // Overrides hovericons to disable while space key is pressed
    var hoverIconsIsResetEvent = this.hoverIcons.isResetEvent;

    this.hoverIcons.isResetEvent = function (evt, allowShift) {
      return spaceKeyPressed || hoverIconsIsResetEvent.apply(this, arguments);
    };

    this.keydownHandler = mxUtils.bind(this, function (evt) {
      if (evt.which == 32 /* Space */ && !graph.isEditing()) {
        spaceKeyPressed = true;
        this.hoverIcons.reset();
        graph.container.style.cursor = 'move';
        // Disables scroll after space keystroke with scrollbars
        if (!graph.isEditing() && mxEvent.getSource(evt) == graph.container) {
          mxEvent.consume(evt);
        }
      } else if (!mxEvent.isConsumed(evt) && evt.keyCode == 27 /* Escape */ ) {
        this.hideDialog(null, true);
      }
    });

    mxEvent.addListener(document, 'keydown', this.keydownHandler);

    this.keyupHandler = mxUtils.bind(this, function (evt) {
      graph.container.style.cursor = 'pointer';
      spaceKeyPressed = false;
    });
    mxEvent.addListener(document, 'keyup', this.keyupHandler);

    // Forces panning for middle and right mouse buttons
    var panningHandlerIsForcePanningEvent = graph.panningHandler.isForcePanningEvent;
    graph.panningHandler.isForcePanningEvent = function (me) {
      // Ctrl+left button is reported as right button in FF on Mac
      return panningHandlerIsForcePanningEvent.apply(this, arguments) ||
        spaceKeyPressed || (mxEvent.isMouseEvent(me.getEvent()) &&
          (this.usePopupTrigger || !mxEvent.isPopupTrigger(me.getEvent())) &&
          ((!mxEvent.isControlDown(me.getEvent()) &&
              mxEvent.isRightMouseButton(me.getEvent())) ||
            mxEvent.isMiddleMouseButton(me.getEvent())));
    };

    // Ctrl/Cmd+Enter applies editing value except in Safari where Ctrl+Enter creates
    // a new line (while Enter creates a new paragraph and Shift+Enter stops)
    var cellEditorIsStopEditingEvent = graph.cellEditor.isStopEditingEvent;
    graph.cellEditor.isStopEditingEvent = function (evt) {
      return cellEditorIsStopEditingEvent.apply(this, arguments) ||
        (evt.keyCode == 13 && ((!mxClient.IS_SF && mxEvent.isControlDown(evt)) ||
          (mxClient.IS_MAC && mxEvent.isMetaDown(evt)) ||
          (mxClient.IS_SF && mxEvent.isShiftDown(evt))));
    };

    // Adds space+wheel for zoom
    var graphIsZoomWheelEvent = graph.isZoomWheelEvent;

    graph.isZoomWheelEvent = function () {
      return spaceKeyPressed || graphIsZoomWheelEvent.apply(this, arguments);
    };

    // Switches toolbar for text editing
    var textMode = false;
    var fontMenu = null;
    var sizeMenu = null;
    var nodes = null;

    var updateToolbar = mxUtils.bind(this, function () {
      if (this.toolbar != null && textMode != graph.cellEditor.isContentEditing()) {
        var node = this.toolbar.container.firstChild;
        var newNodes = [];

        while (node != null) {
          var tmp = node.nextSibling;

          if (mxUtils.indexOf(this.toolbar.staticElements, node) < 0) {
            node.parentNode.removeChild(node);
            newNodes.push(node);
          }

          node = tmp;
        }

        // Saves references to special items
        var tmp1 = this.toolbar.fontMenu;
        var tmp2 = this.toolbar.sizeMenu;

        if (nodes == null) {
          this.toolbar.createTextToolbar();
        } else {
          for (var i = 0; i < nodes.length; i++) {
            this.toolbar.container.appendChild(nodes[i]);
          }

          // Restores references to special items
          this.toolbar.fontMenu = fontMenu;
          this.toolbar.sizeMenu = sizeMenu;
        }

        textMode = graph.cellEditor.isContentEditing();
        fontMenu = tmp1;
        sizeMenu = tmp2;
        nodes = newNodes;
      }
    });

    var ui = this;

    // Overrides cell editor to update toolbar
    var cellEditorStartEditing = graph.cellEditor.startEditing;
    graph.cellEditor.startEditing = function () {
      cellEditorStartEditing.apply(this, arguments);
      updateToolbar();

      if (graph.cellEditor.isContentEditing()) {
        var updating = false;

        var updateCssHandler = function () {
          if (!updating) {
            updating = true;

            window.setTimeout(function () {
              var selectedElement = graph.getSelectedElement();
              var node = selectedElement;

              while (node != null && node.nodeType != mxConstants.NODETYPE_ELEMENT) {
                node = node.parentNode;
              }

              if (node != null) {
                var css = mxUtils.getCurrentStyle(node);

                if (css != null && ui.toolbar != null) {
                  // Strips leading and trailing quotes
                  var ff = css.fontFamily;

                  if (ff.charAt(0) == '\'') {
                    ff = ff.substring(1);
                  }

                  if (ff.charAt(ff.length - 1) == '\'') {
                    ff = ff.substring(0, ff.length - 1);
                  }

                  ui.toolbar.setFontName(ff);
                  ui.toolbar.setFontSize(parseInt(css.fontSize));
                }
              }

              updating = false;
            }, 0);
          }
        };

        mxEvent.addListener(graph.cellEditor.textarea, 'input', updateCssHandler)
        mxEvent.addListener(graph.cellEditor.textarea, 'touchend', updateCssHandler);
        mxEvent.addListener(graph.cellEditor.textarea, 'mouseup', updateCssHandler);
        mxEvent.addListener(graph.cellEditor.textarea, 'keyup', updateCssHandler);
        updateCssHandler();
      }
    };

    // Updates toolbar and handles possible errors
    var cellEditorStopEditing = graph.cellEditor.stopEditing;
    graph.cellEditor.stopEditing = function (cell, trigger) {
      try {
        cellEditorStopEditing.apply(this, arguments);
        updateToolbar();
      } catch (e) {
        ui.handleError(e);
      }
    };

    // Enables scrollbars and sets cursor style for the container
    graph.container.setAttribute('tabindex', '0');
    graph.container.style.cursor = 'default';

    // Workaround for page scroll if embedded via iframe
    if (window.self === window.top && graph.container.parentNode != null) {
      try {
        graph.container.focus();
      } catch (e) {
        // ignores error in old versions of IE
      }
    }

    // Keeps graph container focused on mouse down
    var graphFireMouseEvent = graph.fireMouseEvent;
    graph.fireMouseEvent = function (evtName, me, sender) {
      if (evtName == mxEvent.MOUSE_DOWN) {
        this.container.focus();
      }

      graphFireMouseEvent.apply(this, arguments);
    };

    // Configures automatic expand on mouseover
    graph.popupMenuHandler.autoExpand = true;

    // Installs context menu
    if (this.menus != null) {
      graph.popupMenuHandler.factoryMethod = mxUtils.bind(this, function (menu, cell, evt) {
        this.menus.createPopupMenu(menu, cell, evt);
      });
    }

    // Hides context menu
    mxEvent.addGestureListeners(document, mxUtils.bind(this, function (evt) {
      graph.popupMenuHandler.hideMenu();
    }));

    // Create handler for key events
    this.keyHandler = this.createKeyHandler(editor);

    // Getter for key handler
    this.getKeyHandler = function () {
      return keyHandler;
    };

		// Stores the current style and assigns it to new cells
		var styles = ['rounded', 'shadow', 'glass', 'dashed', 'dashPattern', 'labelBackgroundColor',
			'comic', 'sketch', 'fillWeight', 'hachureGap', 'hachureAngle', 'jiggle',
			'disableMultiStroke', 'disableMultiStrokeFill', 'fillStyle', 'curveFitting',
			'simplification', 'sketchStyle'
		];
		var connectStyles = ['shape', 'edgeStyle', 'curved', 'rounded', 'elbow', 'jumpStyle', 'jumpSize',
			'comic', 'sketch', 'fillWeight', 'hachureGap', 'hachureAngle', 'jiggle',
			'disableMultiStroke', 'disableMultiStrokeFill', 'fillStyle', 'curveFitting',
			'simplification', 'sketchStyle'
		];

    // Note: Everything that is not in styles is ignored (styles is augmented below)
    this.setDefaultStyle = function (cell) {
      try {
        var state = graph.view.getState(cell);

        if (state != null) {
          // Ignores default styles
          var clone = cell.clone();
          clone.style = ''
          var defaultStyle = graph.getCellStyle(clone);
          var values = [];
          var keys = [];

          for (var key in state.style) {
            if (defaultStyle[key] != state.style[key]) {
              values.push(state.style[key]);
              keys.push(key);
            }
          }

          // Handles special case for value "none"
          var cellStyle = graph.getModel().getStyle(state.cell);
          var tokens = (cellStyle != null) ? cellStyle.split(';') : [];

          for (var i = 0; i < tokens.length; i++) {
            var tmp = tokens[i];
            var pos = tmp.indexOf('=');

            if (pos >= 0) {
              var key = tmp.substring(0, pos);
              var value = tmp.substring(pos + 1);

              if (defaultStyle[key] != null && value == 'none') {
                values.push(value);
                keys.push(key);
              }
            }
          }

          // Resets current style
          if (graph.getModel().isEdge(state.cell)) {
            graph.currentEdgeStyle = {};
          } else {
            graph.currentVertexStyle = {}
          }

          this.fireEvent(new mxEventObject('styleChanged', 'keys', keys, 'values', values, 'cells', [state.cell]));
        }
      } catch (e) {
        this.handleError(e);
      }
    };

    this.clearDefaultStyle = function () {
      graph.currentEdgeStyle = mxUtils.clone(graph.defaultEdgeStyle);
      graph.currentVertexStyle = mxUtils.clone(graph.defaultVertexStyle);

      // Updates UI
      this.fireEvent(new mxEventObject('styleChanged', 'keys', [], 'values', [], 'cells', []));
    };

    // Keys that should be ignored if the cell has a value (known: new default for all cells is html=1 so
    // for the html key this effecticely only works for edges inserted via the connection handler)
    var valueStyles = ['fontFamily', 'fontSize', 'fontColor'];

    // Keys that always update the current edge style regardless of selection
    var alwaysEdgeStyles = ['edgeStyle', 'startArrow', 'startFill', 'startSize', 'endArrow',
      'endFill', 'endSize'
    ];

    // Keys that are ignored together (if one appears all are ignored)
    var keyGroups = [
      ['startArrow', 'startFill', 'startSize', 'sourcePerimeterSpacing',
        'endArrow', 'endFill', 'endSize', 'targetPerimeterSpacing'
      ],
      ['strokeColor', 'strokeWidth'],
      ['fillColor', 'gradientColor'],
      valueStyles,
      ['opacity'],
      ['align'],
      ['html']
    ];

    // Adds all keys used above to the styles array
    for (var i = 0; i < keyGroups.length; i++) {
      for (var j = 0; j < keyGroups[i].length; j++) {
        styles.push(keyGroups[i][j]);
      }
    }

    for (var i = 0; i < connectStyles.length; i++) {
      if (mxUtils.indexOf(styles, connectStyles[i]) < 0) {
        styles.push(connectStyles[i]);
      }
    }

		// Implements a global current style for edges and vertices that is applied to new cells
		var insertHandler = function (cells, asText, model) {
			model = (model != null) ? model : graph.getModel();

      model.beginUpdate();
      try {
        for (var i = 0; i < cells.length; i++) {
          var cell = cells[i];

          var appliedStyles;

          if (asText) {
            // Applies only basic text styles
            appliedStyles = ['fontSize', 'fontFamily', 'fontColor'];
          } else {
            // Removes styles defined in the cell style from the styles to be applied
            var cellStyle = model.getStyle(cell);
            var tokens = (cellStyle != null) ? cellStyle.split(';') : [];
            appliedStyles = styles.slice();

            for (var j = 0; j < tokens.length; j++) {
              var tmp = tokens[j];
              var pos = tmp.indexOf('=');

              if (pos >= 0) {
                var key = tmp.substring(0, pos);
                var index = mxUtils.indexOf(appliedStyles, key);

                if (index >= 0) {
                  appliedStyles.splice(index, 1);
                }

                // Handles special cases where one defined style ignores other styles
                for (var k = 0; k < keyGroups.length; k++) {
                  var group = keyGroups[k];

                  if (mxUtils.indexOf(group, key) >= 0) {
                    for (var l = 0; l < group.length; l++) {
                      var index2 = mxUtils.indexOf(appliedStyles, group[l]);

                      if (index2 >= 0) {
                        appliedStyles.splice(index2, 1);
                      }
                    }
                  }
                }
              }
            }
          }

          // Applies the current style to the cell
          var edge = model.isEdge(cell);
          var current = (edge) ? graph.currentEdgeStyle : graph.currentVertexStyle;
          var newStyle = model.getStyle(cell);

          for (var j = 0; j < appliedStyles.length; j++) {
            var key = appliedStyles[j];
            var styleValue = current[key];

            if (styleValue != null && (key != 'shape' || edge)) {
              // Special case: Connect styles are not applied here but in the connection handler
              if (!edge || mxUtils.indexOf(connectStyles, key) < 0) {
                newStyle = mxUtils.setStyle(newStyle, key, styleValue);
              }
            }
          }

          model.setStyle(cell, newStyle);
        }
      } finally {
        model.endUpdate();
      }
    };

    graph.addListener('cellsInserted', function (sender, evt) {
      insertHandler(evt.getProperty('cells'));
    });

    graph.addListener('textInserted', function (sender, evt) {
      insertHandler(evt.getProperty('cells'), true);
    });

    this.insertHandler = insertHandler;

    graph.connectionHandler.addListener(mxEvent.CONNECT, function (sender, evt) {
      var cells = [evt.getProperty('cell')];

      if (evt.getProperty('terminalInserted')) {
        cells.push(evt.getProperty('terminal'));
      }

      insertHandler(cells);
    });

    this.addListener('styleChanged', mxUtils.bind(this, function (sender, evt) {
      // Checks if edges and/or vertices were modified
      var cells = evt.getProperty('cells');
      var vertex = false;
      var edge = false;

      if (cells.length > 0) {
        for (var i = 0; i < cells.length; i++) {
          vertex = graph.getModel().isVertex(cells[i]) || vertex;
          edge = graph.getModel().isEdge(cells[i]) || edge;

          if (edge && vertex) {
            break;
          }
        }
      } else {
        vertex = true;
        edge = true;
      }

      var keys = evt.getProperty('keys');
      var values = evt.getProperty('values');

      for (var i = 0; i < keys.length; i++) {
        var common = mxUtils.indexOf(valueStyles, keys[i]) >= 0;

        // Ignores transparent stroke colors
        if (keys[i] != 'strokeColor' || (values[i] != null && values[i] != 'none')) {
          // Special case: Edge style and shape
          if (mxUtils.indexOf(connectStyles, keys[i]) >= 0) {
            if (edge || mxUtils.indexOf(alwaysEdgeStyles, keys[i]) >= 0) {
              if (values[i] == null) {
                delete graph.currentEdgeStyle[keys[i]];
              } else {
                graph.currentEdgeStyle[keys[i]] = values[i];
              }
            }
            // Uses style for vertex if defined in styles
            else if (vertex && mxUtils.indexOf(styles, keys[i]) >= 0) {
              if (values[i] == null) {
                delete graph.currentVertexStyle[keys[i]];
              } else {
                graph.currentVertexStyle[keys[i]] = values[i];
              }
            }
          } else if (mxUtils.indexOf(styles, keys[i]) >= 0) {
            if (vertex || common) {
              if (values[i] == null) {
                delete graph.currentVertexStyle[keys[i]];
              } else {
                graph.currentVertexStyle[keys[i]] = values[i];
              }
            }

            if (edge || common || mxUtils.indexOf(alwaysEdgeStyles, keys[i]) >= 0) {
              if (values[i] == null) {
                delete graph.currentEdgeStyle[keys[i]];
              } else {
                graph.currentEdgeStyle[keys[i]] = values[i];
              }
            }
          }
        }
      }

      if (this.toolbar != null) {
        this.toolbar.setFontName(graph.currentVertexStyle['fontFamily'] || Menus.prototype.defaultFont);
        this.toolbar.setFontSize(graph.currentVertexStyle['fontSize'] || Menus.prototype.defaultFontSize);

        if (this.toolbar.edgeStyleMenu != null) {
          // Updates toolbar icon for edge style
          var edgeStyleDiv = this.toolbar.edgeStyleMenu.getElementsByTagName('div')[0];

          if (graph.currentEdgeStyle['edgeStyle'] == 'orthogonalEdgeStyle' && graph.currentEdgeStyle['curved'] == '1') {
            edgeStyleDiv.className = 'geSprite geSprite-curved';
          } else if (graph.currentEdgeStyle['edgeStyle'] == 'straight' || graph.currentEdgeStyle['edgeStyle'] == 'none' ||
            graph.currentEdgeStyle['edgeStyle'] == null) {
            edgeStyleDiv.className = 'geSprite geSprite-straight';
          } else if (graph.currentEdgeStyle['edgeStyle'] == 'entityRelationEdgeStyle') {
            edgeStyleDiv.className = 'geSprite geSprite-entity';
          } else if (graph.currentEdgeStyle['edgeStyle'] == 'elbowEdgeStyle') {
            edgeStyleDiv.className = 'geSprite geSprite-' + ((graph.currentEdgeStyle['elbow'] == 'vertical') ?
              'verticalelbow' : 'horizontalelbow');
          } else if (graph.currentEdgeStyle['edgeStyle'] == 'isometricEdgeStyle') {
            edgeStyleDiv.className = 'geSprite geSprite-' + ((graph.currentEdgeStyle['elbow'] == 'vertical') ?
              'verticalisometric' : 'horizontalisometric');
          } else {
            edgeStyleDiv.className = 'geSprite geSprite-orthogonal';
          }
        }

        if (this.toolbar.edgeShapeMenu != null) {
          // Updates icon for edge shape
          var edgeShapeDiv = this.toolbar.edgeShapeMenu.getElementsByTagName('div')[0];

          if (graph.currentEdgeStyle['shape'] == 'link') {
            edgeShapeDiv.className = 'geSprite geSprite-linkedge';
          } else if (graph.currentEdgeStyle['shape'] == 'flexArrow') {
            edgeShapeDiv.className = 'geSprite geSprite-arrow';
          } else if (graph.currentEdgeStyle['shape'] == 'arrow') {
            edgeShapeDiv.className = 'geSprite geSprite-simplearrow';
          } else {
            edgeShapeDiv.className = 'geSprite geSprite-connection';
          }
        }

        // Updates icon for optinal line start shape
        if (this.toolbar.lineStartMenu != null) {
          var lineStartDiv = this.toolbar.lineStartMenu.getElementsByTagName('div')[0];

          lineStartDiv.className = this.getCssClassForMarker('start',
            graph.currentEdgeStyle['shape'], graph.currentEdgeStyle[mxConstants.STYLE_STARTARROW],
            mxUtils.getValue(graph.currentEdgeStyle, 'startFill', '1'));
        }

        // Updates icon for optinal line end shape
        if (this.toolbar.lineEndMenu != null) {
          var lineEndDiv = this.toolbar.lineEndMenu.getElementsByTagName('div')[0];

          lineEndDiv.className = this.getCssClassForMarker('end',
            graph.currentEdgeStyle['shape'], graph.currentEdgeStyle[mxConstants.STYLE_ENDARROW],
            mxUtils.getValue(graph.currentEdgeStyle, 'endFill', '1'));
        }
      }
    }));

    // Update font size and font family labels
    //更新字体大小和字体系列标签
    if (this.toolbar != null) {
      var update = mxUtils.bind(this, function () {
        var ff = graph.currentVertexStyle['fontFamily'] || 'Helvetica';
        var fs = String(graph.currentVertexStyle['fontSize'] || '12');
        var state = graph.getView().getState(graph.getSelectionCell());

        if (state != null) {
          ff = state.style[mxConstants.STYLE_FONTFAMILY] || ff;
          fs = state.style[mxConstants.STYLE_FONTSIZE] || fs;

          if (ff.length > 10) {
            ff = ff.substring(0, 8) + '...';
          }
        }

        this.toolbar.setFontName(ff);
        this.toolbar.setFontSize(fs);
      });

      graph.getSelectionModel().addListener(mxEvent.CHANGE, update);
      graph.getModel().addListener(mxEvent.CHANGE, update);
    }

    // Makes sure the current layer is visible when cells are added
    graph.addListener(mxEvent.CELLS_ADDED, function (sender, evt) {
      var cells = evt.getProperty('cells');
      var parent = evt.getProperty('parent');

      if (graph.getModel().isLayer(parent) && !graph.isCellVisible(parent) && cells != null && cells.length > 0) {
        graph.getModel().setVisible(parent, true);
      }
    });

    // Global handler to hide the current menu
    this.gestureHandler = mxUtils.bind(this, function (evt) {
      if (this.currentMenu != null && mxEvent.getSource(evt) != this.currentMenu.div) {
        this.hideCurrentMenu();
      }
    });

    mxEvent.addGestureListeners(document, this.gestureHandler);

    // Updates the editor UI after the window has been resized or the orientation changes
    // Timeout is workaround for old IE versions which have a delay for DOM client sizes.
    // Should not use delay > 0 to avoid handle multiple repaints during window resize
    this.resizeHandler = mxUtils.bind(this, function () {
      window.setTimeout(mxUtils.bind(this, function () {
        if (this.editor.graph != null) {
          this.refresh();
        }
      }), 0);
    });

    //调整大小
    mxEvent.addListener(window, 'resize', this.resizeHandler);
    this.orientationChangeHandler = mxUtils.bind(this, function () {
      this.refresh();
    });

    mxEvent.addListener(window, 'orientationchange', this.orientationChangeHandler);

    // Workaround for bug on iOS see
    // http://stackoverflow.com/questions/19012135/ios-7-ipad-safari-landscape-innerheight-outerheight-layout-issue
    if (mxClient.IS_IOS && !window.navigator.standalone) {
      this.scrollHandler = mxUtils.bind(this, function () {
        window.scrollTo(0, 0);
      });

      mxEvent.addListener(window, 'scroll', this.scrollHandler);
    }

    /**
     * Sets the initial scrollbar locations after a file was loaded.
     */
    this.editor.addListener('resetGraphView', mxUtils.bind(this, function () {
      this.resetScrollbars();
    }));

    /**
     * Repaints the grid.
     */
    this.addListener('gridEnabledChanged', mxUtils.bind(this, function () {
      graph.view.validateBackground();
    }));

    this.addListener('backgroundColorChanged', mxUtils.bind(this, function () {
      graph.view.validateBackground();
    }));

    /**
     * Repaints the grid.
     */
    graph.addListener('gridSizeChanged', mxUtils.bind(this, function () {
      if (graph.isGridEnabled()) {
        graph.view.validateBackground();
      }
    }));

    // Resets UI, updates action and menu states
    this.editor.resetGraph();
  }

  this.init();

  if (!graph.standalone) {
    this.open();
  }
};

// Extends mxEventSource
mxUtils.extend(EditorUi, mxEventSource);

/**
 * Switch to disable logging for mode and search terms.
 */
EditorUi.enableLogging = urlParams['stealth'] != '1' &&
  (/.*\.draw\.io$/.test(window.location.hostname) ||
    /.*\.diagrams\.net$/.test(window.location.hostname)) &&
  window.location.hostname != 'support.draw.io';

/**
 * Switch to enable PlantUML in the insert from text dialog.
 * NOTE: This must also be enabled on the server-side.
 */
EditorUi.prototype.enablePlantUml = !EditorUi.enableLogging;

/**
 * Global config that specifies if the compact UI elements should be used.
 */
EditorUi.compactUi = true;

/**
 * Specifies the size of the split bar.
 */
EditorUi.prototype.splitSize = (mxClient.IS_TOUCH || mxClient.IS_POINTER) ? 12 : 8;

/**
 * Specifies the height of the menubar. Default is 30.
 */
EditorUi.prototype.menubarHeight = 30;

/**
 * Specifies the width of the format panel should be enabled. Default is true.
 */
EditorUi.prototype.formatEnabled = true;

/**
 * Specifies the width of the format panel. Default is 240.
 */
EditorUi.prototype.formatWidth = 240;

/**
 * Specifies the height of the toolbar. Default is 40.
 */
EditorUi.prototype.toolbarHeight = 40;

/**
 * Specifies the height of the footer. Default is 28.
 */
EditorUi.prototype.footerHeight = 28;

/**
 * Specifies the height of the optional sidebarFooterContainer. Default is 34.
 */
EditorUi.prototype.sidebarFooterHeight = 34;

/**
 * Specifies the default custom shape style.
 * 创建形状的style样式
 */
EditorUi.prototype.defaultCustomShapeStyle = 'shape=stencil(tZRtTsQgEEBPw1+DJR7AoN6DbWftpAgE0Ortd/jYRGq72R+YNE2YgTePloEJGWblgA18ZuKFDcMj5/Sm8boZq+BgjCX4pTyqk6ZlKROitwusOMXKQDODx5iy4pXxZ5qTHiFHawxB0JrQZH7lCabQ0Fr+XWC1/E8zcsT/gAi+Subo2/3Mh6d/oJb5nU1b5tW7r2knautaa3T+U32o7f7vZwpJkaNDLORJjcu7t59m2jXxqX9un+tt022acsfmoKaQZ+vhhswZtS6Ne/ThQGt0IV0N3Yyv6P3CeT9/tHO0XFI5cAE=);whiteSpace=wrap;html=1;';

/**
 * Specifies the position of the horizontal split bar. Default is 240 or 118 for
 * screen widths <= 640px.
 */
EditorUi.prototype.hsplitPosition = (screen.width <= 640) ? 118 : ((urlParams['sidebar-entries'] != 'large') ? 212 : 240);

/**
 * Specifies if animations are allowed in <executeLayout>. Default is true.
 */
EditorUi.prototype.allowAnimation = true;

/**
 * Default is 2.
 */
EditorUi.prototype.lightboxMaxFitScale = 2;

/**
 * Default is 4.
 */
EditorUi.prototype.lightboxVerticalDivider = 4;


/**
 * Specifies if single click on horizontal split should collapse sidebar. Default is false.
 */
EditorUi.prototype.hsplitClickEnabled = false;

/**
 * Installs the listeners to update the action states.
 */
EditorUi.prototype.init = function () {
  /**
   * Keypress starts immediate editing on selection cell
   */
  var graph = this.editor.graph;

  if (!graph.standalone) {

    if (urlParams['shape-picker'] != '0') {
      this.installShapePicker();
    }
    // Hides tooltips and connection points when scrolling
    // 滚动时隐藏工具提示和连接点
    mxEvent.addListener(graph.container, 'scroll', mxUtils.bind(this, function () {
      graph.tooltipHandler.hide();
      if (graph.connectionHandler != null && graph.connectionHandler.constraintHandler != null) {
        graph.connectionHandler.constraintHandler.reset();
      }
    }));

		// Hides tooltip on escape
		graph.addListener(mxEvent.ESCAPE, mxUtils.bind(this, function () {
			graph.tooltipHandler.hide();
			var rb = graph.getRubberband();

			if (rb != null) {
				rb.cancel();
			}
		}));

    mxEvent.addListener(graph.container, 'keydown', mxUtils.bind(this, function (evt) {
      this.onKeyDown(evt);
    }));
    mxEvent.addListener(graph.container, 'keypress', mxUtils.bind(this, function (evt) {
      this.onKeyPress(evt);
    }));

    // Updates action states
    this.addUndoListener();
    this.addBeforeUnloadListener();

    graph.getSelectionModel().addListener(mxEvent.CHANGE, mxUtils.bind(this, function () {
      this.updateActionStates();
    }));

    graph.getModel().addListener(mxEvent.CHANGE, mxUtils.bind(this, function () {
      this.updateActionStates();
    }));

    // Changes action states after change of default parent
    var graphSetDefaultParent = graph.setDefaultParent;
    var ui = this;

    this.editor.graph.setDefaultParent = function () {
      graphSetDefaultParent.apply(this, arguments);
      ui.updateActionStates();
    };

    // Hack to make editLink available in vertex handler
    graph.editLink = ui.actions.get('editLink').funct;
    // graph.bindXMLName = ui.actions.get('bindXMLName').funct; //新增

    this.updateActionStates();
    this.initClipboard();
    this.initCanvas();

    if (this.format != null) {
      this.format.init();
    }

    //定时器的方法
    this.editor.setTimeSaveXML(); //执行定时器的方法
    this.spinner = this.createSpinner();
  }
};


/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.installShapePicker = function () {
	var graph = this.editor.graph;
	var ui = this;

	// Uses this event to process mouseDown to check the selection state before it is changed
	graph.addListener(mxEvent.FIRE_MOUSE_EVENT, mxUtils.bind(this, function (sender, evt) {
		if (evt.getProperty('eventName') == 'mouseDown') {
			ui.hideShapePicker();
		}
	}));

	graph.addListener(mxEvent.ESCAPE, mxUtils.bind(this, function () {
		ui.hideShapePicker(true);
	}));

	graph.getSelectionModel().addListener(mxEvent.CHANGE, mxUtils.bind(this, function () {
		ui.hideShapePicker(true);
	}));

	graph.getModel().addListener(mxEvent.CHANGE, mxUtils.bind(this, function () {
		ui.hideShapePicker(true);
	}));

	// Counts as popup menu
	var popupMenuHandlerIsMenuShowing = graph.popupMenuHandler.isMenuShowing;

	graph.popupMenuHandler.isMenuShowing = function () {
		return popupMenuHandlerIsMenuShowing.apply(this, arguments) || ui.shapePicker != null;
	};

	// Adds dbl click dialog for inserting shapes
	var graphDblClick = graph.dblClick;

	graph.dblClick = function (evt, cell) {
		if (this.isEnabled()) {
			if (cell == null && ui.sidebar != null && !mxEvent.isShiftDown(evt)) {
				mxEvent.consume(evt);
				var pt = mxUtils.convertPoint(this.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));

				// Asynchronous to avoid direct insert after double tap
				window.setTimeout(mxUtils.bind(this, function () {
					ui.showShapePicker(pt.x, pt.y);
				}), 30);
			} else {
				graphDblClick.apply(this, arguments);
			}
		}
	};

	if (this.hoverIcons != null) {
		var hoverIconsDrag = this.hoverIcons.drag;

		this.hoverIcons.drag = function () {
			ui.hideShapePicker();
			hoverIconsDrag.apply(this, arguments);
    };
    

    //draw.io 新方法, 点击箭头，出现小图标库，然后在里面选择一个点击就到画布里面了
		var hoverIconsExecute = this.hoverIcons.execute;

		this.hoverIcons.execute = function (state, dir, me) {
			var evt = me.getEvent();

			if (!mxEvent.isControlDown(evt) && !mxEvent.isShiftDown(evt)) {
				this.graph.connectVertex(state.cell, dir, this.graph.defaultEdgeLength, evt, null, null, mxUtils.bind(this, function (x, y, execute) {
					var temp = graph.getCompositeParent(state.cell);
					var geo = graph.getCellGeometry(temp);
					me.consume();

					while (temp != null && graph.model.isVertex(temp) && geo != null && geo.relative) {
						cell = temp;
						temp = graph.model.getParent(cell)
						geo = graph.getCellGeometry(temp);
					}

					ui.showShapePicker(me.getGraphX(), me.getGraphY(), temp, mxUtils.bind(this, function (cell) {
						execute(cell);
					}), dir);
				}), mxUtils.bind(this, function (result) {
					this.graph.selectCellsForConnectVertex(result, evt, this);
				}));
			} else {
				hoverIconsExecute.apply(this, arguments);
			}
		};
	}
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 * 创建用于呈现屏幕外内容的临时图形实例
 */
EditorUi.prototype.showShapePicker = function (x, y, source, callback, direction) {
	var cells = this.getCellsForShapePicker(source);

	if (cells != null && cells.length > 0) {
		var ui = this;
		var graph = this.editor.graph;
		var div = document.createElement('div');
		var sourceState = graph.view.getState(source);
		var style = (source != null && (sourceState == null ||
				!graph.isTransparentState(sourceState))) ?
			graph.copyStyle(source) : null;

		// Do not place entry under pointer for touch devices
    // div.className = 'geToolbarContainer geSidebarContainer geSidebar';
    div.className = 'geSidebarContainer geSidebar';
		div.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y +
			'px;width:140px;border-radius:10px;padding:4px;text-align:center;' +
			'box-shadow:0px 0px 3px 1px #d1d1d1;padding: 6px 0 8px 0;';

		if (direction == mxConstants.DIRECTION_NORTH) {
			mxUtils.setPrefixedStyle(div.style, 'transform', 'translate(-50%,-100%)');
		} else if (direction == mxConstants.DIRECTION_SOUTH) {
			mxUtils.setPrefixedStyle(div.style, 'transform', 'translate(-50%,0%)');
		} else if (direction == mxConstants.DIRECTION_WEST) {
			mxUtils.setPrefixedStyle(div.style, 'transform', 'translate(-100%,-50%)');
		} else if (direction == mxConstants.DIRECTION_EAST) {
			mxUtils.setPrefixedStyle(div.style, 'transform', 'translate(0%,-50%)');
		} else {
			mxUtils.setPrefixedStyle(div.style, 'transform', 'translate(-22px,-22px)');
		}

		if (graph.background != null && graph.background != mxConstants.NONE) {
			div.style.backgroundColor = graph.background;
		}

		graph.container.appendChild(div);

		var addCell = mxUtils.bind(this, function (cell) {
			// Wrapper needed to catch events
			var node = document.createElement('a');
			node.className = 'geItem';
			node.style.cssText = 'position:relative;display:inline-block;position:relative;' +
				'width:30px;height:30px;cursor:pointer;overflow:hidden;padding:3px 0 0 3px;';
			div.appendChild(node);

			if (style != null) {
				this.sidebar.graph.pasteStyle(style, [cell]);
			} else {
				ui.insertHandler([cell], cell.value != '', this.sidebar.graph.model);
			}

			this.sidebar.createThumb([cell], 25, 25, node, null, true, false, cell.geometry.width, cell.geometry.height);

			mxEvent.addListener(node, 'click', function () {
				var clone = graph.cloneCell(cell);

				if (callback != null) {
					callback(clone);
				} else {
					clone.geometry.x = graph.snap(Math.round(x / graph.view.scale) -
						graph.view.translate.x - cell.geometry.width / 2);
					clone.geometry.y = graph.snap(Math.round(y / graph.view.scale) -
						graph.view.translate.y - cell.geometry.height / 2);

					graph.model.beginUpdate();
					try {
						graph.addCell(clone);
					} finally {
						graph.model.endUpdate();
					}

					graph.setSelectionCell(clone);
					graph.scrollCellToVisible(clone);
					graph.startEditingAtCell(clone);

					if (ui.hoverIcons != null) {
						ui.hoverIcons.update(graph.view.getState(clone));
					}
				}

				ui.hideShapePicker();
			});
		});

		for (var i = 0; i < cells.length; i++) {
			addCell(cells[i]);
		}

		if (ui.hoverIcons != null) {
			ui.hoverIcons.reset();
		}

		graph.popupMenuHandler.hideMenu();
		graph.tooltipHandler.hideTooltip();
		this.hideCurrentMenu();
		this.hideShapePicker();

		this.shapePickerCallback = callback;
		this.shapePicker = div;
	}
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 * 创建用于呈现屏幕外内容的临时图形实例
 */
EditorUi.prototype.getCellsForShapePicker = function (cell) {
	var createVertex = mxUtils.bind(this, function (style, w, h, value) {
		return this.editor.graph.createVertex(null, null, value || '', 0, 0, w || 120, h || 60, style, false);
	});

  return [(cell != null) ? this.editor.graph.cloneCell(cell) :
    //text文字框先不要显示
		// createVertex('text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;', 40, 20, 'Text'),
    createVertex('shape=internalStorage;whiteSpace=wrap;html=1;backgroundOutline=1;', 70, 70, '', 'Internal Storage'),
    createVertex('whiteSpace=wrap;html=1;',70, 40),
		createVertex('ellipse;whiteSpace=wrap;html=1;', 80, 50),
		createVertex('rhombus;whiteSpace=wrap;html=1;', 60, 60),
		createVertex('shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;'),
		createVertex('shape=trapezoid;perimeter=trapezoidPerimeter;whiteSpace=wrap;html=1;fixedSize=1;', 90, 40),
		createVertex('shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;', 80, 50),
		createVertex('shape=step;perimeter=stepPerimeter;whiteSpace=wrap;html=1;fixedSize=1;', 80, 50),
		createVertex('shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;'),
		createVertex('shape=cube;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;darkOpacity=0.05;darkOpacity2=0.1;', 100, 60),
		createVertex('shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;', 60, 70),
		createVertex('triangle;whiteSpace=wrap;html=1;', 50, 70),
		createVertex('shape=document;whiteSpace=wrap;html=1;boundedLbl=1;', 80, 70),
		createVertex('shape=tape;whiteSpace=wrap;html=1;', 80, 50),
		createVertex('ellipse;shape=cloud;whiteSpace=wrap;html=1;', 70, 70),
		createVertex('shape=cylinder;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;', 50, 80)
	];
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.hideShapePicker = function (cancel) {
	if (this.shapePicker != null) {
		this.shapePicker.parentNode.removeChild(this.shapePicker);
		this.shapePicker = null;

		if (!cancel && this.shapePickerCallback != null) {
			this.shapePickerCallback();
		}

		this.shapePickerCallback = null;
	}
};


/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.onKeyDown = function (evt) {
	var graph = this.editor.graph;

	// Tab selects next cell
	if (evt.which == 9 && graph.isEnabled() && !mxEvent.isAltDown(evt) &&
		(!graph.isEditing() || !mxEvent.isShiftDown(evt))) {
		if (graph.isEditing()) {
			graph.stopEditing(false);
		} else {
			graph.selectCell(!mxEvent.isShiftDown(evt));
		}

		mxEvent.consume(evt);
	}
};

/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.onKeyPress = function (evt) {
  var graph = this.editor.graph;

	// KNOWN: Focus does not work if label is empty in quirks mode
	if (this.isImmediateEditingEvent(evt) && !graph.isEditing() && !graph.isSelectionEmpty() && evt.which !== 0 &&
		evt.which !== 27 && !mxEvent.isAltDown(evt) && !mxEvent.isControlDown(evt) && !mxEvent.isMetaDown(evt)) {
		graph.escape();
		graph.startEditing();

		// Workaround for FF where char is lost if cursor is placed before char
		if (mxClient.IS_FF) {
			var ce = graph.cellEditor;

			if (ce.textarea != null) {
				ce.textarea.innerHTML = String.fromCharCode(evt.which);

				// Moves cursor to end of textarea
				var range = document.createRange();
				range.selectNodeContents(ce.textarea);
				range.collapse(false);
				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
	}
};

/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.isImmediateEditingEvent = function (evt) {
  return true;
};

/**
 * Private helper method.
 */
EditorUi.prototype.getCssClassForMarker = function (prefix, shape, marker, fill) {
  var result = '';

	if (shape == 'flexArrow') {
		result = (marker != null && marker != mxConstants.NONE) ?
			'geSprite geSprite-' + prefix + 'blocktrans' : 'geSprite geSprite-noarrow';
	} else {
		// SVG marker sprites
		if (marker == 'box' || marker == 'halfCircle') {
			result = 'geSprite geSvgSprite geSprite-' + marker + ((prefix == 'end') ? ' geFlipSprite' : '');
		} else if (marker == mxConstants.ARROW_CLASSIC) {
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'classic' : 'geSprite geSprite-' + prefix + 'classictrans';
		} else if (marker == mxConstants.ARROW_CLASSIC_THIN) {
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'classicthin' : 'geSprite geSprite-' + prefix + 'classicthintrans';
		} else if (marker == mxConstants.ARROW_OPEN) {
			result = 'geSprite geSprite-' + prefix + 'open';
		} else if (marker == mxConstants.ARROW_OPEN_THIN) {
			result = 'geSprite geSprite-' + prefix + 'openthin';
		} else if (marker == mxConstants.ARROW_BLOCK) {
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'block' : 'geSprite geSprite-' + prefix + 'blocktrans';
		} else if (marker == mxConstants.ARROW_BLOCK_THIN) {
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'blockthin' : 'geSprite geSprite-' + prefix + 'blockthintrans';
		} else if (marker == mxConstants.ARROW_OVAL) {
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'oval' : 'geSprite geSprite-' + prefix + 'ovaltrans';
		} else if (marker == mxConstants.ARROW_DIAMOND) {
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'diamond' : 'geSprite geSprite-' + prefix + 'diamondtrans';
		} else if (marker == mxConstants.ARROW_DIAMOND_THIN) {
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'thindiamond' : 'geSprite geSprite-' + prefix + 'thindiamondtrans';
		} else if (marker == 'openAsync') {
			result = 'geSprite geSprite-' + prefix + 'openasync';
		} else if (marker == 'dash') {
			result = 'geSprite geSprite-' + prefix + 'dash';
		} else if (marker == 'cross') {
			result = 'geSprite geSprite-' + prefix + 'cross';
		} else if (marker == 'async') {
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'async' : 'geSprite geSprite-' + prefix + 'asynctrans';
		} else if (marker == 'circle' || marker == 'circlePlus') {
			result = (fill == '1' || marker == 'circle') ? 'geSprite geSprite-' + prefix + 'circle' : 'geSprite geSprite-' + prefix + 'circleplus';
		} else if (marker == 'ERone') {
			result = 'geSprite geSprite-' + prefix + 'erone';
		} else if (marker == 'ERmandOne') {
			result = 'geSprite geSprite-' + prefix + 'eronetoone';
		} else if (marker == 'ERmany') {
			result = 'geSprite geSprite-' + prefix + 'ermany';
		} else if (marker == 'ERoneToMany') {
			result = 'geSprite geSprite-' + prefix + 'eronetomany';
		} else if (marker == 'ERzeroToOne') {
			result = 'geSprite geSprite-' + prefix + 'eroneopt';
		} else if (marker == 'ERzeroToMany') {
			result = 'geSprite geSprite-' + prefix + 'ermanyopt';
		} else {
			result = 'geSprite geSprite-noarrow';
		}
	}

	return result;
};

/**
 * Overridden in Menus.js
 */
EditorUi.prototype.createMenus = function () {
  return null;
};

/**
 * Hook for allowing selection and context menu for certain events.
 */
EditorUi.prototype.updatePasteActionStates = function () {
  var graph = this.editor.graph;
  var paste = this.actions.get('paste');
  var pasteHere = this.actions.get('pasteHere');

  paste.setEnabled(this.editor.graph.cellEditor.isContentEditing() || (!mxClipboard.isEmpty() &&
    graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())));
  pasteHere.setEnabled(paste.isEnabled());
};

/**
 * Hook for allowing selection and context menu for certain events.
 */
EditorUi.prototype.initClipboard = function () {
  var ui = this;

  var mxClipboardCut = mxClipboard.cut;
  mxClipboard.cut = function (graph) {
    if (graph.cellEditor.isContentEditing()) {
      document.execCommand('cut', false, null);
    } else {
      mxClipboardCut.apply(this, arguments);
    }

    ui.updatePasteActionStates();
  };

	var mxClipboardCopy = mxClipboard.copy;
	mxClipboard.copy = function (graph) {
		var result = null;

		if (graph.cellEditor.isContentEditing()) {
			document.execCommand('copy', false, null);
		} else {
			result = result || graph.getSelectionCells();
			result = graph.getExportableCells(graph.model.getTopmostCells(result));

			var cloneMap = new Object();
			var lookup = graph.createCellLookup(result);
			var clones = graph.cloneCells(result, null, cloneMap);

			// Uses temporary model to force new IDs to be assigned
			// to avoid having to carry over the mapping from object
			// ID to cell ID to the paste operation
			var model = new mxGraphModel();
			var parent = model.getChildAt(model.getRoot(), 0);

			for (var i = 0; i < clones.length; i++) {
				model.add(parent, clones[i]);

				// Checks for orphaned relative children and makes absolute				
				var state = graph.view.getState(result[i]);

				if (state != null) {
					var geo = graph.getCellGeometry(clones[i]);

					if (geo != null && geo.relative && !model.isEdge(result[i]) &&
						lookup[mxObjectIdentity.get(model.getParent(result[i]))] == null) {
						geo.offset = null;
						geo.relative = false;
						geo.x = state.x / state.view.scale - state.view.translate.x;
						geo.y = state.y / state.view.scale - state.view.translate.y;
					}
				}
			}

			graph.updateCustomLinks(graph.createCellMapping(cloneMap, lookup), clones);

			mxClipboard.insertCount = 1;
			mxClipboard.setCells(clones);
		}

		ui.updatePasteActionStates();

		return result;
	};

  var mxClipboardPaste = mxClipboard.paste;
  mxClipboard.paste = function (graph) {
    var result = null;
    if (graph.cellEditor.isContentEditing()) {
      document.execCommand('paste', false, null);
    } else {
      result = mxClipboardPaste.apply(this, arguments);
    }
    ui.updatePasteActionStates();
    return result;
  };

  // Overrides cell editor to update paste action state
  var cellEditorStartEditing = this.editor.graph.cellEditor.startEditing;

  this.editor.graph.cellEditor.startEditing = function () {
    cellEditorStartEditing.apply(this, arguments);
    ui.updatePasteActionStates();
  };

  var cellEditorStopEditing = this.editor.graph.cellEditor.stopEditing;

  this.editor.graph.cellEditor.stopEditing = function (cell, trigger) {
    cellEditorStopEditing.apply(this, arguments);
    ui.updatePasteActionStates();
  };
  this.updatePasteActionStates();
};

/**
 * Delay between zoom steps when not using preview.
 */
EditorUi.prototype.lazyZoomDelay = 20;

/**
 * Delay before update of DOM when using preview.
 */
EditorUi.prototype.wheelZoomDelay = 400;

/**
 * Delay before update of DOM when using preview.
 */
EditorUi.prototype.buttonZoomDelay = 600;





/**
 * Contains the default XML for an empty diagram.
 */
EditorUi.prototype.emptyDiagramXml = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>';

/**
 * 
 */
EditorUi.prototype.emptyLibraryXml = '<mxlibrary>[]</mxlibrary>';

/**
 * Link for scratchpad help.素材库的帮助链接
 */
EditorUi.prototype.scratchpadHelpLink = 'https://desk.draw.io/support/solutions/articles/16000042367';


/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.createSpinner = function (x, y, size) {
  size = (size != null) ? size : 24;
  var spinner = new Spinner({
    lines: 12, // The number of lines to draw
    length: size, // The length of each line
    width: Math.round(size / 3), // The line thickness
    radius: Math.round(size / 2), // The radius of the inner circle
    rotate: 0, // The rotation offset
    color: (uiTheme == 'dark') ? '#c0c0c0' : '#000', // #rgb or #rrggbb
    speed: 1.5, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    zIndex: 2e9 // The z-index (defaults to 2000000000)
  });

  // Extends spin method to include an optional label
  var oldSpin = spinner.spin;

  spinner.spin = function (container, label) {
    var result = false;

    if (!this.active) {
      oldSpin.call(this, container);
      this.active = true;

      if (label != null) {
        var status = document.createElement('div');
        status.style.position = 'absolute';
        status.style.whiteSpace = 'nowrap';
        status.style.background = '#4B4243';
        status.style.color = 'white';
        status.style.fontFamily = 'Helvetica, Arial';
        status.style.fontSize = '9pt';
        status.style.padding = '6px';
        status.style.paddingLeft = '10px';
        status.style.paddingRight = '10px';
        status.style.zIndex = 2e9;
        status.style.left = Math.max(0, x) + 'px';
        status.style.top = Math.max(0, y + 70) + 'px';

        mxUtils.setPrefixedStyle(status.style, 'borderRadius', '6px');
        mxUtils.setPrefixedStyle(status.style, 'transform', 'translate(-50%,-50%)');

        if (uiTheme != 'dark') {
          mxUtils.setPrefixedStyle(status.style, 'boxShadow', '2px 2px 3px 0px #ddd');
        }

        if (label.substring(label.length - 3, label.length) != '...' &&
          label.charAt(label.length - 1) != '!') {
          label = label + '...';
        }

        status.innerHTML = label;
        container.appendChild(status);
        spinner.status = status;

        // Centers the label in older IE versions
        if (mxClient.IS_VML && (document.documentMode == null || document.documentMode <= 8)) {
          status.style.left = Math.round(Math.max(0, x - status.offsetWidth / 2)) + 'px';
          status.style.top = Math.round(Math.max(0, y + 70 - status.offsetHeight / 2)) + 'px';
        }
      }

      // Pause returns a function to resume the spinner
      this.pause = mxUtils.bind(this, function () {
        var fn = function () {};

        if (this.active) {
          fn = mxUtils.bind(this, function () {
            this.spin(container, label);
          });
        }

        this.stop();

        return fn;
      });
      result = true;
    }
    return result;
  };

  // Extends stop method to remove the optional label
  var oldStop = spinner.stop;

  spinner.stop = function () {
    oldStop.call(this);
    this.active = false;

    if (spinner.status != null && spinner.status.parentNode != null) {
      spinner.status.parentNode.removeChild(spinner.status);
    }
    spinner.status = null;
  };

  spinner.pause = function () {
    return function () {};
  };
  return spinner;
};

/**
 * Returns true for Gliffy data.
 */
EditorUi.prototype.isRemoteFileFormat = function (data, filename) {
  return /(\"contentType\":\s*\"application\/gliffy\+json\")/.test(data);
};

EditorUi.prototype.closableScratchpad = false;

/**
 * Abstraction for local storage access.
 */
EditorUi.prototype.getLocalData = function (key, fn) {
  fn(localStorage.getItem(key));
};

/**
 * Abstraction for local storage access.
 */
EditorUi.prototype.setLocalData = function (key, data, fn) {
  localStorage.setItem(key, data);

  if (fn != null) {
    fn();
  }
};

/**
 * Abstraction for local storage access.
 */
EditorUi.prototype.removeLocalData = function (key, fn) {
  localStorage.removeItem(key)
  fn();
};

/**
 * Returns true if no external comms allowed or possible
 */
EditorUi.prototype.isOffline = function (ignoreStealth) {
  return this.isOfflineApp() || !navigator.onLine || (!ignoreStealth && urlParams['stealth'] == '1');
};

/**
 * Returns true if offline app, which isn't a defined thing
 */
EditorUi.prototype.isOfflineApp = function () {
  return urlParams['offline'] == '1';
};

/**
 * Defines the maximum size for images.
 */
EditorUi.prototype.maxBackgroundSize = 1600;

/**
 * Defines the maximum size for images.
 */
EditorUi.prototype.maxImageSize = 520;

/**
 * Defines the maximum width for pasted text.
 * Use 0 to disable check.
 */
EditorUi.prototype.maxTextWidth = 520;

/**
 * Images above 100K should be resampled.
 */
EditorUi.prototype.resampleThreshold = 100000;

/**
 * Maximum allowed size for images is 1 MB.
 */
EditorUi.prototype.maxImageBytes = 1000000;

/**
 * Maximum size for background images is 2.5 MB.
 */
EditorUi.prototype.maxBackgroundBytes = 2500000;

/**
 * Maximum size for text files in labels is 0.5 MB.
 */
EditorUi.prototype.maxTextBytes = 500000;









/**
 * Initializes the infinite canvas.
 */
EditorUi.prototype.initCanvas = function () {
  // Initial page layout view, scrollBuffer and timer-based scrolling
  var graph = this.editor.graph;
  graph.timerAutoScroll = true;

  /**
   * Returns the padding for pages in page view with scrollbars.
   */
  graph.getPagePadding = function () {
    return new mxPoint(Math.max(0, Math.round((graph.container.offsetWidth - 34) / graph.view.scale)),
      Math.max(0, Math.round((graph.container.offsetHeight - 34) / graph.view.scale)));
  };

  // Fits the number of background pages to the graph
  graph.view.getBackgroundPageBounds = function () {
    var layout = this.graph.getPageLayout();
    var page = this.graph.getPageSize();

    return new mxRectangle(this.scale * (this.translate.x + layout.x * page.width),
      this.scale * (this.translate.y + layout.y * page.height),
      this.scale * layout.width * page.width,
      this.scale * layout.height * page.height);
  };

  graph.getPreferredPageSize = function (bounds, width, height) {
    var pages = this.getPageLayout();
    var size = this.getPageSize();

    return new mxRectangle(0, 0, pages.width * size.width, pages.height * size.height);
  };

  // Scales pages/graph to fit available size
  var resize = null;
  var ui = this;

	if (this.editor.isChromelessView()) {
		resize = mxUtils.bind(this, function (autoscale, maxScale, cx, cy) {
			if (graph.container != null && !graph.isViewer()) {
				cx = (cx != null) ? cx : 0;
				cy = (cy != null) ? cy : 0;

        var bds = (graph.pageVisible) ? graph.view.getBackgroundPageBounds() : graph.getGraphBounds();
        var scroll = mxUtils.hasScrollbars(graph.container);
        var tr = graph.view.translate;
        var s = graph.view.scale;

        // Normalizes the bounds
        var b = mxRectangle.fromRectangle(bds);
        b.x = b.x / s - tr.x;
        b.y = b.y / s - tr.y;
        b.width /= s;
        b.height /= s;

        var st = graph.container.scrollTop;
        var sl = graph.container.scrollLeft;
        var sb = (mxClient.IS_QUIRKS || document.documentMode >= 8) ? 20 : 14;

        if (document.documentMode == 8 || document.documentMode == 9) {
          sb += 3;
        }

        var cw = graph.container.offsetWidth - sb;
        var ch = graph.container.offsetHeight - sb;

        var ns = (autoscale) ? Math.max(0.3, Math.min(maxScale || 1, cw / b.width)) : s;
        var dx = ((cw - ns * b.width) / 2) / ns;
        var dy = (this.lightboxVerticalDivider == 0) ? 0 : ((ch - ns * b.height) / this.lightboxVerticalDivider) / ns;

        if (scroll) {
          dx = Math.max(dx, 0);
          dy = Math.max(dy, 0);
        }

        if (scroll || bds.width < cw || bds.height < ch) {
          graph.view.scaleAndTranslate(ns, Math.floor(dx - b.x), Math.floor(dy - b.y));
          graph.container.scrollTop = st * ns / s;
          graph.container.scrollLeft = sl * ns / s;
        } else if (cx != 0 || cy != 0) {
          var t = graph.view.translate;
          graph.view.setTranslate(Math.floor(t.x + cx / s), Math.floor(t.y + cy / s));
        }
      }
    });

    // Hack to make function available to subclassers
    this.chromelessResize = resize;

    // Hook for subclassers for override
    this.chromelessWindowResize = mxUtils.bind(this, function () {
      this.chromelessResize(false);
    });

    // Removable resize listener
    var autoscaleResize = mxUtils.bind(this, function () {
      this.chromelessWindowResize(false);
    });

    //调整大小
    mxEvent.addListener(window, 'resize', autoscaleResize);
    this.destroyFunctions.push(function () {
      mxEvent.removeListener(window, 'resize', autoscaleResize);
    });

    this.editor.addListener('resetGraphView', mxUtils.bind(this, function () {
      this.chromelessResize(true);
    }));

    //放大
    this.actions.get('zoomIn').funct = mxUtils.bind(this, function (evt) {
      graph.zoomIn();
      this.chromelessResize(false);
    });
    
    //缩小
    this.actions.get('zoomOut').funct = mxUtils.bind(this, function (evt) {
      graph.zoomOut();
      this.chromelessResize(false);
    });

    // Creates toolbar for viewer - do not use CSS here
    // as this may be used in a viewer that has no CSS
    //导航栏
    if (urlParams['toolbar'] != '0') {
      var toolbarConfig = JSON.parse(decodeURIComponent(urlParams['toolbar-config'] || '{}'));

			this.chromelessToolbar = document.createElement('div');
			this.chromelessToolbar.style.position = 'fixed';
			this.chromelessToolbar.style.overflow = 'hidden';
			this.chromelessToolbar.style.boxSizing = 'border-box';
			this.chromelessToolbar.style.whiteSpace = 'nowrap';
			this.chromelessToolbar.style.backgroundColor = '#000000';
			this.chromelessToolbar.style.padding = '10px 10px 8px 10px';
			this.chromelessToolbar.style.left = (graph.isViewer()) ? '0' : '50%';

      if (!mxClient.IS_VML) {
        mxUtils.setPrefixedStyle(this.chromelessToolbar.style, 'borderRadius', '20px');
        mxUtils.setPrefixedStyle(this.chromelessToolbar.style, 'transition', 'opacity 600ms ease-in-out');
      }

			var updateChromelessToolbarPosition = mxUtils.bind(this, function () {
				var css = mxUtils.getCurrentStyle(graph.container);

				if (graph.isViewer()) {
					this.chromelessToolbar.style.top = '0';
				} else {
					this.chromelessToolbar.style.bottom = ((css != null) ? parseInt(css['margin-bottom'] || 0) : 0) +
						((this.tabContainer != null) ? (20 + parseInt(this.tabContainer.style.height)) : 20) + 'px';
				}
			});

      this.editor.addListener('resetGraphView', updateChromelessToolbarPosition);
      updateChromelessToolbarPosition();

      var btnCount = 0;

      var addButton = mxUtils.bind(this, function (fn, imgSrc, tip) {
        btnCount++;
        var a = document.createElement('span');
        a.style.paddingLeft = '8px';
        a.style.paddingRight = '8px';
        a.style.cursor = 'pointer';
        mxEvent.addListener(a, 'click', fn);

        if (tip != null) {
          a.setAttribute('title', tip);
        }

        var img = document.createElement('img');
        img.setAttribute('border', '0');
        img.setAttribute('src', imgSrc);

        a.appendChild(img);
        this.chromelessToolbar.appendChild(a);
        return a;
      });

      if (toolbarConfig.backBtn != null) {
        addButton(mxUtils.bind(this, function (evt) {
          window.location.href = toolbarConfig.backBtn.url;
          mxEvent.consume(evt);
        }), Editor.backLargeImage, mxResources.get('back', null, 'Back'));
      }

			if (this.isPagesEnabled()) {
				var prevButton = addButton(mxUtils.bind(this, function (evt) {
					this.actions.get('previousPage').funct();
					mxEvent.consume(evt);
				}), Editor.previousLargeImage, mxResources.get('previousPage'));

      var pageInfo = document.createElement('div');
      pageInfo.style.display = 'inline-block';
      pageInfo.style.verticalAlign = 'top';
      pageInfo.style.fontFamily = 'Helvetica,Arial';
      pageInfo.style.marginTop = '8px';
      pageInfo.style.fontSize = '14px';
      pageInfo.style.color = '#ffffff';
      this.chromelessToolbar.appendChild(pageInfo);

      var nextButton = addButton(mxUtils.bind(this, function (evt) {
        this.actions.get('nextPage').funct();
        mxEvent.consume(evt);
      }), Editor.nextLargeImage, mxResources.get('nextPage'));

      var updatePageInfo = mxUtils.bind(this, function () {
        if (this.pages != null && this.pages.length > 1 && this.currentPage != null) {
          pageInfo.innerHTML = '';
          mxUtils.write(pageInfo, (mxUtils.indexOf(this.pages, this.currentPage) + 1) + ' / ' + this.pages.length);
        }
      });

      prevButton.style.paddingLeft = '0px';
      prevButton.style.paddingRight = '4px';
      nextButton.style.paddingLeft = '4px';
      nextButton.style.paddingRight = '0px';

      var updatePageButtons = mxUtils.bind(this, function () {
        if (this.pages != null && this.pages.length > 1 && this.currentPage != null) {
          nextButton.style.display = '';
          prevButton.style.display = '';
          pageInfo.style.display = 'inline-block';
        } else {
          nextButton.style.display = 'none';
          prevButton.style.display = 'none';
          pageInfo.style.display = 'none';
        }
        updatePageInfo();
      });

      this.editor.addListener('resetGraphView', updatePageButtons);
      this.editor.addListener('pageSelected', updatePageInfo);
    }
      //缩小
      addButton(mxUtils.bind(this, function (evt) {
        this.actions.get('zoomOut').funct();
        mxEvent.consume(evt);
      }), Editor.zoomOutLargeImage, mxResources.get('zoomOut') + ' (Alt+鼠标滚轮)');
      //放大
      addButton(mxUtils.bind(this, function (evt) {
        this.actions.get('zoomIn').funct();
        mxEvent.consume(evt);
      }), Editor.zoomInLargeImage, mxResources.get('zoomIn') + ' (Alt+鼠标滚轮)');

      addButton(mxUtils.bind(this, function (evt) {
        if (graph.isLightboxView()) {
          if (graph.view.scale == 1) {
            this.lightboxFit();
          } else {
            graph.zoomTo(1);
          }

          this.chromelessResize(false);
        } else {
          this.chromelessResize(true);
        }
        mxEvent.consume(evt);
      }), Editor.actualSizeLargeImage, mxResources.get('fit'));

      // Changes toolbar opacity on hover
      var fadeThread = null;
      var fadeThread2 = null;

			var fadeOut = mxUtils.bind(this, function (delay) {
				if (fadeThread != null) {
					window.clearTimeout(fadeThread);
					fadeThread = null;
				}

				if (fadeThread2 != null) {
					window.clearTimeout(fadeThread2);
					fadeThread2 = null;
				}

        fadeThread = window.setTimeout(mxUtils.bind(this, function () {
          mxUtils.setOpacity(this.chromelessToolbar, 0);
          fadeThread = null;

          fadeThread2 = window.setTimeout(mxUtils.bind(this, function () {
            this.chromelessToolbar.style.display = 'none';
            fadeThread2 = null;
          }), 600);
        }), delay || 200);
      });

			var fadeIn = mxUtils.bind(this, function (opacity) {
				if (fadeThread != null) {
					window.clearTimeout(fadeThread);
					fadeThread = null;
				}

				if (fadeThread2 != null) {
					window.clearTimeout(fadeThread2);
					fadeThread2 = null;
				}

        this.chromelessToolbar.style.display = '';
        mxUtils.setOpacity(this.chromelessToolbar, opacity || 30);
      });

      if (urlParams['layers'] == '1') {
        this.layersDialog = null;

        var layersButton = addButton(mxUtils.bind(this, function (evt) {
          if (this.layersDialog != null) {
            this.layersDialog.parentNode.removeChild(this.layersDialog);
            this.layersDialog = null;
          } else {
            this.layersDialog = graph.createLayersDialog();

            mxEvent.addListener(this.layersDialog, 'mouseleave', mxUtils.bind(this, function () {
              this.layersDialog.parentNode.removeChild(this.layersDialog);
              this.layersDialog = null;
            }));

            var r = layersButton.getBoundingClientRect();

            mxUtils.setPrefixedStyle(this.layersDialog.style, 'borderRadius', '5px');
            this.layersDialog.style.position = 'fixed';
            this.layersDialog.style.fontFamily = 'Helvetica,Arial';
            this.layersDialog.style.backgroundColor = '#000000';
            this.layersDialog.style.width = '160px';
            this.layersDialog.style.padding = '4px 2px 4px 2px';
            this.layersDialog.style.color = '#ffffff';
            mxUtils.setOpacity(this.layersDialog, 70);
            this.layersDialog.style.left = r.left + 'px';
            this.layersDialog.style.bottom = parseInt(this.chromelessToolbar.style.bottom) +
              this.chromelessToolbar.offsetHeight + 4 + 'px';

            // Puts the dialog on top of the container z-index
            var style = mxUtils.getCurrentStyle(this.editor.graph.container);
            this.layersDialog.style.zIndex = style.zIndex;

            document.body.appendChild(this.layersDialog);
          }
          mxEvent.consume(evt);
        }), Editor.layersLargeImage, mxResources.get('layers'));

        // Shows/hides layers button depending on content
        var model = graph.getModel();

        model.addListener(mxEvent.CHANGE, function () {
          layersButton.style.display = (model.getChildCount(model.root) > 1) ? '' : 'none';
        });
      }

      this.addChromelessToolbarItems(addButton);
      if (this.editor.editButtonLink != null || this.editor.editButtonFunc != null) {
        addButton(mxUtils.bind(this, function (evt) {
          if (this.editor.editButtonFunc != null) {
            this.editor.editButtonFunc();
          } else if (this.editor.editButtonLink == '_self') {
            this.editor.editAsNew(this.getEditBlankXml());
          } else {
            graph.openLink(this.editor.editButtonLink, 'editWindow');
          }
          mxEvent.consume(evt);
        }), Editor.editLargeImage, mxResources.get('edit'));
      }

      if (this.lightboxToolbarActions != null) {
        for (var i = 0; i < this.lightboxToolbarActions.length; i++) {
          var lbAction = this.lightboxToolbarActions[i];
          addButton(lbAction.fn, lbAction.icon, lbAction.tooltip);
        }
      }

      if (toolbarConfig.refreshBtn != null) {
        addButton(mxUtils.bind(this, function (evt) {
          if (toolbarConfig.refreshBtn.url) {
            window.location.href = toolbarConfig.refreshBtn.url;
          } else {
            window.location.reload();
          }
          mxEvent.consume(evt);
        }), Editor.refreshLargeImage, mxResources.get('refresh', null, 'Refresh'));
      }

      if (toolbarConfig.fullscreenBtn != null && window.self !== window.top) {
        addButton(mxUtils.bind(this, function (evt) {
          if (toolbarConfig.fullscreenBtn.url) {
            graph.openLink(toolbarConfig.fullscreenBtn.url);
          } else {
            graph.openLink(window.location.href);
          }
          mxEvent.consume(evt);
        }), Editor.fullscreenLargeImage, mxResources.get('openInNewWindow', null, 'Open in New Window'));
      }

      if ((toolbarConfig.closeBtn && window.self === window.top) ||
        (graph.lightbox && (urlParams['close'] == '1' || this.container != document.body))) {
        addButton(mxUtils.bind(this, function (evt) {
          if (urlParams['close'] == '1' || toolbarConfig.closeBtn) {
            window.close();
          } else {
            this.destroy();
            mxEvent.consume(evt);
          }
        }), Editor.closeLargeImage, mxResources.get('close') + ' (Escape)');
      }

			// Initial state invisible
			this.chromelessToolbar.style.display = 'none';

			if (!graph.isViewer()) {
				mxUtils.setPrefixedStyle(this.chromelessToolbar.style, 'transform', 'translate(-50%,0)');
			}

			graph.container.appendChild(this.chromelessToolbar);

      mxEvent.addListener(graph.container, (mxClient.IS_POINTER) ? 'pointermove' : 'mousemove', mxUtils.bind(this, function (evt) {
        if (!mxEvent.isTouchEvent(evt)) {
          if (!mxEvent.isShiftDown(evt)) {
            fadeIn(30);
          }
          fadeOut();
        }
      }));

      mxEvent.addListener(this.chromelessToolbar, (mxClient.IS_POINTER) ? 'pointermove' : 'mousemove', function (evt) {
        mxEvent.consume(evt);
      });

      mxEvent.addListener(this.chromelessToolbar, 'mouseenter', mxUtils.bind(this, function (evt) {
        if (!mxEvent.isShiftDown(evt)) {
          fadeIn(100);
        } else {
          fadeOut();
        }
      }));

      mxEvent.addListener(this.chromelessToolbar, 'mousemove', mxUtils.bind(this, function (evt) {
        if (!mxEvent.isShiftDown(evt)) {
          fadeIn(100);
        } else {
          fadeOut();
        }
        mxEvent.consume(evt);
      }));

      mxEvent.addListener(this.chromelessToolbar, 'mouseleave', mxUtils.bind(this, function (evt) {
        if (!mxEvent.isTouchEvent(evt)) {
          fadeIn(30);
        }
      }));

      // Shows/hides toolbar for touch devices
      var tol = graph.getTolerance();

      graph.addMouseListener({
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
        mouseDown: function (sender, me) {
          this.startX = me.getGraphX();
          this.startY = me.getGraphY();
          this.scrollLeft = graph.container.scrollLeft;
          this.scrollTop = graph.container.scrollTop;
        },
        mouseMove: function (sender, me) {},
        mouseUp: function (sender, me) {
          if (mxEvent.isTouchEvent(me.getEvent())) {
            if ((Math.abs(this.scrollLeft - graph.container.scrollLeft) < tol &&
                Math.abs(this.scrollTop - graph.container.scrollTop) < tol) &&
              (Math.abs(this.startX - me.getGraphX()) < tol &&
                Math.abs(this.startY - me.getGraphY()) < tol)) {
              if (parseFloat(ui.chromelessToolbar.style.opacity || 0) > 0) {
                fadeOut();
              } else {
                fadeIn(30);
              }
            }
          }
        }
      });
    } // end if toolbar

    // Installs handling of highlight and handling links to relative links and anchors
    if (!this.editor.editable) {
      this.addChromelessClickHandler();
    }
  } else if (this.editor.extendCanvas) {
    /**
     * Guesses autoTranslate to avoid another repaint (see below).
     * Works if only the scale of the graph changes or if pages
     * are visible and the visible pages do not change.
     */
    var graphViewValidate = graph.view.validate;
    graph.view.validate = function () {
      if (this.graph.container != null && mxUtils.hasScrollbars(this.graph.container)) {
        var pad = this.graph.getPagePadding();
        var size = this.graph.getPageSize();

        // Updating scrollbars here causes flickering in quirks and is not needed
        // if zoom method is always used to set the current scale on the graph.
        var tx = this.translate.x;
        var ty = this.translate.y;
        this.translate.x = pad.x - (this.x0 || 0) * size.width;
        this.translate.y = pad.y - (this.y0 || 0) * size.height;
      }
      graphViewValidate.apply(this, arguments);
    };

		if (!graph.isViewer()) {
			var graphSizeDidChange = graph.sizeDidChange;

			graph.sizeDidChange = function () {
				if (this.container != null && mxUtils.hasScrollbars(this.container)) {
					var pages = this.getPageLayout();
					var pad = this.getPagePadding();
					var size = this.getPageSize();

        // Updates the minimum graph size
        var minw = Math.ceil(2 * pad.x + pages.width * size.width);
        var minh = Math.ceil(2 * pad.y + pages.height * size.height);
        var min = graph.minimumGraphSize;

        // LATER: Fix flicker of scrollbar size in IE quirks mode
        // after delayed call in window.resize event handler
        if (min == null || min.width != minw || min.height != minh) {
          graph.minimumGraphSize = new mxRectangle(0, 0, minw, minh);
        }

        // Updates auto-translate to include padding and graph size
        var dx = pad.x - pages.x * size.width;
        var dy = pad.y - pages.y * size.height;

        if (!this.autoTranslate && (this.view.translate.x != dx || this.view.translate.y != dy)) {
          this.autoTranslate = true;
          this.view.x0 = pages.x;
          this.view.y0 = pages.y;

          // NOTE: THIS INVOKES THIS METHOD AGAIN. UNFORTUNATELY THERE IS NO WAY AROUND THIS SINCE THE
          // BOUNDS ARE KNOWN AFTER THE VALIDATION AND SETTING THE TRANSLATE TRIGGERS A REVALIDATION.
          // SHOULD MOVE TRANSLATE/SCALE TO VIEW.
          var tx = graph.view.translate.x;
          var ty = graph.view.translate.y;
          graph.view.setTranslate(dx, dy);

						// LATER: Fix rounding errors for small zoom
						graph.container.scrollLeft += Math.round((dx - tx) * graph.view.scale);
						graph.container.scrollTop += Math.round((dy - ty) * graph.view.scale);

						this.autoTranslate = false;

						return;
					}

					graphSizeDidChange.apply(this, arguments);
				} else {
					// Fires event but does not invoke superclass
					this.fireEvent(new mxEventObject(mxEvent.SIZE, 'bounds', this.getGraphBounds()));
				}
			};
		}
	}

	// Accumulates the zoom factor while the rendering is taking place
	// so that not the complete sequence of zoom steps must be painted
	var bgGroup = graph.view.getBackgroundPane();
	var mainGroup = graph.view.getDrawPane();
	graph.cumulativeZoomFactor = 1;
	var updateZoomTimeout = null;
	var cursorPosition = null;
	var scrollPosition = null;
	var filter = null;

	var scheduleZoom = function (delay) {
		if (updateZoomTimeout != null) {
			window.clearTimeout(updateZoomTimeout);
		}

		window.setTimeout(function () {
			if (!graph.isMouseDown) {
				updateZoomTimeout = window.setTimeout(mxUtils.bind(this, function () {
					if (graph.isFastZoomEnabled()) {
						// Transforms background page
						if (graph.view.backgroundPageShape != null && graph.view.backgroundPageShape.node != null) {
							mxUtils.setPrefixedStyle(graph.view.backgroundPageShape.node.style, 'transform-origin', null);
							mxUtils.setPrefixedStyle(graph.view.backgroundPageShape.node.style, 'transform', null);
						}

						// Transforms graph and background image
						mainGroup.style.transformOrigin = '';
						bgGroup.style.transformOrigin = '';

						// Workaround for no reset of transform in Safari
						if (mxClient.IS_SF) {
							mainGroup.style.transform = 'scale(1)';
							bgGroup.style.transform = 'scale(1)';

							window.setTimeout(function () {
								mainGroup.style.transform = '';
								bgGroup.style.transform = '';
							}, 0)
						} else {
							mainGroup.style.transform = '';
							bgGroup.style.transform = '';
						}

						// Shows interactive elements
						graph.view.getDecoratorPane().style.opacity = '';
						graph.view.getOverlayPane().style.opacity = '';
					}

					var sp = new mxPoint(graph.container.scrollLeft, graph.container.scrollTop);
					var offset = mxUtils.getOffset(graph.container);
					var prev = graph.view.scale;
					var dx = 0;
					var dy = 0;

					if (cursorPosition != null) {
						dx = graph.container.offsetWidth / 2 - cursorPosition.x + offset.x;
						dy = graph.container.offsetHeight / 2 - cursorPosition.y + offset.y;
					}

					graph.zoom(graph.cumulativeZoomFactor);
					var s = graph.view.scale;

					if (s != prev) {
						if (scrollPosition != null) {
							dx += sp.x - scrollPosition.x;
							dy += sp.y - scrollPosition.y;
						}

						if (resize != null) {
							ui.chromelessResize(false, null, dx * (graph.cumulativeZoomFactor - 1),
								dy * (graph.cumulativeZoomFactor - 1));
						}

						if (mxUtils.hasScrollbars(graph.container) && (dx != 0 || dy != 0)) {
							graph.container.scrollLeft -= dx * (graph.cumulativeZoomFactor - 1);
							graph.container.scrollTop -= dy * (graph.cumulativeZoomFactor - 1);
						}
					}

					if (filter != null) {
						mainGroup.setAttribute('filter', filter);
					}

					graph.cumulativeZoomFactor = 1;
					updateZoomTimeout = null;
					scrollPosition = null;
					cursorPosition = null;
					filter = null;
				}), (delay != null) ? delay : ((graph.isFastZoomEnabled()) ? ui.wheelZoomDelay : ui.lazyZoomDelay));
			}
		}, 0);
	};

	graph.lazyZoom = function (zoomIn, ignoreCursorPosition, delay) {
		// TODO: Fix ignored cursor position if scrollbars are disabled
		ignoreCursorPosition = ignoreCursorPosition || !graph.scrollbars;

		if (ignoreCursorPosition) {
			cursorPosition = new mxPoint(
				graph.container.offsetLeft + graph.container.clientWidth / 2,
				graph.container.offsetTop + graph.container.clientHeight / 2);
		}

		// Switches to 5% zoom steps below 15%
		if (zoomIn) {
			if (this.view.scale * this.cumulativeZoomFactor <= 0.15) {
				this.cumulativeZoomFactor *= (this.view.scale + 0.05) / this.view.scale;
			} else {
				// Uses to 5% zoom steps for better grid rendering in webkit
				// and to avoid rounding errors for zoom steps
				this.cumulativeZoomFactor *= this.zoomFactor;
				this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 20) / 20 / this.view.scale;
			}
		} else {
			if (this.view.scale * this.cumulativeZoomFactor <= 0.15) {
				this.cumulativeZoomFactor *= (this.view.scale - 0.05) / this.view.scale;
			} else {
				// Uses to 5% zoom steps for better grid rendering in webkit
				// and to avoid rounding errors for zoom steps
				this.cumulativeZoomFactor /= this.zoomFactor;
				this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 20) / 20 / this.view.scale;
			}
		}

		this.cumulativeZoomFactor = Math.max(0.05, Math.min(this.view.scale * this.cumulativeZoomFactor, 160)) / this.view.scale;

		if (graph.isFastZoomEnabled()) {
			if (filter == null && mainGroup.getAttribute('filter') != '') {
				filter = mainGroup.getAttribute('filter');
				mainGroup.removeAttribute('filter');
			}

			scrollPosition = new mxPoint(graph.container.scrollLeft, graph.container.scrollTop);

			var cx = (ignoreCursorPosition) ? graph.container.scrollLeft + graph.container.clientWidth / 2 :
				cursorPosition.x + graph.container.scrollLeft - graph.container.offsetLeft;
			var cy = (ignoreCursorPosition) ? graph.container.scrollTop + graph.container.clientHeight / 2 :
				cursorPosition.y + graph.container.scrollTop - graph.container.offsetTop;
			mainGroup.style.transformOrigin = cx + 'px ' + cy + 'px';
			mainGroup.style.transform = 'scale(' + this.cumulativeZoomFactor + ')';
			bgGroup.style.transformOrigin = cx + 'px ' + cy + 'px';
			bgGroup.style.transform = 'scale(' + this.cumulativeZoomFactor + ')';

			if (graph.view.backgroundPageShape != null && graph.view.backgroundPageShape.node != null) {
				var page = graph.view.backgroundPageShape.node;

				mxUtils.setPrefixedStyle(page.style, 'transform-origin',
					((ignoreCursorPosition) ? ((graph.container.clientWidth / 2 + graph.container.scrollLeft -
						page.offsetLeft) + 'px') : ((cursorPosition.x + graph.container.scrollLeft -
						page.offsetLeft - graph.container.offsetLeft) + 'px')) + ' ' +
					((ignoreCursorPosition) ? ((graph.container.clientHeight / 2 + graph.container.scrollTop -
						page.offsetTop) + 'px') : ((cursorPosition.y + graph.container.scrollTop -
						page.offsetTop - graph.container.offsetTop) + 'px')));
				mxUtils.setPrefixedStyle(page.style, 'transform',
					'scale(' + this.cumulativeZoomFactor + ')');
			}

			graph.view.getDecoratorPane().style.opacity = '0';
			graph.view.getOverlayPane().style.opacity = '0';

			if (ui.hoverIcons != null) {
				ui.hoverIcons.reset();
			}
		}

		scheduleZoom(delay);
	};

	// Holds back repaint until after mouse gestures
	mxEvent.addGestureListeners(graph.container, function (evt) {
		if (updateZoomTimeout != null) {
			window.clearTimeout(updateZoomTimeout);
		}
	}, null, function (evt) {
		if (graph.cumulativeZoomFactor != 1) {
			scheduleZoom(0);
		}
	});

	// Holds back repaint until scroll ends
	mxEvent.addListener(graph.container, 'scroll', function () {
		if (updateZoomTimeout && !graph.isMouseDown && graph.cumulativeZoomFactor != 1) {
			scheduleZoom(0);
		}
	});

	mxEvent.addMouseWheelListener(mxUtils.bind(this, function (evt, up, force, cx, cy) {
		if (this.dialogs == null || this.dialogs.length == 0) {
			// Scrolls with scrollbars turned off
			if (!graph.scrollbars && graph.isScrollWheelEvent(evt)) {
				var t = graph.view.getTranslate();
				var step = 40 / graph.view.scale;

				if (!mxEvent.isShiftDown(evt)) {
					graph.view.setTranslate(t.x, t.y + ((up) ? step : -step));
				} else {
					graph.view.setTranslate(t.x + ((up) ? -step : step), t.y);
				}
			} else if (force || graph.isZoomWheelEvent(evt)) {
				var source = mxEvent.getSource(evt);

				while (source != null) {
					if (source == graph.container) {
						graph.tooltipHandler.hideTooltip();
						cursorPosition = (cx != null && cy != null) ? new mxPoint(cx, cy) :
							new mxPoint(mxEvent.getClientX(evt), mxEvent.getClientY(evt));
						graph.lazyZoom(up);
            mxEvent.consume(evt);
            
						return false;
					}

					source = source.parentNode;
				}
			}
		}
  }), graph.container);	

  // Uses fast zoom for pinch gestures on iOS
	graph.panningHandler.zoomGraph = function (evt) {
		graph.cumulativeZoomFactor = evt.scale;
		graph.lazyZoom(evt.scale > 0, true);
		mxEvent.consume(evt);
	};
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.addChromelessToolbarItems = function (addButton) {
  addButton(mxUtils.bind(this, function (evt) {
    this.actions.get('print').funct();
    mxEvent.consume(evt);
  }), Editor.printLargeImage, mxResources.get('print'));
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.isPagesEnabled = function () {
	return this.editor.editable || urlParams['hide-pages'] != '1';
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.createTemporaryGraph = function (stylesheet) {
	var graph = new Graph(document.createElement('div'));
	graph.stylesheet.styles = mxUtils.clone(stylesheet.styles);
	graph.resetViewOnRootChange = false;
	graph.setConnectable(false);
	graph.gridEnabled = false;
	graph.autoScroll = false;
	graph.setTooltips(false);
	graph.setEnabled(false);

  // Container must be in the DOM for correct HTML rendering
  graph.container.style.visibility = 'hidden';
  graph.container.style.position = 'absolute';
  graph.container.style.overflow = 'hidden';
  graph.container.style.height = '1px';
  graph.container.style.width = '1px';
  return graph;
};

/**
 * 
 */
EditorUi.prototype.addChromelessClickHandler = function () {
  var hl = urlParams['highlight'];

  // Adds leading # for highlight color code
  if (hl != null && hl.length > 0) {
    hl = '#' + hl;
  }
  this.editor.graph.addClickHandler(hl);
};

/**
 * 右侧设置菜单是否显示方法
 */
EditorUi.prototype.toggleFormatPanel = function (visible) {
	visible = (visible != null) ? visible : this.formatWidth == 0;

	if (this.format != null) {
		this.formatWidth = (visible) ? 240 : 0;
		this.formatContainer.style.display = (visible) ? '' : 'none';
		this.refresh();
		this.format.refresh();
		this.fireEvent(new mxEventObject('formatWidthChanged'));
	}
};

/**
 * Adds support for placeholders in labels.
 */
EditorUi.prototype.lightboxFit = function (maxHeight) {
  if (this.isDiagramEmpty()) {
    this.editor.graph.view.setScale(1);
  } else {
    var p = urlParams['border'];
    var border = 60;

    if (p != null) {
      border = parseInt(p);
    }

    // LATER: Use initial graph bounds to avoid rounding errors
    this.editor.graph.maxFitScale = this.lightboxMaxFitScale;
    this.editor.graph.fit(border, null, null, null, null, null, maxHeight);
    this.editor.graph.maxFitScale = null;
  }
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.isDiagramEmpty = function () {
  var model = this.editor.graph.getModel();
  return model.getChildCount(model.root) == 1 && model.getChildCount(model.getChildAt(model.root, 0)) == 0;
};

/**
 * Hook for allowing selection and context menu for certain events.
 */
EditorUi.prototype.isSelectionAllowed = function (evt) {
  return mxEvent.getSource(evt).nodeName == 'SELECT' || (mxEvent.getSource(evt).nodeName == 'INPUT' &&
    mxUtils.isAncestorNode(this.formatContainer, mxEvent.getSource(evt)));
};

/**
 * Installs dialog if browser window is closed without saving
 * This must be disabled during save and image export.
 */
EditorUi.prototype.addBeforeUnloadListener = function () {
  // Installs dialog if browser window is closed without saving
  // This must be disabled during save and image export
  window.onbeforeunload = mxUtils.bind(this, function () {
    if (!this.editor.isChromelessView()) {
      return this.onBeforeUnload();
    }
  });
};

/**
 * Sets the onbeforeunload for the application
 */
EditorUi.prototype.onBeforeUnload = function () {
  if (this.editor.modified) {
    return mxResources.get('allChangesLost');
  }
};

/**
 * 直接读取xml 到视图更新的方法
 */
EditorUi.prototype.open2 = function (xml, filename, id) {
  try {
    var doc = mxUtils.parseXml(xml);
    this.editor.setGraphXml(doc.documentElement);
    this.editor.setModified(false);
    this.editor.undoManager.clear();
    this.editor.editId = id;
    if (filename != null) {
      this.editor.setFilename(filename);
      this.updateDocumentTitle();
    }
    return false;
  } catch (e) {
    mxUtils.alert(mxResources.get('invalidOrMissingFile') + ': ' + e.message);
  }
}

/**
 * Opens the current diagram via the window.opener if one exists.
 */
EditorUi.prototype.open = function () {
  // Cross-domain window access is not allowed in FF, so if we
  // were opened from another domain then this will fail.
  try {
    if (window.opener != null && window.opener.openFile != null) {
      window.opener.openFile.setConsumer(mxUtils.bind(this, function (xml, filename) {
        try {
          var doc = mxUtils.parseXml(xml);
          this.editor.setGraphXml(doc.documentElement);
          this.editor.setModified(false);
          this.editor.undoManager.clear();

          if (filename != null) {
            this.editor.setFilename(filename);
            this.updateDocumentTitle();
          }
          return;
        } catch (e) {
          mxUtils.alert(mxResources.get('invalidOrMissingFile') + ': ' + e.message);
        }
      }));
    }
  } catch (e) {
    // ignore
  }

  // Fires as the last step if no file was loaded
  this.editor.graph.view.validate();

	// Required only in special cases where an initial file is opened
	// and the minimumGraphSize changes and CSS must be updated.
	this.editor.graph.sizeDidChange();
	this.editor.fireEvent(new mxEventObject('resetGraphView'));
};

/**
 * Shows the given popup menu.
 */
EditorUi.prototype.showPopupMenu = function (fn, x, y, evt) {
	this.editor.graph.popupMenuHandler.hideMenu();

	var menu = new mxPopupMenu(fn);
	menu.div.className += ' geMenubarMenu';
	menu.smartSeparators = true;
	menu.showDisabled = true;
	menu.autoExpand = true;

	// Disables autoexpand and destroys menu when hidden
	menu.hideMenu = mxUtils.bind(this, function () {
		mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
		menu.destroy();
	});

	menu.popup(x, y, null, evt);

	// Allows hiding by clicking on document
	this.setCurrentMenu(menu);
};

/**
 * Sets the current menu and element.
 */
EditorUi.prototype.setCurrentMenu = function (menu, elt) {
  this.currentMenuElt = elt;
  this.currentMenu = menu;
};

/**
 * Resets the current menu and element.
 */
EditorUi.prototype.resetCurrentMenu = function () {
  this.currentMenuElt = null;
  this.currentMenu = null;
};

/**
 * Hides and destroys the current menu.
 */
EditorUi.prototype.hideCurrentMenu = function () {
  if (this.currentMenu != null) {
    this.currentMenu.hideMenu();
    this.resetCurrentMenu();
  }
};

/**
 * Updates the document title.
 */
EditorUi.prototype.updateDocumentTitle = function () {
  var title = this.editor.getOrCreateFilename();

  if (this.editor.appName != null) {
    title += ' - ' + this.editor.appName;
  }
  document.title = title;
};

/**
 * Updates the document title.
 */
EditorUi.prototype.createHoverIcons = function () {
  return new HoverIcons(this.editor.graph);
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.redo = function () {
  try {
    var graph = this.editor.graph;
    if (graph.isEditing()) {
      document.execCommand('redo', false, null);
    } else {
      this.editor.undoManager.redo();
    }
  } catch (e) {
    // ignore all errors
  }
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.undo = function () {
  try {
    var graph = this.editor.graph;
    if (graph.isEditing()) {
      // Stops editing and executes undo on graph if native undo
      // does not affect current editing value
      var value = graph.cellEditor.textarea.innerHTML;
      document.execCommand('undo', false, null);
      if (value == graph.cellEditor.textarea.innerHTML) {
        graph.stopEditing(true);
        this.editor.undoManager.undo();
      }
    } else {
      this.editor.undoManager.undo();
    }
  } catch (e) {
    // ignore all errors
  }
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.canRedo = function () {
  return this.editor.graph.isEditing() || this.editor.undoManager.canRedo();
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.canUndo = function () {
  return this.editor.graph.isEditing() || this.editor.undoManager.canUndo();
};

/**
 * 
 */
EditorUi.prototype.getEditBlankXml = function () {
  return mxUtils.getXml(this.editor.getGraphXml());
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.getUrl = function (pathname) {

  var href = (pathname != null) ? pathname : window.location.pathname;
  var parms = (href.indexOf('?') > 0) ? 1 : 0;
  // Removes template URL parameter for new blank diagram
  for (var key in urlParams) {
    if (parms == 0) {
      href += '?';
    } else {
      href += '&';
    }

    href += key + '=' + urlParams[key];
    parms++;
  }
  return href;
};

/**
 * Specifies if the graph has scrollbars.
 */
EditorUi.prototype.setScrollbars = function (value) {
  var graph = this.editor.graph;
  var prev = graph.container.style.overflow;
  graph.scrollbars = value;
  this.editor.updateGraphComponents();

	if (prev != graph.container.style.overflow) {
		graph.container.scrollTop = 0;
		graph.container.scrollLeft = 0;
		graph.view.scaleAndTranslate(1, 0, 0);
		this.resetScrollbars();
	}

	this.fireEvent(new mxEventObject('scrollbarsChanged'));
};

/**
 * Returns true if the graph has scrollbars.
 */
EditorUi.prototype.hasScrollbars = function () {
  return this.editor.graph.scrollbars;
};

/**
 * Resets the state of the scrollbars.
 */
EditorUi.prototype.resetScrollbars = function () {
  var graph = this.editor.graph;

  if (!this.editor.extendCanvas) {
    graph.container.scrollTop = 0;
    graph.container.scrollLeft = 0;

    if (!mxUtils.hasScrollbars(graph.container)) {
      graph.view.setTranslate(0, 0);
    }
  } else if (!this.editor.isChromelessView()) {
    if (mxUtils.hasScrollbars(graph.container)) {
      if (graph.pageVisible) {
        var pad = graph.getPagePadding();
        graph.container.scrollTop = Math.floor(pad.y - this.editor.initialTopSpacing) - 1;
        graph.container.scrollLeft = Math.floor(Math.min(pad.x,
          (graph.container.scrollWidth - graph.container.clientWidth) / 2)) - 1;

        // Scrolls graph to visible area
        var bounds = graph.getGraphBounds();

        if (bounds.width > 0 && bounds.height > 0) {
          if (bounds.x > graph.container.scrollLeft + graph.container.clientWidth * 0.9) {
            graph.container.scrollLeft = Math.min(bounds.x + bounds.width - graph.container.clientWidth, bounds.x - 10);
          }

					if (bounds.y > graph.container.scrollTop + graph.container.clientHeight * 0.9) {
						graph.container.scrollTop = Math.min(bounds.y + bounds.height - graph.container.clientHeight, bounds.y - 10);
					}
				}
			} else {
				var bounds = graph.getGraphBounds();
				var width = Math.max(bounds.width, graph.scrollTileSize.width * graph.view.scale);
				var height = Math.max(bounds.height, graph.scrollTileSize.height * graph.view.scale);
				graph.container.scrollTop = Math.floor(Math.max(0, bounds.y - Math.max(20, (graph.container.clientHeight - height) / 4)));
				graph.container.scrollLeft = Math.floor(Math.max(0, bounds.x - Math.max(0, (graph.container.clientWidth - width) / 2)));
			}
		} else {
			var b = mxRectangle.fromRectangle((graph.pageVisible) ? graph.view.getBackgroundPageBounds() : graph.getGraphBounds())
			var tr = graph.view.translate;
			var s = graph.view.scale;
			b.x = b.x / s - tr.x;
			b.y = b.y / s - tr.y;
			b.width /= s;
			b.height /= s;

			var dy = (graph.pageVisible) ? 0 : Math.max(0, (graph.container.clientHeight - b.height) / 4);

			graph.view.setTranslate(Math.floor(Math.max(0,
					(graph.container.clientWidth - b.width) / 2) - b.x + 2),
				Math.floor(dy - b.y + 1));
		}
	}
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setPageVisible = function (value) {
  var graph = this.editor.graph;
  var hasScrollbars = mxUtils.hasScrollbars(graph.container);
  var tx = 0;
  var ty = 0;

  if (hasScrollbars) {
    tx = graph.view.translate.x * graph.view.scale - graph.container.scrollLeft;
    ty = graph.view.translate.y * graph.view.scale - graph.container.scrollTop;
  }

  graph.pageVisible = value;
  graph.pageBreaksVisible = value;
  graph.preferPageSize = value;
  graph.view.validateBackground();

  // Workaround for possible handle offset
  if (hasScrollbars) {
    var cells = graph.getSelectionCells();
    graph.clearSelection();
    graph.setSelectionCells(cells);
  }

  // Calls updatePageBreaks
  graph.sizeDidChange();

  if (hasScrollbars) {
    graph.container.scrollLeft = graph.view.translate.x * graph.view.scale - tx;
    graph.container.scrollTop = graph.view.translate.y * graph.view.scale - ty;
  }
  this.fireEvent(new mxEventObject('pageViewChanged'));
};

/**
 * Class: ChangeGridColor
 *
 * Undoable change to grid color.
 */
function ChangeGridColor(ui, color) {
	this.ui = ui;
	this.color = color;
};

/**
 * Executes selection of a new page.
 */
ChangeGridColor.prototype.execute = function () {
	var temp = this.ui.editor.graph.view.gridColor;
	this.ui.setGridColor(this.color);
	this.color = temp;
};

// Registers codec for ChangePageSetup
(function () {
	var codec = new mxObjectCodec(new ChangeGridColor(), ['ui']);

	mxCodecRegistry.register(codec);
})();

/**
 * Change types
 */
function ChangePageSetup(ui, color, image, format, pageScale) {
	this.ui = ui;
	this.color = color;
	this.previousColor = color;
	this.image = image;
	this.previousImage = image;
	this.format = format;
	this.previousFormat = format;
	this.pageScale = pageScale;
	this.previousPageScale = pageScale;

  // Needed since null are valid values for color and image
  this.ignoreColor = false;
  this.ignoreImage = false;
}

/**
 * Implementation of the undoable page rename.
 */
ChangePageSetup.prototype.execute = function () {
  var graph = this.ui.editor.graph;

  if (!this.ignoreColor) {
    this.color = this.previousColor;
    var tmp = graph.background;
    this.ui.setBackgroundColor(this.previousColor);
    this.previousColor = tmp;
  }

  if (!this.ignoreImage) {
    this.image = this.previousImage;
    var tmp = graph.backgroundImage;
    this.ui.setBackgroundImage(this.previousImage);
    this.previousImage = tmp;
  }

  if (this.previousFormat != null) {
    this.format = this.previousFormat;
    var tmp = graph.pageFormat;

    if (this.previousFormat.width != tmp.width ||
      this.previousFormat.height != tmp.height) {
      this.ui.setPageFormat(this.previousFormat);
      this.previousFormat = tmp;
    }
  }

	if (this.foldingEnabled != null && this.foldingEnabled != this.ui.editor.graph.foldingEnabled) {
		this.ui.setFoldingEnabled(this.foldingEnabled);
		this.foldingEnabled = !this.foldingEnabled;
	}

	if (this.previousPageScale != null) {
		var currentPageScale = this.ui.editor.graph.pageScale;

		if (this.previousPageScale != currentPageScale) {
			this.ui.setPageScale(this.previousPageScale);
			this.previousPageScale = currentPageScale;
		}
	}
};

// Registers codec for ChangePageSetup
(function () {
	var codec = new mxObjectCodec(new ChangePageSetup(), ['ui', 'previousColor', 'previousImage', 'previousFormat', 'previousPageScale']);

	codec.afterDecode = function (dec, node, obj) {
		obj.previousColor = obj.color;
		obj.previousImage = obj.image;
		obj.previousFormat = obj.format;
		obj.previousPageScale = obj.pageScale;

		if (obj.foldingEnabled != null) {
			obj.foldingEnabled = !obj.foldingEnabled;
		}

		return obj;
	};

	mxCodecRegistry.register(codec);
})();

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setBackgroundColor = function (value) {
  this.editor.graph.background = value;
  this.editor.graph.view.validateBackground();

  this.fireEvent(new mxEventObject('backgroundColorChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setFoldingEnabled = function (value) {
  this.editor.graph.foldingEnabled = value;
  this.editor.graph.view.revalidate();
  this.fireEvent(new mxEventObject('foldingEnabledChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setPageFormat = function (value) {
  this.editor.graph.pageFormat = value;

  if (!this.editor.graph.pageVisible) {
    this.actions.get('pageView').funct();
  } else {
    this.editor.graph.view.validateBackground();
    this.editor.graph.sizeDidChange();
  }
  this.fireEvent(new mxEventObject('pageFormatChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setPageScale = function (value) {
  this.editor.graph.pageScale = value;

  if (!this.editor.graph.pageVisible) {
    this.actions.get('pageView').funct();
  } else {
    this.editor.graph.view.validateBackground();
    this.editor.graph.sizeDidChange();
  }
  this.fireEvent(new mxEventObject('pageScaleChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setGridColor = function (value) {
  this.editor.graph.view.gridColor = value;
  this.editor.graph.view.validateBackground();
  this.fireEvent(new mxEventObject('gridColorChanged'));
};

/**
 * Updates the states of the given undo/redo items.
 */
EditorUi.prototype.addUndoListener = function () {
  var undo = this.actions.get('undo');
  var redo = this.actions.get('redo');

  var undoMgr = this.editor.undoManager;

  var undoListener = mxUtils.bind(this, function () {
    undo.setEnabled(this.canUndo());
    redo.setEnabled(this.canRedo());
  });

  undoMgr.addListener(mxEvent.ADD, undoListener);
  undoMgr.addListener(mxEvent.UNDO, undoListener);
  undoMgr.addListener(mxEvent.REDO, undoListener);
  undoMgr.addListener(mxEvent.CLEAR, undoListener);

  // Overrides cell editor to update action states
  var cellEditorStartEditing = this.editor.graph.cellEditor.startEditing;

  this.editor.graph.cellEditor.startEditing = function () {
    cellEditorStartEditing.apply(this, arguments);
    undoListener();
  };

  var cellEditorStopEditing = this.editor.graph.cellEditor.stopEditing;

  this.editor.graph.cellEditor.stopEditing = function (cell, trigger) {
    cellEditorStopEditing.apply(this, arguments);
    undoListener();
  };
  // Updates the button states once
  undoListener();
};

/**
 * Updates the states of the given toolbar items based on the selection.
 */
EditorUi.prototype.updateActionStates = function () {
	var graph = this.editor.graph;
	var selected = !graph.isSelectionEmpty();
	var vertexSelected = false;
	var groupSelected = false;
	var edgeSelected = false;

  var cells = graph.getSelectionCells();

  if (cells != null) {
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];

      if (graph.getModel().isEdge(cell)) {
        edgeSelected = true;
      }

			if (graph.getModel().isVertex(cell)) {
				vertexSelected = true;

				if (graph.getModel().getChildCount(cell) > 0 ||
					graph.isContainer(cell)) {
					groupSelected = true;
				}
			}

      if (edgeSelected && vertexSelected) {
        break;
      }
    }
  }

  // Updates action states
  var actions = ['cut', 'copy', 'bold', 'italic', 'underline', 'addDeviceType', 'bindingDeviceId', 'bindXMLName', 'delete', 'duplicate',
    'editStyle', 'editTooltip', 'editLink', 'backgroundColor', 'borderColor',
    'edit', 'toFront', 'toBack', 'lockUnlock', 'solid', 'dashed', 'pasteSize',
    'dotted', 'fillColor', 'gradientColor', 'shadow', 'fontColor',
    'formattedText', 'rounded', 'toggleRounded', 'sharp', 'strokeColor'
  ];

  for (var i = 0; i < actions.length; i++) {
    this.actions.get(actions[i]).setEnabled(selected);
  }

	this.actions.get('setAsDefaultStyle').setEnabled(graph.getSelectionCount() == 1);
	this.actions.get('clearWaypoints').setEnabled(!graph.isSelectionEmpty());
	this.actions.get('copySize').setEnabled(graph.getSelectionCount() == 1);
	this.actions.get('turn').setEnabled(!graph.isSelectionEmpty());
	this.actions.get('curved').setEnabled(edgeSelected);
	this.actions.get('rotation').setEnabled(vertexSelected);
	this.actions.get('wordWrap').setEnabled(vertexSelected);
	this.actions.get('autosize').setEnabled(vertexSelected);
	var oneVertexSelected = vertexSelected && graph.getSelectionCount() == 1;
	this.actions.get('group').setEnabled(graph.getSelectionCount() > 1 ||
		(oneVertexSelected && !graph.isContainer(graph.getSelectionCell())));
	this.actions.get('ungroup').setEnabled(groupSelected);
	this.actions.get('removeFromGroup').setEnabled(oneVertexSelected &&
		graph.getModel().isVertex(graph.getModel().getParent(graph.getSelectionCell())));

  // Updates menu states
  var state = graph.view.getState(graph.getSelectionCell());
  this.menus.get('navigation').setEnabled(selected || graph.view.currentRoot != null);
  this.actions.get('collapsible').setEnabled(vertexSelected &&
    (graph.isContainer(graph.getSelectionCell()) || graph.model.getChildCount(graph.getSelectionCell()) > 0));
  this.actions.get('home').setEnabled(graph.view.currentRoot != null);
  this.actions.get('exitGroup').setEnabled(graph.view.currentRoot != null);
  this.actions.get('enterGroup').setEnabled(graph.getSelectionCount() == 1 && graph.isValidRoot(graph.getSelectionCell()));
  var foldable = graph.getSelectionCount() == 1 && graph.isCellFoldable(graph.getSelectionCell());
  this.actions.get('expand').setEnabled(foldable);
  this.actions.get('collapse').setEnabled(foldable);
  this.actions.get('editLink').setEnabled(graph.getSelectionCount() == 1);
  this.actions.get('openLink').setEnabled(graph.getSelectionCount() == 1 &&
    graph.getLinkForCell(graph.getSelectionCell()) != null);
  this.actions.get('guides').setEnabled(graph.isEnabled());
  this.actions.get('grid').setEnabled(!this.editor.chromeless || this.editor.editable);

	var unlocked = graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent());
	this.menus.get('layout').setEnabled(unlocked);
	this.menus.get('insert').setEnabled(unlocked);
	this.menus.get('direction').setEnabled(unlocked && vertexSelected);
	this.menus.get('align').setEnabled(unlocked && vertexSelected && graph.getSelectionCount() > 1);
	this.menus.get('distribute').setEnabled(unlocked && vertexSelected && graph.getSelectionCount() > 1);
	this.actions.get('selectVertices').setEnabled(unlocked);
	this.actions.get('selectEdges').setEnabled(unlocked);
	this.actions.get('selectAll').setEnabled(unlocked);
	this.actions.get('selectNone').setEnabled(unlocked);

	this.updatePasteActionStates();
};

EditorUi.prototype.zeroOffset = new mxPoint(0, 0);

EditorUi.prototype.getDiagramContainerOffset = function () {
	return this.zeroOffset;
};

/**
 * Refreshes the viewport.
 */
EditorUi.prototype.refresh = function (sizeDidChange) {
  sizeDidChange = (sizeDidChange != null) ? sizeDidChange : true;

  var quirks = mxClient.IS_IE && (document.documentMode == null || document.documentMode == 5);
  var w = this.container.clientWidth;
  var h = this.container.clientHeight;

  if (this.container == document.body) {
    w = document.body.clientWidth || document.documentElement.clientWidth;
    h = (quirks) ? document.body.clientHeight || document.documentElement.clientHeight : document.documentElement.clientHeight;
  }

  // Workaround for bug on iOS see
  // http://stackoverflow.com/questions/19012135/ios-7-ipad-safari-landscape-innerheight-outerheight-layout-issue
  // FIXME: Fix if footer visible
  var off = 0;

  if (mxClient.IS_IOS && !window.navigator.standalone) {
    if (window.innerHeight != document.documentElement.clientHeight) {
      off = document.documentElement.clientHeight - window.innerHeight;
      window.scrollTo(0, 0);
    }
  }

  var effHsplitPosition = Math.max(0, Math.min(this.hsplitPosition, w - this.splitSize - 20));
  var tmp = 0;

  if (this.menubar != null) {
    this.menubarContainer.style.height = this.menubarHeight + 'px';
    tmp += this.menubarHeight;
  }

  if (this.toolbar != null) {
    //修改导航栏的定位 top = '0px';
    this.toolbarContainer.style.top = '0px'; //this.menubarHeight + 'px';
    this.toolbarContainer.style.height = this.toolbarHeight + 'px';
    tmp += this.toolbarHeight;
  }

  if (tmp > 0 && !mxClient.IS_QUIRKS) {
    tmp += 1;
  }

  var sidebarFooterHeight = 0;

  if (this.sidebarFooterContainer != null) {
    var bottom = this.footerHeight + off;
    sidebarFooterHeight = Math.max(0, Math.min(h - tmp - bottom, this.sidebarFooterHeight));
    this.sidebarFooterContainer.style.width = effHsplitPosition + 'px';
    this.sidebarFooterContainer.style.height = sidebarFooterHeight + 'px';
    this.sidebarFooterContainer.style.bottom = bottom + 'px';
  }

  var fw = (this.format != null) ? this.formatWidth : 0;
  this.sidebarContainer.style.top = tmp + 'px';
  this.sidebarContainer.style.width = effHsplitPosition + 'px';
  this.formatContainer.style.top = tmp + 'px';
  this.formatContainer.style.width = fw + 'px';
  this.formatContainer.style.display = (this.format != null) ? '' : 'none';

	var diagContOffset = this.getDiagramContainerOffset();
	var contLeft = (this.hsplit.parentNode != null) ? (effHsplitPosition + this.splitSize) : 0;
	this.diagramContainer.style.left = (contLeft + diagContOffset.x) + 'px';
	this.diagramContainer.style.top = (tmp + diagContOffset.y) + 'px';
	this.footerContainer.style.height = this.footerHeight + 'px';
	this.hsplit.style.top = this.sidebarContainer.style.top;
	this.hsplit.style.bottom = (this.footerHeight + off) + 'px';
	this.hsplit.style.left = effHsplitPosition + 'px';
	this.footerContainer.style.display = (this.footerHeight == 0) ? 'none' : '';

	if (this.tabContainer != null) {
		this.tabContainer.style.left = contLeft + 'px';
	}

  if (quirks) {
    this.menubarContainer.style.width = w + 'px';
    this.toolbarContainer.style.width = this.menubarContainer.style.width;
    var sidebarHeight = Math.max(0, h - this.footerHeight - this.menubarHeight - this.toolbarHeight);
    this.sidebarContainer.style.height = (sidebarHeight - sidebarFooterHeight) + 'px';
    this.formatContainer.style.height = sidebarHeight + 'px';
    this.diagramContainer.style.width = (this.hsplit.parentNode != null) ? Math.max(0, w - effHsplitPosition - this.splitSize - fw) + 'px' : w + 'px';
    this.footerContainer.style.width = this.menubarContainer.style.width;
    var diagramHeight = Math.max(0, h - this.footerHeight - this.menubarHeight - this.toolbarHeight);

    if (this.tabContainer != null) {
      this.tabContainer.style.width = this.diagramContainer.style.width;
      this.tabContainer.style.bottom = (this.footerHeight + off) + 'px';
      diagramHeight -= this.tabContainer.clientHeight;
    }

    this.diagramContainer.style.height = diagramHeight + 'px';
    this.hsplit.style.height = diagramHeight + 'px';
  } else {
    if (this.footerHeight > 0) {
      this.footerContainer.style.bottom = off + 'px';
    }

    this.diagramContainer.style.right = fw + 'px';
    var th = 0;

    if (this.tabContainer != null) {
      this.tabContainer.style.bottom = (this.footerHeight + off) + 'px';
      this.tabContainer.style.right = this.diagramContainer.style.right;
      th = this.tabContainer.clientHeight;
    }

    this.sidebarContainer.style.bottom = (this.footerHeight + sidebarFooterHeight + off) + 'px';
    this.formatContainer.style.bottom = (this.footerHeight + off) + 'px';
    this.diagramContainer.style.bottom = (this.footerHeight + off + th) + 'px';
  }

  if (sizeDidChange) {
    this.editor.graph.sizeDidChange();
  }
};

/**
 * Creates the required containers.
 */
EditorUi.prototype.createTabContainer = function () {
  return null;
};

/**
 * Creates the required containers.
 */
EditorUi.prototype.createDivs = function () {
  this.menubarContainer = this.createDiv('geMenubarContainer');
  this.toolbarContainer = this.createDiv('geToolbarContainer');
  this.sidebarContainer = this.createDiv('geSidebarContainer');
  this.formatContainer = this.createDiv('geSidebarContainer geFormatContainer');
  this.diagramContainer = this.createDiv('geDiagramContainer');
  this.footerContainer = this.createDiv('geFooterContainer');
  this.hsplit = this.createDiv('geHsplit');
  this.hsplit.setAttribute('title', mxResources.get('collapseExpand'));

  // Sets static style for containers
  this.menubarContainer.style.top = '0px';
  this.menubarContainer.style.left = '0px';
  this.menubarContainer.style.right = '0px';
  this.toolbarContainer.style.left = '0px';
  this.toolbarContainer.style.right = '0px';
  this.sidebarContainer.style.left = '0px';
  this.formatContainer.style.right = '0px';
  this.formatContainer.style.zIndex = '1';
  this.diagramContainer.style.right = ((this.format != null) ? this.formatWidth : 0) + 'px';
  this.footerContainer.style.left = '0px';
  this.footerContainer.style.right = '0px';
  this.footerContainer.style.bottom = '0px';
  this.footerContainer.style.zIndex = mxPopupMenu.prototype.zIndex - 2;
  this.hsplit.style.width = this.splitSize + 'px';
  this.sidebarFooterContainer = this.createSidebarFooterContainer();

  if (this.sidebarFooterContainer) {
    this.sidebarFooterContainer.style.left = '0px';
  }

  if (!this.editor.chromeless) {
    this.tabContainer = this.createTabContainer();
  } else {
    this.diagramContainer.style.border = 'none';
  }
};

/**
 * Hook for sidebar footer container. This implementation returns null.
 * 侧边栏页脚容器的挂钩。此实现返回null
 */
EditorUi.prototype.createSidebarFooterContainer = function () {
  return null;
};

/**
 * Creates the required containers.
 * 创建导航栏
 */
EditorUi.prototype.createUi = function () {
  //之前的导航栏 文字导航栏: 'file', 'edit', 'view', 'arrange', 'extras'---隐藏--start
  // Creates menubar
  // this.menubar = (this.editor.chromeless) ? null : this.menus.createMenubar(this.createDiv('geMenubar'));

  // if (this.menubar != null) {
  //   this.menubarContainer.appendChild(this.menubar.container);
  // }

  // // Adds status bar in menubar
  // if (this.menubar != null) {
  //   this.statusContainer = this.createStatusContainer();

  //   // Connects the status bar to the editor status
  //   this.editor.addListener('statusChanged', mxUtils.bind(this, function () {
  //     this.setStatusText(this.editor.getStatus());
  //   }));

  //   this.setStatusText(this.editor.getStatus());
  //   this.menubar.container.appendChild(this.statusContainer);

  //   // Inserts into DOM
  //   this.container.appendChild(this.menubarContainer);
  // }
  //之前的导航栏 文字导航栏---隐藏--end

  // Creates the sidebar 创建左侧菜单栏
  this.sidebar = (this.editor.chromeless) ? null : this.createSidebar(this.sidebarContainer);

  if (this.sidebar != null) {
    this.container.appendChild(this.sidebarContainer);
  }

  // Creates the format sidebar
  this.format = (this.editor.chromeless || !this.formatEnabled) ? null : this.createFormat(this.formatContainer);

  if (this.format != null) {
    this.container.appendChild(this.formatContainer);
  }

  // Creates the footer 创建底部
  var footer = (this.editor.chromeless) ? null : this.createFooter();
  if (footer != null) {
    this.footerContainer.appendChild(footer);
    this.container.appendChild(this.footerContainer);
  }

  if (this.sidebar != null && this.sidebarFooterContainer) {
    this.container.appendChild(this.sidebarFooterContainer);
  }

  this.container.appendChild(this.diagramContainer);

  if (this.container != null && this.tabContainer != null) {
    this.container.appendChild(this.tabContainer);
  }

  // Creates toolbar  创建图片导航栏
  this.toolbar = (this.editor.chromeless) ? null : this.createToolbar(this.createDiv('geToolbar'));
  if (this.toolbar != null) {

    //自动保存的文字------start

    // this.statusContainer = this.createStatusContainer();
    // // Connects the status bar to the editor status
    // this.editor.addListener('statusChanged', mxUtils.bind(this, function () {
    //   this.setStatusText(this.editor.getStatus());
    // }));
    // this.setStatusText(this.editor.getStatus());
    // this.toolbar.container.appendChild(this.statusContainer);

    //自动保存的文字------end

    this.toolbarContainer.appendChild(this.toolbar.container);
    this.container.appendChild(this.toolbarContainer);
  }

  // HSplit
  if (this.sidebar != null) {
    this.container.appendChild(this.hsplit);
    this.addSplitHandler(this.hsplit, true, 0, mxUtils.bind(this, function (value) {
      this.hsplitPosition = value;
      this.refresh();
    }));
  }
};

/**
 * Creates a new toolbar for the given container.
 * 点击自动保存的菜单地方
 */
EditorUi.prototype.createStatusContainer = function () {
  var container = document.createElement('a');
  // console.log("container:",container);
  container.className = 'geItem geStatus';
  container.onclick = (e) => {
    if (e.target.innerText == mxResources.get('modificationNotSavedClickHereToSave')) {
      // console.log(e);
      //点击已经修改的文字提示，调最新的--保存接口
      this.savePutFile();
    }
  }
  if (screen.width < 420) {
    container.style.maxWidth = Math.max(20, screen.width - 320) + 'px';
    container.style.overflow = 'hidden';
  }
  return container;
};

/**
 * Creates a new toolbar for the given container.
 */
// 页面内容是否修改了，导航栏显示的文字:修改未保存,点击此处保存./所有修改已保存。
EditorUi.prototype.setStatusText = function (value) {
  let inner = '';
  if (value == mxResources.get('modificationNotSavedClickHereToSave')) {
    inner = '<div class="geStatusAlert" style="cursor:pointer;overflow:hidden;">' + value + '</div>';
  }
  if (value == mxResources.get('allChangesSaved')) {
    inner = value;
  }
  this.statusContainer.innerHTML = inner;
};

/**
 * Creates a new toolbar for the given container.
 */
EditorUi.prototype.createToolbar = function (container) {
  return new Toolbar(this, container);
};

/**
 * Creates a new sidebar for the given container.
 */
EditorUi.prototype.createSidebar = function (container) {
  return new Sidebar(this, container);
};

/**
 * Creates a new sidebar for the given container.
 */
EditorUi.prototype.createFormat = function (container) {
  return new Format(this, container);
};

/**
 * Creates and returns a new footer.
 */
EditorUi.prototype.createFooter = function () {
  return this.createDiv('geFooter');
};

/**
 * Creates the actual toolbar for the toolbar container.
 */
EditorUi.prototype.createDiv = function (classname) {
  var elt = document.createElement('div');
  elt.className = classname;
  return elt;
};

/**
 * Updates the states of the given undo/redo items.
 */
EditorUi.prototype.addSplitHandler = function (elt, horizontal, dx, onChange) {
  var start = null;
  var initial = null;
  var ignoreClick = true;
  var last = null;
  // Disables built-in pan and zoom in IE10 and later
  if (mxClient.IS_POINTER) {
    elt.style.touchAction = 'none';
  }
  var getValue = mxUtils.bind(this, function () {
    var result = parseInt(((horizontal) ? elt.style.left : elt.style.bottom));
    // Takes into account hidden footer
    if (!horizontal) {
      result = result + dx - this.footerHeight;
    }
    return result;
  });

  function moveHandler(evt) {
    if (start != null) {
      var pt = new mxPoint(mxEvent.getClientX(evt), mxEvent.getClientY(evt));
      onChange(Math.max(0, initial + ((horizontal) ? (pt.x - start.x) : (start.y - pt.y)) - dx));
      mxEvent.consume(evt);
      if (initial != getValue()) {
        ignoreClick = true;
        last = null;
      }
    }
  };

  function dropHandler(evt) {
    moveHandler(evt);
    initial = null;
    start = null;
  };

  mxEvent.addGestureListeners(elt, function (evt) {
    start = new mxPoint(mxEvent.getClientX(evt), mxEvent.getClientY(evt));
    initial = getValue();
    ignoreClick = false;
    mxEvent.consume(evt);
  });

  mxEvent.addListener(elt, 'click', mxUtils.bind(this, function (evt) {
    if (!ignoreClick && this.hsplitClickEnabled) {
      var next = (last != null) ? last - dx : 0;
      last = getValue();
      onChange(next);
      mxEvent.consume(evt);
    }
  }));
  mxEvent.addGestureListeners(document, null, moveHandler, dropHandler);
  this.destroyFunctions.push(function () {
    mxEvent.removeGestureListeners(document, null, moveHandler, dropHandler);
  });
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.handleError = function (resp, title, fn, invokeFnOnClose, notFoundMessage) {
	var e = (resp != null && resp.error != null) ? resp.error : resp;

	if (e != null || title != null) {
		var msg = mxUtils.htmlEntities(mxResources.get('unknownError'));
		var btn = mxResources.get('ok');
		title = (title != null) ? title : mxResources.get('error');

		if (e != null && e.message != null) {
			msg = mxUtils.htmlEntities(e.message);
		}

		this.showError(title, msg, btn, fn, null, null, null, null, null,
			null, null, null, (invokeFnOnClose) ? fn : null);
	} else if (fn != null) {
		fn();
	}
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.showError = function (title, msg, btn, fn, retry, btn2, fn2, btn3, fn3, w, h, hide, onClose) {
  var dlg = new ErrorDialog(this, title, msg, btn || mxResources.get('ok'),
    fn, retry, btn2, fn2, hide, btn3, fn3);
  var lines = Math.ceil((msg != null) ? msg.length / 50 : 1);
  this.showDialog(dlg.container, w || 340, h || (100 + lines * 20), true, false, onClose);
  dlg.init();
};

/**
 * Displays a print dialog.
 */
EditorUi.prototype.showDialog = function (elt, w, h, modal, closable, onClose, noScroll, transparent, onResize, ignoreBgClick) {
  this.editor.graph.tooltipHandler.hideTooltip();
  if (this.dialogs == null) {
    this.dialogs = [];
  }
  this.dialog = new Dialog(this, elt, w, h, modal, closable, onClose, noScroll, transparent, onResize, ignoreBgClick);
  this.dialogs.push(this.dialog);
};

/**
 * Displays a print dialog.
 */
EditorUi.prototype.hideDialog = function (cancel, isEsc) {
  if (this.dialogs != null && this.dialogs.length > 0) {
    var dlg = this.dialogs.pop();
    if (dlg.close(cancel, isEsc) == false) {
      //add the dialog back if dialog closing is cancelled
      this.dialogs.push(dlg);
      return;
    }
    this.dialog = (this.dialogs.length > 0) ? this.dialogs[this.dialogs.length - 1] : null;
    this.editor.fireEvent(new mxEventObject('hideDialog'));

    if (this.dialog == null && this.editor.graph.container.style.visibility != 'hidden') {
      window.setTimeout(mxUtils.bind(this, function () {
        if (this.editor.graph.isEditing() && this.editor.graph.cellEditor.textarea != null) {
          this.editor.graph.cellEditor.textarea.focus();
        } else {
          mxUtils.clearSelection();
          this.editor.graph.container.focus();
        }
      }), 0);
    }
  }
};

/**
 * Handles ctrl+enter keystroke to clone cells.
 */
EditorUi.prototype.ctrlEnter = function () {
  var graph = this.editor.graph;
  if (graph.isEnabled()) {
    try {
      var cells = graph.getSelectionCells();
      var lookup = new mxDictionary();
      var newCells = [];

      for (var i = 0; i < cells.length; i++) {
        // Clones table rows instead of cells
        var cell = (graph.isTableCell(cells[i])) ? graph.model.getParent(cells[i]) : cells[i];

        if (cell != null && !lookup.get(cell)) {
          lookup.put(cell, true);
          newCells.push(cell);
        }
      }

      graph.setSelectionCells(graph.duplicateCells(newCells, false));
    } catch (e) {
      this.handleError(e);
    }
  }
};

/**
 * Display a color dialog.
 * 显示颜色对话框。
 */
EditorUi.prototype.pickColor = function (color, apply) {
  // color = '#33ff99';
  console.log("显示颜色对话框:", color);
  var graph = this.editor.graph;
  var selState = graph.cellEditor.saveSelection();
  var h = 226 + ((Math.ceil(ColorDialog.prototype.presetColors.length / 12) +
    Math.ceil(ColorDialog.prototype.defaultColors.length / 12)) * 17);

  var dlg = new ColorDialog(this, color || 'none', function (color) {
    graph.cellEditor.restoreSelection(selState);
    apply(color);
  }, function () {
    graph.cellEditor.restoreSelection(selState);
  });
  this.showDialog(dlg.container, 230, h, true, false);
  dlg.init();
};

/**
 * Adds the label menu items to the given menu and parent.
 */
EditorUi.prototype.openFile = function () {
  // Closes dialog after open
  window.openFile = new OpenFile(mxUtils.bind(this, function (cancel) {
    // console.log("打开文件：關閉");
    this.hideDialog(cancel);
  }));
  // Removes openFile if dialog is closed
  this.showDialog(new OpenDialog(this).container, (Editor.useLocalStorage) ? 640 : 320,
    (Editor.useLocalStorage) ? 480 : 220, true, true,
    function () {
      // console.log("zou没走");
      window.openFile = null;
    });
};

/**
 * Extracs the graph model from the given HTML data from a data transfer event.
 */
EditorUi.prototype.extractGraphModelFromHtml = function (data) {
  var result = null;
  try {
    var idx = data.indexOf('&lt;mxGraphModel ');
    if (idx >= 0) {
      var idx2 = data.lastIndexOf('&lt;/mxGraphModel&gt;');
      if (idx2 > idx) {
        result = data.substring(idx, idx2 + 21).replace(/&gt;/g, '>').
        replace(/&lt;/g, '<').replace(/\\&quot;/g, '"').replace(/\n/g, '');
      }
    }
  } catch (e) {
    // ignore
  }
  return result;
};

/**
 * Opens the given files in the editor.
 */
EditorUi.prototype.extractGraphModelFromEvent = function (evt) {
  var result = null;
  var data = null;
  if (evt != null) {
    var provider = (evt.dataTransfer != null) ? evt.dataTransfer : evt.clipboardData;
    if (provider != null) {
      if (document.documentMode == 10 || document.documentMode == 11) {
        data = provider.getData('Text');
      } else {
        data = (mxUtils.indexOf(provider.types, 'text/html') >= 0) ? provider.getData('text/html') : null;
        if (mxUtils.indexOf(provider.types, 'text/plain' && (data == null || data.length == 0))) {
          data = provider.getData('text/plain');
        }
      }

      if (data != null) {
        data = Graph.zapGremlins(mxUtils.trim(data));
        // Tries parsing as HTML document with embedded XML
        var xml = this.extractGraphModelFromHtml(data);
        if (xml != null) {
          data = xml;
        }
      }
    }
  }

  if (data != null && this.isCompatibleString(data)) {
    result = data;
  }
  return result;
};

/**
 * Hook for subclassers to return true if event data is a supported format.
 * This implementation always returns false.
 */
EditorUi.prototype.isCompatibleString = function (data) {
  return false;
};


/**
 * Adds the label menu items to the given menu and parent.
 * 之前的保存接口
 */
// EditorUi.prototype.saveFile = function (forceDialog) {
//   console.log("修改xml",this.editor.filename,this.editor._id);
//   if (!forceDialog && this.editor.filename != null) {
//     //open 和 导入后修改时候的大图id：this.editor.editId
//     console.log("修改xml",this.editor.editId,this.editor.getOrCreateFilename());
//     var obj = {
//       name: JSON.stringify(this.editor.getOrCreateFilename()),
//       id: window.location.pathname.split('/')[ window.location.pathname.split().length -1] || this.editor.editId,
//     }
//     this.save(obj); 
//     // this.save(this.editor.getOrCreateFilename());
//   } else {
//     console.log("新增xml");
//     var dlg = new FilenameDialog(this, this.editor.getOrCreateFilename(), mxResources.get('save'),
//       mxUtils.bind(this, function (obj) {
//       this.editor.editId = obj.id; //新增的时候的大图id
//       this.save(obj);
//     }), null, mxUtils.bind(this, function (name) {
//       if (name != null && name.length > 0) {
//         return true;
//       }
//       mxUtils.confirm(mxResources.get('invalidName'));//提示信息:名称为空/无效名称
//       return false;
//     }));
//     this.showDialog(dlg.container, 300, 100, true, true);
//     dlg.init();
//   }
// };



/**
 * Saves the current graph under the given filename.
 * 之前的保存的回调
 */
// EditorUi.prototype.save = function (obj) {
//   console.log("objjj:",obj,this.editor._id);
//   //put修改时id赋值
//   if(this.editor._id != null){
//     obj.id = this.editor._id;
//   }
//   //保存后的状态
//   // this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('autosave')));
//   if (obj.name != null) {
//     //防止name里面带xml
//     if(obj.name.indexOf(".xml") != -1){
//       obj.name = obj.name.split('.')[0];
//     }

//     if (this.editor.graph.isEditing()) {
//       this.editor.graph.stopEditing();
//     }
//     var xml = mxUtils.getXml(this.editor.getGraphXml());
//     console.log("保存时xml数据：",xml,Editor.useLocalStorage);
//     try {
//       if (Editor.useLocalStorage) {
//         console.log("保存：Editor.useLocalStorage")
//         //   if (localStorage.getItem(name) != null && !mxUtils.confirm(mxResources.get('replaceIt', [name]))) {
//         //     return;
//         //   }
//         //   localStorage.setItem(name, xml);
//         //   this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('saved')) + ' ' + new Date());
//       } else {
//         if (xml.length < MAX_REQUEST_SIZE) {
//           //去除name里面的双引号
//           obj.name = obj.name.split('"').join('');
//           // put 修改的时候能拿到大图id：this.editor._id
//           if (this.editor._id != undefined) {
//             console.log("put时id:",this.editor._id)
//             // axios.put(SAVE_URL + '/' + this.editor._id, {
//             axios.put(SAVE_URL, {
//               // axios.put(SAVE_URL + '/' + obj.id, {
//               id: this.editor._id,
//               name: obj.name,
//               xml: xml
//             }).then((data) => {
//               // this.$Message.success("xml数据保存到本地文件夹(xml)里面,成功!!!");
//               console.log("保存成功put：",data);
//             }).catch(error => {
//               console.error(error)
//             })
//           } else {
//             axios.post(SAVE_URL, {
//               id: obj.id,
//               name: obj.name,
//               xml: xml,
//             }).then((data) => {
//               // this.$Message.success("xml数据保存到本地文件夹(xml)里面,成功!!!");
//               console.log("保存成功post：",data);
//             }).catch(error => {
//               console.error(error)
//             })
//           }
//         } else {
//           mxUtils.alert(mxResources.get('drawingTooLarge'));
//           mxUtils.popup(xml);
//           return;
//         }
//       }

//       this.editor.setModified(false);
//       this.editor.setFilename(obj.name);
//       this.updateDocumentTitle();
//     } catch (e) {
//       this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('errorSavingFile')));
//     }
//   }
// };

/**
 * 最新的保存/修改--接口 put方法
 */
EditorUi.prototype.savePutFile = function (forceDialog) {
  const importObj = JSON.parse(localStorage.getItem('importObj')); //取数据
  console.log("put修改保存importObj:", importObj);

  if (!forceDialog && importObj.name != null && importObj.id != undefined) {

    //保存前过滤掉图例的数据
    //当前画布的cell
    this.editor.graph.selectAll(null, true); // 全选
    let selectionCells = this.editor.graph.getSelectionCells();
    // console.log("selectionCells:", selectionCells);
    var _flag = false;
    selectionCells.map(v=>{
      if ( v.value && v.value.indexOf("......") != -1 ){
        _flag = true;
        // this.editor.graph.removeCells([v], true); //删除
      }

      if (v.value == "" && v.bindMark && v.style.indexOf("image;html=1;") != -1){
        // this.editor.graph.removeCells([v], true); //删除
      }
    })
    if (_flag == true){
      vm.$Message.error("温馨提示: 图例的数据不会保存, 请选择图例保存按钮！");
      return false
    }
    this.editor.graph.clearSelection(); //全不选
    //更新视图
    this.editor.graph.refresh()

    // 获取当前画布的xml
    var xml = mxUtils.getXml(this.editor.getGraphXml());
    // console.log("xml:", xml);
    var obj = {
      id: importObj.id,
      name: importObj.name,
      xml: xml,
    };
    //防止name里面带xml
    if (obj.name.indexOf(".xml") != -1) {
      obj.name = obj.name.split('.')[0]
    }
    try {
      if (Editor.useLocalStorage) {
        // Editor.useLocalStorage = true;走这里
        //   if (localStorage.getItem(name) != null && !mxUtils.confirm(mxResources.get('replaceIt', [name]))) {
        //     return;
        //   }
        //   localStorage.setItem(name, xml);
        //   this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('saved')) + ' ' + new Date());
      } else {
        if (xml.length < MAX_REQUEST_SIZE) {
          //去除name里面的双引号
          obj.name = obj.name.split('"').join('');
          axios.put(SAVE_URL, {
            id: obj.id,
            name: obj.name,
            xml: obj.xml
          }).then((res) => {
            if (res.status == '200') {
              // console.log("手动点击保存:", obj.xml, obj.id, obj.name);
              //保存后更新导航栏菜单的状态
              this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('allChangesSaved')));
              // console.log("保存成功put：", res.data);
              vm.$Message.success("Topo图保存成功！！！")
            }
          })
        } else {
          mxUtils.alert(mxResources.get('drawingTooLarge'));
          mxUtils.popup(xml);
          return;
        }
      }
      this.editor.setModified(false);
      this.editor.setFilename(obj.name);
      this.updateDocumentTitle();
    } catch (e) {
      this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('errorSavingFile')));
    }
  }
}

/**
 * Executes the given layout.
 */
EditorUi.prototype.executeLayout = function (exec, animate, post) {
	var graph = this.editor.graph;

	if (graph.isEnabled()) {
		graph.getModel().beginUpdate();
		try {
			exec();
		} catch (e) {
			throw e;
		} finally {
			// Animates the changes in the graph model except
			// for Camino, where animation is too slow
			if (this.allowAnimation && animate && (navigator.userAgent == null ||
					navigator.userAgent.indexOf('Camino') < 0)) {
				// New API for animating graph layout results asynchronously
				var morph = new mxMorphing(graph);
				morph.addListener(mxEvent.DONE, mxUtils.bind(this, function () {
					graph.getModel().endUpdate();

          if (post != null) {
            post();
          }
        }));
        morph.startAnimation();
      } else {
        graph.getModel().endUpdate();
        if (post != null) {
          post();
        }
      }
    }
  }
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showImageDialog = function (title, value, fn, ignoreExisting) {
  var cellEditor = this.editor.graph.cellEditor;
  var selState = cellEditor.saveSelection();
  var newValue = mxUtils.prompt(title, value);
  cellEditor.restoreSelection(selState);

  if (newValue != null && newValue.length > 0) {
    var img = new Image();

    img.onload = function () {
      fn(newValue, img.width, img.height);
    };
    img.onerror = function () {
      fn(null);
      mxUtils.alert(mxResources.get('fileNotFound'));
    };

    img.src = newValue;
  } else {
    fn(null);
  }
};

/**
 * Hides the current menu. //编辑链接的dialog的样式
 */
EditorUi.prototype.showLinkDialog = function (value, btnLabel, fn) {
  var dlg = new LinkDialog(this, value, btnLabel, fn);
  this.showDialog(dlg.container, 420, 100, true, true);
  dlg.init();
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showDataDialog = function (cell) {
  if (cell != null) {
    var dlg = new EditDataDialog(this, cell);
    this.showDialog(dlg.container, 480, 420, true, false, null, false);
    dlg.init();
  }
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showBackgroundImageDialog = function (apply, img) {
	apply = (apply != null) ? apply : mxUtils.bind(this, function (image) {
		var change = new ChangePageSetup(this, null, image);
		change.ignoreColor = true;

    this.editor.graph.model.execute(change);
  });

	var newValue = mxUtils.prompt(mxResources.get('backgroundImage'), (img != null) ? img.src : '');

  if (newValue != null && newValue.length > 0) {
    var img = new Image();

		img.onload = function () {
			apply(new mxImage(newValue, img.width, img.height), false);
		};
		img.onerror = function () {
			apply(null, true);
			mxUtils.alert(mxResources.get('fileNotFound'));
		};

    img.src = newValue;
  } else {
    apply(null);
  }
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setBackgroundImage = function (image) {
  this.editor.graph.setBackgroundImage(image);
  this.editor.graph.view.validateBackgroundImage();

  this.fireEvent(new mxEventObject('backgroundImageChanged'));
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
EditorUi.prototype.confirm = function (msg, okFn, cancelFn) {
  if (mxUtils.confirm(msg)) {
    if (okFn != null) {
      okFn();
    }
  } else if (cancelFn != null) {
    cancelFn();
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
EditorUi.prototype.createOutline = function (wnd) {
  var outline = new mxOutline(this.editor.graph);
  outline.border = 20;

  mxEvent.addListener(window, 'resize', function () {
    outline.update();
  });

  this.addListener('pageFormatChanged', function () {
    outline.update();
  });

  return outline;
};

// Alt+Shift+Keycode mapping to action
EditorUi.prototype.altShiftActions = {
  67: 'clearWaypoints', // Alt+Shift+C
  65: 'connectionArrows', // Alt+Shift+A
  76: 'editLink', // Alt+Shift+L
  80: 'connectionPoints', // Alt+Shift+P
  84: 'editTooltip', // Alt+Shift+T
  86: 'pasteSize', // Alt+Shift+V
  88: 'copySize' // Alt+Shift+X
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
EditorUi.prototype.createKeyHandler = function (editor) {
  var editorUi = this;
  var graph = this.editor.graph;
  var keyHandler = new mxKeyHandler(graph);

	var isEventIgnored = keyHandler.isEventIgnored;
	keyHandler.isEventIgnored = function (evt) {
		// Handles undo/redo/ctrl+./,/u via action and allows ctrl+b/i
		// only if editing value is HTML (except for FF and Safari)
		return !(mxEvent.isShiftDown(evt) && evt.keyCode == 9) &&
			((!this.isControlDown(evt) || mxEvent.isShiftDown(evt) ||
				(evt.keyCode != 90 && evt.keyCode != 89 && evt.keyCode != 188 &&
					evt.keyCode != 190 && evt.keyCode != 85)) && ((evt.keyCode != 66 && evt.keyCode != 73) ||
				!this.isControlDown(evt) || (this.graph.cellEditor.isContentEditing() &&
					!mxClient.IS_FF && !mxClient.IS_SF)) && isEventIgnored.apply(this, arguments));
	};

  // Ignores graph enabled state but not chromeless state
  keyHandler.isEnabledForEvent = function (evt) {
    return (!mxEvent.isConsumed(evt) && this.isGraphEvent(evt) && this.isEnabled() &&
      (editorUi.dialogs == null || editorUi.dialogs.length == 0));
  };

  // Routes command-key to control-key on Mac
  keyHandler.isControlDown = function (evt) {
    return mxEvent.isControlDown(evt) || (mxClient.IS_MAC && evt.metaKey);
  };

  var queue = [];
  var thread = null;

  // Helper function to move cells with the cursor keys
  function nudge(keyCode, stepSize, resize) {
    queue.push(function () {
      if (!graph.isSelectionEmpty() && graph.isEnabled()) {
        stepSize = (stepSize != null) ? stepSize : 1;

        if (resize) {
          // Resizes all selected vertices
          graph.getModel().beginUpdate();
          try {
            var cells = graph.getSelectionCells();

            for (var i = 0; i < cells.length; i++) {
              if (graph.getModel().isVertex(cells[i]) && graph.isCellResizable(cells[i])) {
                var geo = graph.getCellGeometry(cells[i]);

                if (geo != null) {
                  geo = geo.clone();

                  if (keyCode == 37) {
                    geo.width = Math.max(0, geo.width - stepSize);
                  } else if (keyCode == 38) {
                    geo.height = Math.max(0, geo.height - stepSize);
                  } else if (keyCode == 39) {
                    geo.width += stepSize;
                  } else if (keyCode == 40) {
                    geo.height += stepSize;
                  }

                  graph.getModel().setGeometry(cells[i], geo);
                }
              }
            }
          } finally {
            graph.getModel().endUpdate();
          }
        } else {
          // Moves vertices up/down in a stack layout
          var cell = graph.getSelectionCell();
          var parent = graph.model.getParent(cell);
          var layout = null;

          if (graph.getSelectionCount() == 1 && graph.model.isVertex(cell) &&
            graph.layoutManager != null && !graph.isCellLocked(cell)) {
            layout = graph.layoutManager.getLayout(parent);
          }

          if (layout != null && layout.constructor == mxStackLayout) {
            var index = parent.getIndex(cell);

						if (keyCode == 37 || keyCode == 38) {
							graph.model.add(parent, cell, Math.max(0, index - 1));
						} else if (keyCode == 39 || keyCode == 40) {
							graph.model.add(parent, cell, Math.min(graph.model.getChildCount(parent), index + 1));
						}
					} else {
						var cells = graph.getMovableCells(graph.getSelectionCells());
						var realCells = [];

						for (var i = 0; i < cells.length; i++) {
							// TODO: Use getCompositeParent
							var style = graph.getCurrentCellStyle(cells[i]);

							if (mxUtils.getValue(style, 'part', '0') == '1') {
								var parent = graph.model.getParent(cells[i]);

								if (graph.model.isVertex(parent) && mxUtils.indexOf(cells, parent) < 0) {
									realCells.push(parent);
								}
							} else {
								realCells.push(cells[i]);
							}
						}

						if (realCells.length > 0) {
							cells = realCells;
							var dx = 0;
							var dy = 0;

            if (keyCode == 37) {
              dx = -stepSize;
            } else if (keyCode == 38) {
              dy = -stepSize;
            } else if (keyCode == 39) {
              dx = stepSize;
            } else if (keyCode == 40) {
              dy = stepSize;
            }

							graph.moveCells(cells, dx, dy);
						}
					}
				}
			}
		});

    if (thread != null) {
      window.clearTimeout(thread);
    }

    thread = window.setTimeout(function () {
      if (queue.length > 0) {
        graph.getModel().beginUpdate();
        try {
          for (var i = 0; i < queue.length; i++) {
            queue[i]();
          }

					queue = [];
				} finally {
					graph.getModel().endUpdate();
				}
			}
		}, 200);
	};

  // Overridden to handle special alt+shift+cursor keyboard shortcuts
  var directions = {
    37: mxConstants.DIRECTION_WEST,
    38: mxConstants.DIRECTION_NORTH,
    39: mxConstants.DIRECTION_EAST,
    40: mxConstants.DIRECTION_SOUTH
  };

  var keyHandlerGetFunction = keyHandler.getFunction;

  mxKeyHandler.prototype.getFunction = function (evt) {
    if (graph.isEnabled()) {
      // TODO: Add alt modified state in core API, here are some specific cases
      if (mxEvent.isShiftDown(evt) && mxEvent.isAltDown(evt)) {
        var action = editorUi.actions.get(editorUi.altShiftActions[evt.keyCode]);

        if (action != null) {
          return action.funct;
        }
      }

			if (evt.keyCode == 9 && mxEvent.isAltDown(evt)) {
				if (graph.cellEditor.isContentEditing()) {
					// Alt+Shift+Tab while editing
					return function () {
						document.execCommand('outdent', false, null);
					};
				} else if (mxEvent.isShiftDown(evt)) {
					// Alt+Shift+Tab
					return function () {
						graph.selectParentCell();
					};
				} else {
					// Alt+Tab
					return function () {
						graph.selectChildCell();
					};
				}
			} else if (directions[evt.keyCode] != null && !graph.isSelectionEmpty()) {
				// On macOS, Control+Cursor is used by Expose so allow for Alt+Control to resize
				if (!this.isControlDown(evt) && mxEvent.isShiftDown(evt) && mxEvent.isAltDown(evt)) {
					if (graph.model.isVertex(graph.getSelectionCell())) {
						return function () {
							var cells = graph.connectVertex(graph.getSelectionCell(), directions[evt.keyCode],
								graph.defaultEdgeLength, evt, true);

              if (cells != null && cells.length > 0) {
                if (cells.length == 1 && graph.model.isEdge(cells[0])) {
                  graph.setSelectionCell(graph.model.getTerminal(cells[0], false));
                } else {
                  graph.setSelectionCell(cells[cells.length - 1]);
                }

                graph.scrollCellToVisible(graph.getSelectionCell());

                if (editorUi.hoverIcons != null) {
                  editorUi.hoverIcons.update(graph.view.getState(graph.getSelectionCell()));
                }
              }
            };
          }
        } else {
          // Avoids consuming event if no vertex is selected by returning null below
          // Cursor keys move and resize (ctrl) cells
          if (this.isControlDown(evt)) {
            return function () {
              nudge(evt.keyCode, (mxEvent.isShiftDown(evt)) ? graph.gridSize : null, true);
            };
          } else {
            return function () {
              nudge(evt.keyCode, (mxEvent.isShiftDown(evt)) ? graph.gridSize : null);
            };
          }
        }
      }
    }

    return keyHandlerGetFunction.apply(this, arguments);
  };

  // Binds keystrokes to actions
  keyHandler.bindAction = mxUtils.bind(this, function (code, control, key, shift) {
    var action = this.actions.get(key);

    if (action != null) {
      var f = function () {
        if (action.isEnabled()) {
          action.funct();
        }
      };

      if (control) {
        if (shift) {
          keyHandler.bindControlShiftKey(code, f);
        } else {
          keyHandler.bindControlKey(code, f);
        }
      } else {
        if (shift) {
          keyHandler.bindShiftKey(code, f);
        } else {
          keyHandler.bindKey(code, f);
        }
      }
    }
  });

  var ui = this;
  var keyHandlerEscape = keyHandler.escape;
  keyHandler.escape = function (evt) {
    keyHandlerEscape.apply(this, arguments);
  };

  // Ignores enter keystroke. Remove this line if you want the
  // enter keystroke to stop editing. N, W, T are reserved.
  keyHandler.enter = function () {};

	keyHandler.bindControlShiftKey(36, function () {
		graph.exitGroup();
	}); // Ctrl+Shift+Home
	keyHandler.bindControlShiftKey(35, function () {
		graph.enterGroup();
	}); // Ctrl+Shift+End
	keyHandler.bindShiftKey(36, function () {
		graph.home();
	}); // Ctrl+Shift+Home
	keyHandler.bindKey(35, function () {
		graph.refresh();
	}); // End
	keyHandler.bindAction(107, true, 'zoomIn'); // Ctrl+Plus
	keyHandler.bindAction(109, true, 'zoomOut'); // Ctrl+Minus
	keyHandler.bindAction(80, true, 'print'); // Ctrl+P
	keyHandler.bindAction(79, true, 'outline', true); // Ctrl+Shift+O

  if (!this.editor.chromeless || this.editor.editable) {
    keyHandler.bindControlKey(36, function () {
      if (graph.isEnabled()) {
        graph.foldCells(true);
      }
    }); // Ctrl+Home
    keyHandler.bindControlKey(35, function () {
      if (graph.isEnabled()) {
        graph.foldCells(false);
      }
    }); // Ctrl+End
    keyHandler.bindControlKey(13, function () {
      	ui.ctrlEnter();
    }); // Ctrl+Enter
    keyHandler.bindAction(8, false, 'delete'); // 删除
    keyHandler.bindAction(11, false, 'addDeviceType'); // 添加设备类型

    keyHandler.bindAction(11, false, 'bindingDeviceId'); // 绑定设备
    keyHandler.bindAction(11, false, 'bindXMLName'); // 绑定xml

    keyHandler.bindAction(11, true, 'collapse'); // 
    keyHandler.bindAction(11, true, 'expand'); // 
    keyHandler.bindAction(8, true, 'deleteAll'); // Shift+Backspace
    keyHandler.bindAction(46, false, 'delete'); // Delete
    keyHandler.bindAction(46, true, 'deleteAll'); // Ctrl+Delete
    keyHandler.bindAction(36, false, 'resetView'); // Home
    keyHandler.bindAction(72, true, 'fitWindow', true); // Ctrl+Shift+H
    keyHandler.bindAction(74, true, 'fitPage'); // Ctrl+J
    keyHandler.bindAction(74, true, 'fitTwoPages', true); // Ctrl+Shift+J
    keyHandler.bindAction(48, true, 'customZoom'); // Ctrl+0
    keyHandler.bindAction(82, true, 'turn'); // Ctrl+R
    keyHandler.bindAction(82, true, 'clearDefaultStyle', true); // Ctrl+Shift+R
    keyHandler.bindAction(83, true, 'save'); // Ctrl+S
    keyHandler.bindAction(83, true, 'saveAs', true); // Ctrl+Shift+S
    keyHandler.bindAction(65, true, 'selectAll'); // Ctrl+A
    keyHandler.bindAction(65, true, 'selectNone', true); // Ctrl+A
    keyHandler.bindAction(73, true, 'selectVertices', true); // Ctrl+Shift+I
    keyHandler.bindAction(69, true, 'selectEdges', true); // Ctrl+Shift+E
    keyHandler.bindAction(69, true, 'editStyle'); // Ctrl+E
    keyHandler.bindAction(66, true, 'bold'); // Ctrl+B
    keyHandler.bindAction(66, true, 'toBack', true); // Ctrl+Shift+B
    keyHandler.bindAction(70, true, 'toFront', true); // Ctrl+Shift+F
    keyHandler.bindAction(68, true, 'duplicate'); // Ctrl+D
    keyHandler.bindAction(68, true, 'setAsDefaultStyle', true); // Ctrl+Shift+D   
    keyHandler.bindAction(90, true, 'undo'); // Ctrl+Z
    keyHandler.bindAction(89, true, 'autosize', true); // Ctrl+Shift+Y
    keyHandler.bindAction(88, true, 'cut'); // Ctrl+X
    keyHandler.bindAction(67, true, 'copy'); // Ctrl+C
    keyHandler.bindAction(86, true, 'paste'); // Ctrl+V
    keyHandler.bindAction(71, true, 'group'); // Ctrl+G
    keyHandler.bindAction(77, true, 'editData'); // Ctrl+M
    keyHandler.bindAction(71, true, 'grid', true); // Ctrl+Shift+G
    keyHandler.bindAction(73, true, 'italic'); // Ctrl+I
    keyHandler.bindAction(76, true, 'lockUnlock'); // Ctrl+L
    keyHandler.bindAction(76, true, 'layers', true); // Ctrl+Shift+L
    keyHandler.bindAction(80, true, 'formatPanel', true); // Ctrl+Shift+P
    keyHandler.bindAction(85, true, 'underline'); // Ctrl+U
    keyHandler.bindAction(85, true, 'ungroup', true); // Ctrl+Shift+U
    keyHandler.bindAction(190, true, 'superscript'); // Ctrl+.
    keyHandler.bindAction(188, true, 'subscript'); // Ctrl+,
    keyHandler.bindAction(9, false, 'indent', true); // Shift+Tab,
    keyHandler.bindKey(13, function () {
      if (graph.isEnabled()) {
        graph.startEditingAtCell();
      }
    }); // Enter
    keyHandler.bindKey(113, function () {
      if (graph.isEnabled()) {
        graph.startEditingAtCell();
      }
    }); // F2
  }

  if (!mxClient.IS_WIN) {
    keyHandler.bindAction(90, true, 'redo', true); // Ctrl+Shift+Z
  } else {
    keyHandler.bindAction(89, true, 'redo'); // Ctrl+Y
  }
  return keyHandler;
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
EditorUi.prototype.destroy = function () {
  if (this.editor != null) {
    this.editor.destroy();
    this.editor = null;
  }

  if (this.menubar != null) {
    this.menubar.destroy();
    this.menubar = null;
  }

  if (this.toolbar != null) {
    this.toolbar.destroy();
    this.toolbar = null;
  }

  if (this.sidebar != null) {
    this.sidebar.destroy();
    this.sidebar = null;
  }

  if (this.keyHandler != null) {
    this.keyHandler.destroy();
    this.keyHandler = null;
  }

  if (this.keydownHandler != null) {
    mxEvent.removeListener(document, 'keydown', this.keydownHandler);
    this.keydownHandler = null;
  }

  if (this.keyupHandler != null) {
    mxEvent.removeListener(document, 'keyup', this.keyupHandler);
    this.keyupHandler = null;
  }

  if (this.resizeHandler != null) {
    mxEvent.removeListener(window, 'resize', this.resizeHandler);
    this.resizeHandler = null;
  }

  if (this.gestureHandler != null) {
    mxEvent.removeGestureListeners(document, this.gestureHandler);
    this.gestureHandler = null;
  }

  if (this.orientationChangeHandler != null) {
    mxEvent.removeListener(window, 'orientationchange', this.orientationChangeHandler);
    this.orientationChangeHandler = null;
  }

  if (this.scrollHandler != null) {
    mxEvent.removeListener(window, 'scroll', this.scrollHandler);
    this.scrollHandler = null;
  }

  if (this.destroyFunctions != null) {
    for (var i = 0; i < this.destroyFunctions.length; i++) {
      this.destroyFunctions[i]();
    }
    this.destroyFunctions = null;
  }

  var c = [this.menubarContainer, this.toolbarContainer, this.sidebarContainer,
    this.formatContainer, this.diagramContainer, this.footerContainer,
    this.chromelessToolbar, this.hsplit, this.sidebarFooterContainer,
    this.layersDialog
  ];

  for (var i = 0; i < c.length; i++) {
    if (c[i] != null && c[i].parentNode != null) {
      c[i].parentNode.removeChild(c[i]);
    }
  }
};

//新加的方法-------------start-----
/**
 * 
 */
EditorUi.prototype.isScratchpadEnabled = function () {
  return isLocalStorage || mxClient.IS_CHROMEAPP;
};

/**
 * Shows or hides the scratchpad library.
 * 点击素材库--显示或隐藏素材库
 */
EditorUi.prototype.toggleScratchpad = function () {

  if (this.isScratchpadEnabled()) {

    if (this.scratchpad == null) {
      StorageFile.getFileContent(this, '.scratchpad', mxUtils.bind(this, function (xml) {
        if (xml == null) {
          xml = this.emptyLibraryXml;
        }
        this.loadLibrary(new StorageLibrary(this, xml, '.scratchpad'));
      }));
    } else {
      this.closeLibrary(this.scratchpad);
    }
  }
}
/**
 * Opens the application keystore.
 */
EditorUi.prototype.openDatabase = function (success, error) {
  if (this.database == null) {
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;

    if (indexedDB != null) {
      try {
        var req = indexedDB.open('database', 2);

        req.onupgradeneeded = function (e) {
          try {
            var db = req.result;

            if (e.oldVersion < 1) {
              // Version 1 is the first version of the database.
              db.createObjectStore('objects', {
                keyPath: 'key'
              });
            }

            if (e.oldVersion < 2) {
              // Version 2 introduces browser file storage.
              db.createObjectStore('files', {
                keyPath: 'title'
              });
              db.createObjectStore('filesInfo', {
                keyPath: 'title'
              });
              EditorUi.migrateStorageFiles = isLocalStorage;
            }
          } catch (e) {
            if (error != null) {
              error(e);
            }
          }
        }

        req.onsuccess = mxUtils.bind(this, function (e) {
          var db = req.result;
          this.database = db;

          if (EditorUi.migrateStorageFiles) {
            StorageFile.migrate(db);
            EditorUi.migrateStorageFiles = false;
          }

          if (location.host == 'app.diagrams.net' && !this.drawioMigrationStarted) {
            this.drawioMigrationStarted = true;

            this.getDatabaseItem('.drawioMigrated3', mxUtils.bind(this, function (value) {
              if (value && urlParams['forceMigration'] != '1') //Already migrated
              {
                return;
              }

              var drawioFrame = document.createElement('iframe');
              drawioFrame.style.display = 'none';
              drawioFrame.setAttribute('src', 'https://www.draw.io?embed=1&proto=json&forceMigration=' + urlParams['forceMigration']);
              document.body.appendChild(drawioFrame);
              var collectNames = true,
                allDone = false;
              var fileNames, index = 0;

              var markAsMigrated = mxUtils.bind(this, function () {
                allDone = true;
                this.setDatabaseItem('.drawioMigrated3', true);
                drawioFrame.contentWindow.postMessage(JSON.stringify({
                  action: 'remoteInvoke',
                  funtionName: 'setMigratedFlag'
                }), '*');
              });

              var next = mxUtils.bind(this, function () {
                index++;
                fetchOneFile();
              });

              var fetchOneFile = mxUtils.bind(this, function () {
                try {
                  if (index >= fileNames.length) {
                    markAsMigrated();
                    return;
                  }

                  var fileTitle = fileNames[index];

                  StorageFile.getFileContent(this, fileTitle, mxUtils.bind(this, function (data) {
                    if (data == null || (fileTitle == '.scratchpad' && data == this.emptyLibraryXml)) //Don't overwrite
                    {
                      drawioFrame.contentWindow.postMessage(JSON.stringify({
                        action: 'remoteInvoke',
                        funtionName: 'getLocalStorageFile',
                        functionArgs: [fileTitle]
                      }), '*');
                    } else {
                      next();
                    }
                  }), next); //Ignore errors
                } catch (e) {
                  //Log error
                  console.log(e);
                }
              });

              var importOneFile = mxUtils.bind(this, function (file) {
                try {
                  this.setDatabaseItem(null, [{
                    title: file.title,
                    size: file.data.length,
                    lastModified: Date.now(),
                    type: file.isLib ? 'L' : 'F'
                  }, {
                    title: file.title,
                    data: file.data
                  }], next, next /* Ignore errors */ , ['filesInfo', 'files']);
                } catch (e) {
                  //Log error
                  console.log(e);
                }
              });

              var messageListener = mxUtils.bind(this, function (evt) {
                try {
                  //Only accept messages from migration iframe
                  if (evt.source != drawioFrame.contentWindow) {
                    return;
                  }

                  var drawMsg = {};

                  try {
                    drawMsg = JSON.parse(evt.data);
                  } catch (e) {} //Ignore

                  if (drawMsg.event == 'init') {
                    drawioFrame.contentWindow.postMessage(JSON.stringify({
                      action: 'remoteInvokeReady'
                    }), '*');
                    drawioFrame.contentWindow.postMessage(JSON.stringify({
                      action: 'remoteInvoke',
                      funtionName: 'getLocalStorageFileNames'
                    }), '*');
                  } else if (drawMsg.event == 'remoteInvokeResponse' && !allDone) {
                    if (collectNames) {
                      if (drawMsg.resp != null && drawMsg.resp.length > 0 && drawMsg.resp[0] != null) {
                        fileNames = drawMsg.resp[0];
                        collectNames = false;
                        fetchOneFile();
                      } else {
                        //Nothing in draw.io localStorage
                        markAsMigrated();
                      }
                    } else {
                      //Add the file, then move to the next
                      if (drawMsg.resp != null && drawMsg.resp.length > 0 && drawMsg.resp[0] != null) {
                        importOneFile(drawMsg.resp[0]);
                      } else {
                        next();
                      }
                    }
                  }
                } catch (e) {
                  console.log(e);
                }
              });

              window.addEventListener('message', messageListener);
            })); //Ignore errors
          }

          success(db);

          db.onversionchange = function () {
            //TODO Handle DB revision update while code is running
            //		Save open file and request a page reload before closing the DB
            db.close();
          };
        });

        req.onerror = error;

        req.onblocked = function () {
          //TODO Use this when a new version is introduced
          // there's another open connection to same database
          // and it wasn't closed after db.onversionchange triggered for them
        };
      } catch (e) {
        if (error != null) {
          error(e);
        }
      }
    } else if (error != null) {
      error();
    }
  } else {
    success(this.database);
  }
};
/**
 * Add/Update item(s) in the database. It supports multiple stores transactions by sending an array of data, storeName 
 * (key is optional, can be an array also if multiple stores are needed)
 */
EditorUi.prototype.setDatabaseItem = function (key, data, success, error, storeName) {
  this.openDatabase(mxUtils.bind(this, function (db) {
    try {
      storeName = storeName || 'objects';

      if (!Array.isArray(storeName)) {
        storeName = [storeName];
        key = [key];
        data = [data];
      }

      var trx = db.transaction(storeName, 'readwrite');
      trx.oncomplete = success;
      trx.onerror = error;

      for (var i = 0; i < storeName.length; i++) {
        trx.objectStore(storeName[i]).put(key != null && key[i] != null ? {
          key: key[i],
          data: data[i]
        } : data[i]);
      }
    } catch (e) {
      if (error != null) {
        error(e);
      }
    }
  }), error);
};

/**
 * Removes the item for the given key from the database.
 */
EditorUi.prototype.removeDatabaseItem = function (key, success, error, storeName) {
  this.openDatabase(mxUtils.bind(this, function (db) {
    storeName = storeName || 'objects';

    if (!Array.isArray(storeName)) {
      storeName = [storeName];
      key = [key];
    }

    var trx = db.transaction(storeName, 'readwrite');
    trx.oncomplete = success;
    trx.onerror = error;

    for (var i = 0; i < storeName.length; i++) {
      trx.objectStore(storeName[i]).delete(key[i]);
    }
  }), error);
};
/**
 * Returns one item from the database.
 */
EditorUi.prototype.getDatabaseItem = function (key, success, error, storeName) {
  this.openDatabase(mxUtils.bind(this, function (db) {
    try {
      storeName = storeName || 'objects';
      var trx = db.transaction([storeName], 'readonly');
      var req = trx.objectStore(storeName).get(key);

      req.onsuccess = function () {
        success(req.result);
      };

      req.onerror = error;
    } catch (e) {
      if (error != null) {
        error(e);
      }
    }
  }), error);
};

/**
 * Returns all items from the database.
 */
EditorUi.prototype.getDatabaseItems = function (success, error, storeName) {
  this.openDatabase(mxUtils.bind(this, function (db) {
    try {
      storeName = storeName || 'objects';
      var trx = db.transaction([storeName], 'readonly');
      var req = trx.objectStore(storeName).openCursor(
        IDBKeyRange.lowerBound(0));
      var items = [];

      req.onsuccess = function (e) {
        if (e.target.result == null) {
          success(items);
        } else {
          items.push(e.target.result.value);
          e.target.result.continue();
        }
      };

      req.onerror = error;
    } catch (e) {
      if (error != null) {
        error(e);
      }
    }
  }), error);
};

/**
 * Returns all item keys from the database.
 */
EditorUi.prototype.getDatabaseItemKeys = function (success, error, storeName) {
  this.openDatabase(mxUtils.bind(this, function (db) {
    try {
      storeName = storeName || 'objects';
      var trx = db.transaction([storeName], 'readonly');
      var req = trx.objectStore(storeName).getAllKeys();

      req.onsuccess = function () {
        success(req.result);
      };

      req.onerror = error;
    } catch (e) {
      if (error != null) {
        error(e);
      }
    }
  }), error);
};
/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.closeLibrary = function (file) {
  if (file != null) {
    this.removeLibrarySidebar(file.getHash());

    if (file.constructor != LocalLibrary) {
      mxSettings.removeCustomLibrary(file.getHash());
    }

    if (file.title == '.scratchpad') {
      this.scratchpad = null;
    }
  }
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.removeLibrarySidebar = function (id) {
  var elts = this.sidebar.palettes[id];
  if (elts != null) {
    for (var i = 0; i < elts.length; i++) {
      elts[i].parentNode.removeChild(elts[i]);
    }
    delete this.sidebar.palettes[id];
  }
};

/**
 * Changes the position of the library in the sidebar 
 */
EditorUi.prototype.repositionLibrary = function (nextChild) {
  var c = this.sidebar.container;
  if (nextChild == null) {
    var elts = this.sidebar.palettes['L.scratchpad'];
    if (elts == null) {
      elts = this.sidebar.palettes['search'];
    }
    if (elts != null) {
      nextChild = elts[elts.length - 1].nextSibling;
    }
  }
  nextChild = (nextChild != null) ? nextChild : c.firstChild.nextSibling.nextSibling;
  var content = c.lastChild;
  var title = content.previousSibling;
  c.insertBefore(content, nextChild);
  c.insertBefore(title, content);
}

/**
 * Loads the image from the given URI.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.loadImage = function (uri, onload, onerror) {
  try {
    var img = new Image();
    img.onload = function () {
      img.width = (img.width > 0) ? img.width : 120;
      img.height = (img.height > 0) ? img.height : 120;
      onload(img);
    };
    if (onerror != null) {
      img.onerror = onerror;
    };
    img.src = uri;
  } catch (e) {
    if (onerror != null) {
      onerror(e);
    } else {
      throw e;
    }
  }
};
/**
 * Resizes the given image if <maxImageBytes> is not null.
 */
EditorUi.prototype.resizeImage = function (img, data, fn, enabled, maxSize, thresh) {
  maxSize = (maxSize != null) ? maxSize : this.maxImageSize;
  var w = Math.max(1, img.width);
  var h = Math.max(1, img.height);
  if (enabled && this.isResampleImage(data, thresh)) {
    try {
      var factor = Math.max(w / maxSize, h / maxSize);
      if (factor > 1) {
        var w2 = Math.round(w / factor);
        var h2 = Math.round(h / factor);
        var canvas = document.createElement('canvas');
        canvas.width = w2;
        canvas.height = h2;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w2, h2);
        var tmp = canvas.toDataURL();

        // Uses new image if smaller
        if (tmp.length < data.length) {
          // Checks if the image is empty by comparing
          // with an empty image of the same size
          var canvas2 = document.createElement('canvas');
          canvas2.width = w2;
          canvas2.height = h2;
          var tmp2 = canvas2.toDataURL();
          if (tmp !== tmp2) {
            data = tmp;
            w = w2;
            h = h2;
          }
        }
      }
    } catch (e) {
      // ignores image scaling errors
    }
  }
  fn(data, w, h);
};
/**
 * 
 */
EditorUi.prototype.isResampleImage = function (data, thresh) {
  thresh = (thresh != null) ? thresh : this.resampleThreshold;

  return data.length > thresh;
};
/**
 * Extracts the XML from the compressed or non-compressed text chunk.
 */
EditorUi.prototype.extractGraphModelFromPng = function (data) {
  return Editor.extractGraphModelFromPng(data);
};

/**
 * Returns whether or not any services should be shown in dialogs
 */
EditorUi.prototype.isServices = function (count) {
  var noServices = 1; //(mxClient.IS_IOS) ? 0 : 1;
  return count != noServices;
};

/**
 * Hook for subclassers.
 * 导航栏--视图--素材库 右边的 ? 帮助
 */
EditorUi.prototype.openLink = function (url, target, allowOpener) {
  // LATER: Replace this with direct calls to graph
  return this.editor.graph.openLink(url, target, allowOpener);
};

/**
 * Hook for subclassers.
 * 子类挂钩
 */
EditorUi.prototype.showSplash = function (force) {};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.getCurrentFile = function () {
  return this.currentFile;
};

/**
 * Handling for canvas export.
 */
EditorUi.prototype.isExportToCanvas = function () {
  return this.editor.isExportToCanvas();
};

/**
 * Hides the current menu.
 * 隐藏当前菜单
 */
EditorUi.prototype.showLibraryDialog = function (name, sidebar, images, file, mode) {
  var dlg = new LibraryDialog(this, name, sidebar, images, file, mode);

  this.showDialog(dlg.container, 640, 440, true, false, mxUtils.bind(this, function (cancel) {
    if (cancel && this.getCurrentFile() == null && urlParams['embed'] != '1') {
      this.showSplash();
    }
  }));

  dlg.init();
};


/**
 * Translates this point by the given vector.
 * 把这一点转换成给定的向量
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.createLibraryDataFromImages = function (images) {
  var doc = mxUtils.createXmlDocument();
  var library = doc.createElement('mxlibrary');
  mxUtils.setTextContent(library, JSON.stringify(images));
  doc.appendChild(library);
  return mxUtils.getXml(doc);
};


/**
 * Returns true if files should be saved using <saveLocalFile>.
 * 如果文件应使用<saveLocalFile>保存，则返回true
 */
EditorUi.prototype.isLocalFileSave = function () {
  return ((urlParams['save'] != 'remote' && (mxClient.IS_IE ||
        (typeof window.Blob !== 'undefined' && typeof window.URL !== 'undefined')) &&
      document.documentMode != 9 && document.documentMode != 8 &&
      document.documentMode != 7 && !mxClient.IS_QUIRKS) ||
    this.isOfflineApp() || mxClient.IS_IOS);
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 * 素材库里面的导出xml文件和(导出svg文件)，保存本地xml文件
 */
EditorUi.prototype.saveLocalFile = function (data, filename, mimeType, base64Encoded, format, allowBrowser, allowTab) {
  allowBrowser = (allowBrowser != null) ? allowBrowser : false;
  allowTab = (allowTab != null) ? allowTab : (format != 'vsdx') && (!mxClient.IS_IOS || !navigator.standalone);
  var count = this.getServiceCount(allowBrowser);
  if (isLocalStorage) {
    count++;
  }
  var rowLimit = (count <= 4) ? 2 : (count > 6 ? 4 : 3);
  var dlg = new CreateDialog(this, filename, mxUtils.bind(this, function (newTitle, mode) {
      try {
        // Opens a new window
        if (mode == '_blank') {
          if (mimeType != null && mimeType.substring(0, 6) == 'image/') {
            this.openInNewWindow(data, mimeType, base64Encoded);
          } else {
            var win = window.open('about:blank');

            if (win == null) {
              mxUtils.popup(data, true);
            } else {
              win.document.write('<pre>' + mxUtils.htmlEntities(data, false) + '</pre>');
              win.document.close();
            }
          }
        } else if (mode == App.MODE_DEVICE || mode == 'download') {
          this.doSaveLocalFile(data, newTitle, mimeType, base64Encoded);
        } else if (newTitle != null && newTitle.length > 0) {
          this.pickFolder(mode, mxUtils.bind(this, function (folderId) {
            try {
              this.exportFile(data, newTitle, mimeType, base64Encoded, mode, folderId);
            } catch (e) {
              this.handleError(e);
            }
          }));
        }
      } catch (e) {
        this.handleError(e);
      }
    }), mxUtils.bind(this, function () {
      this.hideDialog();
    }), mxResources.get('saveAs'), mxResources.get('download'), false, allowBrowser, allowTab,
    null, count > 1, rowLimit, data, mimeType, base64Encoded);
  var height = (this.isServices(count)) ? ((count > rowLimit) ? 390 : 270) : 160;
  this.showDialog(dlg.container, 400, height, true, true);
  dlg.init();
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.doSaveLocalFile = function (data, filename, mimeType, base64Encoded, format) {
  // Appends .drawio extension for XML files with no extension
  // to avoid the browser to automatically append .xml instead
  if (mimeType == 'text/xml' &&
    !/(\.drawio)$/i.test(filename) &&
    !/(\.xml)$/i.test(filename)) {
    filename = filename + '.drawio';
  }

  // Newer versions of IE
  if (window.Blob && navigator.msSaveOrOpenBlob) {
    var blob = (base64Encoded) ?
      this.base64ToBlob(data, mimeType) :
      new Blob([data], {
        type: mimeType
      })
    navigator.msSaveOrOpenBlob(blob, filename);
  }
  // Older versions of IE (binary not supported)
  else if (mxClient.IS_IE) {
    var win = window.open('about:blank', '_blank');

    if (win == null) {
      mxUtils.popup(data, true);
    } else {
      win.document.write(data);
      win.document.close();
      win.document.execCommand('SaveAs', true, filename);
      win.close();
    }
  } else if (mxClient.IS_IOS && this.isOffline()) {
    // Workaround for "WebKitBlobResource error 1" in mobile Safari
    if (!navigator.standalone && mimeType != null && mimeType.substring(0, 6) == 'image/') {
      this.openInNewWindow(data, mimeType, base64Encoded);
    } else {
      this.showTextDialog(filename + ':', data);
    }
  } else {
    var a = document.createElement('a');
    // Workaround for mxXmlRequest.simulate no longer working in PaleMoon
    // if this is used (ie PNG export broken after XML export in PaleMoon)
    // and for "WebKitBlobResource error 1" for all browsers on iOS.
    var useDownload = (navigator.userAgent == null ||
        navigator.userAgent.indexOf("PaleMoon/") < 0) &&
      !mxClient.IS_IOS && typeof a.download !== 'undefined';

    // Workaround for Chromium 65 cross-domain anchor download issue
    if (mxClient.IS_GC && navigator.userAgent != null) {
      var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)
      var vers = raw ? parseInt(raw[2], 10) : false;
      useDownload = vers == 65 ? false : useDownload;
    }

    if (useDownload || this.isOffline()) {
      a.href = URL.createObjectURL((base64Encoded) ?
        this.base64ToBlob(data, mimeType) :
        new Blob([data], {
          type: mimeType
        }));

      if (useDownload) {
        a.download = filename;
      } else {
        // Workaround for same window in Safari
        a.setAttribute('target', '_blank');
      }
      document.body.appendChild(a);
      try {
        window.setTimeout(function () {
          URL.revokeObjectURL(a.href);
        }, 0);
        a.click();
        a.parentNode.removeChild(a);
      } catch (e) {
        // ignore
      }
    } else {
      var req = this.createEchoRequest(data, filename, mimeType, base64Encoded, format);
      req.simulate(document, '_blank');
    }
  }
};
/**
 * Returns the number of storage options enabled
 */
EditorUi.prototype.getServiceCount = function (allowBrowser, splash) {
  var serviceCount = 1;

  if (this.drive != null || typeof window.DriveClient === 'function') {
    serviceCount++
  }

  if (!splash && (this.dropbox != null || typeof window.DropboxClient === 'function')) {
    serviceCount++
  }

  if (this.oneDrive != null || typeof window.OneDriveClient === 'function') {
    serviceCount++
  }

  if (!splash && (this.gitHub != null)) {
    serviceCount++
  }

  if (!splash && (this.gitLab != null)) {
    serviceCount++
  }

  if (splash && allowBrowser && isLocalStorage && urlParams['browser'] == '1') {
    serviceCount++
  }

  return serviceCount;
}

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 * png 和jpg 图片导出后 处理
 */
EditorUi.prototype.base64ToBlob = function (base64Data, contentType) {
  contentType = contentType || '';
  var sliceSize = 1024;
  var byteCharacters = atob(base64Data);
  var bytesLength = byteCharacters.length;
  var slicesCount = Math.ceil(bytesLength / sliceSize);
  var byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    var begin = sliceIndex * sliceSize;
    var end = Math.min(begin + sliceSize, bytesLength);
    var bytes = new Array(end - begin);
    for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, {
    type: contentType
  });
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.loadLibrary = function (file, expand) {
  var doc = mxUtils.parseXml(file.getData());
  if (doc.documentElement.nodeName == 'mxlibrary') {
    var images = JSON.parse(mxUtils.getTextContent(doc.documentElement));
    this.libraryLoaded(file, images, doc.documentElement.getAttribute('title'), expand);
  } else {
    throw {
      message: mxResources.get('notALibraryFile')
    };
  }
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.getLibraryStorageHint = function (file) {
  return '';
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.libraryLoaded = function (file, images, optionalTitle, expand) {
  if (this.sidebar == null) {
    return;
  }

  if (file.constructor != LocalLibrary) {
    mxSettings.addCustomLibrary(file.getHash());
  }

  if (file.title == '.scratchpad') {
    this.scratchpad = file;
  }

  var elts = this.sidebar.palettes[file.getHash()];
  var nextSibling = (elts != null) ? elts[elts.length - 1].nextSibling : null;

  // Removes existing sidebar entry for this library
  this.removeLibrarySidebar(file.getHash());
  var dropTarget = null;

  var addImages = mxUtils.bind(this, function (imgs, content) {
    if (imgs.length == 0 && file.isEditable()) {
      if (dropTarget == null) {
        dropTarget = document.createElement('div');
        dropTarget.className = 'geDropTarget';
        mxUtils.write(dropTarget, mxResources.get('dragElementsHere'));
      }
      content.appendChild(dropTarget);
    } else {
      this.addLibraryEntries(imgs, content);
    }
  });

  // Adds entries to search index
  // KNOWN: Existing entries are not replaced after edit of custom library
  if (this.sidebar != null && images != null) {
    this.sidebar.addEntries(images);
  }

  // Adds new sidebar entry for this library
  var tmp = (optionalTitle != null && optionalTitle.length > 0) ? optionalTitle : file.getTitle();
  var contentDiv = this.sidebar.addPalette(file.getHash(), tmp,
    (expand != null) ? expand : true, mxUtils.bind(this, function (content) {
      addImages(images, content);
    }));

  this.repositionLibrary(nextSibling);

  // Adds tooltip for backend
  var title = contentDiv.parentNode.previousSibling;
  var tip = title.getAttribute('title');

  if (tip != null && tip.length > 0 && file.title != '.scratchpad') {
    title.setAttribute('title', this.getLibraryStorageHint(file) + '\n' + tip);
  }

  var buttons = document.createElement('div');
  buttons.style.position = 'absolute';
  buttons.style.right = '0px';
  buttons.style.top = '0px';
  buttons.style.padding = '8px'

  // Workaround for CSS error in IE8 (standards and quirks)
  if (!mxClient.IS_QUIRKS && document.documentMode != 8) {
    buttons.style.backgroundColor = 'inherit';
  }

  title.style.position = 'relative';
  var btnWidth = 18;
  var btn = document.createElement('img');
  btn.setAttribute('src', Dialog.prototype.closeImage);
  btn.setAttribute('title', mxResources.get('close'));
  btn.setAttribute('valign', 'absmiddle');
  btn.setAttribute('border', '0');
  btn.style.cursor = 'pointer';
  btn.style.margin = '0 3px';

  var saveBtn = null;
  if (file.title != '.scratchpad' || this.closableScratchpad) {
    buttons.appendChild(btn);
    mxEvent.addListener(btn, 'click', mxUtils.bind(this, function (evt) {
      // Workaround for close after any button click in IE8/quirks
      if (!mxEvent.isConsumed(evt)) {
        var fn = mxUtils.bind(this, function () {
          this.closeLibrary(file);
        });
        if (saveBtn != null) {
          this.confirm(mxResources.get('allChangesLost'), null, fn,
            mxResources.get('cancel'), mxResources.get('discardChanges'));
        } else {
          fn();
        }
        mxEvent.consume(evt);
      }
    }));
  }

  if (file.isEditable()) {
    var graph = this.editor.graph;
    var spinBtn = null;

    var editLibrary = mxUtils.bind(this, function (evt) {
      this.showLibraryDialog(file.getTitle(), contentDiv, images, file, file.getMode());
      mxEvent.consume(evt);
    });

    var saveLibrary = mxUtils.bind(this, function (evt) {
      file.setModified(true);
      if (file.isAutosave()) {
        if (spinBtn != null && spinBtn.parentNode != null) {
          spinBtn.parentNode.removeChild(spinBtn);
        }

        spinBtn = btn.cloneNode(false);
        spinBtn.setAttribute('src', Editor.spinImage);
        spinBtn.setAttribute('title', mxResources.get('saving'));
        spinBtn.style.cursor = 'default';
        spinBtn.style.marginRight = '2px';
        spinBtn.style.marginTop = '-2px';
        buttons.insertBefore(spinBtn, buttons.firstChild);
        title.style.paddingRight = (buttons.childNodes.length * btnWidth) + 'px';

        this.saveLibrary(file.getTitle(), images, file, file.getMode(), true, true, function () {
          if (spinBtn != null && spinBtn.parentNode != null) {
            spinBtn.parentNode.removeChild(spinBtn);
            title.style.paddingRight = (buttons.childNodes.length * btnWidth) + 'px';
          }
        });
      } else if (saveBtn == null) {
        saveBtn = btn.cloneNode(false);
        saveBtn.setAttribute('src', IMAGE_PATH + '/download.png');
        saveBtn.setAttribute('title', mxResources.get('save'));
        buttons.insertBefore(saveBtn, buttons.firstChild);

        mxEvent.addListener(saveBtn, 'click', mxUtils.bind(this, function (evt) {
          this.saveLibrary(file.getTitle(), images, file, file.getMode(),
            file.constructor == LocalLibrary, true,
            function () {
              if (saveBtn != null && !file.isModified()) {
                title.style.paddingRight = (buttons.childNodes.length * btnWidth) + 'px';
                saveBtn.parentNode.removeChild(saveBtn);
                saveBtn = null;
              }
            });
          mxEvent.consume(evt);
        }));

        title.style.paddingRight = (buttons.childNodes.length * btnWidth) + 'px';
      }
    });

    var addCells = mxUtils.bind(this, function (cells, bounds, evt, title) {
      cells = graph.cloneCells(mxUtils.sortCells(graph.model.getTopmostCells(cells)));

      // Translates cells to origin
      for (var i = 0; i < cells.length; i++) {
        var geo = graph.getCellGeometry(cells[i]);
        if (geo != null) {
          geo.translate(-bounds.x, -bounds.y);
        }
      }

      contentDiv.appendChild(this.sidebar.createVertexTemplateFromCells(
        cells, bounds.width, bounds.height, title || '', true, false, false));

      var xml = Graph.compress(mxUtils.getXml(this.editor.graph.encodeCells(cells)));
      var entry = {
        xml: xml,
        w: bounds.width,
        h: bounds.height
      };

      if (title != null) {
        entry.title = title;
      }

      images.push(entry);
      saveLibrary(evt);

      if (dropTarget != null && dropTarget.parentNode != null && images.length > 0) {
        dropTarget.parentNode.removeChild(dropTarget);
        dropTarget = null;
      }
    });

    var addSelection = mxUtils.bind(this, function (evt) {
      if (!graph.isSelectionEmpty()) {
        var cells = graph.getSelectionCells();
        var bounds = graph.view.getBounds(cells);

        var s = graph.view.scale;
        bounds.x /= s;
        bounds.y /= s;
        bounds.width /= s;
        bounds.height /= s;

        bounds.x -= graph.view.translate.x;
        bounds.y -= graph.view.translate.y;

        addCells(cells, bounds);
      } else if (graph.getRubberband().isActive()) {
        graph.getRubberband().execute(evt);
        graph.getRubberband().reset();
      } else {
        //素材库 + 如果库里没有内容，会弹层报错提示：未选择
        this.showError(mxResources.get('error'), mxResources.get('nothingIsSelected'), mxResources.get('ok'));
      }
      mxEvent.consume(evt);
    });

    // Adds drop handler from graph
    mxEvent.addGestureListeners(contentDiv, function () {}, mxUtils.bind(this, function (evt) {
      if (graph.isMouseDown && graph.panningManager != null && graph.graphHandler.first != null) {

        // graph.graphHandler.suspend(); //报错先注释
        this.spinner.stop();
        if (graph.graphHandler.hint != null) {
          graph.graphHandler.hint.style.visibility = 'hidden';
        }

        contentDiv.style.backgroundColor = '#f1f3f4';
        contentDiv.style.cursor = 'copy';
        graph.panningManager.stop();
        graph.autoScroll = false;

        mxEvent.consume(evt);
      }
    }), mxUtils.bind(this, function (evt) {
      if (graph.isMouseDown && graph.panningManager != null && graph.graphHandler != null) {
        contentDiv.style.backgroundColor = '';
        contentDiv.style.cursor = 'default';
        this.sidebar.showTooltips = true;
        graph.panningManager.stop();

        graph.graphHandler.reset();
        graph.isMouseDown = false;
        graph.autoScroll = true;

        addSelection(evt);
        mxEvent.consume(evt);
      }
    }));

    // Handles mouse leaving the library and restoring move
    mxEvent.addListener(contentDiv, 'mouseleave', mxUtils.bind(this, function (evt) {
      if (graph.isMouseDown && graph.graphHandler.first != null) {

        graph.graphHandler.resume(); //报错

        if (graph.graphHandler.hint != null) {
          graph.graphHandler.hint.style.visibility = 'visible';
        }

        contentDiv.style.backgroundColor = '';
        contentDiv.style.cursor = '';
        graph.autoScroll = true;
      }
    }));

    // Adds drop handler from filesystem
    if (Graph.fileSupport) {

      mxEvent.addListener(contentDiv, 'dragover', mxUtils.bind(this, function (evt) {
        contentDiv.style.backgroundColor = '#f1f3f4';
        evt.dataTransfer.dropEffect = 'copy';
        contentDiv.style.cursor = 'copy';
        this.sidebar.hideTooltip();
        evt.stopPropagation();
        evt.preventDefault();
      }));

      mxEvent.addListener(contentDiv, 'drop', mxUtils.bind(this, function (evt) {
        contentDiv.style.cursor = '';
        contentDiv.style.backgroundColor = '';

        if (evt.dataTransfer.files.length > 0) {
          this.importFiles(evt.dataTransfer.files, 0, 0, this.maxImageSize, mxUtils.bind(this, function (data, mimeType, x, y, w, h, img, doneFn, file) {
            if (data != null && mimeType.substring(0, 6) == 'image/') {
              var style = 'shape=image;verticalLabelPosition=bottom;verticalAlign=top;imageAspect=0;aspect=fixed;image=' +
                this.convertDataUri(data);
              var cells = [new mxCell('', new mxGeometry(0, 0, w, h), style)];
              cells[0].vertex = true;

              addCells(cells, new mxRectangle(0, 0, w, h), evt, (mxEvent.isAltDown(evt)) ? null : img.substring(0, img.lastIndexOf('.')).replace(/_/g, ' '));

              if (dropTarget != null && dropTarget.parentNode != null && images.length > 0) {
                dropTarget.parentNode.removeChild(dropTarget);
                dropTarget = null;
              }
            } else {
              var done = false;

              var doImport = mxUtils.bind(this, function (theData, theMimeType) {
                if (theData != null && theMimeType == 'application/pdf') {
                  var xml = Editor.extractGraphModelFromPdf(theData);

                  if (xml != null && xml.length > 0) {
                    theMimeType = 'text/xml';
                    theData = xml;
                  }
                }

                if (theData != null) //Try to parse the file as xml (can be a library or mxfile). Otherwise, an error will be shown
                {
                  var doc = mxUtils.parseXml(theData);

                  if (doc.documentElement.nodeName == 'mxlibrary') {
                    try {
                      var temp = JSON.parse(mxUtils.getTextContent(doc.documentElement));
                      addImages(temp, contentDiv);
                      images = images.concat(temp);
                      saveLibrary(evt);
                      this.spinner.stop();
                      done = true;
                    } catch (e) {
                      // ignore
                    }
                  } else if (doc.documentElement.nodeName == 'mxfile') {
                    try {
                      var pages = doc.documentElement.getElementsByTagName('diagram');
                      for (var i = 0; i < pages.length; i++) {
                        var cells = this.stringToCells(Editor.getDiagramNodeXml(pages[i]));
                        var size = this.editor.graph.getBoundingBoxFromGeometry(cells);
                        addCells(cells, new mxRectangle(0, 0, size.width, size.height), evt);
                      }
                      done = true;
                    } catch (e) {
                      if (window.console != null) {
                        console.log('error in drop handler:', e);
                      }
                    }
                  }
                }

                if (!done) {
                  this.spinner.stop();
                  this.handleError({
                    message: mxResources.get('errorLoadingFile')
                  })
                }

                if (dropTarget != null && dropTarget.parentNode != null && images.length > 0) {
                  dropTarget.parentNode.removeChild(dropTarget);
                  dropTarget = null;
                }
              });

              if (file != null && img != null && ((/(\.v(dx|sdx?))($|\?)/i.test(img)) || /(\.vs(x|sx?))($|\?)/i.test(img))) {
                this.importVisio(file, function (xml) {
                  doImport(xml, 'text/xml');
                }, null, img);
              } else if (!this.isOffline() && new XMLHttpRequest().upload && this.isRemoteFileFormat(data, img) && file != null) {
                this.parseFile(file, mxUtils.bind(this, function (xhr) {
                  if (xhr.readyState == 4) {
                    this.spinner.stop();

                    if (xhr.status >= 200 && xhr.status <= 299) {
                      doImport(xhr.responseText, 'text/xml');
                    } else {
                      this.handleError({
                          message: mxResources.get((xhr.status == 413) ?
                            'drawingTooLarge' : 'invalidOrMissingFile')
                        },
                        mxResources.get('errorLoadingFile'));
                    }
                  }
                }));
              } else {
                doImport(data, mimeType);
              }
            }
          }));
        }

        evt.stopPropagation();
        evt.preventDefault();
      }));

      mxEvent.addListener(contentDiv, 'dragleave', function (evt) {
        contentDiv.style.cursor = '';
        contentDiv.style.backgroundColor = '';
        evt.stopPropagation();
        evt.preventDefault();
      });
    }

    btn = btn.cloneNode(false);
    btn.setAttribute('src', Editor.editImage);
    btn.setAttribute('title', mxResources.get('edit'));
    buttons.insertBefore(btn, buttons.firstChild);

    mxEvent.addListener(btn, 'click', editLibrary);
    mxEvent.addListener(contentDiv, 'dblclick', function (evt) {
      if (mxEvent.getSource(evt) == contentDiv) {
        editLibrary(evt);
      }
    });

    var btn2 = btn.cloneNode(false);
    btn2.setAttribute('src', Editor.plusImage);
    btn2.setAttribute('title', mxResources.get('add'));
    buttons.insertBefore(btn2, buttons.firstChild);
    mxEvent.addListener(btn2, 'click', addSelection);

    if (!this.isOffline() && file.title == '.scratchpad' && EditorUi.scratchpadHelpLink != null) {
      var link = document.createElement('span');
      link.setAttribute('title', mxResources.get('help'));
      link.style.cssText = 'color:#a3a3a3;text-decoration:none;margin-right:2px;';
      mxUtils.write(link, '?');

      mxEvent.addGestureListeners(link, mxUtils.bind(this, function (evt) {
        this.openLink(EditorUi.scratchpadHelpLink);
        mxEvent.consume(evt);
      }));
      buttons.insertBefore(link, buttons.firstChild);
    }
  }

  title.appendChild(buttons);
  title.style.paddingRight = (buttons.childNodes.length * btnWidth) + 'px';
};

	/**
	 * Generates a Mermaid image.
   * 插入高级布局里面的 Mermaid 弹层方法
	 */
	// EditorUi.prototype.generateMermaidImage = function (data, config, success, error) {
	// 	var ui = this;
	// 	var delayed = function () {
	// 		try {
	// 			this.loadingMermaid = false;
	// 			config = (config != null) ? config : EditorUi.defaultMermaidConfig;
	// 			config.securityLevel = 'strict';
	// 			config.startOnLoad = false;

	// 			mermaid.mermaidAPI.initialize(config);
	// 			mermaid.mermaidAPI.render('geMermaidOutput-' + new Date().getTime(), data, function (svg) {
	// 				try {
	// 					// Workaround for namespace errors in SVG output for IE
	// 					if (mxClient.IS_IE || mxClient.IS_IE11) {
	// 						svg = svg.replace(/ xmlns:\S*="http:\/\/www.w3.org\/XML\/1998\/namespace"/g, '').
	// 						replace(/ (NS xml|\S*):space="preserve"/g, ' xml:space="preserve"');
	// 					}

	// 					var doc = mxUtils.parseXml(svg);
	// 					var svgs = doc.getElementsByTagName('svg');

	// 					if (svgs.length > 0) {
	// 						var w = parseFloat(svgs[0].getAttribute('width'));
	// 						var h = parseFloat(svgs[0].getAttribute('height'));

	// 						success(ui.convertDataUri(Editor.createSvgDataUri(svg)), w, h);
	// 					} else {
	// 						error({
	// 							message: mxResources.get('invalidInput')
	// 						});
	// 					}
	// 				} catch (e) {
	// 					error(e);
	// 				}
	// 			});
	// 		} catch (e) {
	// 			error(e);
	// 		}
	// 	};

	// 	if (typeof mermaid === 'undefined' && !this.loadingMermaid && !this.isOffline(true)) {
  //     this.loadingMermaid = true;
	// 		if (urlParams['dev'] == '1') {
	// 			mxscript('/mermaid.min.js', delayed);
	// 		} else {
  //       mxscript('/extensions.min.js', delayed);
  //     }
	// 	} else {
	// 		delayed();
  //   }
    
	// };

	/**
	 * Generates a plant UML image. Possible types are svg, png and txt.
   * 插入高级布局里面的 plantUml 弹层方法
	 */
	EditorUi.prototype.generatePlantUmlImage = function (data, type, success, error) {
		function encode64(data) {
			var r = "";
			for (let i = 0; i < data.length; i += 3) {
				if (i + 2 == data.length) {
					r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
				} else if (i + 1 == data.length) {
					r += append3bytes(data.charCodeAt(i), 0, 0);
				} else {
					r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1),
						data.charCodeAt(i + 2));
				}
			}
			return r;
		}

		function append3bytes(b1, b2, b3) {
      var c1,c2,c3,c4;

			c1 = b1 >> 2;
			c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
			c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
			c4 = b3 & 0x3F;
			var r = "";
			r += encode6bit(c1 & 0x3F);
			r += encode6bit(c2 & 0x3F);
			r += encode6bit(c3 & 0x3F);
			r += encode6bit(c4 & 0x3F);
			return r;
		}

		function encode6bit(b) {
			if (b < 10) {
				return String.fromCharCode(48 + b);
			}

			b -= 10;

			if (b < 26) {
				return String.fromCharCode(65 + b);
			}

			b -= 26;

			if (b < 26) {
				return String.fromCharCode(97 + b);
			}

			b -= 26;

			if (b == 0) {
				return '-';
			}

			if (b == 1) {
				return '_';
			}

			return '?';
		}

		// TODO: Remove unescape, use btoa for compatibility with graph.compress
		function compress(s) {
			return encode64(pako.deflateRaw(s, {
				to: 'string'
			}));
		};

		var plantUmlServerUrl = (type == 'txt') ? PLANT_URL + '/txt/' :
			((type == 'png') ? PLANT_URL + '/png/' : PLANT_URL + '/svg/');

		var xhr = new XMLHttpRequest();
		xhr.open('GET', plantUmlServerUrl + compress(data), true);

		if (type != 'txt') {
			xhr.responseType = 'blob';
		}

		xhr.onload = function (e) {
			if (this.status >= 200 && this.status < 300) {
				if (type == 'txt') {
					success(this.response);
				} else {
					var reader = new FileReader();
					reader.readAsDataURL(this.response);

					reader.onloadend = function (e) {
						var img = new Image();

						img.onload = function () {
							try {
								var w = img.width;
								var h = img.height;

								// Workaround for 0 image size in IE11
								if (w == 0 && h == 0) {
									var data = reader.result;
									var comma = data.indexOf(',');
									var svgText = decodeURIComponent(escape(atob(data.substring(comma + 1))));
									var root = mxUtils.parseXml(svgText);
									var svgs = root.getElementsByTagName('svg');

									if (svgs.length > 0) {
										w = parseFloat(svgs[0].getAttribute('width'));
										h = parseFloat(svgs[0].getAttribute('height'));
									}
								}

								success(reader.result, w, h);
							} catch (e) {
								error(e);
							}
						};

						img.src = reader.result;
					};

					reader.onerror = function (e) {
						error(e);
					};
				}
			} else {
				error(e);
			}
		};

		xhr.onerror = function (e) {
			error(e);
		};
		xhr.send();
  };
  
  /**
   * Inserts the given text as a preformatted HTML text.
   * 插入高级布局里面的 plantUml文本 方法
   */
  EditorUi.prototype.insertAsPreText = function (text, x, y) {
    var graph = this.editor.graph;
    var cell = null;
    graph.getModel().beginUpdate();
    try {
      cell = graph.insertVertex(null, null, '<pre>' + text + '</pre>',
        x, y, 1, 1, 'text;html=1;align=left;verticalAlign=top;');
      graph.updateCellSize(cell, true);
    } finally {
      graph.getModel().endUpdate();
    }
    return cell;
  };
  
	/**
	 * 高级布局里面 CSV 方法
	 */
	EditorUi.prototype.showImportCsvDialog = function () {
		if (this.importCsvDialog == null) {
			this.importCsvDialog = new TextareaDialog(this, mxResources.get('csv') + ':',
				Editor.defaultCsvValue, mxUtils.bind(this, function (newValue) {
					this.importCsv(newValue);
				}), null, null, 620, 430, null, true, true, mxResources.get('import'),
				!this.isOffline() ? 'https://drawio-app.com/import-from-csv-to-drawio/' : null);
		}

		this.showDialog(this.importCsvDialog.container, 640, 520, true, true, null, null, null, null, true);
		this.importCsvDialog.init();
  };
  
	/**
	 *导入CSV 方法
	 */
	EditorUi.prototype.importCsv = function (text, done) {
		try {
			var lines = text.split('\n');
			var allCells = [];
			var cells = [];
			var dups = {};

			if (lines.length > 0) {
				// Internal lookup table
				var lookups = {};

				// Default values
				var style = null;
				var styles = null;
				var stylename = null;
				var labelname = null;
				var labels = null;
				var parentstyle = null;
				var identity = null;
				var parent = null;
				var namespace = '';
				var width = 'auto';
				var height = 'auto';
				var left = null;
				var top = null;
				var edgespacing = 40;
				var nodespacing = 40;
				var levelspacing = 100;
				var padding = 0;

				var graph = this.editor.graph;
				var view = graph.view;
				var bds = graph.getGraphBounds();

				// Delayed after optional layout
				var afterInsert = function () {
					if (done != null) {
						done(select);
					} else {
						graph.setSelectionCells(select);
						graph.scrollCellToVisible(graph.getSelectionCell());
					}
				};

				// Computes unscaled, untranslated graph bounds
				var pt = graph.getFreeInsertPoint();
				var x0 = pt.x;
				var y0 = pt.y;
				var y = y0;

				// Default label value depends on column names
				var label = null;

				// Default layout to run.
				var layout = 'auto';

				// Name of the attribute that contains the parent reference
				var parent = null;

				// Name of the attribute that contains the references for creating edges
				var edges = [];

				// Name of the column for hyperlinks
				var link = null;

				// String array of names to remove from metadata
				var ignore = null;

				// Read processing instructions first
				var index = 0;

				while (index < lines.length && lines[index].charAt(0) == '#') {
					var text = lines[index];
					index++;

					while (index < lines.length && text.charAt(text.length - 1) == '\\' &&
						lines[index].charAt(0) == '#') {
						text = text.substring(0, text.length - 1) + mxUtils.trim(lines[index].substring(1));
						index++;
					}

					if (text.charAt(1) != '#') {
						// Processing instruction
						var idx = text.indexOf(':');

						if (idx > 0) {
							var key = mxUtils.trim(text.substring(1, idx));
							var value = mxUtils.trim(text.substring(idx + 1));

							if (key == 'label') {
								label = graph.sanitizeHtml(value);
							} else if (key == 'labelname' && value.length > 0 && value != '-') {
								labelname = value;
							} else if (key == 'labels' && value.length > 0 && value != '-') {
								labels = JSON.parse(value);
							} else if (key == 'style') {
								style = value;
							} else if (key == 'parentstyle') {
								parentstyle = value;
							} else if (key == 'stylename' && value.length > 0 && value != '-') {
								stylename = value;
							} else if (key == 'styles' && value.length > 0 && value != '-') {
								styles = JSON.parse(value);
							} else if (key == 'identity' && value.length > 0 && value != '-') {
								identity = value;
							} else if (key == 'parent' && value.length > 0 && value != '-') {
								parent = value;
							} else if (key == 'namespace' && value.length > 0 && value != '-') {
								namespace = value;
							} else if (key == 'width') {
								width = value;
							} else if (key == 'height') {
								height = value;
							} else if (key == 'left' && value.length > 0) {
								left = value;
							} else if (key == 'top' && value.length > 0) {
								top = value;
							} else if (key == 'ignore') {
								ignore = value.split(',');
							} else if (key == 'connect') {
								edges.push(JSON.parse(value));
							} else if (key == 'link') {
								link = value;
							} else if (key == 'padding') {
								padding = parseFloat(value);
							} else if (key == 'edgespacing') {
								edgespacing = parseFloat(value);
							} else if (key == 'nodespacing') {
								nodespacing = parseFloat(value);
							} else if (key == 'levelspacing') {
								levelspacing = parseFloat(value);
							} else if (key == 'layout') {
								layout = value;
							}
						}
					}
				}

				if (lines[index] == null) {
					throw new Error(mxResources.get('invalidOrMissingFile'));
				}

				// Converts identity and parent to index and validates XML attribute names
				var keys = this.editor.csvToArray(lines[index]);
				var identityIndex = null;
				var parentIndex = null;
				var attribs = [];

				for (var i = 0; i < keys.length; i++) {
					if (identity == keys[i]) {
						identityIndex = i;
					}

					if (parent == keys[i]) {
						parentIndex = i;
					}

					attribs.push(mxUtils.trim(keys[i]).replace(/[^a-z0-9]+/ig, '_').replace(/^\d+/, '').replace(/_+$/, ''));
				}

				if (label == null) {
					label = '%' + attribs[0] + '%';
				}

				if (edges != null) {
					for (var e = 0; e < edges.length; e++) {
						if (lookups[edges[e].to] == null) {
							lookups[edges[e].to] = {};
						}
					}
				}

				// Parse and validate input
				var arrays = [];

				for (var i = index + 1; i < lines.length; i++) {
					var values = this.editor.csvToArray(lines[i]);

					if (values == null) {
						var short = (lines[i].length > 40) ? lines[i].substring(0, 40) + '...' : lines[i];

						throw new Error(short + ' (' + i + '):\n' + mxResources.get('containsValidationErrors'));
					} else if (values.length > 0) {
						arrays.push(values);
					}
				}

				graph.model.beginUpdate();
				try {
					for (var i = 0; i < arrays.length; i++) {
						var values = arrays[i];
						var cell = null;
						var id = (identityIndex != null) ? namespace + values[identityIndex] : null;

						if (id != null) {
							cell = graph.model.getCell(id);
						}

						var exists = cell != null;
						var newCell = new mxCell(label, new mxGeometry(x0, y,
							0, 0), style || 'whiteSpace=wrap;html=1;');
						newCell.vertex = true;
						newCell.id = id;

						for (var j = 0; j < values.length; j++) {
							graph.setAttributeForCell(newCell, attribs[j], values[j]);
						}

						if (labelname != null && labels != null) {
							var tempLabel = labels[newCell.getAttribute(labelname)];

							if (tempLabel != null) {
								graph.labelChanged(newCell, tempLabel);
							}
						}

						if (stylename != null && styles != null) {
							var tempStyle = styles[newCell.getAttribute(stylename)];

							if (tempStyle != null) {
								newCell.style = tempStyle;
							}
						}

						graph.setAttributeForCell(newCell, 'placeholders', '1');
						newCell.style = graph.replacePlaceholders(newCell, newCell.style);

						if (exists) {
							graph.model.setGeometry(cell, newCell.geometry);
							graph.model.setStyle(cell, newCell.style);

							if (mxUtils.indexOf(cells, cell) < 0) {
								cells.push(cell);
							}
						}

						cell = newCell;

						if (!exists) {
							for (var e = 0; e < edges.length; e++) {
								lookups[edges[e].to][cell.getAttribute(edges[e].to)] = cell;
							}
						}

						if (link != null && link != 'link') {
							graph.setLinkForCell(cell, cell.getAttribute(link));

							// Removes attribute
							graph.setAttributeForCell(cell, link, null);
						}

						// Sets the size
						graph.fireEvent(new mxEventObject('cellsInserted', 'cells', [cell]));
						var size = this.editor.graph.getPreferredSizeForCell(cell);

						if (cell.vertex) {
							if (left != null && cell.getAttribute(left) != null) {
								cell.geometry.x = x0 + parseFloat(cell.getAttribute(left));
							}

							if (top != null && cell.getAttribute(top) != null) {
								cell.geometry.y = y0 + parseFloat(cell.getAttribute(top));
							}

							if (width.charAt(0) == '@' && cell.getAttribute(width.substring(1)) != null) {
								cell.geometry.width = parseFloat(cell.getAttribute(width.substring(1)));
							} else {
								cell.geometry.width = (width == 'auto') ? size.width + padding : parseFloat(width);
							}

							if (height.charAt(0) == '@' && cell.getAttribute(height.substring(1)) != null) {
								cell.geometry.height = parseFloat(cell.getAttribute(height.substring(1)));
							} else {
								cell.geometry.height = (height == 'auto') ? size.height + padding : parseFloat(height);
							}

							y += cell.geometry.height + nodespacing;
						}

						if (!exists) {
							var parent = (parentIndex != null) ? graph.model.getCell(
								namespace + values[parentIndex]) : null;
							allCells.push(cell);

							if (parent != null) {
								parent.style = graph.replacePlaceholders(parent, parentstyle);
								graph.addCell(cell, parent);
							} else {
								cells.push(graph.addCell(cell));
							}
						} else {
							if (dups[id] == null) {
								dups[id] = [];
							}

							dups[id].push(cell);
						}
					}

					var roots = cells.slice();
					var select = cells.slice();

					for (var e = 0; e < edges.length; e++) {
						var edge = edges[e];

						for (var i = 0; i < allCells.length; i++) {
							var cell = allCells[i];

							var insertEdge = mxUtils.bind(this, function (realCell, dataCell, edge) {
								var tmp = dataCell.getAttribute(edge.from);

								if (tmp != null) {
									// Removes attribute
									graph.setAttributeForCell(dataCell, edge.from, null);

									if (tmp != '') {
										var refs = tmp.split(',');

										for (var j = 0; j < refs.length; j++) {
											var ref = lookups[edge.to][refs[j]];

											if (ref != null) {
												var label = edge.label;

												if (edge.fromlabel != null) {
													label = (dataCell.getAttribute(edge.fromlabel) || '') + (label || '');
												}

												if (edge.tolabel != null) {
													label = (label || '') + (ref.getAttribute(edge.tolabel) || '');
												}

												var placeholders = ((edge.placeholders == 'target') ==
													!edge.invert) ? ref : realCell;
												var style = (edge.style != null) ?
													graph.replacePlaceholders(placeholders, edge.style) :
													graph.createCurrentEdgeStyle();

												var edgeCell = graph.insertEdge(null, null, label || '', (edge.invert) ?
													ref : realCell, (edge.invert) ? realCell : ref, style);

												// Adds additional edge labels
												if (edge.labels != null) {
													for (var k = 0; k < edge.labels.length; k++) {
														var def = edge.labels[k];
														var elx = (def.x != null) ? def.x : 0;
														var ely = (def.y != null) ? def.y : 0;
														var st = 'resizable=0;html=1;';
														var el = new mxCell(def.label || k,
															new mxGeometry(elx, ely, 0, 0), st);
														el.vertex = true;
														el.connectable = false;
														el.geometry.relative = true;

														if (def.dx != null || def.dy != null) {
															el.geometry.offset = new mxPoint(
																(def.dx != null) ? def.dx : 0,
																(def.dy != null) ? def.dy : 0);
														}

														edgeCell.insert(el);
													}
												}

												select.push(edgeCell);
												mxUtils.remove((edge.invert) ? realCell : ref, roots);
											}
										}
									}
								}
							});

							insertEdge(cell, cell, edge);

							// Checks more entries
							if (dups[cell.id] != null) {
								for (var j = 0; j < dups[cell.id].length; j++) {
									insertEdge(cell, dups[cell.id][j], edge);
								}
							}
						}
					}

					// Removes ignored attributes after processing above
					if (ignore != null) {
						for (var i = 0; i < allCells.length; i++) {
							var cell = allCells[i];

							for (var j = 0; j < ignore.length; j++) {
								graph.setAttributeForCell(cell, mxUtils.trim(ignore[j]), null);
							}
						}
					}

					if (cells.length > 0) {
						var edgeLayout = new mxParallelEdgeLayout(graph);
						edgeLayout.spacing = edgespacing;

						var postProcess = function () {
							if (edgeLayout.spacing > 0) {
								edgeLayout.execute(graph.getDefaultParent());
							}

							// Aligns cells to grid and/or rounds positions
							for (var i = 0; i < cells.length; i++) {
								var geo = graph.getCellGeometry(cells[i]);
								geo.x = Math.round(graph.snap(geo.x));
								geo.y = Math.round(graph.snap(geo.y));

								if (width == 'auto') {
									geo.width = Math.round(graph.snap(geo.width));
								}

								if (height == 'auto') {
									geo.height = Math.round(graph.snap(geo.height));
								}
							}
						};

						if (layout.charAt(0) == '[') {
							// Required for layouts to work with new cells
							var temp = afterInsert;
							graph.view.validate();
							this.executeLayoutList(JSON.parse(layout), function () {
								postProcess();
								temp();
							});
							afterInsert = null;
						} else if (layout == 'circle') {
							var circleLayout = new mxCircleLayout(graph);
							circleLayout.resetEdges = false;

							var circleLayoutIsVertexIgnored = circleLayout.isVertexIgnored;

							// Ignore other cells
							circleLayout.isVertexIgnored = function (vertex) {
								return circleLayoutIsVertexIgnored.apply(this, arguments) ||
									mxUtils.indexOf(cells, vertex) < 0;
							};

							this.executeLayout(function () {
								circleLayout.execute(graph.getDefaultParent());
								postProcess();
							}, true, afterInsert);

							afterInsert = null;
						} else if (layout == 'horizontaltree' || layout == 'verticaltree' ||
							(layout == 'auto' && select.length == 2 * cells.length - 1 && roots.length == 1)) {
							// Required for layouts to work with new cells
							graph.view.validate();

							var treeLayout = new mxCompactTreeLayout(graph, layout == 'horizontaltree');
							treeLayout.levelDistance = nodespacing;
							treeLayout.edgeRouting = false;
							treeLayout.resetEdges = false;

							this.executeLayout(function () {
								treeLayout.execute(graph.getDefaultParent(), (roots.length > 0) ? roots[0] : null);
							}, true, afterInsert);

							afterInsert = null;
						} else if (layout == 'horizontalflow' || layout == 'verticalflow' ||
							(layout == 'auto' && roots.length == 1)) {
							// Required for layouts to work with new cells
							graph.view.validate();

							var flowLayout = new mxHierarchicalLayout(graph,
								(layout == 'horizontalflow') ? mxConstants.DIRECTION_WEST : mxConstants.DIRECTION_NORTH);
							flowLayout.intraCellSpacing = nodespacing;
							flowLayout.parallelEdgeSpacing = edgespacing;
							flowLayout.interRankCellSpacing = levelspacing;
							flowLayout.disableEdgeStyle = false;

							this.executeLayout(function () {
								flowLayout.execute(graph.getDefaultParent(), select);

								// Workaround for flow layout moving cells to origin
								graph.moveCells(select, x0, y0);
							}, true, afterInsert);

							afterInsert = null;
						} else if (layout == 'organic' || (layout == 'auto' &&
								select.length > cells.length)) {
							// Required for layouts to work with new cells
							graph.view.validate();

							var organicLayout = new mxFastOrganicLayout(graph);
							organicLayout.forceConstant = nodespacing * 3;
							organicLayout.resetEdges = false;

							var organicLayoutIsVertexIgnored = organicLayout.isVertexIgnored;

							// Ignore other cells
							organicLayout.isVertexIgnored = function (vertex) {
								return organicLayoutIsVertexIgnored.apply(this, arguments) ||
									mxUtils.indexOf(cells, vertex) < 0;
							};

							var edgeLayout = new mxParallelEdgeLayout(graph);
							edgeLayout.spacing = edgespacing;

							this.executeLayout(function () {
								organicLayout.execute(graph.getDefaultParent());
								postProcess();
							}, true, afterInsert);

							afterInsert = null;
						}
					}

					this.hideDialog();
				} finally {
					graph.model.endUpdate();
				}

				if (afterInsert != null) {
					afterInsert();
				}
			}
		} catch (e) {
			this.handleError(e);
		}
	};



/**
 * Imports the given XML into the existing diagram.
 */
EditorUi.prototype.convertDataUri = function (uri) {
  // Handles special case of data URI which needs to be rewritten
  // to be used in a cell style to remove the semicolon
  if (uri.substring(0, 5) == 'data:') {
    var semi = uri.indexOf(';');
    if (semi > 0) {
      uri = uri.substring(0, semi) + uri.substring(uri.indexOf(',', semi + 1));
    }
  }
  return uri;
};

/**
 * Highlights the given element
 * 打开素材库会显示里面的内容
 */
EditorUi.prototype.stringToCells = function (xml) {
  var doc = mxUtils.parseXml(xml);
  var node = this.editor.extractGraphModel(doc.documentElement);
  // console.log("node:",node,doc);

  var cells = [];
  if (node != null) {
    var codec = new mxCodec(node.ownerDocument);
    var model = new mxGraphModel();
    codec.decode(node, model);
    var parent = model.getChildAt(model.getRoot(), 0);

    for (var j = 0; j < model.getChildCount(parent); j++) {
      cells.push(model.getChildAt(parent, j));
    }
  }
  console.log("打开素材里面默认的cells：", cells);
  return cells;
};

/**
 * Imports a local file from the device or local storage.
 */
EditorUi.prototype.importLocalFile = function (device, noSplash) {
  console.log("导入本地xml", device);
  if (device && Graph.fileSupport) {
    if (this.importFileInputElt == null) {
      var input = document.createElement('input');
      input.setAttribute('type', 'file');
      mxEvent.addListener(input, 'change', mxUtils.bind(this, function () {
        if (input.files != null) {
          // Using null for position will disable crop of input file
          this.importFiles(input.files, null, null, this.maxImageSize);
          // Resets input to force change event for same file (type reset required for IE)
          input.type = '';
          input.type = 'file';
          input.value = '';
        }
      }));

      input.style.display = 'none';
      document.body.appendChild(input);
      this.importFileInputElt = input;
    }

    this.importFileInputElt.click();
  } else {
    window.openNew = false;
    window.openKey = 'import';

    if (!noSplash) {
      var prevValue = Editor.useLocalStorage;
      Editor.useLocalStorage = !device;
    }

    // Closes dialog after open
    window.openFile = new OpenFile(mxUtils.bind(this, function (cancel) {
      this.hideDialog(cancel);
    }));

    window.openFile.setConsumer(mxUtils.bind(this, function (xml, filename) {
      if (filename != null && Graph.fileSupport && /(\.v(dx|sdx?))($|\?)/i.test(filename)) {
        // "Not a UTF 8 file" when opening VSDX in IE so this is never called
        var file = new Blob([xml], {
          type: 'application/octet-stream'
        })

        this.importVisio(file, mxUtils.bind(this, function (xml) {
          this.importXml(xml, 0, 0, true);
        }), null, filename);
      } else {
        this.editor.graph.setSelectionCells(this.importXml(xml, 0, 0, true));
      }
    }));

    // Removes openFile if dialog is closed
    this.showDialog(new OpenDialog(this).container, 360, 220, true, true, function () {
      window.openFile = null;
    });

    // Extends dialog close to show splash screen
    if (!noSplash) {
      var dlg = this.dialog;
      var dlgClose = dlg.close;
      this.dialog.close = mxUtils.bind(this, function (cancel) {
        Editor.useLocalStorage = prevValue;
        dlgClose.apply(dlg, arguments);
        if (cancel && this.getCurrentFile() == null && urlParams['embed'] != '1') {
          this.showSplash();
        }
      });
    }
  }
};

/**
 * Hook for subclassers.
 */
EditorUi.prototype.saveLibrary = function (name, images, file, mode, noSpin, noReload, fn) {
  if (fn) {
    fn();
  }
  //素材库添加 + 执行这
  console.log("saveLibrary:", fn, file);
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 * 素材保存，调的APP里面的方法, 挪用过来的
 */
EditorUi.prototype.saveLibrary2 = function (name, images, file, mode, noSpin, noReload, fn) {
  try {
    mode = (mode != null) ? mode : this.mode;
    noSpin = (noSpin != null) ? noSpin : false;
    noReload = (noReload != null) ? noReload : false;
    var xml = this.createLibraryDataFromImages(images);
    var error = mxUtils.bind(this, function (resp) {
      this.spinner.stop();
      if (fn != null) {
        fn();
      }
      this.handleError(resp, (resp != null) ? mxResources.get('errorSavingFile') : null);
    });

    // Handles special case for local libraries
    if (file == null && mode == App.MODE_DEVICE) {
      file = new LocalLibrary(this, xml, name);
    }

    if (file == null) {
      this.pickFolder(mode, mxUtils.bind(this, function (folderId) {
        if (mode == App.MODE_GOOGLE && this.drive != null && this.spinner.spin(document.body, mxResources.get('inserting'))) {
          this.drive.insertFile(name, xml, folderId, mxUtils.bind(this, function (newFile) {
            this.spinner.stop();
            this.hideDialog(true);
            this.libraryLoaded(newFile, images);
          }), error, this.drive.libraryMimeType);
        } else if (mode == App.MODE_GITHUB && this.gitHub != null && this.spinner.spin(document.body, mxResources.get('inserting'))) {
          this.gitHub.insertLibrary(name, xml, mxUtils.bind(this, function (newFile) {
            this.spinner.stop();
            this.hideDialog(true);
            this.libraryLoaded(newFile, images);
          }), error, folderId);
        } else if (mode == App.MODE_GITLAB && this.gitLab != null && this.spinner.spin(document.body, mxResources.get('inserting'))) {
          this.gitLab.insertLibrary(name, xml, mxUtils.bind(this, function (newFile) {
            this.spinner.stop();
            this.hideDialog(true);
            this.libraryLoaded(newFile, images);
          }), error, folderId);
        } else if (mode == App.MODE_TRELLO && this.trello != null && this.spinner.spin(document.body, mxResources.get('inserting'))) {
          this.trello.insertLibrary(name, xml, mxUtils.bind(this, function (newFile) {
            this.spinner.stop();
            this.hideDialog(true);
            this.libraryLoaded(newFile, images);
          }), error, folderId);
        } else if (mode == App.MODE_DROPBOX && this.dropbox != null && this.spinner.spin(document.body, mxResources.get('inserting'))) {
          this.dropbox.insertLibrary(name, xml, mxUtils.bind(this, function (newFile) {
            this.spinner.stop();
            this.hideDialog(true);
            this.libraryLoaded(newFile, images);
          }), error, folderId);
        } else if (mode == App.MODE_ONEDRIVE && this.oneDrive != null && this.spinner.spin(document.body, mxResources.get('inserting'))) {
          this.oneDrive.insertLibrary(name, xml, mxUtils.bind(this, function (newFile) {
            this.spinner.stop();
            this.hideDialog(true);
            this.libraryLoaded(newFile, images);
          }), error, folderId);
        } else if (mode == App.MODE_BROWSER) {
          var fn = mxUtils.bind(this, function () {
            var file = new StorageLibrary(this, xml, name);
            // Inserts data into local storage
            file.saveFile(name, false, mxUtils.bind(this, function () {
              this.hideDialog(true);
              this.libraryLoaded(file, images);
            }), error);
          });

          if (localStorage.getItem(name) == null) {
            fn();
          } else {
            this.confirm(mxResources.get('replaceIt', [name]), fn);
          }
        } else {
          this.handleError({
            message: mxResources.get('serviceUnavailableOrBlocked')
          });
        }
      }));
    } else if (noSpin || this.spinner.spin(document.body, mxResources.get('saving'))) {
      file.setData(xml);

      var doSave = mxUtils.bind(this, function () {
        file.save(true, mxUtils.bind(this, function (resp) {
          this.spinner.stop();
          this.hideDialog(true);

          if (!noReload) {
            this.libraryLoaded(file, images);
          }

          if (fn != null) {
            fn();
          }
        }), error);
      });

      if (name != file.getTitle()) {
        var oldHash = file.getHash();
        file.rename(name, mxUtils.bind(this, function (resp) {
          // Change hash in stored settings
          if (file.constructor != LocalLibrary && oldHash != file.getHash()) {
            mxSettings.removeCustomLibrary(oldHash);
            mxSettings.addCustomLibrary(file.getHash());
          }
          // Workaround for library files changing hash so
          // the old library cannot be removed from the
          // sidebar using the updated file in libraryLoaded
          this.removeLibrarySidebar(oldHash);
          doSave();
        }), error)
      } else {
        doSave();
      }
    }
  } catch (e) {
    this.handleError(e);
  }
};


/**
 *  素材库里面的内容导入
 */
EditorUi.prototype.importFiles = function (files, x, y, maxSize, fn, resultFn, filterFn, barrierFn,
  resizeDialog, maxBytes, resampleThreshold, ignoreEmbeddedXml) {
  maxSize = (maxSize != null) ? maxSize : this.maxImageSize; //图片大小 1M 
  maxBytes = (maxBytes != null) ? maxBytes : this.maxImageBytes;

  var crop = x != null && y != null;
  var resizeImages = true;
  x = (x != null) ? x : 0;
  y = (y != null) ? y : 0;

  // Checks if large images are imported
  var largeImages = false;

  console.log('导入xml时Files:', files);

  if (!mxClient.IS_CHROMEAPP && files != null) {
    var thresh = resampleThreshold || this.resampleThreshold;
    for (var i = 0; i < files.length; i++) {
      if (files[i].type.substring(0, 6) == 'image/' && files[i].size > thresh) {
        largeImages = true;
        break;
      }
    }
  }

  var doImportFiles = mxUtils.bind(this, function () {
    var graph = this.editor.graph;
    var gs = graph.gridSize;

    fn = (fn != null) ? fn : mxUtils.bind(this, function (data, mimeType, x, y, w, h, filename, done, file) {
      try {
        if (data != null && data.substring(0, 10) == '<mxlibrary') {
          this.spinner.stop();
          this.loadLibrary(new LocalLibrary(this, data, filename));
          return null;
        } else {
          return this.importFile(data, mimeType, x, y, w, h, filename, done, file, crop, ignoreEmbeddedXml);
        }
      } catch (e) {
        // console.log(e,'e');
        this.handleError(e);
        return null;
      }
    });

    resultFn = (resultFn != null) ? resultFn : mxUtils.bind(this, function (cells) {
      graph.setSelectionCells(cells);
    });

    if (this.spinner.spin(document.body, mxResources.get('loading'))) {
      var count = files.length;
      var remain = count;
      var queue = [];

      // Barrier waits for all files to be loaded asynchronously
      var barrier = mxUtils.bind(this, function (index, fnc) {
        queue[index] = fnc;
        if (--remain == 0) {
          this.spinner.stop(); //
          if (barrierFn != null) {
            barrierFn(queue);
          } else {
            var cells = [];
            graph.getModel().beginUpdate();
            try {
              for (var j = 0; j < queue.length; j++) {
                var tmp = queue[j]();
                if (tmp != null) {
                  cells = cells.concat(tmp);
                }
              }
            } finally {
              graph.getModel().endUpdate();
            }
          }
          resultFn(cells);
        }
      });

      for (var i = 0; i < count; i++) {
        (mxUtils.bind(this, function (index) {
          var file = files[index];
          if (file != null) {
            var reader = new FileReader();
            reader.onload = mxUtils.bind(this, function (e) {
              if (filterFn == null || filterFn(file)) {
                if (file.type.substring(0, 6) == 'image/') {
                  if (file.type.substring(0, 9) == 'image/svg') {
                    // Checks if SVG contains content attribute
                    var data = e.target.result;
                    var comma = data.indexOf(',');
                    var svgText = decodeURIComponent(escape(atob(data.substring(comma + 1))));
                    var root = mxUtils.parseXml(svgText);
                    var svgs = root.getElementsByTagName('svg');

                    if (svgs.length > 0) {
                      var svgRoot = svgs[0];
                      var cont = (ignoreEmbeddedXml) ? null : svgRoot.getAttribute('content');

                      if (cont != null && cont.charAt(0) != '<' && cont.charAt(0) != '%') {
                        cont = unescape((window.atob) ? atob(cont) : Base64.decode(cont, true));
                      }

                      if (cont != null && cont.charAt(0) == '%') {
                        cont = decodeURIComponent(cont);
                      }

                      if (cont != null && (cont.substring(0, 8) === '<mxfile ' ||
                          cont.substring(0, 14) === '<mxGraphModel ')) {
                        barrier(index, mxUtils.bind(this, function () {
                          return fn(cont, 'text/xml', x + index * gs, y + index * gs, 0, 0, file.name);
                        }));
                      } else {
                        // SVG needs special handling to add viewbox if missing and
                        // find initial size from SVG attributes (only for IE11)
                        barrier(index, mxUtils.bind(this, function () {
                          try {
                            var prefix = data.substring(0, comma + 1);

                            // Parses SVG and find width and height
                            if (root != null) {
                              var svgs = root.getElementsByTagName('svg');
                              if (svgs.length > 0) {
                                var svgRoot = svgs[0];
                                var w = svgRoot.getAttribute('width');
                                var h = svgRoot.getAttribute('height');

                                if (w != null && w.charAt(w.length - 1) != '%') {
                                  w = parseFloat(w);
                                } else {
                                  w = NaN;
                                }

                                if (h != null && h.charAt(h.length - 1) != '%') {
                                  h = parseFloat(h);
                                } else {
                                  h = NaN;
                                }

                                // Check if viewBox attribute already exists
                                var vb = svgRoot.getAttribute('viewBox');

                                if (vb == null || vb.length == 0) {
                                  svgRoot.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
                                }
                                // Uses width and height from viewbox for
                                // missing width and height attributes
                                else if (isNaN(w) || isNaN(h)) {
                                  var tokens = vb.split(' ');

                                  if (tokens.length > 3) {
                                    w = parseFloat(tokens[2]);
                                    h = parseFloat(tokens[3]);
                                  }
                                }

                                data = Editor.createSvgDataUri(mxUtils.getXml(svgRoot));
                                var s = Math.min(1, Math.min(maxSize / Math.max(1, w)), maxSize / Math.max(1, h));
                                var cells = fn(data, file.type, x + index * gs, y + index * gs, Math.max(
                                  1, Math.round(w * s)), Math.max(1, Math.round(h * s)), file.name);

                                // Hack to fix width and height asynchronously
                                if (isNaN(w) || isNaN(h)) {
                                  var img = new Image();
                                  img.onload = mxUtils.bind(this, function () {
                                    w = Math.max(1, img.width);
                                    h = Math.max(1, img.height);
                                    cells[0].geometry.width = w;
                                    cells[0].geometry.height = h;
                                    svgRoot.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
                                    data = Editor.createSvgDataUri(mxUtils.getXml(svgRoot));
                                    var semi = data.indexOf(';');
                                    if (semi > 0) {
                                      data = data.substring(0, semi) + data.substring(data.indexOf(',', semi + 1));
                                    }
                                    graph.setCellStyles('image', data, [cells[0]]);
                                  });
                                  img.src = Editor.createSvgDataUri(mxUtils.getXml(svgRoot));
                                }
                                return cells;
                              }
                            }
                          } catch (e) {
                            // ignores any SVG parsing errors
                          }
                          return null;
                        }));
                      }
                    } else {
                      barrier(index, mxUtils.bind(this, function () {
                        return null;
                      }));
                    }
                  } else {
                    // Checks if PNG+XML is available to bypass code below
                    var containsModel = false;

                    if (file.type == 'image/png') {
                      var xml = (ignoreEmbeddedXml) ? null : this.extractGraphModelFromPng(e.target.result);
                      if (xml != null && xml.length > 0) {
                        var img = new Image();
                        img.src = e.target.result;
                        barrier(index, mxUtils.bind(this, function () {
                          return fn(xml, 'text/xml', x + index * gs, y + index * gs,
                            img.width, img.height, file.name);
                        }));
                        containsModel = true;
                      }
                    }

                    // Additional asynchronous step for finding image size
                    if (!containsModel) {
                      // Cannot load local files in Chrome App
                      console.log(mxClient.IS_CHROMEAPP, 11111);

                      if (mxClient.IS_CHROMEAPP) {
                        this.spinner.stop();
                        this.showError(mxResources.get('error'), mxResources.get('dragAndDropNotSupported'),
                          mxResources.get('cancel'), mxUtils.bind(this, function () {
                            // Hides the dialog
                          }), null, mxResources.get('ok'), mxUtils.bind(this, function () {
                            // Redirects to import function
                            this.actions.get('import').funct();
                          })
                        );
                      } else {
                        // 拖进来的图片信息

                        this.loadImage(e.target.result, mxUtils.bind(this, function (img) {
                          this.resizeImage(img, e.target.result, mxUtils.bind(this, function (data2, w2, h2) {
                            barrier(index, mxUtils.bind(this, function () {
                              // console.log("拖进来的图片信息",data2);
                              // Refuses to insert images above a certain size as they kill the app
                              if (data2 != null && data2.length < maxBytes) {
                                var s = (!resizeImages || !this.isResampleImage(e.target.result, resampleThreshold)) ? 1 : Math.min(1, Math.min(maxSize / w2, maxSize / h2));
                                return fn(data2, file.type, x + index * gs, y + index * gs, Math.round(w2 * s), Math.round(h2 * s), file.name);
                              } else {
                                this.handleError({
                                  message: mxResources.get('imageTooBig')
                                });
                                return null;
                              }
                            }));
                          }), resizeImages, maxSize, resampleThreshold);
                        }), mxUtils.bind(this, function () {

                          this.handleError({
                            message: mxResources.get('invalidOrMissingFile')
                          });
                        }));
                      }
                    }
                  }
                } else {
                  var data = e.target.result;
                  fn(data, file.type, x + index * gs, y + index * gs, 240, 160, file.name, function (cells) {
                    barrier(index, function () {
                      return cells;
                    });
                  }, file);
                }
              }
            });

            // Handles special cases
            if (/(\.v(dx|sdx?))($|\?)/i.test(file.name) || /(\.vs(x|sx?))($|\?)/i.test(file.name)) {
              fn(null, file.type, x + index * gs, y + index * gs, 240, 160, file.name, function (cells) {
                barrier(index, function () {
                  return cells;
                });
              }, file);
            } else if (file.type.substring(0, 5) == 'image' || file.type == 'application/pdf') {
              reader.readAsDataURL(file);
            } else {
              reader.readAsText(file);
            }
          }
        }))(i);
      }
    }
  });

  if (largeImages) {
    // Workaround for lost files array in async code
    var tmp = [];
    for (var i = 0; i < files.length; i++) {
      tmp.push(files[i]);
    }
    files = tmp;
    this.confirmImageResize(function (doResize) {
      resizeImages = doResize;
      doImportFiles();
    }, resizeDialog);
  } else {
    doImportFiles();
  }
};

/**
 * Parses the file using XHR2 via the server. File can be a blob or file object.
 * Filename is an optional parameter for blobs (that do not have a filename).
 */
EditorUi.prototype.confirmImageResize = function (fn, force) {
  force = (force != null) ? force : false;
  var resume = (this.spinner != null && this.spinner.pause != null) ? this.spinner.pause() : function () {};
  var resizeImages = (isLocalStorage || mxClient.IS_CHROMEAPP) ? mxSettings.getResizeImages() : null;

  var wrapper = function (remember, resize) {
    if (remember || force) {
      mxSettings.setResizeImages((remember) ? resize : null);
      mxSettings.save();
    }

    resume();
    fn(resize);
  };

  if (resizeImages != null && !force) {
    wrapper(false, resizeImages);
  } else {
    this.showDialog(new ConfirmDialog(this, mxResources.get('resizeLargeImages'),
        function (remember) {
          wrapper(remember, true);
        },
        function (remember) {
          wrapper(remember, false);
        }, mxResources.get('resize'), mxResources.get('actualSize'),
        '<img style="margin-top:8px;" src="' + Editor.loResImage + '"/>',
        '<img style="margin-top:8px;" src="' + Editor.hiResImage + '"/>',
        isLocalStorage || mxClient.IS_CHROMEAPP).container, 340,
      (isLocalStorage || mxClient.IS_CHROMEAPP) ? 220 : 200, true, true);
  }
};

/**
 * 
 */
var ConfirmDialog = function (editorUi, message, okFn, cancelFn, okLabel, cancelLabel,
  okImg, cancelImg, showRememberOption, imgSrc, maxHeight) {
  var div = document.createElement('div');
  div.style.textAlign = 'center';
  maxHeight = (maxHeight != null) ? maxHeight : 44;

  var p2 = document.createElement('div');
  p2.style.padding = '6px';
  p2.style.overflow = 'auto';
  p2.style.maxHeight = maxHeight + 'px';
  p2.style.lineHeight = '1.2em';

  if (mxClient.IS_QUIRKS) {
    p2.style.height = '60px';
  }

  mxUtils.write(p2, message);
  div.appendChild(p2);

  if (imgSrc != null) {
    var p3 = document.createElement('div');
    p3.style.padding = '6px 0 6px 0';
    var img = document.createElement('img');
    img.setAttribute('src', imgSrc);
    p3.appendChild(img);
    div.appendChild(p3);
  }

  var btns = document.createElement('div');
  btns.style.textAlign = 'center';
  btns.style.whiteSpace = 'nowrap';

  var cb = document.createElement('input');
  cb.setAttribute('type', 'checkbox');

  var cancelBtn = mxUtils.button(cancelLabel || mxResources.get('cancel'), function () {
    editorUi.hideDialog();

    if (cancelFn != null) {
      cancelFn(cb.checked);
    }
  });
  cancelBtn.className = 'geBtn';

  if (cancelImg != null) {
    cancelBtn.innerHTML = cancelImg + '<br>' + cancelBtn.innerHTML;
    cancelBtn.style.paddingBottom = '8px';
    cancelBtn.style.paddingTop = '8px';
    cancelBtn.style.height = 'auto';
    cancelBtn.style.width = '40%';
  }

  if (editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  var okBtn = mxUtils.button(okLabel || mxResources.get('ok'), function () {
    editorUi.hideDialog();

    if (okFn != null) {
      okFn(cb.checked);
    }
  });
  btns.appendChild(okBtn);

  if (okImg != null) {
    okBtn.innerHTML = okImg + '<br>' + okBtn.innerHTML + '<br>';
    okBtn.style.paddingBottom = '8px';
    okBtn.style.paddingTop = '8px';
    okBtn.style.height = 'auto';
    okBtn.className = 'geBtn';
    okBtn.style.width = '40%';
  } else {
    okBtn.className = 'geBtn gePrimaryBtn';
  }

  if (!editorUi.editor.cancelFirst) {
    btns.appendChild(cancelBtn);
  }

  div.appendChild(btns);

  if (showRememberOption) {
    btns.style.marginTop = '10px';
    var p2 = document.createElement('p');
    p2.style.marginTop = '20px';
    p2.appendChild(cb);
    var span = document.createElement('span');
    mxUtils.write(span, ' ' + mxResources.get('rememberThisSetting'));
    p2.appendChild(span);
    div.appendChild(p2);

    mxEvent.addListener(span, 'click', function (evt) {
      cb.checked = !cb.checked;
      mxEvent.consume(evt);
    });
  } else {
    btns.style.marginTop = '12px';
  }

  this.init = function () {
    okBtn.focus();
  };
  this.container = div;
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.createFileData = function (node, graph, file, url, forceXml, forceSvg, forceHtml,
  embeddedCallback, ignoreSelection, compact, uncompressed) {
  graph = (graph != null) ? graph : this.editor.graph;
  forceXml = (forceXml != null) ? forceXml : false;
  ignoreSelection = (ignoreSelection != null) ? ignoreSelection : true;

  var editLink = null;
  var redirect = null;

  if (file == null || file.getMode() == App.MODE_DEVICE || file.getMode() == App.MODE_BROWSER) {
    editLink = '_blank';
  } else {
    editLink = url;
    redirect = editLink;
  }

  if (node == null) {
    return '';
  } else {
    var fileNode = node;

    // Ignores case for possible HTML or XML nodes
    if (fileNode.nodeName.toLowerCase() != 'mxfile') {
      if (uncompressed) {
        var diagramNode = node.ownerDocument.createElement('diagram');
        diagramNode.setAttribute('id', this.editor.guid());
        diagramNode.appendChild(node);

        fileNode = node.ownerDocument.createElement('mxfile');
        fileNode.appendChild(diagramNode);
      } else {
        // Removes control chars in input for correct roundtrip check
        var text = Graph.zapGremlins(mxUtils.getXml(node));
        var data = Graph.compress(text);

        // Fallback to plain XML for invalid compression
        // TODO: Remove this fallback with active pages
        if (Graph.decompress(data) != text) {
          return text;
        } else {
          var diagramNode = node.ownerDocument.createElement('diagram');
          diagramNode.setAttribute('id', this.editor.guid());
          mxUtils.setTextContent(diagramNode, data);

          fileNode = node.ownerDocument.createElement('mxfile');
          fileNode.appendChild(diagramNode);
        }
      }
    }

    if (!compact) {
      // Removes old metadata
      fileNode.removeAttribute('userAgent');
      fileNode.removeAttribute('version');
      fileNode.removeAttribute('editor');
      fileNode.removeAttribute('pages');
      fileNode.removeAttribute('type');

      if (mxClient.IS_CHROMEAPP) {
        fileNode.setAttribute('host', 'Chrome');
      } else if (EditorUi.isElectronApp) {
        fileNode.setAttribute('host', 'Electron');
      } else {
        fileNode.setAttribute('host', window.location.hostname);
      }

      // Adds new metadata
      fileNode.setAttribute('modified', new Date().toISOString());
      fileNode.setAttribute('agent', navigator.appVersion);
      fileNode.setAttribute('version', EditorUi.VERSION);
      fileNode.setAttribute('etag', this.editor.guid());

      var md = (file != null) ? file.getMode() : this.mode;

      if (md != null) {
        fileNode.setAttribute('type', md);
      }

      if (fileNode.getElementsByTagName('diagram').length > 1 && this.pages != null) {
        fileNode.setAttribute('pages', this.pages.length);
      }
    } else {
      fileNode = fileNode.cloneNode(true);
      fileNode.removeAttribute('modified');
      fileNode.removeAttribute('host');
      fileNode.removeAttribute('agent');
      fileNode.removeAttribute('etag');
      fileNode.removeAttribute('userAgent');
      fileNode.removeAttribute('version');
      fileNode.removeAttribute('editor');
      fileNode.removeAttribute('type');
    }

    var xml = (uncompressed) ? mxUtils.getPrettyXml(fileNode) : mxUtils.getXml(fileNode);
    // Writes the file as an embedded HTML file
    if (!forceSvg && !forceXml && (forceHtml || (file != null && /(\.html)$/i.test(file.getTitle())))) {
      xml = this.getHtml2(mxUtils.getXml(fileNode), graph, (file != null) ? file.getTitle() : null, editLink, redirect);
    }
    // Maps the XML data to the content attribute in the SVG node 
    else if (forceSvg || (!forceXml && file != null && /(\.svg)$/i.test(file.getTitle()))) {
      if (file != null && (file.getMode() == App.MODE_DEVICE || file.getMode() == App.MODE_BROWSER)) {
        url = null;
      }

      xml = this.getEmbeddedSvg(xml, graph, url, null, embeddedCallback, ignoreSelection, redirect);
    }
    return xml;
  }
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.getXmlFileData = function (ignoreSelection, currentPage, uncompressed) {
  ignoreSelection = (ignoreSelection != null) ? ignoreSelection : true;
  currentPage = (currentPage != null) ? currentPage : false;
  uncompressed = (uncompressed != null) ? uncompressed : !Editor.compressXml;

  // Generats graph model XML node for single page export
  var node = this.editor.getGraphXml(ignoreSelection);

  if (ignoreSelection && this.fileNode != null && this.currentPage != null) {
    // Updates current page XML if selection is ignored
    EditorUi.removeChildNodes(this.currentPage.node);
    mxUtils.setTextContent(this.currentPage.node, Graph.compressNode(node));

    // Creates a clone of the file node for processing
    node = this.fileNode.cloneNode(false);

    // Appends the node of the page and applies compression
    function appendPage(pageNode) {
      var models = pageNode.getElementsByTagName('mxGraphModel');
      var modelNode = (models.length > 0) ? models[0] : null;
      var clone = pageNode;

      if (modelNode == null && uncompressed) {
        var text = mxUtils.trim(mxUtils.getTextContent(pageNode));
        clone = pageNode.cloneNode(false);

        if (text.length > 0) {
          var tmp = Graph.decompress(text);

          if (tmp != null && tmp.length > 0) {
            clone.appendChild(mxUtils.parseXml(tmp).documentElement);
          }
        }
      } else if (modelNode != null && !uncompressed) {
        clone = pageNode.cloneNode(false);
        mxUtils.setTextContent(clone, Graph.compressNode(modelNode));
      } else {
        clone = pageNode.cloneNode(true);
      }

      node.appendChild(clone);
    };


    if (currentPage) {
      appendPage(this.currentPage.node);
    } else {
      // Restores order of pages
      for (var i = 0; i < this.pages.length; i++) {
        if (this.currentPage != this.pages[i]) {
          if (this.pages[i].needsUpdate) {
            var enc = new mxCodec(mxUtils.createXmlDocument());
            var temp = enc.encode(new mxGraphModel(this.pages[i].root));
            this.editor.graph.saveViewState(this.pages[i].viewState, temp);
            EditorUi.removeChildNodes(this.pages[i].node);
            mxUtils.setTextContent(this.pages[i].node, Graph.compressNode(temp));

            // Marks the page as up-to-date
            delete this.pages[i].needsUpdate;
          }
        }

        appendPage(this.pages[i].node);
      }
    }
  }
  return node;
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.getFileData = function (forceXml, forceSvg, forceHtml, embeddedCallback, ignoreSelection,
  currentPage, node, compact, file, uncompressed) {
  ignoreSelection = (ignoreSelection != null) ? ignoreSelection : true;
  currentPage = (currentPage != null) ? currentPage : false;
  var graph = this.editor.graph;

  // Forces compression of embedded XML
  if (forceSvg || (!forceXml && file != null && /(\.svg)$/i.test(file.getTitle()))) {
    uncompressed = false;

    // Exports SVG for first page while other page is visible by creating a graph
    // LATER: Add caching for the graph or SVG while not on first page
    if (this.pages != null && this.currentPage != this.pages[0]) {
      var graphGetGlobalVariable = graph.getGlobalVariable;
      graph = this.createTemporaryGraph(graph.getStylesheet());
      var page = this.pages[0];

      graph.getGlobalVariable = function (name) {
        if (name == 'page') {
          return page.getName();
        } else if (name == 'pagenumber') {
          return 1;
        }

        return graphGetGlobalVariable.apply(this, arguments);
      };

      document.body.appendChild(graph.container);
      graph.model.setRoot(page.root);
    }
  }

  node = (node != null) ? node : this.getXmlFileData(ignoreSelection, currentPage, uncompressed);
  file = (file != null) ? file : this.getCurrentFile();
  var result = this.createFileData(node, graph, file, window.location.href,
    forceXml, forceSvg, forceHtml, embeddedCallback, ignoreSelection, compact,
    uncompressed);

  // Removes temporary graph from DOM
  if (graph != this.editor.graph) {
    graph.container.parentNode.removeChild(graph.container);
  }
  return result;
};

/**
 * 
 */
EditorUi.prototype.getHtml = function (node, graph, title, editLink, redirect, ignoreSelection) {
  ignoreSelection = (ignoreSelection != null) ? ignoreSelection : true;
  var bg = null;
  var js = EditorUi.drawHost + '/js/embed-static.min.js';

  // LATER: Merge common code with EmbedDialog
  if (graph != null) {
    var bounds = (ignoreSelection) ? graph.getGraphBounds() : graph.getBoundingBox(graph.getSelectionCells());
    var scale = graph.view.scale;
    var x0 = Math.floor(bounds.x / scale - graph.view.translate.x);
    var y0 = Math.floor(bounds.y / scale - graph.view.translate.y);
    bg = graph.background;

    // Embed script only used if no redirect
    if (redirect == null) {
      var s = this.getBasenames().join(';');

      if (s.length > 0) {
        js = EditorUi.drawHost + '/embed.js?s=' + s;
      }
    }

    // Adds embed attributes
    node.setAttribute('x0', x0);
    node.setAttribute('y0', y0);
  }

  if (node != null) {
    node.setAttribute('pan', '1');
    node.setAttribute('zoom', '1');
    node.setAttribute('resize', '0');
    node.setAttribute('fit', '0');
    node.setAttribute('border', '20');

    // Hidden attributes
    node.setAttribute('links', '1');

    if (editLink != null) {
      node.setAttribute('edit', editLink);
    }
  }

  // Makes XHTML compatible
  if (redirect != null) {
    redirect = redirect.replace(/&/g, '&amp;');
  }

  // Removes control chars in input for correct roundtrip check
  var text = (node != null) ? Graph.zapGremlins(mxUtils.getXml(node)) : '';

  // Double compression for mxfile not fixed since it may cause imcompatibilites with
  // embed clients that rely on this format. HTML files and export use getHtml2.
  var data = Graph.compress(text);

  // Fallback to URI encoded XML for invalid compression
  if (Graph.decompress(data) != text) {
    data = encodeURIComponent(text);
  }

  var style = 'position:relative;overflow:auto;width:100%;';

  return ((redirect == null) ? '<!--[if IE]><meta http-equiv="X-UA-Compatible" content="IE=5,IE=9" ><![endif]-->\n' : '') +
    '<!DOCTYPE html>\n<html' + ((redirect != null) ? ' xmlns="http://www.w3.org/1999/xhtml">' : '>') +
    '\n<head>\n' + ((redirect == null) ? ((title != null) ? '<title>' + mxUtils.htmlEntities(title) +
      '</title>\n' : '') : '<title>diagrams.net</title>\n') +
    ((redirect != null) ? '<meta http-equiv="refresh" content="0;URL=\'' + redirect + '\'"/>\n' : '') +
    '</head>\n<body' +
    (((redirect == null && bg != null && bg != mxConstants.NONE) ? ' style="background-color:' + bg + ';">' : '>')) +
    '\n<div class="mxgraph" style="' + style + '">\n' +
    '<div style="width:1px;height:1px;overflow:hidden;">' + data + '</div>\n</div>\n' +
    ((redirect == null) ? '<script type="text/javascript" src="' + js + '"></script>' :
      '<a style="position:absolute;top:50%;left:50%;margin-top:-128px;margin-left:-64px;" ' +
      'href="' + redirect + '" target="_blank"><img border="0" ' +
      'src="' + EditorUi.drawHost + '/images/drawlogo128.png"/></a>') +
    '\n</body>\n</html>\n';
};


/**
 * Same as above but using the new embed code.
 */
EditorUi.prototype.getHtml2 = function (xml, graph, title, editLink, redirect) {
  var js = window.DRAWIO_VIEWER_URL || EditorUi.drawHost + '/js/viewer-static.min.js';

  // Makes XHTML compatible
  if (redirect != null) {
    redirect = redirect.replace(/&/g, '&amp;');
  }

  var data = {
    highlight: '#0000ff',
    nav: this.editor.graph.foldingEnabled,
    resize: true,
    xml: Graph.zapGremlins(xml),
    toolbar: 'pages zoom layers lightbox'
  };

  if (this.pages != null && this.currentPage != null) {
    data.page = mxUtils.indexOf(this.pages, this.currentPage);
  }

  var style = 'max-width:100%;border:1px solid transparent;';

  return ((redirect == null) ? '<!--[if IE]><meta http-equiv="X-UA-Compatible" content="IE=5,IE=9" ><![endif]-->\n' : '') +
    '<!DOCTYPE html>\n<html' + ((redirect != null) ? ' xmlns="http://www.w3.org/1999/xhtml">' : '>') +
    '\n<head>\n' + ((redirect == null) ? ((title != null) ? '<title>' + mxUtils.htmlEntities(title) +
      '</title>\n' : '') : '<title>diagrams.net</title>\n') +
    ((redirect != null) ? '<meta http-equiv="refresh" content="0;URL=\'' + redirect + '\'"/>\n' : '') +
    '<meta charset="utf-8"/>\n</head>\n<body>' +
    '\n<div class="mxgraph" style="' + style + '" data-mxgraph="' + mxUtils.htmlEntities(JSON.stringify(data)) + '"></div>\n' +
    ((redirect == null) ? '<script type="text/javascript" src="' + js + '"></script>' :
      '<a style="position:absolute;top:50%;left:50%;margin-top:-128px;margin-left:-64px;" ' +
      'href="' + redirect + '" target="_blank"><img border="0" ' +
      'src="' + EditorUi.drawHost + '/images/drawlogo128.png"/></a>') +
    '\n</body>\n</html>\n';
};



/**
 * Adds the library entries to the given DOM node.
 */
EditorUi.prototype.addLibraryEntries = function (imgs, content) {
  for (var i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    var data = img.data;
    if (data != null) {
      data = this.convertDataUri(data);
      var s = 'shape=image;verticalLabelPosition=bottom;verticalAlign=top;imageAspect=0;';
      if (img.aspect == 'fixed') {
        s += 'aspect=fixed;'
      }
      content.appendChild(this.sidebar.createVertexTemplate(s + 'image=' +
        data, img.w, img.h, '', img.title || '', false, false, true));
    } else if (img.xml != null) {
      var cells = this.stringToCells(Graph.decompress(img.xml));
      if (cells.length > 0) {
        content.appendChild(this.sidebar.createVertexTemplateFromCells(
          cells, img.w, img.h, img.title || '', true, false, true));
      }
    }
  }
};


/**
 * Shows the layers dialog if the graph has more than one layer.
 * 如果图形有多个层，则显示“层”对话框。
 */
EditorUi.prototype.initializeEmbedMode = function () {
  this.setGraphEnabled(false);
  var parent = window.opener || window.parent;

  if (parent != window) {
    if (urlParams['spin'] != '1' || this.spinner.spin(document.body, mxResources.get('loading'))) {
      this.installMessageHandler(mxUtils.bind(this, function (xml, evt, modified) {
        this.spinner.stop();
        this.addEmbedButtons();
        this.setGraphEnabled(true);

        if (xml == null || xml.length == 0) {
          xml = this.emptyDiagramXml;
        }

        // Creates temporary file for diff sync in embed mode
        this.setCurrentFile(new LocalFile(this, xml,
          this.defaultFilename, true));
        this.setFileData(xml);

        if (!this.editor.isChromelessView()) {
          this.showLayersDialog();
        } else if (this.editor.graph.isLightboxView()) {
          this.lightboxFit();
        }

        if (this.chromelessResize) {
          this.chromelessResize();
        }

        this.editor.undoManager.clear();
        this.editor.modified = (modified != null) ? modified : false;
        this.updateUi();

        // Workaround for no initial focus in FF
        // (does not work in Conf Cloud with FF)
        if (window.self !== window.top) {
          window.focus();
        }

        if (this.format != null) {
          this.format.refresh();
        }
      }));
    }
  }
};

/**
 * Adds the buttons for embedded mode.
 */
EditorUi.prototype.installMessageHandler = function (fn) {
  var changeListener = null;
  var ignoreChange = false;
  var autosave = false;
  var lastData = null;

  var updateStatus = mxUtils.bind(this, function (sender, eventObject) {
    if (!this.editor.modified || urlParams['modified'] == '0') {
      this.editor.setStatus('');
    } else if (urlParams['modified'] != null) {
      this.editor.setStatus(mxUtils.htmlEntities(mxResources.get(urlParams['modified'])));
    }
  });

  this.editor.graph.model.addListener(mxEvent.CHANGE, updateStatus);

  // Receives XML message from opener and puts it into the graph
  mxEvent.addListener(window, 'message', mxUtils.bind(this, function (evt) {
    var validSource = window.opener || window.parent;

    if (evt.source != validSource) {
      return;
    }

    var data = evt.data;

    var extractDiagramXml = mxUtils.bind(this, function (data) {
      if (data != null && typeof data.charAt === 'function' && data.charAt(0) != '<') {
        try {
          if (data.substring(0, 22) == 'data:image/png;base64,') {
            data = this.extractGraphModelFromPng(data);
          } else if (data.substring(0, 26) == 'data:image/svg+xml;base64,') {
            data = atob(data.substring(26));
          } else if (data.substring(0, 24) == 'data:image/svg+xml;utf8,') {
            data = data.substring(24);
          }

          if (data != null) {
            if (data.charAt(0) == '%') {
              data = decodeURIComponent(data);
            } else if (data.charAt(0) != '<') {
              data = Graph.decompress(data);
            }
          }
        } catch (e) {
          // ignore compression errors and use empty data
        }
      }

      return data;
    });

    if (urlParams['proto'] == 'json') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = null;
      }

      try {
        if (data == null) {
          // Ignore
          return;
        } else if (data.action == 'dialog') {
          this.showError((data.titleKey != null) ? mxResources.get(data.titleKey) : data.title,
            (data.messageKey != null) ? mxResources.get(data.messageKey) : data.message,
            (data.buttonKey != null) ? mxResources.get(data.buttonKey) : data.button);

          if (data.modified != null) {
            this.editor.modified = data.modified;
          }

          return;
        } else if (data.action == 'layout') {
          this.executeLayoutList(data.layouts)

          return;
        } else if (data.action == 'prompt') {
          this.spinner.stop();

          var dlg = new FilenameDialog(this, data.defaultValue || '',
            (data.okKey != null) ? mxResources.get(data.okKey) : data.ok,
            function (value) {
              if (value != null) {
                parent.postMessage(JSON.stringify({
                  event: 'prompt',
                  value: value,
                  message: data
                }), '*');
              } else {
                parent.postMessage(JSON.stringify({
                  event: 'prompt-cancel',
                  message: data
                }), '*');
              }
            }, (data.titleKey != null) ? mxResources.get(data.titleKey) : data.title);
          this.showDialog(dlg.container, 300, 80, true, false);
          dlg.init();

          return;
        } else if (data.action == 'draft') {
          var tmp = extractDiagramXml(data.xml);
          this.spinner.stop();

          var dlg = new DraftDialog(this, mxResources.get('draftFound',
              [data.name || this.defaultFilename]),
            tmp, mxUtils.bind(this, function () {
              this.hideDialog();
              parent.postMessage(JSON.stringify({
                event: 'draft',
                result: 'edit',
                message: data
              }), '*');
            }), mxUtils.bind(this, function () {
              this.hideDialog();
              parent.postMessage(JSON.stringify({
                event: 'draft',
                result: 'discard',
                message: data
              }), '*');
            }), (data.editKey) ? mxResources.get(data.editKey) : null,
            (data.discardKey) ? mxResources.get(data.discardKey) : null,
            (data.ignore) ? mxUtils.bind(this, function () {
              this.hideDialog();
              parent.postMessage(JSON.stringify({
                event: 'draft',
                result: 'ignore',
                message: data
              }), '*');
            }) : null);
          this.showDialog(dlg.container, 640, 480, true, false, mxUtils.bind(this, function (cancel) {
            if (cancel) {
              this.actions.get('exit').funct();
            }
          }));

          try {
            dlg.init();
          } catch (e) {
            parent.postMessage(JSON.stringify({
              event: 'draft',
              error: e.toString(),
              message: data
            }), '*');
          }

          return;
        } else if (data.action == 'template') {
          this.spinner.stop();

          var enableRecentDocs = data.enableRecent == 1;
          var enableSearchDocs = data.enableSearch == 1;
          var enableCustomTemp = data.enableCustomTemp == 1;

          var dlg = new NewDialog(this, false, data.callback != null,
            mxUtils.bind(this, function (xml, name) {
              xml = xml || this.emptyDiagramXml;

              // LATER: Add autosave option in template message
              if (data.callback != null) {
                parent.postMessage(JSON.stringify({
                  event: 'template',
                  xml: xml,
                  blank: xml == this.emptyDiagramXml,
                  name: name,
                  message: data
                }), '*');
              } else {
                fn(xml, evt, xml != this.emptyDiagramXml);

                // Workaround for status updated before modified applied
                if (!this.editor.modified) {
                  this.editor.setStatus('');
                }
              }
            }), null, null, null, null, null, null, null,
            enableRecentDocs ? mxUtils.bind(this, function (recentReadyCallback) {
              this.remoteInvoke('getRecentDiagrams', null, null, recentReadyCallback, function () {
                recentReadyCallback(null, 'Network Error!');
              });
            }) : null,
            enableSearchDocs ? mxUtils.bind(this, function (searchStr, searchReadyCallback) {
              this.remoteInvoke('searchDiagrams', [searchStr], null, searchReadyCallback, function () {
                searchReadyCallback(null, 'Network Error!');
              });
            }) : null,
            mxUtils.bind(this, function (url, info, name) {
              //If binary files are possible, we can get the file content using remote invokation, imported it, and send final mxFile back
              parent.postMessage(JSON.stringify({
                event: 'template',
                docUrl: url,
                info: info,
                name: name
              }), '*');
            }), null, null,
            enableCustomTemp ? mxUtils.bind(this, function (customTempCallback) {
              this.remoteInvoke('getCustomTemplates', null, null, customTempCallback, function () {
                customTempCallback({}, 0); //ignore error by sending empty templates
              });
            }) : null);

          this.showDialog(dlg.container, 620, 440, true, false, mxUtils.bind(this, function (cancel) {
            if (cancel) {
              this.actions.get('exit').funct();
            }
          }));
          dlg.init();

          return;
        } else if (data.action == 'textContent') {
          //TODO Remove this message and use remote invokation instead
          var allPagesTxt = this.getDiagramTextContent();
          parent.postMessage(JSON.stringify({
            event: 'textContent',
            data: allPagesTxt,
            message: data
          }), '*');
          return;
        } else if (data.action == 'status') {
          if (data.messageKey != null) {
            this.editor.setStatus(mxUtils.htmlEntities(mxResources.get(data.messageKey)));
          } else if (data.message != null) {
            this.editor.setStatus(mxUtils.htmlEntities(data.message));
          }

          if (data.modified != null) {
            this.editor.modified = data.modified;
          }

          return;
        } else if (data.action == 'spinner') {
          var msg = (data.messageKey != null) ? mxResources.get(data.messageKey) : data.message;

          if (data.show != null && !data.show) {
            this.spinner.stop();
          } else {
            this.spinner.spin(document.body, msg)
          }

          return;
        } else if (data.action == 'export') {
          if (data.format == 'png' || data.format == 'xmlpng') {
            if ((data.spin == null && data.spinKey == null) || this.spinner.spin(document.body,
                (data.spinKey != null) ? mxResources.get(data.spinKey) : data.spin)) {
              var xml = (data.xml != null) ? data.xml : this.getFileData(true);
              this.editor.graph.setEnabled(false);
              var graph = this.editor.graph;

              var postDataBack = mxUtils.bind(this, function (uri) {
                this.editor.graph.setEnabled(true);
                this.spinner.stop();

                var msg = this.createLoadMessage('export');
                msg.format = data.format;
                msg.message = data;
                msg.data = uri;
                msg.xml = xml;
                parent.postMessage(JSON.stringify(msg), '*');
              });

              var processUri = mxUtils.bind(this, function (uri) {
                if (uri == null) {
                  uri = Editor.blankImage;
                }

                if (data.format == 'xmlpng') {
                  uri = Editor.writeGraphModelToPng(uri, 'tEXt', 'mxfile',
                    encodeURIComponent(xml));
                }

                // Removes temporary graph from DOM
                if (graph != this.editor.graph) {
                  graph.container.parentNode.removeChild(graph.container);
                }

                postDataBack(uri);
              });

              var pageId = data.pageId || (this.pages != null ? this.pages[0].getId() : null);

              // LATER: Uses external export if current page (not first page) has mathEnabled
              if (this.isExportToCanvas()) {
                // Exports PNG for first/specific page while other page is visible by creating a graph
                // LATER: Add caching for the graph or SVG while not on first page
                if (this.pages != null && this.currentPage.getId() != pageId) {
                  var graphGetGlobalVariable = graph.getGlobalVariable;
                  graph = this.createTemporaryGraph(graph.getStylesheet());
                  var page;

                  for (var i = 0; i < this.pages.length; i++) {
                    if (this.pages[i].getId() == pageId) {
                      page = this.updatePageRoot(this.pages[i]);
                      break;
                    }
                  }

                  graph.getGlobalVariable = function (name) {
                    if (name == 'page') {
                      return page.getName();
                    } else if (name == 'pagenumber') {
                      return 1;
                    }

                    return graphGetGlobalVariable.apply(this, arguments);
                  };

                  document.body.appendChild(graph.container);
                  graph.model.setRoot(page.root);
                }

                //Set visible layers based on message setting
                if (data.layerIds != null) {
                  var graphModel = graph.model;
                  var layers = graphModel.getChildCells(graphModel.getRoot());
                  var layerIdsMap = {};

                  for (var i = 0; i < data.layerIds.length; i++) {
                    layerIdsMap[data.layerIds[i]] = true;
                  }

                  for (var i = 0; i < layers.length; i++) {
                    graphModel.setVisible(layers[i], layerIdsMap[layers[i].id] || false);
                  }
                }

                this.editor.exportToCanvas(mxUtils.bind(this, function (canvas) {
                  processUri(canvas.toDataURL('image/png'));
                }), null, null, null, mxUtils.bind(this, function () {
                  processUri(null);
                }), null, null, data.scale, null, null, null, graph);
              } else {
                // Data from server is base64 encoded to avoid binary XHR
                // Double encoding for XML arg is needed for UTF8 encoding
                var req = new mxXmlRequest(EXPORT_URL, 'format=png&embedXml=' +
                  ((data.format == 'xmlpng') ? '1' : '0') +
                  (pageId != null ? '&pageId=' + pageId : '') +
                  (data.layerIds != null ? '&extras=' + encodeURIComponent(JSON.stringify({
                    layerIds: data.layerIds
                  })) : '') +
                  (data.scale != null ? '&scale=' + data.scale : '') + '&base64=1&xml=' +
                  encodeURIComponent(xml));

                req.send(mxUtils.bind(this, function (req) {
                  // Temp graph was never created at this point so we can
                  // skip processUri since it already contains the XML
                  if (req.getStatus() >= 200 && req.getStatus() <= 299) {
                    postDataBack('data:image/png;base64,' + req.getText());
                  } else {
                    processUri(null);
                  }
                }), mxUtils.bind(this, function () {
                  processUri(null);
                }));
              }
            }
          } else {
            // SVG is generated from graph so parse optional XML
            if (data.xml != null && data.xml.length > 0) {
              this.setFileData(data.xml);
            }

            var msg = this.createLoadMessage('export');

            // Attaches incoming message
            msg.message = data;

            // Forces new HTML format if pages exists
            if (data.format == 'html2' || (data.format == 'html' && (urlParams['pages'] != '0' ||
                (this.pages != null && this.pages.length > 1)))) {
              var node = this.getXmlFileData();
              msg.xml = mxUtils.getXml(node);
              msg.data = this.getFileData(null, null, true, null, null, null, node);
              msg.format = data.format;
            } else if (data.format == 'html') {
              var xml = this.editor.getGraphXml();
              msg.data = this.getHtml(xml, this.editor.graph);
              msg.xml = mxUtils.getXml(xml);
              msg.format = data.format;
            } else {
              // Creates a preview with no alt text for unsupported browsers
              mxSvgCanvas2D.prototype.foAltText = null;

              var bg = this.editor.graph.background;

              if (bg == mxConstants.NONE) {
                bg = null;
              }

              msg.xml = this.getFileData(true, null, null, null, null,
                null, null, null, null, false);
              msg.format = 'svg';

              var postResult = mxUtils.bind(this, function (svg) {
                this.editor.graph.setEnabled(true);
                this.spinner.stop();

                msg.data = Editor.createSvgDataUri(svg);
                parent.postMessage(JSON.stringify(msg), '*');
              });

              if (data.format == 'xmlsvg') {
                if ((data.spin == null && data.spinKey == null) || this.spinner.spin(document.body,
                    (data.spinKey != null) ? mxResources.get(data.spinKey) : data.spin)) {
                  this.getEmbeddedSvg(msg.xml, this.editor.graph, null, true, postResult, null, null, data.embedImages);
                }
              } else {
                if ((data.spin == null && data.spinKey == null) || this.spinner.spin(document.body,
                    (data.spinKey != null) ? mxResources.get(data.spinKey) : data.spin)) {
                  this.editor.graph.setEnabled(false);
                  var svgRoot = this.editor.graph.getSvg(bg);

                  this.embedFonts(svgRoot, mxUtils.bind(this, function (svgRoot) {
                    if (data.embedImages || data.embedImages == null) {
                      this.editor.convertImages(svgRoot, mxUtils.bind(this, function (svgRoot) {
                        postResult(mxUtils.getXml(svgRoot));
                      }));
                    } else {
                      postResult(mxUtils.getXml(svgRoot));
                    }
                  }));
                }
              }

              return;
            }

            parent.postMessage(JSON.stringify(msg), '*');
          }

          return;
        } else if (data.action == 'load') {
          autosave = data.autosave == 1;
          this.hideDialog();

          if (data.modified != null && urlParams['modified'] == null) {
            urlParams['modified'] = data.modified;
          }

          if (data.saveAndExit != null && urlParams['saveAndExit'] == null) {
            urlParams['saveAndExit'] = data.saveAndExit;
          }

          if (data.noSaveBtn != null && urlParams['noSaveBtn'] == null) {
            urlParams['noSaveBtn'] = data.noSaveBtn;
          }

          if (data.noExitBtn != null && urlParams['noExitBtn'] == null) {
            urlParams['noExitBtn'] = data.noExitBtn;
          }

          if (data.title != null && this.buttonContainer != null) {
            var tmp = document.createElement('span');
            mxUtils.write(tmp, data.title);

            if (uiTheme == 'atlas') {
              this.buttonContainer.style.paddingRight = '12px';
              this.buttonContainer.style.paddingTop = '6px';
              this.buttonContainer.style.right = '25px';
            } else if (uiTheme != 'min') {
              this.buttonContainer.style.paddingRight = '38px';
              this.buttonContainer.style.paddingTop = '6px';
            }

            if (this.embedFilenameSpan != null) {
              this.embedFilenameSpan.parentNode.removeChild(this.embedFilenameSpan);
            }

            this.buttonContainer.appendChild(tmp);
            this.embedFilenameSpan = tmp;
          }

          if (data.xmlpng != null) {
            data = this.extractGraphModelFromPng(data.xmlpng);
          } else {
            data = data.xml;
          }
        } else if (data.action == 'merge') {
          var file = this.getCurrentFile();

          if (file != null) {
            var tmp = extractDiagramXml(data.xml);

            if (tmp != null && tmp != '') {
              file.mergeFile(new LocalFile(this, tmp), function () {
                parent.postMessage(JSON.stringify({
                  event: 'merge',
                  message: data
                }), '*');
              }, function (err) {
                parent.postMessage(JSON.stringify({
                  event: 'merge',
                  message: data,
                  error: err
                }), '*');
              });
            }
          }

          return;
        } else if (data.action == 'remoteInvokeReady') {
          this.handleRemoteInvokeReady(parent);
          return;
        } else if (data.action == 'remoteInvoke') {
          this.handleRemoteInvoke(data, evt.origin);
          return;
        } else if (data.action == 'remoteInvokeResponse') {
          this.handleRemoteInvokeResponse(data);
          return;
        } else {
          // Unknown message must stop execution
          parent.postMessage(JSON.stringify({
            error: 'unknownMessage',
            data: JSON.stringify(data)
          }), '*');

          return;
        }
      } catch (e) {
        // TODO: Block handling of more messages when in error state
        this.handleError(e);
      }
    }

    var doLoad = mxUtils.bind(this, function (data, evt) {
      ignoreChange = true;
      try {
        fn(data, evt);
      } catch (e) {
        this.handleError(e);
      }
      ignoreChange = false;

      if (urlParams['modified'] != null) {
        this.editor.setStatus('');
      }

      var getData = mxUtils.bind(this, function () {
        return (urlParams['pages'] != '0' || (this.pages != null && this.pages.length > 1)) ?
          this.getFileData(true) : mxUtils.getXml(this.editor.getGraphXml());
      });;

      lastData = getData();

      if (autosave && changeListener == null) {
        changeListener = mxUtils.bind(this, function (sender, eventObject) {
          var data = getData();

          if (data != lastData && !ignoreChange) {
            var msg = this.createLoadMessage('autosave');
            msg.xml = data;
            data = JSON.stringify(msg);

            var parent = window.opener || window.parent;
            parent.postMessage(data, '*');
          }

          lastData = data;
        });

        this.editor.graph.model.addListener(mxEvent.CHANGE, changeListener);

        // Some options trigger autosave
        this.editor.graph.addListener('gridSizeChanged', changeListener);
        this.editor.graph.addListener('shadowVisibleChanged', changeListener);
        this.addListener('pageFormatChanged', changeListener);
        this.addListener('pageScaleChanged', changeListener);
        this.addListener('backgroundColorChanged', changeListener);
        this.addListener('backgroundImageChanged', changeListener);
        this.addListener('foldingEnabledChanged', changeListener);
        this.addListener('mathEnabledChanged', changeListener);
        this.addListener('gridEnabledChanged', changeListener);
        this.addListener('guidesEnabledChanged', changeListener);
        this.addListener('pageViewChanged', changeListener);
      }

      // Sends the bounds of the graph to the host after parsing
      if (urlParams['returnbounds'] == '1' || urlParams['proto'] == 'json') {
        var resp = this.createLoadMessage('load');

        // Attaches XML to response
        resp.xml = data;

        parent.postMessage(JSON.stringify(resp), '*');
      }
    });

    if (data != null && typeof data.substring === 'function' && data.substring(0, 34) == 'data:application/vnd.visio;base64,') {
      // Checks VND binary magic number in base64
      var filename = (data.substring(34, 45) == '0M8R4KGxGuE') ? 'raw.vsd' : 'raw.vsdx';

      this.importVisio(this.base64ToBlob(data.substring(data.indexOf(',') + 1)), function (xml) {
        doLoad(xml, evt);
      }, mxUtils.bind(this, function (e) {
        this.handleError(e);
      }), filename);
    } else if (data != null && typeof data.substring === 'function' && !this.isOffline() && new XMLHttpRequest().upload && this.isRemoteFileFormat(data, '')) {
      // Asynchronous parsing via server
      this.parseFile(new Blob([data], {
        type: 'application/octet-stream'
      }), mxUtils.bind(this, function (xhr) {
        if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status <= 299 &&
          xhr.responseText.substring(0, 13) == '<mxGraphModel') {
          doLoad(xhr.responseText, evt);
        }
      }), '');
    } else if (data != null && typeof data.substring === 'function' && this.isLucidChartData(data)) {
      this.convertLucidChart(data, mxUtils.bind(this, function (xml) {
        doLoad(xml);
      }), mxUtils.bind(this, function (e) {
        this.handleError(e);
      }));
    } else {
      data = extractDiagramXml(data);
      doLoad(data, evt);
    }
  }));

  // Requests data from the sender. This is a workaround for not allowing
  // the opener to listen for the onload event if not in the same origin.
  var parent = window.opener || window.parent;
  var msg = (urlParams['proto'] == 'json') ? JSON.stringify({
    event: 'init'
  }) : (urlParams['ready'] || 'ready');
  parent.postMessage(msg, '*');

  // Adds JSON event for opening links
  if (urlParams['proto'] == 'json') {
    var graphOpenLink = this.editor.graph.openLink;

    this.editor.graph.openLink = function (href, target, allowOpener) {
      graphOpenLink.apply(this, arguments);

      parent.postMessage(JSON.stringify({
        event: 'openLink',
        href: href,
        target: target,
        allowOpener: allowOpener
      }), '*');
    };
  }
};


/**
 * 
 */
EditorUi.prototype.setFileData = function (data) {
  data = this.validateFileData(data);
  this.currentPage = null;
  this.fileNode = null;
  this.pages = null;

  var node = (data != null && data.length > 0) ? mxUtils.parseXml(data).documentElement : null;

  // Checks for parser errors
  var cause = Editor.extractParserError(node, mxResources.get('invalidOrMissingFile'));

  if (cause) {
    throw new Error(mxResources.get('notADiagramFile') + ' (' + cause + ')');
  } else {
    // Some nodes must be extracted here to find the mxfile node
    // LATER: Remove duplicate call to extractGraphModel in overridden setGraphXml
    var tmp = (node != null) ? this.editor.extractGraphModel(node, true) : null;

    if (tmp != null) {
      node = tmp;
    }

    if (node != null && node.nodeName == 'mxfile') {
      var nodes = node.getElementsByTagName('diagram');

      if (urlParams['pages'] != '0' || nodes.length > 1 ||
        (nodes.length == 1 && nodes[0].hasAttribute('name'))) {
        var selectedPage = null;
        this.fileNode = node;
        this.pages = [];

        // Wraps page nodes
        for (var i = 0; i < nodes.length; i++) {
          // Adds page ID based on page order to match
          // remote IDs given if IDs are missing here
          if (nodes[i].getAttribute('id') == null) {
            nodes[i].setAttribute('id', i);
          }

          var page = new DiagramPage(nodes[i]);

          // Checks for invalid page names
          if (page.getName() == null) {
            page.setName(mxResources.get('pageWithNumber', [i + 1]));
          }

          this.pages.push(page);

          if (urlParams['page-id'] != null && page.getId() == urlParams['page-id']) {
            selectedPage = page;
          }
        }

        this.currentPage = (selectedPage != null) ? selectedPage :
          this.pages[Math.max(0, Math.min(this.pages.length - 1, urlParams['page'] || 0))];
        node = this.currentPage.node;
      }
    }

    // Creates tabbed file structure if enforced by URL
    if (urlParams['pages'] != '0' && this.fileNode == null && node != null) {
      this.fileNode = node.ownerDocument.createElement('mxfile');
      this.currentPage = new DiagramPage(node.ownerDocument.createElement('diagram'));
      this.currentPage.setName(mxResources.get('pageWithNumber', [1]));
      this.pages = [this.currentPage];
    }

    // Avoids scroll offset when switching page
    this.editor.setGraphXml(node);

    // Avoids duplicate parsing of the XML stored in the node
    if (this.currentPage != null) {
      this.currentPage.root = this.editor.graph.model.root;
    }

    if (urlParams['layer-ids'] != null) {
      try {
        var layerIds = urlParams['layer-ids'].split(' ');
        var layerIdsMap = {};

        for (var i = 0; i < layerIds.length; i++) {
          layerIdsMap[layerIds[i]] = true;
        }

        var model = this.editor.graph.getModel();
        var children = model.getChildren(model.root);

        // handle layers visibility
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          model.setVisible(child, layerIdsMap[child.id] || false);
        }
      } catch (e) {} //ignore
    }
  }
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.getBaseFilename = function (ignorePageName) {
  var file = this.getCurrentFile();
  var basename = (file != null && file.getTitle() != null) ? file.getTitle() : this.defaultFilename;

  console.log("getBaseFilename：", ignorePageName, file, basename, this.defaultFilename)

  if (/(\.xml)$/i.test(basename) || /(\.html)$/i.test(basename) ||
    /(\.svg)$/i.test(basename) || /(\.png)$/i.test(basename) ||
    /(\.drawio)$/i.test(basename)) {
    basename = basename.substring(0, basename.lastIndexOf('.'));
  }

  if (!ignorePageName && this.pages != null && this.pages.length > 1 &&
    this.currentPage != null && this.currentPage.node.getAttribute('name') != null &&
    this.currentPage.getName().length > 0) {
    basename = basename + '-' + this.currentPage.getName();
  }
  return basename;
};

/**
 * 导出svg
 */
EditorUi.prototype.exportSvg = function (scale, transparentBackground, ignoreSelection, addShadow,
  editable, embedImages, border, noCrop, currentPage, linkTarget) {
  if (this.spinner.spin(document.body, mxResources.get('export'))) {
    try {
      var selectionEmpty = this.editor.graph.isSelectionEmpty();
      ignoreSelection = (ignoreSelection != null) ? ignoreSelection : selectionEmpty;
      var bg = (transparentBackground) ? null : this.editor.graph.background;

      if (bg == mxConstants.NONE) {
        bg = null;
      }

      // Handles special case where background is null but transparent is false
      if (bg == null && transparentBackground == false) {
        bg = '#ffffff';
      }

      // Sets or disables alternate text for foreignObjects. Disabling is needed
      // because PhantomJS seems to ignore switch statements and paint all text.
      var svgRoot = this.editor.graph.getSvg(bg, scale, border, noCrop, null,
        ignoreSelection, null, null, (linkTarget == 'blank') ? '_blank' :
        ((linkTarget == 'self') ? '_top' : null), null, true);

      if (addShadow) {
        this.editor.graph.addSvgShadow(svgRoot);
      }

      var filename = this.getBaseFilename() + '.svg';

      var doSave = mxUtils.bind(this, function (svgRoot) {
        this.spinner.stop();

        if (editable) {
          svgRoot.setAttribute('content', this.getFileData(true, null, null, null, ignoreSelection,
            currentPage, null, null, null, false));
        }

        var svg = '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
          mxUtils.getXml(svgRoot);

        if (this.isLocalFileSave() || svg.length <= MAX_REQUEST_SIZE) {
          this.saveData(filename, 'svg', svg, 'image/svg+xml');
        } else {
          this.handleError({
            message: mxResources.get('drawingTooLarge')
          }, mxResources.get('error'), mxUtils.bind(this, function () {
            mxUtils.popup(svg);
          }));
        }
      });

      // Adds CSS
      this.editor.addFontCss(svgRoot);

      if (this.editor.graph.mathEnabled) {
        this.editor.addMathCss(svgRoot);
      }

      if (embedImages) {
        // Caches images
        if (this.thumbImageCache == null) {
          this.thumbImageCache = new Object();
        }

        this.editor.convertImages(svgRoot, doSave, this.thumbImageCache);
      } else {
        doSave(svgRoot);
      }
    } catch (e) {
      this.handleError(e);
    }
  }
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.saveData = function (filename, format, data, mime, base64Encoded) {
  if (this.isLocalFileSave()) {
    //保存xml和svg文件
    this.saveLocalFile(data, filename, mime, base64Encoded, format);
  } else {
    //保存 GIF和PDF文件
    this.saveRequest(filename, format, mxUtils.bind(this, function (newTitle, base64) {
      return this.createEchoRequest(data, newTitle, mime, base64Encoded, format, base64);
    }), data, base64Encoded, mime);
  }
};

/**
 * Translates this point by the given vector.
 * 
 * Last 3 argument are optional and must only be used if the data can be stored as is on the client
 * side without requiring a server roundtrip.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 * 导出 GIF和PDF文件调的方法
 */
EditorUi.prototype.saveRequest = function (filename, format, fn, data, base64Encoded, mimeType, allowTab) {
  allowTab = (allowTab != null) ? allowTab : !mxClient.IS_IOS || !navigator.standalone;
  var count = this.getServiceCount(false);
  if (isLocalStorage) {
    count++;
  }
  var rowLimit = (count <= 4) ? 2 : (count > 6 ? 4 : 3);
  var dlg = new CreateDialog(this, filename, mxUtils.bind(this, function (newTitle, mode) {
      if (mode == '_blank' || newTitle != null && newTitle.length > 0) {
        var base64 = (mode == App.MODE_DEVICE || mode == 'download' || mode == null || mode == '_blank') ? '0' : '1';
        // console.log("走了11",newTitle,mode, base64);
        var xhr = fn((mode == '_blank') ? null : newTitle, base64);

        if (xhr != null) {
          if (mode == App.MODE_DEVICE || mode == 'download' || mode == '_blank') {
            // this.saveLocalFile( xhr.params, filename, format, null, null, true);
            // xhr.simulate(document, '_blank');
            // console.log("22",xhr)
          } else {
            // console.log("333")
            this.pickFolder(mode, mxUtils.bind(this, function (folderId) {
              mimeType = (mimeType != null) ? mimeType : ((format == 'pdf') ?
                'application/pdf' : 'image/' + format);

              // Workaround for no roundtrip required if data is available on client-side
              // TODO: Refactor the saveData/saveRequest call chain for local data
              if (data != null) {
                try {
                  this.exportFile(data, newTitle, mimeType, true, mode, folderId);
                } catch (e) {
                  this.handleError(e);
                }
              } else if (this.spinner.spin(document.body, mxResources.get('saving'))) {
                // LATER: Catch possible mixed content error
                // see http://stackoverflow.com/questions/30646417/catching-mixed-content-error
                xhr.send(mxUtils.bind(this, function () {
                  this.spinner.stop();

                  if (xhr.getStatus() >= 200 && xhr.getStatus() <= 299) {
                    try {
                      this.exportFile(xhr.getText(), newTitle, mimeType, true, mode, folderId);
                    } catch (e) {
                      this.handleError(e);
                    }
                  } else {
                    this.handleError({
                      message: mxResources.get('errorSavingFile')
                    });
                  }
                }), function (resp) {
                  this.spinner.stop();
                  this.handleError(resp);
                });
              }
            }));
          }
        }
      }
    }), mxUtils.bind(this, function () {
      this.hideDialog();
    }), mxResources.get('saveAs'), mxResources.get('download'), false, false, allowTab,
    null, count > 1, rowLimit, data, mimeType, base64Encoded);

  var height = (this.isServices(count)) ? ((count > 4) ? 390 : 270) : 160;
  this.showDialog(dlg.container, 380, height, true, true);
  dlg.init();
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.downloadFile = function (format, uncompressed, addShadow, ignoreSelection, currentPage,
  pageVisible, transparent, scale, border, grid, includeXml) {
  try {
    ignoreSelection = (ignoreSelection != null) ? ignoreSelection : this.editor.graph.isSelectionEmpty();
    var basename = this.getBaseFilename(!currentPage);
    var filename = basename + '.' + format;

    if (format == 'xml') {
      var data = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        this.getFileData(true, null, null, null, ignoreSelection, currentPage,
          null, null, null, uncompressed);

      this.saveData(filename, format, data, 'text/xml');
    } else if (format == 'html') {
      var data = this.getHtml2(this.getFileData(true), this.editor.graph, basename);
      this.saveData(filename, format, data, 'text/html');
    } else if ((format == 'svg' || format == 'xmlsvg') && this.spinner.spin(document.body, mxResources.get('export'))) {
      var svg = null;
      var saveSvg = mxUtils.bind(this, function (data) {
        if (data.length <= MAX_REQUEST_SIZE) {
          this.saveData(filename, 'svg', data, 'image/svg+xml');
        } else {
          this.handleError({
            message: mxResources.get('drawingTooLarge')
          }, mxResources.get('error'), mxUtils.bind(this, function () {
            mxUtils.popup(svg);
          }));
        }
      });

      if (format == 'svg') {
        var bg = this.editor.graph.background;

        if (transparent || bg == mxConstants.NONE) {
          bg = null;
        }

        // Sets or disables alternate text for foreignObjects. Disabling is needed
        // because PhantomJS seems to ignore switch statements and paint all text.
        var svgRoot = this.editor.graph.getSvg(bg, null, null, null, null, ignoreSelection);

        if (addShadow) {
          this.editor.graph.addSvgShadow(svgRoot);
        }

        // Embeds the images in the SVG output (async)
        this.editor.convertImages(svgRoot, mxUtils.bind(this, mxUtils.bind(this, function (svgRoot2) {
          this.spinner.stop();

          saveSvg('<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
            mxUtils.getXml(svgRoot2));
        })));
      } else {
        filename = basename + '.svg';

        svg = this.getFileData(false, true, null, mxUtils.bind(this, function (svg) {
          this.spinner.stop();
          saveSvg(svg);
        }), ignoreSelection);
      }
    } else {
      if (format == 'xmlpng') {
        filename = basename + '.png';
      } else if (format == 'jpeg') {
        filename = basename + '.jpg';
      }
      // GIF 和 PDF 方法 
      this.saveRequest(filename, format, mxUtils.bind(this, function (newTitle, base64) {
        try {
          var prev = this.editor.graph.pageVisible;
          if (pageVisible != null) {
            this.editor.graph.pageVisible = pageVisible;
          }
          var req = this.createDownloadRequest(newTitle, format, ignoreSelection, base64,
            transparent, currentPage, scale, border, grid, includeXml);
          this.editor.graph.pageVisible = prev;
          return req;
        } catch (e) {
          this.handleError(e);
        }
      }));
    }
  } catch (e) {
    this.handleError(e);
  }
};

/**
 * Adds a file drop handler for opening local files.
 */
EditorUi.prototype.addFileDropHandler = function (elts) {
  // Installs drag and drop handler for files
  if (Graph.fileSupport) {
    var dropElt = null;

    for (var i = 0; i < elts.length; i++) {
      // Setup the dnd listeners
      mxEvent.addListener(elts[i], 'dragleave', function (evt) {
        if (dropElt != null) {
          dropElt.parentNode.removeChild(dropElt);
          dropElt = null;
        }

        evt.stopPropagation();
        evt.preventDefault();
      });

      mxEvent.addListener(elts[i], 'dragover', mxUtils.bind(this, function (evt) {
        if (this.editor.graph.isEnabled() || urlParams['embed'] != '1') {
          // IE 10 does not implement pointer-events so it can't have a drop highlight
          if (dropElt == null && (!mxClient.IS_IE || (document.documentMode > 10 && document.documentMode < 12))) {
            dropElt = this.highlightElement();
          }
        }

        evt.stopPropagation();
        evt.preventDefault();
      }));

      mxEvent.addListener(elts[i], 'drop', mxUtils.bind(this, function (evt) {
        if (dropElt != null) {
          dropElt.parentNode.removeChild(dropElt);
          dropElt = null;
        }

        if (this.editor.graph.isEnabled() || urlParams['embed'] != '1') {
          if (evt.dataTransfer.files.length > 0) {
            this.hideDialog();

            // Never open files in embed mode
            if (urlParams['embed'] == '1') {
              this.importFiles(evt.dataTransfer.files, 0, 0, this.maxImageSize, null, null,
                null, null, !mxEvent.isControlDown(evt) && !mxEvent.isShiftDown(evt));
            } else {
              this.openFiles(evt.dataTransfer.files, true);
            }
          } else {
            // Handles open special files via text drag and drop
            var data = this.extractGraphModelFromEvent(evt);

            // Tries additional and async parsing of text content such as HTML, Gliffy data
            if (data == null) {
              var provider = (evt.dataTransfer != null) ? evt.dataTransfer : evt.clipboardData;

              if (provider != null) {
                if (document.documentMode == 10 || document.documentMode == 11) {
                  data = provider.getData('Text');
                } else {
                  var data = null;

                  if (mxUtils.indexOf(provider.types, 'text/uri-list') >= 0) {
                    var data = evt.dataTransfer.getData('text/uri-list');
                  } else {
                    data = (mxUtils.indexOf(provider.types, 'text/html') >= 0) ? provider.getData('text/html') : null;
                  }

                  if (data != null && data.length > 0) {
                    var div = document.createElement('div');
                    div.innerHTML = data;

                    // Extracts single image
                    var imgs = div.getElementsByTagName('img');

                    if (imgs.length > 0) {
                      data = imgs[0].getAttribute('src');
                    }
                  } else if (mxUtils.indexOf(provider.types, 'text/plain') >= 0) {
                    data = provider.getData('text/plain');
                  }
                }

                if (data != null) {
                  // Checks for embedded XML in PNG
                  if (data.substring(0, 22) == 'data:image/png;base64,') {
                    var xml = this.extractGraphModelFromPng(data);

                    if (xml != null && xml.length > 0) {
                      this.openLocalFile(xml, null, true);
                    }
                  } else if (!this.isOffline() && this.isRemoteFileFormat(data)) {
                    new mxXmlRequest(OPEN_URL, 'format=xml&data=' + encodeURIComponent(data)).send(mxUtils.bind(this, function (req) {
                      if (req.getStatus() >= 200 && req.getStatus() <= 299) {
                        this.openLocalFile(req.getText(), null, true);
                      }
                    }));
                  } else if (/^https?:\/\//.test(data)) {
                    if (this.getCurrentFile() == null) {
                      window.location.hash = '#U' + encodeURIComponent(data);
                    } else {
                      window.openWindow(((mxClient.IS_CHROMEAPP) ?
                          (EditorUi.drawHost + '/') : 'https://' + location.host + '/') +
                        window.location.search + '#U' + encodeURIComponent(data));
                    }
                  }
                }
              }
            } else {
              this.openLocalFile(data, null, true);
            }
          }
        }

        evt.stopPropagation();
        evt.preventDefault();
      }));
    }
  }
};

/**
 *
 */
EditorUi.prototype.exportImage = function (name, scale, transparentBackground, ignoreSelection, addShadow, editable, border, noCrop, currentPage, format, grid, dpi) {
  format = (format != null) ? format : 'png';
  // console.log("导出img:",name);
  if (this.spinner.spin(document.body, mxResources.get('exporting'))) {
    var selectionEmpty = this.editor.graph.isSelectionEmpty();
    ignoreSelection = (ignoreSelection != null) ? ignoreSelection : selectionEmpty;

    // Caches images
    if (this.thumbImageCache == null) {
      this.thumbImageCache = new Object();
    }

    try {
      this.editor.exportToCanvas(mxUtils.bind(this, function (canvas) {
          this.spinner.stop();
          try {
            this.saveCanvas(name, canvas, (editable) ? this.getFileData(true, null,
                null, null, ignoreSelection, currentPage) : null,
              format, (this.pages == null || this.pages.length == 0), dpi);
          } catch (e) {
            // Fallback to server-side image export
            if (e.message == 'Invalid image') {
              //
              this.downloadFile(format);
            } else {
              this.handleError(e);
            }
          }
        }), null, this.thumbImageCache, null, mxUtils.bind(this, function (e) {
          this.spinner.stop();
          this.handleError(e);
        }), null, ignoreSelection, scale || 1, transparentBackground,
        addShadow, null, null, border, noCrop, grid);
    } catch (e) {
      this.spinner.stop();
      this.handleError(e);
    }
  }
};

/**
 * 导出png/jpg图片最后保存的方法
 */
EditorUi.prototype.saveCanvas = function (name, canvas, xml, format, ignorePageName, dpi) {
  var ext = ((format == 'jpeg') ? 'jpg' : format);
  var filename = name ? name : this.getBaseFilename(ignorePageName) + '.' + ext;
  //如果传过来的name有值就用name，如果没有就用初始的值
  // console.log("saveCanvas:",name,filename);
  var data = this.createImageDataUri(canvas, xml, format, dpi);
  this.saveData(filename, ext, data.substring(data.lastIndexOf(',') + 1), 'image/' + format, true);
};

EditorUi.prototype.createImageDataUri = function (canvas, xml, format, dpi) {
  var data = canvas.toDataURL('image/' + format);
  // Checks if output is invalid or empty
  if (data.length <= 6 || data == canvas.cloneNode(false).toDataURL('image/' + format)) {
    throw {
      message: 'Invalid image'
    };
  }
  if (xml != null) {
    data = this.editor.writeGraphModelToPng(data, 'tEXt', 'mxfile', encodeURIComponent(xml));
  }
  if (dpi > 0) {
    data = this.editor.writeGraphModelToPng(data, 'pHYs', 'dpi', dpi);
  }
  return data;
};
//新加的方法-------------end---

/**
 * "Installs" menus in EditorUi.
 */
EditorUi.prototype.createMenus = function () {
  return new Menus(this);
};

export default EditorUi;
export {
  ChangePageSetup
}