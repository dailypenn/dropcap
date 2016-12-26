var getYear = function() {
  return new Date().getFullYear();
}

var getMonth = function() {
  var date = new Date();
  return ('0' + (date.getMonth() + 1)).slice(-2);
}

module.exports = {
  getYear: getYear,
  getMonth: getMonth
}
