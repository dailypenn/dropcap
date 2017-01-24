// Requires
var google     = require('googleapis');
var util       = require('./util');
var constants  = require('./constants');
var Promise    = require('promise');
var Memcached  = require('memcached');
var ApiBuilder = require('claudia-api-builder');
var openGraph  = require('open-graph-scraper');

// Authentication Credentials
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
};

// Globals
var api        = new ApiBuilder();
var memcached  = new Memcached('pub-memcache-10791.us-east-1-2.5.ec2.garantiadata.com:10791');
var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/analytics.readonly'], null);

function queryTopArticles(analytics, viewID, maxResults) {
  return new Promise(function (resolve, reject) {
    // check cache first
    memcached.get(viewID + '_topArticles', function(err, data) {
      if (err) {
        console.error(err);
        reject(err);
      }
      if (data) {
        // return from memcached
        return resolve(data); // Comment out when developing to avoid using cached data
      }
      // Otherwise get data
      analytics.data.ga.get({
        'auth': jwtClient,
        'ids': viewID,
        'metrics': 'ga:pageViews',
        'dimensions': 'ga:pageTitle,ga:pagePath',
        'start-date': '7daysAgo',
        'end-date': 'today',
        'sort': '-ga:pageViews',
        'max-results': maxResults * 2, // get 2x max results to remove dupes
        'filters': 'ga:pagePathLevel1==/article/;' + util.get2ndLvlPagePaths() + ';' + util.get3rdLvlPagePaths()
      }, function (err, response) {
        if (err) {
          console.error('error getting analytics: ' + err);
          reject(err);
        }

        var topURLs = util.combineAndStripURLs(response.rows, maxResults);
        return resolve(urlDataAsJSON(topURLs, viewID));
      });
    });
  });
}

var urlDataAsJSON = function(urlList, viewID) {
  return new Promise(function(resolve, reject) {
    var result = [];

    for (var item in urlList) {
      var urlItem = urlList[item];
      var url = urlItem[1]; // get URL from list item

      // remove leading title
      urlItem[0] = urlItem[0].replace('The Daily Pennsylvanian | ', '');

      mergeOGData(`http://www.thedp.com${url}`, urlItem).then(function(data) {
        result.push(data);

        // Check for done conditions
        if (result.length === urlList.length) {
          result.sort(function(o1, o2) {
            return o2.views - o1.views;
          })
          result = {'result': result};

          // Set cache and resolve promise
          memcached.set(viewID + '_topArticles', result, 3600, function(err) {
            if (err) { console.error(err) };
          });

          return resolve(result);
        }
      }, function(err) {
        console.error('error getting OG tags');
        reject(err);
      });
    }
  });
}

var mergeOGData = function(canonicalURL, urlData) {
  return new Promise(function (resolve, reject) {
    openGraph({url: canonicalURL, timeout: 9000}, function (err, results) {
      if (err) {
        console.error('error getting opengraph:', results);
        reject(results);
      }
      var res = {
        'gaTitle': util.htmlEscape(urlData[0]),
        'ogTitle': util.htmlEscape(results.data.ogTitle),
        'path': urlData[1],
        'views': urlData[2],
        'image': results.data.ogImage.url.replace('p.', 't.')
      }
      resolve(res);
    });
  });
}

// API Endpoints
api.get('/properties', function (request) {
  var endpoints = Object.keys(constants.VIEW_ID).map(function(e) {
    return '/' + e
  });
  return {'valid property endpoints': endpoints};
});

api.get('/{property}', function (request) {
  return new Promise(function (resolve, reject) {
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        console.error('error generating jwt token', err);
        reject(err);
      }
      var analytics = google.analytics('v3');
      var viewID = constants.VIEW_ID[request.pathParams.property];
      return resolve(queryTopArticles(analytics, viewID, 10));
    });
  });
}, {
  success: {contentType: 'application/json; charset=utf-8'}
});

module.exports = api;
