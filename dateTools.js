var getYear = function() {
  var date = new Date;
  return ("0" + (date.getMonth() + 1)).slice(-2);
}

var getMonth = function() {
  var date = new Date;
  return ("0" + (date.getMonth() + 1)).slice(-2);
}

module.exports = {
  getYear: getYear,
  getMonth: getMonth
}
