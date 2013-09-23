
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:shards');
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
  this.balancer = balancer;
  this.state = facet({});
}

inherits(Shards, Hash);

// TODO: random id
Shards.prototype.create = function(port, address) {
  var id = address + ':' + port;
  debug('(create) %s', id);
  var shard = new Shard(id, port, address);
  this.set(shard.id, shard);
  return shard;
};

Shards.prototype.findOrCreate = function(port, address) {
  var shard = this.find({ port: port, address: address }).at(0);

  if (shard) {
    debug('(findOrCreate) found: %s', shard.id);
    return shard;
  }

  shard = this.create(port, address);
  debug('(findOrCreate) create: %', shard.id);
  return shard;
};

Shards.prototype.byCondition = function(val) {
  return this.find({ condition: val });
};

Shards.prototype.byRole = function(val) {
  return this.find({ role: val });
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
