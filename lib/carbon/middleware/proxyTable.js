/*!
 * Carbon - proxyTable middleware
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('debug')('carbon:proxyTable');

/*!
 * Main exports
 */

exports = module.exports = function (table) {
  var routes = Object.create(null);

  // loop through the table and add well formed object
  table.forEach(function (route) {
    if (route.hostname && (route.port || route.dest)) {
      routes[route.hostname] = route.port ? route.port : route.dest;
      debug('proxy table register', route.hostname, routes[route.hostname]);
    }
  });

  // our middleware callback to register
  return function (req, res, next) {
    var prox = routes[req.headers.host];
    if (prox && 'string' === typeof prox) {
      prox = prox.split(':');
      debug('proxy table route', prox[1] || 80, proxy[0]);
      return next(prox[1] || 80, prox[0]);
    } else if (prox) {
      debug('proxy table route', prox);
      return next(prox);
    }
    next();
  };
};
