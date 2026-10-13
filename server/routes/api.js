// 整合自 vue_mxgraph_admin/routes/api.js
// 说明：TOPO 图以 XML 文件形式保存到 server/data/xmls/，元数据记录在
// server/data/xmlList.json（数组：{ id, name, xml, createUserName, createTime }）
var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

// 数据目录（本文件位于 server/routes，因此用 ../data 指向 server/data）
var DATA_DIR = path.resolve(__dirname, '../data');
var XML_DIR = path.resolve(DATA_DIR, 'xmls');
var LIST_FILE = path.resolve(DATA_DIR, 'xmlList.json');

// 确保目录/文件存在
if (!fs.existsSync(XML_DIR)) {
  fs.mkdirSync(XML_DIR, { recursive: true });
}
if (!fs.existsSync(LIST_FILE)) {
  fs.writeFileSync(LIST_FILE, '[]', 'utf-8');
}

function readList() {
  try {
    return JSON.parse(fs.readFileSync(LIST_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function writeList(list) {
  fs.writeFileSync(LIST_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

router.post('/open', function (req, res, next) {
  res.json({ status: 'success' });
});

router.post('/save', function (req, res, next) {
  res.json({ status: 'success' });
});

// 删除xml 文件
router.delete('/delete_Graph/:id', function (req, res, next) {
  var xmlList = readList();
  var _id = String(req.params.id);
  var index = xmlList.findIndex(function (v) { return v.id == _id; });
  if (index > -1) {
    var filename = xmlList[index].name;
    fs.unlink(path.resolve(XML_DIR, filename), function (err) {
      if (err) {
        res.status(500).json({ success: false, msg: String(err) });
        throw err;
      } else {
        xmlList.splice(index, 1);
        writeList(xmlList);
        res.json({ status: 'success', msg: '删除成功！' });
      }
    });
  } else {
    res.status(400).json({ success: false, msg: '未找到id为' + _id + '的xml文件' });
  }
});

// 保存TOPO图
router.post('/graphs', function (req, res, next) {
  var obj = req.body;
  var _xml = obj.xml;
  var fileName = obj.name.endsWith('.xml') ? obj.name : (obj.name + '.xml');
  fs.writeFile(path.resolve(XML_DIR, fileName), _xml, 'utf-8', function (err) {
    if (err) {
      res.json({ status: 'error', data: String(err) });
    } else {
      var xmlList = readList();
      xmlList.push({
        id: obj.id,
        name: fileName,
        xml: obj.xml,
        createUserName: obj.userName,
        createTime: obj.nowTime
      });
      writeList(xmlList);
      res.json({ status: 'success', msg: '保存TOPO图成功！' });
    }
  });
});

// 查询列表
router.get('/list_All', function (req, res, next) {
  var xmlList = readList();
  res.json({ status: 'success', data: xmlList });
});

// xml 详情
router.get('/detail_Graph/:id', function (req, res, next) {
  var xmlList = readList();
  var _id = String(req.params.id);
  var fileName = '';
  for (var i = 0; i < xmlList.length; i++) {
    if (xmlList[i].id == _id) {
      fileName = xmlList[i].name;
    }
  }
  if (!fileName) {
    res.json({ status: 'error', data: 'not found with id: ' + _id });
  } else {
    fs.readFile(path.resolve(XML_DIR, fileName), function (err, data) {
      if (err) {
        res.json({ status: 'error', data: String(err) });
      } else {
        res.json({
          status: 'success',
          data: { id: _id, name: fileName, xml: data.toString() }
        });
      }
    });
  }
});

// 修改 xml
router.put('/graphs', function (req, res, next) {
  var _id = req.body.id;
  var _name = req.body.name;
  var _xml = req.body.xml;
  var fileName = _name.endsWith('.xml') ? _name : (_name + '.xml');
  fs.writeFile(path.resolve(XML_DIR, fileName), _xml, 'utf-8', function (err) {
    if (err) {
      res.status(400).json({ status: 'error', data: String(err) });
    } else {
      res.status(200).json({
        status: 'success',
        msg: '成功保存入' + path.resolve(XML_DIR, fileName) + '文件'
      });
    }
  });
});

// 查询name 是否唯一
router.get('/validateName', function (req, res, next) {
  var _name = req.query.name;
  _name = _name.endsWith('.xml') ? _name : (_name + '.xml');
  var xmlList = readList();
  var exitName = xmlList.some(function (item) { return item.name == _name; });
  if (exitName) {
    res.json({ status: 'error', data: _name + '名称已经存在' });
  } else {
    res.json({ status: 'success' });
  }
});

module.exports = router;
