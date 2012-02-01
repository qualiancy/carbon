var http = require('http')
  , path = require('path')
  , fs = require('fs');

exports = module.exports = {};

exports.version  = '0.0.3';

exports.Proxy = require('./carbon/proxy');
exports.ProxyRequest = require('./carbon/proxyRequest');

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

exports.attach = function (server, opts) {
  var stack = new exports.Proxy(server, opts || {});
  return stack;
};

exports.middleware = {};

fs.readdirSync(__dirname + '/carbon/middleware').forEach(function (filename) {
  if (!/\.js$/.test(filename)) return;
  var name = path.basename(filename, '.js');

  function load () {
    return require('./carbon/middleware/' + name);
  }

  Object.defineProperty(exports.middleware, name, { get: load });
  Object.defineProperty(exports, name, { get: load });
});


