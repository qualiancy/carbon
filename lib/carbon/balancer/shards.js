
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


var Shard = require('./shard');

/*!
 * Primary exports
 */

module.exports = Shards

function Shards(balancer) {
  Hash.call(this, null, { findRoot: '_shardStore.settings' });
  this._ids = crystal();
  this.balancer = balancer;
  this.state = facet({});
}

inherits(Shards, Hash);

EventEmitter(Shards.prototype);

Shards.prototype.alloc = function() {
  var id = this._ids.claim();
  debug('(alloc) %s', id);
  return id;
};

Shards.prototype.set = function(key, value) {
  if (!this._ids.has(key)) this._ids.claim(key);
  Hash.prototype.set.call(this, key, value);
  this.emit('create', value);
  return this;
};

Shards.prototype.del = function(id) {
  var shard = this.get(id);
  Hash.prototype.del.call(this, id);
  this._ids.release(id);
  shard.emit('delete');
  return this;
};

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

Shards.prototype.byState = function(val) {
  return this.filter(function(shard) {
    return val === shard._shardState.state;
  });
};

Shards.prototype.next = function(cb) {
  var strategy = this.balancer._balancerStore.strategy;

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
