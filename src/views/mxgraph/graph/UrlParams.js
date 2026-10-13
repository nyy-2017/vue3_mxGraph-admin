var UrlParams = (function (url) {
  // console.log("url:", url);
  var result = new Object();
  var idx = url.lastIndexOf('?');

  if (idx > 0) {
    var params = url.substring(idx + 1).split('&');
    for (var i = 0; i < params.length; i++) {
      idx = params[i].indexOf('=');
      if (idx > 0) {
        result[params[i].substring(0, idx)] = params[i].substring(idx + 1);
      }
    }
  }
  // console.log("result:", result);
  return result;
})(window.location.href);

export default UrlParams;