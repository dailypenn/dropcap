var express = require('express')
var app = express()

var google     = require('googleapis')
var openGraph  = require('open-graph-scraper')
var util       = require('./util')
var constants  = require('./constants')

var key = {
  'type': 'service_account',
  'project_id': 'dailypenn-web-top10',
  'private_key_id': '6742611634d9b0871986a88b1e09101b8d014a5e',
  'private_key': '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCxrToODL1ySnSV\nE1aIncnTC+e1omuxClN4gctCJnGaSzn8Uz69jKtBZPxlcumIVvAFPp5PPzApFCWV\nYSAAoUCy7Kk4sO26ZTKc6n+GgSQ6dFeHycG/qqrkoHmBmU7k0xoN0HgxB9N53o3h\ndP+1OnOMmWKKy0atOr1tQOZ+jrPk/xKBcEK0iIDspvDtkhUgY5QZsLxdDX/WMkIZ\nWErPtrhK91cjfG/4UXzVQVIILrazpIuYQhrP+2Ki3FmS5XeqU1vakT9zLbmxbGaa\nV2GaRgtwtrYOTx6VJhHDz6PAeK8hxAWcZTed3MjdVFXejzaBolSuzLH3Gq72tj+f\n1UF901jrAgMBAAECggEAOTZNfl6t1hKRjbtHXwBoD7RCrWMaiEyJ6kDpIWjdpdBZ\nYJ2xkzmrn4gUGdqxxjwwV4/9TAlNybx6CarXsjw6aCL6ro2STzXs4UhFPhtxff0e\nflQCNmSPWMUvuwKRu+8Z8Z7SRP9/Ijv+tb2F5WZn9LsjVwvzuy4x9u8yCUiMNs0+\nXtBH6qlzcDnGQ55YqtN5nhm6BcDBFwOpSI+iEhXGluMNGUa+TUa3ugzSVrvomZ1A\naUrb/g0qWbXpAy7mJmt4jbGy3aYE/DZREX9KvHMCGi+9PX70mRZjSpB/3t8Idv2j\nedaXPixfj6SKZY94bgXYXaO9JxMV/IuvFoFm0yuyKQKBgQDWru8kv4HZp98RC1gk\nTZfh4yHZstlnqT0jrYC7vqIUwrRSYJNgSkT+zxOYP3tIIxxVuRZW7AEr5aDEkUId\nqD0utUCrVDMLaYZcBkNIuK9waFn4zQEAiUrJOzxV65JIPuH9k2rPcaiXBM6CLf1v\nn6L/ghIjHzvLspQCo08oA7LUPwKBgQDT3wo2Y72vMbI2/dEgKAnQQSsnuH8aJ+Cs\nrbO9lI7ZpxQuWsF4ijB8H1TkVSyzgr2u9/zW0OGelPRpuNEhPlJPV0qUQA/RQGwY\n62SVWSFK2DRG/MND26kOdo0i3xEin/3RWt+iBBqBKG2jI+yspk9FaSPFwBQz4YZo\nfF3CkFUgVQKBgF0dCLpOmbpWtkiFPBia0vp1cjQi/2qXm94CnehQWapZfK6SFrnX\n3K8MD7qkJgt2tw5zNb5DpIpukVlQi3Wjh83fbYoh/fXAMjdtu/cpq2Y8zHE+MWYT\nJi27lILLpunQ5GIAc35AFNhTjGIoIlksyxy5RLaZEG1cKhguzuFTIVgvAoGBAMP8\nKsc7Jki8ML2btmoHf2RsFA5vJOu9/Z/eIkj49dcyLYHfo93r/oOiu/VnMK1xACOs\n8+6GVF5MLXbqZlFZA+yus6dFRxxqelPm0ykvxJMmQd10jO/lbpGZal7ad1BPLQwP\nApUtNJNLIXfqkFD4mpV7d4LCdi2zrZBTkquatZPtAoGBAIFjY6mTPdNR3wtVZlxJ\nMN8Y41aKchJOurl4zqm+zB/A/bI2BMPMaghdmFDM9F6rFqePUdeB7UWaHL257iL9\ncVp363PubCOgnAdUw0VU363Gq2ljc7i/CEj9kdKoVNpmhvrDLb55nBQyxyIiO7kl\nD3CPlpp67tXVcuJwYvffEQvb\n-----END PRIVATE KEY-----\n',
  'client_email': 'dp-top10@dailypenn-web-top10.iam.gserviceaccount.com',
  'client_id': '108413780379481780591',
  'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
  'token_uri': 'https://accounts.google.com/o/oauth2/token',
  'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
  'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/dp-top10%40dailypenn-web-top10.iam.gserviceaccount.com'
}

var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/analytics.readonly'], null)

function queryTopArticles(analytics, viewName, maxResults) {
  return new Promise(function (resolve, reject) {
    analytics.data.ga.get({
      'auth': jwtClient,
      'ids': constants.VIEW_ID[viewName],
      'metrics': 'ga:pageViews',
      'dimensions': 'ga:pageTitle,ga:pagePath',
      'start-date': '7daysAgo',
      'end-date': 'today',
      'sort': '-ga:pageViews',
      'max-results': maxResults * 2, // get 2x max results to remove dupes
      'filters': 'ga:pagePathLevel1==/article/;' + util.get2ndLvlPagePaths() + ';' + util.get3rdLvlPagePaths()
    }, function (err, response) {
      if (err) {
        // analytics fetching error
        reject(err)
      }

      var topURLs = util.combineAndStripURLs(response.rows, maxResults)
      return resolve(urlDataAsJSON(topURLs, viewName))
    })
  })
}

var urlDataAsJSON = function(urlList, viewName) {
  const baseURL = constants.BASE_URL[viewName]
  return new Promise(function(resolve, reject) {
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
        reject(err)
      })
    }
  })
}

var mergeOGData = function(canonicalURL, urlData) {
  return new Promise(function (resolve, reject) {
    openGraph({url: canonicalURL, timeout: 9000}, function (err, results) {
      if (err) {
        // error getting opengraph results
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
  return new Promise(function (resolve, reject) {
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        reject(err)
      }
      var analytics = google.analytics('v3')
      resolve(queryTopArticles(analytics, property, 10))
    })
  })
}

app.get('/:property', function (request, res) {
  // 10 browser cache, 30 minute public cache
  res.set('Cache-Control', 'public, max-age=600, s-maxage=1800');
  getTopTen(request.params.property).then((data) => res.send(data))
})

var server = app.listen(3000, function() {
  console.log('Express server listening on port ' + server.address().port)
});

exports.dropcap = app
