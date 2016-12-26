var api = require('./app.js');


var apiRequest = {
  requestContext: {
    resourcePath: '/',
    httpMethod: 'GET'
  }
};

lambdaContextSpy = {
    done: function(err, result) {
        console.log('Context done');
        console.log('  error: ', err);
        console.log(' result: ', JSON.stringify(result, null, 4));
    }
};


api.proxyRouter(apiRequest, lambdaContextSpy);
