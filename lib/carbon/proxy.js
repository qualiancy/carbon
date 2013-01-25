/*!
 * Carbon - Proxy Constructor
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependencies
 */

var debug = require('sherlock')('carbon:proxy')
  , EventEmitter = require('drip').EventEmitter
  , util = require('util');

/*!
 * Internal dependancies
 */

var _ = require('./utils')
  , middleware = require('./middleware')
  , ProxyRequest = require('./proxyRequest');

/*!
 * constants
 */

var env = process.env.NODE_ENV || 'development';

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
  EventEmitter.call(this);
  opts = opts || {};

  if (!server) throw new Error('Carbon Proxy requires an http server');
  this.server = server;
  this.server.on('request', handleRequest.bind(this));
  this.server.on('upgrade', handleUpgrade.bind(this));

  this._stack = {
      http: {
          all: [ middleware.defaultHttp ]
        , err: [ middleware.defaultHttpError ] }
    , ws: {
          all: [ middleware.defaultWs ]
        , err: [ middleware.defaultWsError ] }
  };
};

/**
 * Inherit from drip event emitter
 */

util.inherits(Proxy, EventEmitter);

/**
 * # .ws
 *
 * Assert that the next `use` statement will be for
 * an websocket. Alternatively, method `use` for function
 * as an websocket. Returns `this` for chaining.
 *
 *      proxy.ws.use(fn);
 *      proxy.ws(fn);
 *      proxy.ws.error(fn);
 *      proxy.error.ws(fn);
 *
 * @param {Function} callback
 * @return {this}
 * @api public
 */

Object.defineProperty(Proxy.prototype, 'ws',
  { get: function () {
      this._useWS = true;
      var useWs = function (fn) {
        this.use(fn);
        return this;
      }
      useWs.__proto__ = this;
      return useWs;
    }
});

/**
 * # .error
 *
 * Assert that the next `use` statement will be for
 * an error. Alternatively, method `use` for function
 * as an error. Returns `this` for chaining.
 *
 *      proxy.error.use(fn);
 *      proxy.error(fn);
 *      proxy.ws.error(fn);
 *      proxy.error.ws(fn);
 *
 * @param {Function} callback
 * @return {this}
 * @api public
 */

Object.defineProperty(Proxy.prototype, 'error',
  { get: function () {
      this._useErr = true;
      var useError = function (fn) {
        this.use(fn);
        return this;
      }
      useError.__proto__ = this;
      return useError;
    }
});

/**
 * # use
 *
 * Add a callback function to the stack based on
 * previous switches. Defaults to normal http.
 *
 * @param {Function} callback
 * @returns {this}
 * @api public
 */

Proxy.prototype.use = function (fn) {
  if (fn.handle && 'function' === typeof fn.handle)
    fn = fn.handle;

  var stack = this._stack;
  stack = this._useWS ? stack.ws : stack.http;
  stack = this._useErr ? stack.err : stack.all;
  stack.splice(stack.length - 1, 0, fn)
  this._useWS = false;
  this._useErr = false;
  return this;
};

/**
 * # configure
 *
 * Handler for NODE_ENV based configuration. Defaults
 * to all environments.
 *
 * @param {String} environment (optional)
 * @param {Function} runnable
 * @api public
 */

Proxy.prototype.configure = function (_env, fn) {
  if ('function' === typeof _env) {
    fn = _env;
    _env = env;
  }

  if (_env === env) fn();
};

/*!
 * # handleRequest
 *
 * proxies req/res to the run command and build
 * proxy request upon match
 *
 * @param {http.Request} node request object
 * @param {http.Response} node response object
 */

function handleRequest (req, res) {
  debug('handle request', req.headers.host, req.url);
  var self = this
    , stack = Array.prototype.slice.call(this._stack.http.all, 0);

  req.buf = _.buffer(req);

  // run our init middleware function first
  stack.splice(0, 0, middleware.init(this));

  // iterate through the stack
  runStack.call(this, stack, [ req, res ], function (port, host, secure) {
    var opts = { port: port, host: host || 'localhost', buffer: req.buf }
      , request = new ProxyRequest(req, res);

    if ('boolean' == typeof secure)
      opts.secure = secure;

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

function handleUpgrade (req, socket, head) {
  debug('handle websocket', req.headers.host, req.url);
  var self = this
    , stack = Array.prototype.slice.call(this._stack.ws.all, 0);

  req.head = head;
  req.buf = _.buffer(req);

  // iterate through the stack
  runStack.call(this, stack, [ req, socket ], function (port, host, secure) {
    var opts = { port: port, host: host || 'localhost', buffer: req.buf, head: req.head }
      , request = new ProxyRequest(req, socket);

    if ('boolean' === typeof secure)
      opts.secure = secure;

    // send proxy start event to `res` object for middleware
    request.on('start', function () {
      debug('proxy ws start', opts.host, opts.port, req.url);
      socket.emit('proxy ws start');
    });

    // send proxy end event to `res` object for middleware
    request.on('end', function () {
      debug('proxy ws end', opts.host, opts.port, req.url);
      socket.emit('proxy ws end');
    });

    // start the proxy
    request.proxyWS(opts);
  });
};

/*!
 * # runStack
 *
 * iterates through the callback stack for a given
 * strategy. ends stack run upon match and calls
 * callback.
 *
 * @param {Array} stack to run
 * @param {Array} arguments to pass to stack callback
 * @param {Function} callback to execute upon match
 * @api private
 */

function runStack (stack, args, cb) {
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
