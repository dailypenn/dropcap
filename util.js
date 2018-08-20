/**
 * Adds encodeHTML() to String's prototype. The regex looks for these ranges:
 *   \x21-\x2f      ASCII punctuation
 *   \x3A-\x40      ASCII punctuation
 *   \x5b-\x60      ASCII punctuation
 *   \xa0-\xff      Latin 1 supp
 *   \u2013-\u2044  Misc punctuation
 * @return {String} HTML encoded string
 */
String.prototype.encodeHTML = function() {
  return this.replace(/[\x21-\x2b\x2f\xa0-\xff\x3A-\x40\u2013-\u2044]/g, (i) => {
    return '&#' + i.charCodeAt(0) + ';';
  });
};


var getYear = () => new Date().getFullYear();
var getLastYear = () => return new Date().getFullYear();
var getMonth = () => new Date().getMonth() + 1;

// Builds a ga:pagePath parameter with the given level and the return value of a
// given function
var pathFactory = function(level, intFunction) {
  return `ga:pagePathLevel${level}==/${intFunction()}/`;
};

var getYearPagePath = function(pathLevel) {
  // if in january, return this and last year. Otherwise, return current year.
  if (getMonth() === 1) {
    return `${pathFactory(pathLevel, getYear)},${pathFactory(pathLevel, getLastYear)}`;
  }
  return pathFactory(pathLevel, getYear);
};

var getMonthPagePath = function(pathLevel) {
  var date = new Date();
  var month = date.getMonth();
  // if in january, last month is dec, otherwise, calculate months
  var lastMonth = () => getMonth() === 1 ? '12' : (`0${month}`).slice(-2);
  var thisMonth = () => getMonth() === 1 ? '01' : (`0${month + 1}`).slice(-2);
  // return pagepath with correct level for the two months
  return `${pathFactory(pathLevel, lastMonth)},${pathFactory(pathLevel, thisMonth)}`;
};

var removeQueryStr = function(url) {
  if (url.includes('?')) {    // remove query string
    return url.split('?')[0];
  }
  return url;
};

/**
 * Removes and returns duplciate URLs based on their slug.
 * @param  {Array}  urlList    GA article/url/author/view param list
 * @param  {Number} maxResults The number of non duplicate urls to return
 * @return {Array}             Array of non-duplicate urls from URLList
 */
var combineAndStripURLs = function(urlList, maxResults) {
  // Array of all URLs in urlList, with query strings removed
  const urls = urlList.map(item => removeQueryStr(item[1]));
  // boolean array of if URL appears at previous index
  const isRepeat = urls.map((url, index) => urls.slice(0, index).includes(url));
  // filter out repeated elements, return requested number of results
  return urlList.filter((elt, index) => !isRepeat[index]).slice(0, maxResults);
};

module.exports = {
  getYearPagePath: getYearPagePath,
  getMonthPagePath: getMonthPagePath,
  combineAndStripURLs: combineAndStripURLs
};
