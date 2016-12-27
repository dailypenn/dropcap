var api = require('./app.js');


var apiRequest = {
  requestContext: {
    resourcePath: '/',
    httpMethod: 'GET'
  }
};

lambdaContextSpy = {
  done: function(err, result) {
    if (err) {
      console.log('  error: ', err);
    }
    console.log(result);
  }
};


api.proxyRouter(apiRequest, lambdaContextSpy);
