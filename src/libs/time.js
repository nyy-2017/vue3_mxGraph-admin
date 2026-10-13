
export function FromDates() {
     const timeStamp = new Date();
     let year = new Date(timeStamp).getFullYear();
     let month =new Date(timeStamp).getMonth() + 1 < 10? "0" + (new Date(timeStamp).getMonth() + 1): new Date(timeStamp).getMonth() + 1;
     let date =new Date(timeStamp).getDate() < 10? "0" + new Date(timeStamp).getDate(): new Date(timeStamp).getDate();
     let hh =new Date(timeStamp).getHours() < 10? "0" + new Date(timeStamp).getHours(): new Date(timeStamp).getHours();
     let mm =new Date(timeStamp).getMinutes() < 10? "0" + new Date(timeStamp).getMinutes(): new Date(timeStamp).getMinutes();
     let ss =new Date(timeStamp).getSeconds() < 10? "0" + new Date(timeStamp).getSeconds(): new Date(timeStamp).getSeconds();
     let nowTime = year + month + date + hh + mm + ss;
     return nowTime;
} 

export function FromTimes(timeStamp) {  //时间转换
     let year = new Date(timeStamp).getFullYear();
     let month =new Date(timeStamp).getMonth() + 1 < 10? "0" + (new Date(timeStamp).getMonth() + 1): new Date(timeStamp).getMonth() + 1;
     let date =new Date(timeStamp).getDate() < 10? "0" + new Date(timeStamp).getDate(): new Date(timeStamp).getDate();
     let hh =new Date(timeStamp).getHours() < 10? "0" + new Date(timeStamp).getHours(): new Date(timeStamp).getHours();
     let mm =new Date(timeStamp).getMinutes() < 10? "0" + new Date(timeStamp).getMinutes(): new Date(timeStamp).getMinutes();
     let ss =new Date(timeStamp).getSeconds() < 10? "0" + new Date(timeStamp).getSeconds(): new Date(timeStamp).getSeconds();
     let nowTime = year + "-" + month + "-" + date +" "+ hh + ":" + mm + ":"+ ss;
     return nowTime;
}

export function tenseTimes(timeStamp) {  //时间转换(时分秒)
     let hh =new Date(timeStamp).getHours() < 10? "0" + new Date(timeStamp).getHours(): new Date(timeStamp).getHours();
     let mm =new Date(timeStamp).getMinutes() < 10? "0" + new Date(timeStamp).getMinutes(): new Date(timeStamp).getMinutes();
     let ss =new Date(timeStamp).getSeconds() < 10? "0" + new Date(timeStamp).getSeconds(): new Date(timeStamp).getSeconds();
     let nowTime = hh + ":" + mm + ":"+ ss;
     return nowTime;
}

export function nowTime(){   //当前时间
     return new Date(+new Date(new Date().toJSON())+8*3600*1000).toISOString().replace(/T/g,' ').replace(/\.[\d]{3}Z/,'')
}

export function formerTime(n){   //三天前时间
     var n = n;
     let d = new Date();
     let year = d.getFullYear();
     let mon=d.getMonth()+1;
     let day=d.getDate();
     let hh=d.getHours();
     let mm=d.getMinutes();
     let ss=d.getSeconds();
     if(day <= n){if(mon>1) { mon=mon-1; }else { year = year-1; mon = 12; }}
           d.setDate(d.getDate()-n);
           year = d.getFullYear();
           mon=d.getMonth()+1;
           day=d.getDate();
     let  s = year+"-"+(mon<10?('0'+mon):mon)+"-"+(day<10?('0'+day):day) +" "+ (hh<10?('0'+hh):hh) + ":" + (mm<10?('0'+mm):mm) + ":"+ (ss<10?('0'+ss):ss);
     return s;
}

export function upMonthDate() {   //上个月1号时间
     let d = new Date();
     let year = d.getFullYear();
     let mon=d.getMonth()+1;
     let day="01";
     if(mon>1) { 
          mon=mon-1; 
     }else {
          year = year-1; mon = 12;
     }
     let  s = year+"-"+(mon<10?('0'+mon):mon)+"-"+day +" "+ "00" + ":" + "00" + ":"+ "00";
     return s;
} 

export function defaultTime(){   //默认时间
     return "2000-01-01 01:01:01"
}

export function broadcastEndTime(startTime,sec){   //播表模板录入结束时间
     let n = new Date(startTime.getTime()+sec*1000);
     let year = new Date(n).getFullYear();
     let month =new Date(n).getMonth() + 1 < 10? "0" + (new Date(n).getMonth() + 1): new Date(n).getMonth() + 1;
     let date =new Date(n).getDate() < 10? "0" + new Date(n).getDate(): new Date(n).getDate();
     let hh =new Date(n).getHours() < 10? "0" + new Date(n).getHours(): new Date(n).getHours();
     let mm =new Date(n).getMinutes() < 10? "0" + new Date(n).getMinutes(): new Date(n).getMinutes();
     let ss =new Date(n).getSeconds() < 10? "0" + new Date(n).getSeconds(): new Date(n).getSeconds();
     let nowTime = year + "-" + month + "-" + date +" "+ hh + ":" + mm + ":"+ ss;
     return nowTime;
}

export function startRecTime(timeStamp){   //播表查询开始时间
     if(timeStamp == ""){
          return "";
          
     }else{
          let year = new Date(timeStamp).getFullYear();
          let month =new Date(timeStamp).getMonth() + 1 < 10? "0" + (new Date(timeStamp).getMonth() + 1): new Date(timeStamp).getMonth() + 1;
          let date =new Date(timeStamp).getDate() < 10? "0" + new Date(timeStamp).getDate(): new Date(timeStamp).getDate();
          let nowTime = year + "-" + month + "-" + date +" "+ "00:00:00";
          return nowTime;
     }
     
}

export function endRecTime(timeStamp){   //播表查询结束时间
     if(timeStamp == ""){
          return "";
          
     }else{
          let year = new Date(timeStamp).getFullYear();
          let month =new Date(timeStamp).getMonth() + 1 < 10? "0" + (new Date(timeStamp).getMonth() + 1): new Date(timeStamp).getMonth() + 1;
          let date =new Date(timeStamp).getDate() < 10? "0" + new Date(timeStamp).getDate(): new Date(timeStamp).getDate();
          let nowTime = year + "-" + month + "-" + date +" "+ "23:59:59";
          return nowTime;
     }
     
}
