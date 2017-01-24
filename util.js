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

var removeQueryStr = function(url) {
  if (url.includes('?')) {    // remove query string
    return url.split('?')[0];
  }
  return url;
}

// This is an ugly function and will run poorly over large data sets (it's
// O(n^2) and shouldn't be run often.
var combineAndStripURLs = function(urlList, maxResults) {
  var combined = [];
  for (var item in urlList) {
    // remove query string
    urlList[item][1] = removeQueryStr(urlList[item][1]);

    // Check for duplicates
    for (var parsedItem in combined) {
      if (parsedItem[1] === item[1]) { // found Dupe
        parsedItem[1] += item[1];
        break;
      }
    }
    combined.push(urlList[item]);
  }
  return combined.slice(0, maxResults);
}

module.exports = {
  get2ndLvlPagePaths: get2ndLvlPagePaths,
  get3rdLvlPagePaths: get3rdLvlPagePaths,
  htmlEscape: htmlEscape,
  removeQueryStr: removeQueryStr,
  combineAndStripURLs: combineAndStripURLs
}
