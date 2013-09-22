
var debug = require('sherlock')('carbon:shard');
var facet = require('facet');
var sherlock = require('sherlock');

var Condition = require('./condition');

module.exports = Shard;

function Shard(id, port, address) {
  Condition.call(this, '_shardCondition');
  this._shardCondition.ns = 'shard-condition';
  this._shardCondition.debug = sherlock('carbon:shard-condition');
  this._shardStats = { active: 0, protocols: {} };
  var store = this._shardStore = facet({});
  store.set('id', id);
  store.set('address', address);
  store.set('port', port);
  store.set('maxConnections', 5000);
  store.set('threshold', 0.85);
  store.set('role', 'primary');
}

Condition.mixin(Shard.prototype, '_shardCondition');

Object.defineProperty(Shard.prototype, 'id', {
  get: function() {
    return this._shardStore.get('id');
  }
});

Object.defineProperty(Shard.prototype, 'state', {
  get: function() {
    return this._shardCondition.state;
  }
});

Shard.prototype.address = function() {
  var store = this._shardStore;
  var res = {};
  res.host = store.get('address');
  res.port = store.get('port');
  return res;
};

Shard.prototype.role = function(role) {
  var store = this._shardStore;
  if (!arguments.length) return store.get('role');

  role = role.toLowerCase();
  if (!~[ 'primary', 'secondary' ].indexOf(role)) {
    var err = new Error('Invalid role');
    debug('(role) error: %s', err.message);
    throw err;
  }

  store.set('role', role);
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

  if (stats.active >= max && 'available' === this.state) {
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

  if ('available' !== this.state) {
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
