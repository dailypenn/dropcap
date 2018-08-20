const express   = require('express');
const cors      = require('cors');
const google    = require('googleapis');
const openGraph = require('open-graph-scraper');

const conf = require('./config.json');
const {encodeHTML,
       getYearPagePath,
       getMonthPagePath,
       combineAndStripURLs} = require('./util');

const app = express();
app.use(cors());

const VIEWS = conf.views;

function queryTopArticles(analytics, viewName, maxResults) {
  const key = require('./dropcap-service-credentials.json');
  return new Promise((resolve, reject) => {
    var jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/analytics.readonly'],
      null
    );

    jwtClient.authorize(err => {
      if (err) {
        console.error(err);
        reject(err);
      }

      analytics.data.ga.get({
        'auth': jwtClient,
        'ids': VIEWS[viewName].id,
        'metrics': 'ga:pageViews',
        'dimensions': 'ga:pageTitle,ga:pagePath,ga:dimension1', //dim1 is author
        'start-date': '7daysAgo',
        'end-date': 'today',
        'sort': '-ga:pageViews',
        'max-results': maxResults * 2, // get 2x max results to remove dupes
        'filters': VIEWS[viewName].blog ? // Blogs have slightly different page path layouts
          `ga:pagePathLevel1==/blog/;ga:pagePathLevel2==/under-the-button/;${getYearPagePath(3)},${getMonthPagePath(4)}` :
          `ga:pagePathLevel1==/article/;${getYearPagePath(2)};${getMonthPagePath(3)}`
      }, function (err, response) {
        if (err) {
          console.error('Analytics fetching error');
          console.error(err);
          reject(err);
        }
        var topURLs = combineAndStripURLs(response.rows, maxResults);
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

function getTopTen(property) {
  return new Promise((resolve) => {
    var analytics = google.analytics('v3');
    resolve(queryTopArticles(analytics, property, 10));
  });
}

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
  getTopTen(propertyName).then((data) => res.send(data));
});

exports.dropcap = app;
