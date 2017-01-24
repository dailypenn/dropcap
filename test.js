var api = require('./app.js');

var apiRequest = {
  context: {
    path: '/properties',//{property}',
    method: 'GET'
  }//,
//  pathParams: {
//    property: 'DP'
//  }
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
