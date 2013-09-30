
/*!
 * Module dependencies
 */

var crystal = require('crystal');
var debug = require('sherlock')('carbon:shards');
var EventEmitter = require('drip').EventEmitter;
var extend = require('tea-extend');
var Hash = require('gaia-hash').Hash;
var facet = require('facet');
var inherits = require('util').inherits;

/*!
 * Internal constructors
 */

var Shard = require('./shard');

/*!
 * Primary exports
 */

module.exports = Shards

/**
 * ### Shards(ctx)
 *
 * A collection of shards.
 *
 * @param {Balancer} context
 * @api public
 */

function Shards(ctx) {
  Hash.call(this, null, { findRoot: '_shardStore.settings' });
  this._ids = crystal();
  this.ctx = ctx;
  this.state = facet({});
}

/*!
 * Inherits from Hash
 */

inherits(Shards, Hash);

/*!
 * Mixin the EventEmitter
 */

EventEmitter(Shards.prototype);

/**
 * #### .alloc()
 *
 * Allocate a new id string.
 *
 * @return {String} id
 * @api public
 */

Shards.prototype.alloc = function() {
  var id = this._ids.claim();
  debug('(alloc) %s', id);
  return id;
};

/*!
 * Hook into hash#set to ensure a
 * `create` event is emitted on the
 * current Servers instance.
 *
 * @param {String} key
 * @return this
 * @api private
 */

Shards.prototype.set = function(key, value) {
  if (!this._ids.has(key)) this._ids.claim(key);
  Hash.prototype.set.call(this, key, value);
  this.emit('create', value);
  return this;
};

/*!
 * Hook into hash#del to ensure the
 * `delete` event is emitted on the
 * shard that is being removed.
 *
 * @param {String} key
 * @return this
 * @api private
 */

Shards.prototype.del = function(id) {
  var shard = this.get(id);
  Hash.prototype.del.call(this, id);
  this._ids.release(id);
  shard.emit('delete');
  return this;
};

/**
 * #### .create(opts[, cb])
 *
 * Create a new shard in this collection. Shards
 * do not need to have unique address:pair pairs
 * in a collection.
 *
 * @param {Object} options
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Shard} shard created
 * @api public
 */

Shards.prototype.create = function(opts, cb) {
  cb = cb || function() {};
  var self = this;

  setImmediate(function() {
    var options = extend({}, opts || {}, { id: self.alloc() });
    var shard = new Shard(options);

    if ('error' === shard.state) {
      var err = shard._shardState.stateArgs[0];
      err.code = 'EBADOPTS';
      return cb(err);
    }

    self.set(options.id, shard);
    cb(null, shard);
  });
};

/**
 * #### .byState(state)
 *
 * Return filtered hash of all shards
 * that match a given state.
 *
 * @param {String} state ('enabled' || 'disabled')
 * @return {Shards} filtered
 * @api public
 */

Shards.prototype.byState = function(val) {
  return this.filter(function(shard) {
    return val === shard._shardState.state;
  });
};

/**
 * #### .next(cb)
 *
 * Get the next shard to route to given the
 * attached balancer's strategy. If no shards
 * are available will return `null` as second
 * argument of callback.
 *
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Shard|nlll} result
 * @api public
 */

Shards.prototype.next = function(cb) {
  var strategy = this.ctx._balancerStore.strategy;

  function none() {
    debug('(next) no shards');
    cb();
  }

  if (!this.length) return none();
  debug('(next) invoke: %s', strategy.name || '-');
  strategy(this, function(err, shard) {
    if (err) {
      debug('(next) error: %s', err.message);
      cb(err);
    } else if (!shard) {
      none();
    } else {
      debug('(next) found: %j', shard.address());
      cb(null, shard);
    }
  });
};
