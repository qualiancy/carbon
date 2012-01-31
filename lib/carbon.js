var http = require('http')
  , path = require('path')
  , fs = require('fs')
  , carbon = module.exports = {};

carbon.version = '0.0.2';

carbon.Stack = require('./carbon/stack');
carbon.Proxy = require('./carbon/proxy');

carbon.listen = function (port, opts, cb) {
  if ('function' === typeof opts) {
    cb = opts;
    opts = {};
  }

  var server = http.createServer()
    , stack = new carbon.Stack(server, opts);

  server.listen(port, cb);
  return stack;
};

carbon.attach = function (server, opts) {
  var stack = new carbon.Stack(server, opts || {});
  return stack;
};

carbon.middleware = {};

fs.readdirSync(__dirname + '/carbon/middleware').forEach(function (filename) {
  if (!/\.js$/.test(filename)) return;
  var name = path.basename(filename, '.js');

  function load () {
    return require('./carbon/middleware/' + name);
  }

  Object.defineProperty(carbon.middleware, name, { get: load });
  Object.defineProperty(carbon, name, { get: load });
});


