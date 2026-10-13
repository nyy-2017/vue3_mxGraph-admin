// import Cookies from 'js-cookie'

export function lineStation() {
  if (Cookies.get('serverNodeId') !== undefined) {
    // eslint-disable-next-line no-const-assign
    return Cookies.get('serverNodeId').substring(4, 8) // 线路车站
  }
}

export function sequence(num, length) { // 序列号（8位）
  for (var len = (num + '').length; len < length; len = num.length) {
    num = '0' + num
  }
  return num
}

export function trainCode(serial) { // 列车编号接口
  let numbering
  let mainType = '10' // 主类型
  let trainType = '00'
  let manageNode = '1' // 管理节点编号
  numbering = mainType + trainType + lineStation() + manageNode + sequence(serial, 8)
  return numbering
}

export function deviceCode(deviceType, serial) { // 设备编号接口
  let numbering
  let mainType = '06' // 主类型
  let manageNode = '1' // 管理节点编号
  numbering = mainType + sequence(deviceType, 2) + lineStation() + manageNode + sequence(serial, 8)
  return numbering
}

export function deviceTopoCode(deviceType, serial) { // 设备Topo图编号接口
  let numbering
  let mainType = '88' // 主类型
  let manageNode = '1' // 管理节点编号
  let center = '0000'
  numbering = mainType + sequence(66, 2) + center + sequence(serial)
  // numbering = mainType + sequence(deviceType, 2) + center + manageNode + sequence(serial, 8)
  return numbering
}
export function TopoMinCode(deviceType, serial) { // 设备Topo图里面每个小图编号接口
  let numbering
  let mainType = 'TP' // 主类型
  let manageNode = '1' // 管理节点编号
  let center = '0000'
  numbering = mainType + sequence(deviceType, 2) + center + manageNode + sequence(serial, 8)
  return numbering
}

export function materialCode(minorType, serial) { // 素材编号接口
  let numbering
  let mainType = '05' // 主类型
  numbering = mainType + minorType + serial
  return numbering
}

export function recCode(recType, serial) { // 编播编号接口
  let numbering
  let mainType = '08' // 主类型
  numbering = mainType + recType.substring(recType.length - 9) + serial
  return numbering
}

export function nodeInfoCode(serviceType, serial) { // 服务节点编号接口
  let numbering
  let mainType = '01' // 主类型
  let manageNode = '1' // 管理节点编号
  numbering = mainType + sequence(serviceType, 2) + lineStation() + manageNode + sequence(serial, 8)
  return numbering
}

export function userIdCode(levelType, serial) { // 用户编号接口
  let numbering
  let mainType = '07' // 主类型
  let manageNode = '1' // 管理节点编号
  numbering = mainType + sequence(levelType, 2) + lineStation() + manageNode + sequence(serial, 8)
  return numbering
}

export function areaIdCode(areaType, serial) { // 分区编号接口
  let numbering
  let mainType = '04' // 主类型
  let manageNode = '1' // 管理节点编号
  numbering = mainType + sequence(areaType, 2) + manageNode + sequence(serial, 8)
  return numbering
}

export function areaGroupIdCode(serial) { // 分区组编号接口
  let numbering
  let mainType = '04' // 主类型
  numbering = mainType + lineStation() + sequence(serial, 3)
  return numbering
}

export function templateCode(templateType, serial) { // 模板编号接口
  let numbering
  let mainType = '08' // 主类型
  numbering = mainType + templateType.substring(templateType.length - 9) + serial
  return numbering
}

export function mpidCode(usestate, serial) { // 监控项编号接口
  let numbering
  let mainType = '99' // 主类型
  let manageNode = '1' // 管理节点编号
  numbering = mainType + sequence(usestate, 2) + lineStation() + manageNode + sequence(serial, 8)
  return numbering
}