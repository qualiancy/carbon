/*!
 * Carbon - proxyTable middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:proxyTable');

/*!
 * Main exports
 */

module.exports = function middlewareProxyTable (spec) {
  var routes = Object.create(null);

  // loop through the table and add well formed object
  spec.forEach(function (route) {
    if (route.hostname && (route.port || route.dest)) {
      var host = prepareHost(route.hostname)
        , list = route.port ? route.port : route.dest
        , table = roundRobin(list);
      routes[host] = table;
      debug('proxy table register for host %s', host);
    }
  });

  // our middleware callback to register
  return function handleProxyTable (req, res, next) {
    var host = prepareHost(req.headers.host)
      , prox = routes[host]
      , item = (prox) ? prox() : null;

    if (!host) {
      return next();
    } else if (item && item.host) {
      debug('proxy table route %s -> %s:%d', host, item.host, item.port);
      return next(item.port, item.host);
    } else if (item) {
      debug('proxy table route %s -> localhost:%d', host, item.port);
      return next(item.port);
    }

    next();
  };
};

/*!
 * # prepareHost (string)
 *
 * Normalize a host string.
 *
 * @param {String} host string
 * @returns {String} normalized
 * @api private
 */

function prepareHost (str) {
  if (!str || str.length === 0) return null;
  var split = str.split(':');
  return split[0] + ':' + (split[1] || 80);
}

/*!
 * # roundRobin (list)
 *
 * Create a self stored object of host port
 * mappings and return a function to get the
 * next from the list.
 *
 * @param {Array} list (non arrays will be converted)
 * @returns {Function} get next in list
 * @api private
 */

function roundRobin (list) {
  var last = 0
    , table = [];

  if (!Array.isArray(list)) list = [ list ];

  // format our table
  list.forEach(function (item) {
    if ('number' == typeof item) {
      table.push({ port: item });
    } else if ('string' == typeof item) {
      var split = item.split(':');
      table.push({
          port: split[1] || 80
        , address: split[0]
      });
    }
  });

  // return function to get next
  return function () {
    var i = (last == (table.length - 1)) ? 0 : last + 1;
    last = i;
    return table[i];
  }
}
