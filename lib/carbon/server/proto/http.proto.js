
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:server:http');
var EventEmitter = require('drip').EnhancedEmitter;
var extend = require('tea-extend');
var http = require('http');
var proxy = require('carbon-proxy');

/*!
 * Provide listen hook.
 *
 * @param {Object} options
 * @param {Function} callback
 * @api private
 */

exports._listen = function(opts, cb) {
  var self = this;
  var address = opts.address;
  var port = opts.port;
  var handle = http.createServer();
  handle.setTimeout(20 * 1000);
  handle.on('request', this._request.bind(this));
  handle.on('upgrade', this._upgrade.bind(this));
  handle.listen(port, address, function(err) {
    if (err) return cb(err);
    self._handle = handle;
    cb();
  });
};

/*!
 * Provide close hook.
 *
 * @param {Function} callback
 * @api private
 */

exports._close = function(cb) {
  var self = this;
  var handle = this._handle;

  function clean() {
    delete self._handle;
    cb();
  }

  handle.once('close', clean);
  handle.close();
};

/*!
 * Handle HTTP request events.
 *
 * @param {Request} request object
 * @param {Response} response object
 * @api private
 */

exports._request = function(req, res) {
  debug('(request) %s %s %s', req.method, req.headers.host, req.url);
  var stack = [].slice.call(this.stack);
  stack.splice(0, 0, wrap({ type: 'request' }));

  // TODO: hackish?
  if ('listening' !== this.state) {
    req.connection.setTimeout(1);
  }

  req.pause();
  this.iter(stack, [ req, res ], function(err, opts) {
    if (err) return requestError(err, req, res);
    var route = proxy(req, res);
    var cleanup = bindListeners(req.proxyState, route);
    req.proxyState.on('proxy:end', cleanup);
    req.resume();
    route.request(opts);
  });
};

/*!
 * Handle HTTP upgrade events (websockets).
 *
 * @param {Request} request object
 * @param {Socket} socket object
 * @param {Buffer} head buffer
 * @api private
 */

exports._upgrade = function(req, socket, head) {
  debug('(upgrade) %s %s %s', req.method, req.headers.host, req.url);
  var stack = [].slice.call(this.stack);
  stack.splice(0, 0, wrap({ type: 'upgrade' }));
  req.pause();
  this.iter(stack, [ req, socket ], function(err, opts) {
    if (err) return upgradeError(err, req, socket);
    var route = proxy(req, socket, head);
    var cleanup = bindListeners(req.proxyState, route);
    req.proxyState.on('proxy:end', cleanup);
    req.resume();
    route.upgrade(opts);
  });
};

/*!
 * Wrap up settings into a proxyState event
 * emitter. Return a function to use as the
 * first middleware.
 *
 * @param {Object} settings
 * @return {Function} init middleware
 * @api private
 */

function wrap(settings) {
  return function init(req, res, next) {
    var state = new EventEmitter({ delimeter: ':' });
    extend(state, settings);
    req.proxyState = res.proxyState = state;
    req.res = res;
    res.req = req;
    next();
  };
}

/*!
 * Convert an error into a response.
 *
 * TODO: handle env config
 *
 * @param {Error} proxy error
 * @param {Request} original request
 * @param {Response} original response
 * @api private
 */

function requestError(err, req, res) {
  var body = err.body || err.message;
  var code = err.statusCode || 500;
  var ctype = err.contentType || 'text/plain';
  res.setHeader('content-type', ctype);
  res.setHeader('content-length', new Buffer(body).length);
  res.setHeader('x-carbon-error', err.code || 'EPROXYERROR');
  res.writeHead(code);
  res.end(body);
  res.proxyState.emit('proxy:error', err);
}

/*!
 * Turn of socket on an error.
 *
 * TODO: handle env config
 *
 * @param {Error} proxy error
 * @param {Request} original request
 * @param {Socket} original socket
 * @api private
 */

function upgradeError(err, req, socket) {
  socket.end();
  socket.proxyState.emit('proxy:error', err);
}

/*!
 * Listen to events on target and emit them
 * on a given event emitter, prepending the namespace.
 * Return a function to remove listeners added.
 *
 * @param {String} namespace
 * @param {EventEmitter} emit target
 * @param {EventEmitter} listen target
 * @return {Function} cleanup
 * @api public
 */

function bindListeners(emit, listen) {
  emit.proxyEvent('error', 'proxy', listen);
  emit.proxyEvent('start', 'proxy', listen);
  emit.proxyEvent('response', 'proxy', listen);
  emit.proxyEvent('end', 'proxy', listen);
  return function cleanup() {
    emit.unproxyEvent('error', 'proxy', listen);
    emit.unproxyEvent('start', 'proxy', listen);
    emit.unproxyEvent('response', 'proxy', listen);
    emit.unproxyEvent('end', 'proxy', listen);
  }
}
