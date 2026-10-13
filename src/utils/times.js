export function FromDates() {
    const timeStamp = new Date()
    let year = (new Date(timeStamp).getFullYear()).toString()
    let month = (new Date(timeStamp).getMonth() + 1 < 10 ? '0' + (new Date(timeStamp).getMonth() + 1) : new Date(timeStamp).getMonth() + 1).toString()
    let date = (new Date(timeStamp).getDate() < 10 ? '0' + new Date(timeStamp).getDate() : new Date(timeStamp).getDate()).toString()
    let hh = (new Date(timeStamp).getHours() < 10 ? '0' + new Date(timeStamp).getHours() : new Date(timeStamp).getHours()).toString()
    let mm = (new Date(timeStamp).getMinutes() < 10 ? '0' + new Date(timeStamp).getMinutes() : new Date(timeStamp).getMinutes()).toString()
    let ss = (new Date(timeStamp).getSeconds() < 10 ? '0' + new Date(timeStamp).getSeconds() : new Date(timeStamp).getSeconds()).toString()
    let nowTime = year + month + date + hh + mm + ss
    return nowTime
  }
  
  export function FromTimes(timeStamp) { // 时间转换
    let year = new Date(timeStamp).getFullYear()
    let month = new Date(timeStamp).getMonth() + 1 < 10 ? '0' + (new Date(timeStamp).getMonth() + 1) : new Date(timeStamp).getMonth() + 1
    let date = new Date(timeStamp).getDate() < 10 ? '0' + new Date(timeStamp).getDate() : new Date(timeStamp).getDate()
    let hh = new Date(timeStamp).getHours() < 10 ? '0' + new Date(timeStamp).getHours() : new Date(timeStamp).getHours()
    let mm = new Date(timeStamp).getMinutes() < 10 ? '0' + new Date(timeStamp).getMinutes() : new Date(timeStamp).getMinutes()
    let ss = new Date(timeStamp).getSeconds() < 10 ? '0' + new Date(timeStamp).getSeconds() : new Date(timeStamp).getSeconds()
    let nowTime = year + '-' + month + '-' + date + ' ' + hh + ':' + mm + ':' + ss
    return nowTime
  }
  
  export function nationTimes(timeStamp) { // 转化为年月日时间
    let year = new Date(timeStamp).getFullYear()
    let month = new Date(timeStamp).getMonth() + 1 < 10 ? '0' + (new Date(timeStamp).getMonth() + 1) : new Date(timeStamp).getMonth() + 1
    let date = new Date(timeStamp).getDate() < 10 ? '0' + new Date(timeStamp).getDate() : new Date(timeStamp).getDate()
    let nowTime = year + '年' + month + '月' + date + '日'
    return nowTime
  }
  
  export function tenseTimes(timeStamp) { // 时间转换(时分秒)
    let hh = new Date(timeStamp).getHours() < 10 ? '0' + new Date(timeStamp).getHours() : new Date(timeStamp).getHours()
    let mm = new Date(timeStamp).getMinutes() < 10 ? '0' + new Date(timeStamp).getMinutes() : new Date(timeStamp).getMinutes()
    let ss = new Date(timeStamp).getSeconds() < 10 ? '0' + new Date(timeStamp).getSeconds() : new Date(timeStamp).getSeconds()
    let nowTime = hh + ':' + mm + ':' + ss
    return nowTime
  }
  
  export function nowTime() { // 当前时间
    return new Date(+new Date(new Date().toJSON()) + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
  }
  
  export function formerTime(n) { // 三天前时间
    // eslint-disable-next-line no-redeclare
    var n = n
    let d = new Date()
    let year = d.getFullYear()
    let mon = d.getMonth() + 1
    let day = d.getDate()
    let hh = d.getHours()
    let mm = d.getMinutes()
    let ss = d.getSeconds()
    if (day <= n) {
      if (mon > 1) {
        mon = mon - 1
      } else {
        year = year - 1;
        mon = 12
      }
    }
    d.setDate(d.getDate() - n)
    year = d.getFullYear()
    mon = d.getMonth() + 1
    day = d.getDate()
    let s = year + '-' + (mon < 10 ? ('0' + mon) : mon) + '-' + (day < 10 ? ('0' + day) : day) + ' ' + (hh < 10 ? ('0' + hh) : hh) + ':' + (mm < 10 ? ('0' + mm) : mm) + ':' + (ss < 10 ? ('0' + ss) : ss)
    return s
  }
  
  export function upMonthDate() { // 上个月1号时间
    let d = new Date()
    let year = d.getFullYear()
    let mon = d.getMonth() + 1
    let day = '01'
    if (mon > 1) {
      mon = mon - 1
    } else {
      year = year - 1;
      mon = 12
    }
    let s = year + '-' + (mon < 10 ? ('0' + mon) : mon) + '-' + day + ' ' + '00' + ':' + '00' + ':' + '00'
    return s
  }
  
  export function defaultTime() { // 默认时间
    return '2000-01-01 01:01:01'
  }
  
  export function broadcastEndTime(startTime, sec) { // 播表模板录入结束时间
    let n = new Date(startTime.getTime() + sec * 1000)
    let year = new Date(n).getFullYear()
    let month = new Date(n).getMonth() + 1 < 10 ? '0' + (new Date(n).getMonth() + 1) : new Date(n).getMonth() + 1
    let date = new Date(n).getDate() < 10 ? '0' + new Date(n).getDate() : new Date(n).getDate()
    let hh = new Date(n).getHours() < 10 ? '0' + new Date(n).getHours() : new Date(n).getHours()
    let mm = new Date(n).getMinutes() < 10 ? '0' + new Date(n).getMinutes() : new Date(n).getMinutes()
    let ss = new Date(n).getSeconds() < 10 ? '0' + new Date(n).getSeconds() : new Date(n).getSeconds()
    let nowTime = year + '-' + month + '-' + date + ' ' + hh + ':' + mm + ':' + ss
    return nowTime
  }
  
  export function startRecTime(timeStamp) { // 播表查询开始时间
    // eslint-disable-next-line eqeqeq
    if (timeStamp == '') {
      return ''
    } else {
      let year = new Date(timeStamp).getFullYear()
      let month = new Date(timeStamp).getMonth() + 1 < 10 ? '0' + (new Date(timeStamp).getMonth() + 1) : new Date(timeStamp).getMonth() + 1
      let date = new Date(timeStamp).getDate() < 10 ? '0' + new Date(timeStamp).getDate() : new Date(timeStamp).getDate()
      let nowTime = year + '-' + month + '-' + date + ' ' + '00:00:00'
      return nowTime
    }
  }
  
  export function endRecTime(timeStamp) { // 播表查询结束时间
    // eslint-disable-next-line eqeqeq
    if (timeStamp == '') {
      return ''
    } else {
      let year = new Date(timeStamp).getFullYear()
      let month = new Date(timeStamp).getMonth() + 1 < 10 ? '0' + (new Date(timeStamp).getMonth() + 1) : new Date(timeStamp).getMonth() + 1
      let date = new Date(timeStamp).getDate() < 10 ? '0' + new Date(timeStamp).getDate() : new Date(timeStamp).getDate()
      let nowTime = year + '-' + month + '-' + date + ' ' + '23:59:59'
      return nowTime
    }
  }
  
  export function makeDurationToSeconds(time) { // 将时分秒转化为秒
    var str = time
    var arr = str.split(':')
    var hs = parseInt(arr[0] * 3600)
    var ms = parseInt(arr[1] * 60)
    var ss = parseInt(arr[2])
    var seconds = hs + ms + ss
    return seconds
  }
  
  export function formatSeconds(value) { // 将秒转化为时分秒
    let result = parseInt(value)
    let h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600)
    let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60))
    let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60))
    result = `${h}:${m}:${s}`
    return result
  }
  
  export function startRecTime1(timeStamp) { // 播表查询开始时间
    // eslint-disable-next-line eqeqeq
    if (timeStamp == '') {
      return ''
    } else {
      let year = new Date(timeStamp).getFullYear()
      let month = new Date(timeStamp).getMonth() + 1 < 10 ? '0' + (new Date(timeStamp).getMonth() + 1) : new Date(timeStamp).getMonth() + 1
      let date = new Date(timeStamp).getDate() < 10 ? '0' + new Date(timeStamp).getDate() : new Date(timeStamp).getDate()
      let nowTime = year + '-' + month + '-' + date
      return nowTime
    }
  }
  
  export function filtrate(information) { // lineName线路过滤
    let stationNameArr = []
    for (let i = 0; i < information.length; i++) {
      stationNameArr.push(information[i].lineName)
    }
    let array = Array.from(new Set(stationNameArr))
    let variable = []
    for (let j = 0; j < array.length; j++) {
      let vari = {}
      vari.label = array[j]
      vari.value = j + 1
      variable.push(vari)
    }
    return variable
  }
  
  export function filtrateType(information) { // 播放状态线路过滤
    let stationNameArr = []
    for (let i = 0; i < information.length; i++) {
      stationNameArr.push(information[i].broadcastRecordSubareaInfo.lineName)
    }
    let array = Array.from(new Set(stationNameArr))
    let variable = []
    for (let j = 0; j < array.length; j++) {
      let vari = {}
      vari.label = array[j]
      vari.value = j + 1
      variable.push(vari)
    }
    return variable
  }
  
  export function FormateCheck(str) { // 验证 HH:mm:ss格式
    var re = /^(?:[01]\d|2[0-3])(?::[0-5]\d){2}$/
    var result = re.test(str)
    return result
  }
  
  export function isDateTimePart(str) { // 验证YYYY-mm-DD HH:mm:ss格式
    var re = /^((\d{2}(([02468][048])|([13579][26]))[\-\/\s]?((((0?[13578])|(1[02]))[\-\/\s]?((0?[1-9])|([1-2][0-9])|(3[01])))|(((0?[469])|(11))[\-\/\s]?((0?[1-9])|([1-2][0-9])|(30)))|(0?2[\-\/\s]?((0?[1-9])|([1-2][0-9])))))|(\d{2}(([02468][1235679])|([13579][01345789]))[\-\/\s]?((((0?[13578])|(1[02]))[\-\/\s]?((0?[1-9])|([1-2][0-9])|(3[01])))|(((0?[469])|(11))[\-\/\s]?((0?[1-9])|([1-2][0-9])|(30)))|(0?2[\-\/\s]?((0?[1-9])|(1[0-9])|(2[0-8]))))))(\s((([0-1][0-9])|(2?[0-3]))\:([0-5]?[0-9])((\s)|(\:([0-5]?[0-9])))))?$/;
    var result = re.test(str)
    return result
  }
  
  export function yesterday() { // 昨天yyyy-MM-dd
    var day1 = new Date()
    day1.setDate(day1.getDate() - 1)
    return day1.format('yyyy-MM-dd')
  }
  // eslint-disable-next-line no-extend-native
  Date.prototype.format = function (fmt) {
    var o = {
      'M+': this.getMonth() + 1, // 月份
      'd+': this.getDate(), // 日
      'h+': this.getHours(), // 小时
      'm+': this.getMinutes(), // 分
      's+': this.getSeconds(), // 秒
      'q+': Math.floor((this.getMonth() + 3) / 3), // 季度
      'S': this.getMilliseconds() // 毫秒
    }
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
    for (var k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
    return fmt
  }
  
  export function uploadDates(timeStamp) {
    let year = (new Date(timeStamp).getFullYear()).toString()
    let month = (new Date(timeStamp).getMonth() + 1 < 10 ? '0' + (new Date(timeStamp).getMonth() + 1) : new Date(timeStamp).getMonth() + 1).toString()
    let date = (new Date(timeStamp).getDate() < 10 ? '0' + new Date(timeStamp).getDate() : new Date(timeStamp).getDate()).toString()
    let hh = (new Date(timeStamp).getHours() < 10 ? '0' + new Date(timeStamp).getHours() : new Date(timeStamp).getHours()).toString()
    let mm = (new Date(timeStamp).getMinutes() < 10 ? '0' + new Date(timeStamp).getMinutes() : new Date(timeStamp).getMinutes()).toString()
    let ss = (new Date(timeStamp).getSeconds() < 10 ? '0' + new Date(timeStamp).getSeconds() : new Date(timeStamp).getSeconds()).toString()
    let nowTime = year + month + date + hh + mm + ss
    return nowTime
  }