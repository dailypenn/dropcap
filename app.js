const express   = require('express')
const cors     = require('cors')
const app       = express()

const google    = require('googleapis')
const openGraph = require('open-graph-scraper')
const util      = require('./util')
const constants = require('./constants')
const key       = require('./dropcap-service-credentials.json');

function queryTopArticles(analytics, viewName, maxResults) {
  return new Promise((resolve, reject) => {
    var jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/analytics.readonly'],
      null
    );

    jwtClient.authorize((err, tokens) => {
      if (err) {
        console.error(err);
        return;
      }

      analytics.data.ga.get({
        'auth': jwtClient,
        'ids': constants.VIEW_ID[viewName],
        'metrics': 'ga:pageViews',
        'dimensions': 'ga:pageTitle,ga:pagePath',
        'start-date': '7daysAgo',
        'end-date': 'today',
        'sort': '-ga:pageViews',
        'max-results': maxResults * 2, // get 2x max results to remove dupes
        'filters': `ga:pagePathLevel1==/article/;${util.get2ndLvlPagePaths()};${util.get3rdLvlPagePaths()}`
      }, function (err, response) {
        if (err) {
          console.error('Analytics fetching error')
          console.error(err)
          reject(err)
        }
        var topURLs = util.combineAndStripURLs(response.rows, maxResults)
        return resolve(urlDataAsJSON(topURLs, viewName))
      })
    });


  })
}

var urlDataAsJSON = function(urlList, viewName) {
  const baseURL = constants.BASE_URL[viewName]
  return new Promise((resolve, reject) => {
    var result = []

    for (var item in urlList) {
      var urlItem = urlList[item]
      var urlPath = urlItem[1] // get URL from list item

      // remove leading title TODO Make this a constant or something.
      urlItem[0] = urlItem[0].replace('The Daily Pennsylvanian | ', '')
      urlItem[0] = urlItem[0].replace(' | The Daily Pennsylvanian', '')
      urlItem[0] = urlItem[0].replace(' | 34st Street Magazine', '')

      mergeOGData(baseURL + urlPath, urlItem).then(function(data) {
        result.push(data)

        // Check for done conditions
        if (result.length === urlList.length) {
          result.sort(function(o1, o2) {
            return o2.views - o1.views
          })
          result = {'result': result}
          return resolve(result)
        }
      }, function(err) {
        console.error('Open graph merging error')
        console.error(err)
        reject(err)
      })
    }
  })
}

var mergeOGData = function(canonicalURL, urlData) {
  return new Promise((resolve, reject) =>  {
    openGraph({url: canonicalURL, timeout: 9000}, (err, results) => {
      if (err) {
        console.error('Open graph fetching error')
        console.error(err)
        reject(results)
      }
      var res = {
        'gaTitle': util.htmlEscape(urlData[0]),
        'ogTitle': util.htmlEscape(results.data.ogTitle),
        'path': urlData[1],
        'views': urlData[2],
        'image': results.data.ogImage.url.replace('p.', 't.')
      }
      resolve(res)
    })
  })
}

function getTopTen(property) {
  return new Promise((resolve, reject) => {
    var analytics = google.analytics('v3')
    resolve(queryTopArticles(analytics, property, 10))
  })
}

app.get('/favicon.ico', (req, res) => {
  // do nothing
  res.status(204);
});

app.get('/:property', (req, res) => {
  const propertyName = req.params.property.toUpperCase()
  if (constants.VIEW_ID[propertyName] == null) {
    res.send(`{"error": "unknown google analytics property ${propertyName}"}`)
    return
  }
  // 10 browser cache, 30 minute public cache
  res.set('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.set('Access-Control-Allow-Origin', "*")
  res.set('Access-Control-Allow-Methods', 'GET')
  getTopTen(propertyName).then((data) => res.send(data))
})

exports.dropcap = app
