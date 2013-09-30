
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:shard');
var extend = require('tea-extend');
var facet = require('facet');
var Schema = require('gaia-schema');
var sherlock = require('sherlock');

/*!
 * Internal constructors
 */

var ShardState = require('./_shard.state');

/*!
 * Options schema
 */

var SCHEMA = Schema({
    id: { type: String, required: true }
  , address: { type: String, required: true }
  , port: { type: Number, required: true }
  , condition: { type: String, required: true, default: 'enabled' }
  , maxConnections: { type: Number, default: 5000 }
  , saturation: { type: Number, min: 0, max: 1, default: 0.85 }
  , role: { type: String, default: 'primary' }
  , weight: { type: Number, default: 1 }
});

/*!
 * Primary exports
 */

module.exports = Shard;

/**
 * ### Shard
 *
 * A shard represents a target that incoming traffic
 * can be routed too. Shards maintain a count of
 * all connections so that traffic can be throttled
 * if needed.
 *
 * @param {Object} options
 * @return {Shard}
 * @api public
 */

function Shard(opts) {
  ShardState.call(this, '_shardState');
  this._shardState.debug = sherlock('carbon:balancer:shard-state');
  this._shardStats = { active: 0, protocols: {} };

  var store = this._shardStore = facet({});
  store.schema = SCHEMA;

  this.initialize(opts);
}

/*!
 * Mixin from Shard State
 */

ShardState.mixin(Shard.prototype, '_shardState');

/**
 * #### .id
 *
 * Get the shards stored id.
 *
 * @return {String} id
 * @api public
 */

Object.defineProperty(Shard.prototype, 'id', {
  get: function() {
    return this._shardStore.get('id');
  }
});

/**
 * #### .state
 *
 * Get the shard's current state.
 *
 * @return {String} state
 * @api public
 */

Object.defineProperty(Shard.prototype, 'state', {
  get: function() {
    return this._shardState.state;
  }
});

/**
 * #### .get(key)
 *
 * Get a stored property from this shard.
 *
 * @param {String} key
 * @return {Mixed} value
 * @api public
 */

Shard.prototype.get = function(key) {
  return this._shardStore.get(key);
};

/**
 * #### .toJSON()
 *
 * Export this shards's settings to
 * an object that can be sent over the wire
 * or stored in a database. Can also be used
 * to reinstantiate this shard.
 *
 * @return {Object} json
 * @api public
 */

Shard.prototype.toJSON = function() {
  var store = this._shardStore;
  var res = extend({}, store.settings);
  res.state = this._shardState.state;
  delete res.id;
  return res;
};

/**
 * #### .address()
 *
 * Get the currently bound address object
 * for this shard.
 *
 * @return {Object} address
 * @api public
 */

Shard.prototype.address = function() {
  var res = {};
  res.host = this.get('address');
  res.port = this.get('port');
  return res;
};

/**
 * #### .role([role])
 *
 * Get/set the role of this shard. Allowed
 * values are `primary` and `secondary`.
 *
 * @param {String} role
 * @api public
 */

Shard.prototype.role = function(role) {
  if (!arguments.length) return this.get('role');

  role = role.toLowerCase();
  if (!~[ 'primary', 'secondary' ].indexOf(role)) {
    var err = new Error('Invalid role');
    debug('(role) error: %s', err.message);
    throw err;
  }

  this._shardStore.set('role', role);
  return this;
};

/**
 * #### .increase(protocol)
 *
 * Increate the total connection count and
 * (optionally) the connection count for a given
 * protocol.
 *
 * If connection count exceeds `maxConnections` may
 * invoke saturation prevent shard from accepting
 * more connections.
 *
 * @param {String} protocol key
 * @api public
 */

Shard.prototype.increase = function(proto) {
  var max = this._shardStore.get('maxConnections');
  var stats = this._shardStats;

  if (proto) {
    var val = stats.protocols[proto];
    stats.protocols[proto] = val ? 1 : val + 1;
  }

  ++stats.active;
  this.emit('stats', stats);

  if (stats.active >= max && 'enabled' === this.state) {
    this._saturated();
  }
};

/**
 * #### .descrease(protocol)
 *
 * Descres the total connection count and
 * (optionally) the connection count for a given
 * protocol.
 *
 * If the shard is currently saturated or draining
 * it might emit the appropriate event when the
 * connection count falls below the appropriate value.
 *
 * @param {String} protocol key
 * @api public
 */

Shard.prototype.decrease = function(proto) {
  var stats = this._shardStats;

  if (proto) {
    var val = stats.protocols[proto];
    stats.protocols[proto] = val ? 0 : val - 1;
  }

  --stats.active;
  this.emit('stats', stats);

  if ('enabled' !== this.state) {
    maybeEmit(this);
  }
};

/*!
 * Determine if the shard should emit
 * `_fresh` or `_drain` events indicating
 * that connection count is below the threshold
 * or `0`, respectively.
 *
 * @param {Shard} target
 * @api private
 */

function maybeEmit(shard) {
  var active = shard._shardStats.active;
  var state = shard.state;

  function emit(e) {
    debug('(%s)', e);
    shard.emit(e);
  }

  if ('draining' === state) {
    if (active <= 0) emit('_drain');
  } else if ('saturated' === state) {
    var store = shard._shardStore;
    var max = store.get('maxConnections');
    var th = store.get('threshold') || 0.85;
    var min = Math.floor(max * th);
    if (active <= min) emit('_fresh');
  }
}
