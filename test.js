var api = require('./app.js');

var apiRequest = {
  requestContext: {
    resourcePath: '/',
    httpMethod: 'GET'
  }
};

var lambdaContextSpy = {
  done: function(err, result) {
    if (err) {
      console.log('  error: ', err);
    }
    console.log(JSON.parse(result.body, null, 2));
  }
};

api.proxyRouter(apiRequest, lambdaContextSpy);
