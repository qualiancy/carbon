
var debug = require('sherlock')('carbon:shard');
var extend = require('tea-extend');
var facet = require('facet');
var Schema = require('gaia-schema');
var sherlock = require('sherlock');

var ShardState = require('./_shard.state');

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

module.exports = Shard;

function Shard(opts) {
  ShardState.call(this, '_shardState');
  this._shardState.debug = sherlock('carbon:balancer:shard-state');
  this._shardStats = { active: 0, protocols: {} };

  var store = this._shardStore = facet({});
  store.schema = SCHEMA;

  this.initialize(opts);
}

ShardState.mixin(Shard.prototype, '_shardState');

Object.defineProperty(Shard.prototype, 'id', {
  get: function() {
    return this._shardStore.get('id');
  }
});

Object.defineProperty(Shard.prototype, 'state', {
  get: function() {
    return this._shardState.state;
  }
});

Shard.prototype.get = function(key) {
  return this._shardStore.get(key);
};

Shard.prototype.toJSON = function() {
  var store = this._shardStore;
  var res = extend({}, store.settings);
  res.state = this._shardState.state;
  delete res.id;
  return res;
};

Shard.prototype.address = function() {
  var res = {};
  res.host = this.get('address');
  res.port = this.get('port');
  return res;
};

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
