
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:server:base');
var EventEmitter = require('drip').EnhancedEmitter;
var facet = require('facet');
var inherits = require('util').inherits;
var sherlock = require('sherlock');

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

function Base(type, name, opts) {
  ServerMachine.call(this, '_serverState');
  this._serverState.ns = type + '-state';
  this._serverState.debug = sherlock('carbon:server:' + type + '-state');
  this._serverStore = facet({});
  this._serverStore.set(opts);
  this.name = name;
  this.stack = [];
  this.type = type;
}

/*!
 * Mixin finite state machine
 */

ServerMachine.mixin(Base.prototype, '_serverState', { delimeter: ':' });

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
