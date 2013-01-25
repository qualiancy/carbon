/*!
 * Carbon - module exports
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

exports.version  = '0.5.0';

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
 * Alternatively, pass an already constructed node.js server
 * to attach proxy to.
 *
 * @param {Object|Number} http server or port for new http server to listen on
 * @param {Object} options to load into Proxy (optional)
 * @param {Function} callback to execute on http server `listen` (optional)
 */

exports.listen = function (port, opts, cb) {
  // attach to existing server
  if ('object' === typeof port) {
    var stack = new exports.Proxy(port, opts || {});
    return stack;
  }

  // if no options and using port
  if ('function' === typeof opts) {
    cb = opts;
    opts = {};
  }

  // configure new server & proxy
  opts = opts || {};
  var server = http.createServer()
    , stack = new exports.Proxy(server, opts);

  // start listening
  server.listen(port, cb);
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
