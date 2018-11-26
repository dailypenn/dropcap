const express   = require('express');
const cors      = require('cors');
const google    = require('googleapis');
const openGraph = require('open-graph-scraper');

const config = require('./config.json');
const {client_email,
       private_key} = require('./dropcap-service-credentials.json');
const {encodeHTML,
       getYearPagePath,
       getMonthPagePath,
       combineAndStripURLs} = require('./util');

const TIMEOUT = 10000;
const VIEWS = config.views;
const app = express();
app.use(cors());

const queryTopArticles = (viewName, maxResults) => {
  return new Promise((resolve, reject) => {
    const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];
    const jwt = new google.auth.JWT(client_email, null, private_key, scopes, null);

    jwt.authorize((err) => {
      if (err) reject(err);

      const {data: {ga}} = google.analytics('v3');
      ga.get({
        'auth': jwt,
        'ids': VIEWS[viewName].id,
        'metrics': 'ga:pageViews',
        // Custom dimension1 is used for authors
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
      }, (err, response) => {
        if (err) return reject(err);
        if (!response.rows) return reject(`Empty GA API response for ${VIEWS[viewName].name}`);

        const topURLs = combineAndStripURLs(response.rows, maxResults);
        return resolve(urlDataAsJSON(topURLs, viewName));
      });
    });
  });
};

const urlDataAsJSON = (urlList, viewName) => {
  return new Promise((resolve, reject) => {
    const result = [];

    for (const item of urlList) {
      const canonicalURL = VIEWS[viewName].baseURL + item[1];
      mergeOGData(canonicalURL, item).then((data) => {
        result.push(data);

        // Check for done conditions
        if (result.length === urlList.length) {
          result.sort((o1, o2) => o2.views - o1.views);
          return resolve({'result': result});
        }
      }, (err) => reject(err));
    }
  });
};

const mergeOGData = (canonicalURL, urlData) => {
  return new Promise((resolve, reject) =>  {
    openGraph({url: canonicalURL, timeout: TIMEOUT}, (err, results) => {
      if (err) return reject(results);

      // Combine the Analytics data with the article's OG data
      resolve({
        'gaTitle': encodeHTML(urlData[0]),
        'ogTitle': encodeHTML(results.data.ogTitle),
        'path': urlData[1],
        'authors': urlData[2].split(', '),
        'views': urlData[3],
        // On older images, convert from the preview size to thumbnail
        'image': results.data.ogImage.url.replace('p.', 't.')
      });
    });
  });
};

// There isn't a favicon; just to keep it from throwing errors
app.get('/favicon.ico', (req, res) => res.status(204));

app.get('/:view', (req, res) => {
  const view = req.params.view.toUpperCase();

  // If this view isn't in the config, don't try to query for it
  if (!VIEWS[view]) return res.status(404).send({error: `Unknown view ${view}`});

  // 10-minute browser cache, 30-minute public cache
  res.set('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  // identifier for SNWorks
  res.set('User-Agent','DP-Dropcap');

  queryTopArticles(view, 10)
    .then((data) => res.send(data))
    .catch((err) => {
      res.status(500).send({ error: err });
      throw err;
    });
});

exports.dropcap = app;
