var util = require('util')
  , _ = require('./utils')
  , Drip = require('drip')
  , tea = require('tea')
  , Proxy = require('./proxy');


module.exports = Stack;

function Stack (server, opts) {
  var self = this;
  Drip.call(this);

  if (!opts) opts = {};

  var transports = (opts.nolog) ? [] : [ 'console' ];
  this.log = opts.logger || new tea.Logger({
      namespace: 'carbon'
    , levels: 'syslog'
    , transports: transports
  });

  this.proxy = new Proxy({ logger: this.log });

  this._stack = {
      http: {
          all: [ this.defaultHttp ]
        , err: [ this.defaultHttpError ] }
    , ws: {
          all: [ this.defaultWs ]
        , err: [ this.defaultWsError ] }
  };

  if (!server) throw new Error('Carbon Stack requires an http server');
  this.server = server;
  server.on('request', function (req, res) {
    self.handleRequest(req, res);
  });
};

util.inherits(Stack, Drip);

Stack.prototype.use = function (fn) {
  var middleware = this._stack;
  middleware = middleware.http.all;
  middleware.splice(middleware.length - 1, 0, fn)
  return this;
};

Stack.prototype.run = function (stack, args, cb) {
  var l = args.length;

  var iterate = function (i) {
    args[l] = function next () {
      if (arguments.length) return cb.apply(null, arguments);
      iterate(++i);
    }
    stack[i].apply(null, args);
  };

  iterate(0);
};

Stack.prototype.handleRequest = function (req, res) {
  var self = this;

  req.buf = _.buffer(req);
  this.run(this._stack.http.all, [ req, res ], function (port, host) {
    self.log.debug('redirecting to port [' + port + ']');
    var opts = { port: port, host: host || 'localhost', buffer: req.buf };
    self.proxy.proxyRequest(req, res, opts);
  });

};

Stack.prototype.defaultHttp = function (req, res) {
  res.writeHead(501);
  res.end();
};

