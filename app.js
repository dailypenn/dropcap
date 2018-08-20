const express   = require('express');
const cors      = require('cors');
const google    = require('googleapis');
const openGraph = require('open-graph-scraper');

const conf = require('./config.json');
const {client_email,
       private_key} = require('./dropcap-service-credentials.json');
const {encodeHTML,
       getYearPagePath,
       getMonthPagePath,
       combineAndStripURLs} = require('./util');

const VIEWS = conf.views;
const app = express();
app.use(cors());

const queryTopArticles = (viewName, maxResults) => {
  return new Promise((resolve, reject) => {
    const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];
    const jwt = new google.auth.JWT(client_email, null, private_key, scopes, null);

    jwt.authorize(err => {
      if (err) reject(err);

      const {data: {ga}} = google.analytics('v3');
      ga.get({
        'auth': jwt,
        'ids': VIEWS[viewName].id,
        'metrics': 'ga:pageViews',
        // dimension1 is the author
        'dimensions': 'ga:pageTitle,ga:pagePath,ga:dimension1',
        'start-date': '7daysAgo',
        'end-date': 'today',
        'sort': '-ga:pageViews',
        // Query twice the maximum number of results to remove duplicates
        'max-results': maxResults * 2,
        // Blogs have slightly different page path layouts
        'filters': VIEWS[viewName].blogSlug ?
          `ga:pagePathLevel1==/blog/;ga:pagePathLevel2==/${VIEWS[viewName].blogSlug}/;${getYearPagePath(3)};${getMonthPagePath(4)}` :
          `ga:pagePathLevel1==/article/;${getYearPagePath(2)};${getMonthPagePath(3)}`
      }, function (err, response) {
        if (err) return reject(err);
        if (!response.rows) return reject(`Empty GA API response for ${viewName}`);

        const topURLs = combineAndStripURLs(response.rows, maxResults);
        return resolve(urlDataAsJSON(topURLs, viewName));
      });
    });
  });
}

var urlDataAsJSON = function(urlList, viewName) {
  const baseURL = VIEWS[viewName].baseURL;
  return new Promise((resolve, reject) => {
    var result = [];

    for (var item in urlList) {
      var urlItem = urlList[item];
      var urlPath = urlItem[1]; // get URL from list item

      // remove leading title TODO Make this a constant or something.
      urlItem[0] = urlItem[0].replace('The Daily Pennsylvanian | ', '');
      urlItem[0] = urlItem[0].replace(' | The Daily Pennsylvanian', '');
      urlItem[0] = urlItem[0].replace(' | 34st Street Magazine', '');

      mergeOGData(baseURL + urlPath, urlItem).then(function(data) {
        result.push(data);

        // Check for done conditions
        if (result.length === urlList.length) {
          result.sort(function(o1, o2) {
            return o2.views - o1.views;
          });
          result = {'result': result};
          return resolve(result);
        }
      }, function(err) {
        console.error('Open graph merging error');
        console.error(err);
        reject(err);
      });
    }
  });
};

var mergeOGData = function(canonicalURL, urlData) {
  return new Promise((resolve, reject) =>  {
    openGraph({url: canonicalURL, timeout: 9000}, (err, results) => {
      if (err) {
        console.error('Open graph fetching error');
        console.error(err);
        reject(results);
      }
      var res = {
        'gaTitle': encodeHTML(urlData[0]),
        'ogTitle': encodeHTML(results.data.ogTitle),
        'path': urlData[1],
        'authors': urlData[2].split(', '),
        'views': urlData[3],
        'image': results.data.ogImage.url.replace('p.', 't.') // preview->thumb
      };
      resolve(res);
    });
  });
};

// No favicon - just to keep it from throwing errors
app.get('/favicon.ico', (req, res) => { res.status(204); });

app.get('/:property', (req, res) => {
  const propertyName = req.params.property.toUpperCase();
  if (VIEWS[propertyName].id == null) {
    res.send(`{"error": "unknown google analytics property ${propertyName}"}`);
    return;
  }
  // 10 min browser cache, 30 minute public cache
  res.set('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Cache-Control', 'public, max-age=600, s-maxage=1800');
  queryTopArticles(propertyName, 10)
    .then((data) => res.send(data))
    .catch((err) => {
      res.status(500).send({ error: err });
      throw err;
    });
});

exports.dropcap = app;
