// urlParams is null when used for embedding
window.urlParams = window.urlParams || {};

//
window.PLANT_URL = window.PLANT_URL || 'https://plant-aws.diagrams.net';

// Public global variables
window.MAX_REQUEST_SIZE = window.MAX_REQUEST_SIZE || 10485760;
window.MAX_AREA = window.MAX_AREA || 15000 * 15000;

// URLs for save and export
window.SAVE_URL = window.SAVE_URL || '/graphs';
window.STENCIL_PATH = window.STENCIL_PATH || '/static/stencils'; //相对路径不会改变解析的时候加载 本地图片路径
window.RESOURCES_PATH = window.RESOURCES_PATH || '/static/resources'; //帮助的路径配置:help.html

window.ABOUT_PATH = window.ABOUT_PATH || '/static/assets'; //about的图片显示
window.OPEN_FORM = window.OPEN_FORM || '/static/assets/open.html'; //打开文件演示demo

window.STYLE_PATH = window.STYLE_PATH || 'styles';
// window.CSS_PATH = window.CSS_PATH || 'styles';


window.IMAGE_PATH = window.IMAGE_PATH || '/static/mxgraph/images' // 折叠/展开 图片路径
window.EXPORT_URL  = window.EXPORT_URL  || '/graphs' // 图片保存调api接口
// Sets the base path, the UI language via URL param and configures the
// supported languages to avoid 404s. The loading of all core language
// resources is disabled as all required resources are in grapheditor.
// properties. Note that in this example the loading of two resource
// files (the special bundle and the default bundle) is disabled to
// save a GET request. This requires that all resources be present in
// each properties file since only one file is loaded.
window.mxBasePath = window.mxBasePath || '../../../src';
window.mxLanguage = window.mxLanguage || urlParams['lang'];
window.mxLanguages = window.mxLanguages || ['zh'];