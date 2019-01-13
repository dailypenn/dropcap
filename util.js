// Builds a ga:pagePath parameter with level and the return value of func
const pathFactory = (level, func) => `ga:pagePathLevel${level}==/${func()}/`;

// HTML encodes a given string
exports.encodeHTML = (s) => {
  // \x21-\x2b\x2f and \x3A-\x40 are ASCII punctuation
  // \xa0-\xff is Latin 1 supplement (accents, etc.)
  // \u2013-\u2044 is miscellaneous punctuation
  const regex = /[\x21-\x2b\x2f\xa0-\xff\x3A-\x40\u2013-\u2044]/g;
  return s.replace(regex, (i) => `&#${i.charCodeAt(0)};`);
};

// Returns appropriate year path based on current month
exports.getYearPagePath = (pathLevel) => {
  const getYear = () => new Date().getFullYear();
  const getLastYear = () => new Date().getFullYear() - 1;

  // If it's not January, return current year; otherwise, return last year too
  return new Date().getMonth() ? pathFactory(pathLevel, getYear) :
    `${pathFactory(pathLevel, getLastYear)},${pathFactory(pathLevel, getYear)}`;
};

// Returns appropriate month path based on current month
exports.getMonthPagePath = (level) => {
  const month = new Date().getMonth();

  // If it's January, the last month is December; otherwise, calculate months
  const lastMonth = () => month ? `0${month}`.slice(-2) : '12';
  const thisMonth = () => month ? `0${month + 1}`.slice(-2) : '01';

  // Return pagepath with correct level for the past two months
  return `${pathFactory(level, lastMonth)},${pathFactory(level, thisMonth)}`;
};

// Removes query strings from URLs and removes repeated results based on slugs
exports.combineAndStripURLs = (urlList, maxResults) => {
  // Clean up URLS: array of all URLs in urlList, with query strings removed
  const urls = urlList.map(item => item[1].split('?')[0]);
  // Check for duplicates: boolean array of if URL appears at previous index
  const isRepeat = urls.map((url, index) => urls.slice(0, index).includes(url));
  // Remove duplicates: filter out repeats, return requested number of results
  return urlList.filter((elt, index) => !isRepeat[index]).slice(0, maxResults);
};
