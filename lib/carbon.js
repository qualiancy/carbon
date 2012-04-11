/*!
 * Carbon - balancer middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var http = require('http')
  , path = require('path')
  , fs = require('fs');

/*!
 * Version
 */
exports.version  = '0.0.10';

/*!
 * Expose our constructors
 */

exports.Proxy = require('./carbon/proxy');
exports.ProxyRequest = require('./carbon/proxyRequest');

/**
 * # listen(port, [options, [callback]])
 *
 * Create a new http server for use with carbon Proxy.
 * Attach to Proxy and return proxy for middleware loading.
 *
 * @param {Number} port for http server to listen on
 * @param {Object} options to load into Proxy
 * @param {Function} callback to execute on http server `listen`
 */

exports.listen = function (port, opts, cb) {
  if ('function' === typeof opts) {
    cb = opts;
    opts = {};
  }

  opts = opts || {};
  var server = http.createServer()
    , stack = new exports.Proxy(server, opts);

  server.listen(port, cb);
  return stack;
};

/**
 * # attach(server, [options]);
 *
 * Attach an already existing http server
 * to a new proxy server. Useful if you want to
 * not start listening right away.
 *
 * @param {http.Server} node compatible http server (connect/express)
 * @param {Object} options to pass to proxy
 */

exports.attach = function (server, opts) {
  var stack = new exports.Proxy(server, opts || {});
  return stack;
};

/*!
 * Middleware placeholder
 */

exports.middleware = {};

/*!
 * Cycle througth middleware folder and provide getters
 * on the exports.middleware and main exports.
 */

fs.readdirSync(__dirname + '/carbon/middleware').forEach(function (filename) {
  if (!/\.js$/.test(filename)) return;
  var name = path.basename(filename, '.js');

  function load () {
    return require('./carbon/middleware/' + name);
  }

  Object.defineProperty(exports.middleware, name, { get: load });
  Object.defineProperty(exports, name, { get: load });
});
