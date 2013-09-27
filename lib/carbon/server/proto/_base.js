
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:server:base');
var extend = require('tea-extend');
var facet = require('facet');
var inherits = require('util').inherits;
var Schema = require('gaia-schema');

var ServerMachine = require('./_base.machine');

/*!
 * Primary Exports
 */

module.exports = Base;

/**
 * ### Server
 *
 * This constructor is inheritted by all
 * other types of servers. It should not
 * be constructed directly.
 *
 * @param {String} type
 * @param {String} name
 * @param {Object} options
 * @api public
 */

function Base(opts) {
  ServerMachine.call(this, '_serverState');
  var store = this._serverStore = facet({});
  store.schema = Schema(extend({}, this.__schema));

  this.stack = [];
  this.initialize(opts);
}

/*!
 * Mixin finite state machine
 */

ServerMachine.mixin(Base.prototype, '_serverState', { delimeter: ':' });

/*!
 * Helper to provide a simple way to
 * extend the prototype of this constructor
 *
 * @param {Object} schema
 * @param {Object} prototype definition
 * @return {Function} new constructor
 * @api private
 */

Base.extend = function(schema, proto) {
  var self = this;

  var Server = function(opts) {
    self.call(this, opts);
  };

  extend(Server, this);
  inherits(Server, this);
  extend(Server.prototype, proto || {});
  Server.extend = this.extend;
  Server.prototype.__schema = schema;
  return Server;
};

/**
 * #### .state
 *
 * Return the state of the server.
 *
 * @return {String} state
 * @api public
 */

Object.defineProperty(Base.prototype, 'state', {
  get: function() {
    return this._serverState.state;
  }
});

/**
 * #### .get(key)
 *
 */

Base.prototype.get = function(key) {
  return this._serverStore.get(key);
};

/**
 * #### .address()
 *
 * Get the currently bound address object
 * for this proxy server. If not listening
 * will not include `address` or `port`.
 *
 * @return {Object} address
 */

Base.prototype.address = function() {
  if ('listening' !== this.state) return null;
  var res = {};
  res.address = this.get('address');
  res.port = this.get('port');
  return res;
};

Base.prototype._init = function() {
  throw new Error('_init not implemented');
};

/*!
 * Each server must implement a `_listen` function
 * that starts the underlying socket. Callback
 * when server is ready to receive connections.
 *
 * @param {Function} callback
 * @cb {Error|null} if error
 * @api private
 */

Base.prototype._listen = function(opts, cb) {
  var err = new Error('Not implemented');
  cb(err);
};

Base.prototype._close = function(cb) {
  var err = new Error('Not implemented');
  cb(err);
};

/**
 * #### .use(fn)
 *
 * Add a fn to the server stack.
 *
 * @param {Function} handle
 * @return this
 * @api public
 */

Base.prototype.use = function(fn) {
  if (fn && fn.handle) fn = fn.handle;
  debug('(use) %s', fn.name || '-');
  this.stack.push(fn);
  return this;
};

/**
 * #### .unuse(fn)
 *
 * Remove a fn to the server stack.
 *
 * @param {Function} handle
 * @return this
 * @api public
 */

Base.prototype.unuse = function(fn) {
  if (fn && fn.handle) fn = fn.handle;
  var i = this.stack.indexOf(fn);

  if (~i) {
    debug('(unuse) %s', fn.name || '-');
    this.stack.splice(i, 1);
  }

  return this;
};

/*!
 * Iterate through the stack until a match
 * been found. A match is noted by the
 * second argument to the callback. Error
 * as the first argument will also cancel
 * the stack iteration.
 *
 * @param {Array} stack
 * @param {Array} args to apply to stack function
 * @param {Function} callback
 * @api private
 */

Base.prototype.iter = function(stack, args, cb) {
  var self = this;
  var len = args.length;

  function done(err, opts) {
    if (err) {
      debug('(iter) error: %s', err.message);
      cb(err);
    } else {
      debug('(iter) hit: %j', opts);
      cb(null, opts);
    }
  }

  function iterate(i) {
    var fn = stack[i];

    if (!fn) {
      var err = new Error('Proxy miss');
      err.code = 'EPROXYMISS';
      err.statusCode = 501;
      return done(err);
    }

    args[len] = function next(err, opts) {
      if (arguments.length) {
        done(err, opts);
      } else {
        iterate(++i);
      }
    };

    fn.apply(self, args);
  }

  iterate(0);
};
