// this is a learning experiment
// inspired heavily by distribute
// https://github.com/learnboost/distribute
// deviation will occur

var util = require('util')
  , _ = require('./utils')
  , Drip = require('drip')
  , tea = require('tea')
  , Proxy = require('./proxy');

module.exports = Stack;

/**
 * # Stack (constructor)
 *
 * Options:
 *
 * @param {Object} http server listen to requests on
 * @param {Object} options
 */

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
  server.on('request', this.handleRequest.bind(this));
};

/**
 * Inherit from drip event emitter
 */

util.inherits(Stack, Drip);

/**
 * # use
 *
 * Add a callback function to the stack
 *
 * @param {Function} callback
 */

Stack.prototype.use = function (fn) {
  var middleware = this._stack;
  middleware = middleware.http.all;
  middleware.splice(middleware.length - 1, 0, fn)
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

Stack.prototype.run = function (stack, args, cb) {
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
 */

Stack.prototype.handleRequest = function (req, res) {
  var self = this;
  req.buf = _.buffer(req);
  this.run(this._stack.http.all, [ req, res ], function (port, host) {
    var opts = { port: port, host: host || 'localhost', buffer: req.buf };
    self.proxy.proxyRequest(req, res, opts);
  });
};

/**
 * This is the default/last caller in http stack
 */

Stack.prototype.defaultHttp = function (req, res) {
  res.writeHead(501);
  res.end();
};

