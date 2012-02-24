/*!
 * Carbon - balancer middleware
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var util = require('util')
  , _ = require('./utils')
  , Drip = require('drip')
  , debug = require('debug')('carbon:proxy')
  , middleware = require('./middleware')
  , ProxyRequest = require('./proxyRequest');

/*!
 * Main exports
 */

module.exports = Proxy;

/**
 * # Proxy (constructor)
 *
 * Options:
 *
 * @param {Object} http server listen to requests on
 * @param {Object} options
 */

function Proxy (server, opts) {
  var self = this;
  Drip.call(this);

  if (!opts) opts = {};

  this._stack = {
      http: {
          all: [ this.defaultHttp ]
        , err: [ this.defaultHttpError ] }
    , ws: {
          all: [ this.defaultWs ]
        , err: [ this.defaultWsError ] }
  };

  if (!server) throw new Error('Carbon Proxy requires an http server');
  this.server = server;
  server.on('request', this.handleRequest.bind(this));
};

/**
 * Inherit from drip event emitter
 */

util.inherits(Proxy, Drip);

/**
 * # use
 *
 * Add a callback function to the stack
 *
 * @param {Function} callback
 */

Proxy.prototype.use = function (fn) {
  var stack = this._stack;
  stack = stack.http.all;
  stack.splice(stack.length - 1, 0, fn)
  return this;
};

/**
 * # run
 *
 * iterates through the callback stack for a given
 * strategy. ends stack run upon match and calls
 * callback.
 *
 * @param {Array} stack to run
 * @param {Array} arguments to pass to stack callback
 * @param {Function} callback to execute upon match
 */

Proxy.prototype.run = function (stack, args, cb) {
  var self = this
    , len = args.length;

  var iterate = function (i) {
    args[len] = function next () {
      if (arguments.length) return cb.apply(self, arguments);
      iterate(++i);
    }
    stack[i].apply(self, args);
  };

  iterate(0);
};

/**
 * # handleRequest
 *
 * proxies req/res to the run command and build
 * proxy request upon match
 *
 * @param {http.Request} node request object
 * @param {http.Response} node response object
 */

Proxy.prototype.handleRequest = function (req, res) {
  debug('handle request', req.headers.host, req.url);
  var self = this
    , stack = Array.prototype.slice.call(this._stack.http.all, 0);

  req.buf = _.buffer(req);

  // run our init middleware function first
  stack.splice(0, 0, middleware.init(this));

  // iterate through the stack
  this.run(stack, [ req, res ], function (port, host) {
    var opts = { port: port, host: host || 'localhost', buffer: req.buf }
      , request = new ProxyRequest(req, res);

    // send proxy start event to `res` object for middleware
    request.on('start', function () {
      debug('proxy start', opts.host, opts.port, req.url);
      res.emit('proxy start');
    });

    // send proxy end event to `res` object for middleware
    request.on('end', function () {
      debug('proxy end', opts.host, opts.port, req.url);
      res.emit('proxy end');
    });

    // start the proxy
    request.proxyHTTP(opts);
  });
};

/**
 * This is the default/last caller in http stack
 */

Proxy.prototype.defaultHttp = function (req, res) {
  req.emit('proxy miss');
  res.writeHead(501);
  res.end();
};

Proxy.prototype.defaultHttpError = function (err, req, res) {
  req.emit('proxy error');
  res.writeHead(500);
  res.end();
};

Proxy.prototype.defaultWs = function (req, socket) {
  req.emit('proxy ws miss');
  socket.end();
};

Proxy.prototype.defaultWsError = function (err, req, socket) {
  req.emit('proxy ws error');
  socket.end();
};
