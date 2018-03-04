// Add encodeHTML() to String's prototype
String.prototype.encodeHTML = function() {
  // \x21-\x2f      ASCII punctuation
  // \x3A-\x40      ASCII punctuation
  // \x5b-\x60      ASCII punctuation
  // \xa0-\xff      Latin 1 supp
  // \u2013-\u2044  Misc punctuation
  return this.replace(/[\x21-\x2b\x2f\xa0-\xff\x3A-\x40\u2013-\u2044]/g, (i) => {
    return '&#' + i.charCodeAt(0) + ';'
  })
}


var getYear = () => { return new Date().getFullYear() }
var getLastYear = () => { return new Date().getFullYear() }
var getMonth = () => { return new Date().getMonth() + 1 }

// Builds a ga:pagePath parameter with the given level and the return value of a
// given function
var pathFactory = function(level, intFunction) {
  return `ga:pagePathLevel${level}==/${intFunction()}/`
}

var getYearPagePath = function(pathLevel) {
  // if in january, return this and last year. Otherwise, return current year.
  if (getMonth() === 1) {
    return `${pathFactory(pathLevel, getYear)},${pathFactory(pathLevel, getLastYear)}`
  }
  return pathFactory(pathLevel, getYear)
}

var getMonthPagePath = function(pathLevel) {
  var date = new Date()
  var month = date.getMonth()
  // if in january, last month is dec, otherwise, calculate months
  var lastMonth = () => getMonth() === 1 ? '12' : (`0${month}`).slice(-2)
  var thisMonth = () => getMonth() === 1 ? '01' : (`0${month + 1}`).slice(-2)
  // return pagepath with correct level for the two months
  return `${pathFactory(pathLevel, lastMonth)},${pathFactory(pathLevel, thisMonth)}`
}

var removeQueryStr = function(url) {
  if (url.includes('?')) {    // remove query string
    return url.split('?')[0]
  }
  return url
}

// TODO: this should be a map/reduce.
// This is an ugly function and will run poorly over large data sets (it's
// O(n^2) and shouldn't be run often.
var combineAndStripURLs = function(urlList, maxResults) {
  var nonDupe = true
  var combined = []
  for (var item in urlList) {
    // remove query string
    urlList[item][1] = removeQueryStr(urlList[item][1])

    // Check for duplicates by looping over comibned
    for (var parsedItem in combined) {
      if (
        urlList[item][1] === combined[parsedItem][1]) { // same URL
        nonDupe = false
        break
      }
    }
    if (nonDupe) {
      combined.push(urlList[item])
    }
    nonDupe = true
  }
  return combined.slice(0, maxResults)
}

module.exports = {
  getYearPagePath: getYearPagePath,
  getMonthPagePath: getMonthPagePath,
  combineAndStripURLs: combineAndStripURLs
}
