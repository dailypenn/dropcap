var getYear = function() {
  return new Date().getFullYear();
}

var getMonth = function() {
  var date = new Date();
  return date.getMonth() + 1;
}

var get2ndLvlPagePaths = function() {
  var thisYear = getYear();

  if (getMonth() === 1) {
    return `ga:pagePathLevel2==/${thisYear}/,ga:pagePathLevel2==/${thisYear - 1}/`
  }
  return `ga:pagePathLevel2==/${thisYear}/`
}

var get3rdLvlPagePaths = function() {
  var date = new Date();
  var lastMonth;
  var thisMonth;

  if (getMonth() === 1) { // If Jan, get Dec of last year too
    lastMonth = '12';
    thisMonth = '01';
  } else {
    lastMonth = ('0' + (date.getMonth())).slice(-2);
    thisMonth = ('0' + (date.getMonth() + 1)).slice(-2);
  }
  return `ga:pagePathLevel3==/${lastMonth}/,ga:pagePathLevel3==/${thisMonth}/`
}

var htmlEscape = function(str) {
  return str.replace(/[\x26\x0A<>'"—]/g, function(str) {
    return '&#' + str.charCodeAt(0) + ';'
  });
}

module.exports = {
  get2ndLvlPagePaths: get2ndLvlPagePaths,
  get3rdLvlPagePaths: get3rdLvlPagePaths,
  htmlEscape: htmlEscape
}
