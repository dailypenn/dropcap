// Builds a ga:pagePath parameter with a regex on the year and month
const pathFactory = (year, month, blog) => `ga:pagePath=~^/${blog ? `blog/${blog}` : 'article'}/${year}/${month}/`;

// HTML encodes a given string
exports.encodeHTML = (s) => {
  // \x21-\x2b\x2f and \x3A-\x40 are ASCII punctuation
  // \xa0-\xff is Latin 1 supplement (accents, etc.)
  // \u2013-\u2044 is miscellaneous punctuation
  const regex = /[\x21-\x2b\x2f\xa0-\xff\x3A-\x40\u2013-\u2044]/g;
  return s.replace(regex, (i) => `&#${i.charCodeAt(0)};`);
};

// Returns appropriate path based on current month
exports.getPagePath = (blog) => {
  // If it's January, the last month is December; otherwise, calculate months
  const month = new Date().getMonth();
  const lastMonth = month ? `0${month}`.slice(-2) : '12';
  const thisMonth = `0${month + 1}`.slice(-2);

  // Return pagepath for the past two months, adjusting the year for January
  const year = new Date().getFullYear();
  return `${pathFactory(month ? year : year - 1, lastMonth, blog)},${pathFactory(year, thisMonth, blog)}`;
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
