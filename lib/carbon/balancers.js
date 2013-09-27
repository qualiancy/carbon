
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:balancers');
var EventEmitter = require('drip').EventEmitter;
var extend = require('tea-extend');
var Hash = require('gaia-hash').Hash;
var inherits = require('util').inherits;

/*!
 * Internal constructors
 */

var balancers = require('./balancer');

/*!
 * Primary exports
 */

module.exports = Balancers;

/**
 * ### Balancers(context)
 *
 * The collection of balancers.
 *
 * @param {Supervisor} context
 * @api public
 */

function Balancers(ctx) {
  Hash.call(this, null, { findRoot: '_balancerStore.settings' });
  this.ctx = ctx;
}

/*!
 * Inherits from Hash
 */

inherits(Balancers, Hash);

/*!
 * Mixin the EventEmitter
 */

EventEmitter(Balancers.prototype);

/*!
 * Hook into hash#set to ensure a
 * `create` event is emitted on the
 * current Balancers instance.
 *
 * @param {String} key
 * @return this
 * @api private
 */

Balancers.prototype.set = function(key, value) {
  Hash.prototype.set.call(this, key, value);
  this.emit('create', value);
  return this;
};

/*!
 * Hook into hash#del to ensure the
 * `delete` event is emitted on the
 * balancer that is being removed.
 *
 * @param {String} key
 * @return this
 * @api private
 */

Balancers.prototype.del = function(key) {
  var balancer = this.get(key);
  Hash.prototype.del.call(this, key);
  balancer.emit('delete');
  return this;
};

/**
 * #### .findOrCreate(type, name, opts, cb)
 *
 * Find or create a balancer based on the options
 * given.
 *
 * @param {Object} options
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Server} constructed or returned
 * @api public
 */

Balancers.prototype.findOrCreate = function(type, name, opts, cb) {
  if ('number' === typeof opts) opts = { port: opts };
  var err;

  function done(ex, res) {
    setImmediate(function() { cb(ex, res); });
  }

  if (!balancers.has(type)) {
    err = new Error('Server type of "' + type + '" does not exist.');
    return done(err);
  }

  var self = this;
  var balancer = this.get(name);

  if (balancer && type !== balancer.get('type')) {
    err = new Error('Balancer named "' + name + '" found but wrong type.');
    return done(err);
  } else if (balancer) {
    return done(null, balancer);
  }

  opts = extend({}, opts || {}, { name: name });
  balancers.create(this.ctx, type, opts, function(err, balancer) {
    if (err) return cb(err);
    self.set(name, balancer);
    cb(null, balancer);
  });
};
