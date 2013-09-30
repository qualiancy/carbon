
/*!
 * Module dependencies
 */

var async = require('breeze-async');
var debug = require('sherlock')('carbon:balancer:base');
var extend = require('tea-extend');
var facet = require('facet');
var inherits = require('util').inherits;
var Schema = require('gaia-schema');
var sherlock = require('sherlock');

/*!
 * Internal constructors
 */

var BalancerState = require('./_base.state');
var Shards = require('../shards');

/*!
 * Internal utilities
 */

var strategies = require('../strategies');

/*!
 * Primary exports
 */

module.exports = Base;

/**
 * ### Balancer
 *
 * A balancer handles routing traffic through multiple
 * shards (destination servers). While there are different
 * implementations for different protocols, this is the base.
 *
 * @param {Application} app
 * @param {Object} options
 * @return {Balancer}
 * @api public
 */

function Base(app, opts) {
  BalancerState.call(this, '_balancerState');
  var state = this._balancerState;
  var store = this._balancerStore = facet({});
  store.schema = Schema(extend({}, this.__schema));

  this.app = app;
  this.shards = createShards(this);
  this.handle = this.handle.bind(this);
  this.initialize(opts);
}

/*!
 * Mixin from Balancer State
 */

BalancerState.mixin(Base.prototype, '_balancerState', { delimeter: ':' });

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

  function Balancer(app, opts) {
    self.call(this, app, opts);
  };

  extend(Balancer, this);
  inherits(Balancer, this);
  extend(Balancer.prototype, proto || {});
  Balancer.extend = this.extend;
  Balancer.prototype.__schema = schema;
  return Balancer;
};

/**
 * #### .state
 *
 * Get the current state of the balancer.
 *
 * @return {String}
 * @api public
 */

Object.defineProperty(Base.prototype, 'state', {
  get: function() {
    return this._balancerState.state;
  }
});

/**
 * #### .get(key)
 *
 * Get a value from the balancers settings store.
 *
 * @param {String} key
 * @return {Mixed} result
 * @api public
 */

Base.prototype.get = function(key) {
  return this._balancerStore.get(key);
};

/**
 * #### .toJSON()
 *
 * Export this balancer's settings to
 * an object that can be sent over the wire
 * or stored in a database. Can also be used
 * to reinstantiate this balancer.
 *
 * @return {Object} json
 * @api public
 */

Base.prototype.toJSON = function() {
  var shards = this.shards;
  var store = this._balancerStore;
  var res = extend({}, store.settings);

  res.shards = [];
  shards.each(function(shard) {
    res.shards.push(shard.toJSON());
  });

  return res;
};

/**
 * #### .strategy(handle)
 *
 * Set the balancer strategy. Can be a name of
 * one of the provided strategies or a function.
 *
 * @param {String|Function} strategy
 * @return this
 * @api public
 */

Base.prototype.strategy = function(handle) {
  var allowed = this.app.get('strategies');
  var key = 'string' === typeof handle ? handle : 'custom';
  var fn = 'custom' === key ? handle : strategies[key.replace(' ', '_')];

  if (!~allowed.indexOf(key)) {
    var err = new Error('Strategy not permitted.');
    debug('(strategy) error: %s', err.message);
    throw err;
  }

  if (!fn || 'function' !== typeof fn) {
    var err = new Error('Strategy not a function.');
    debug('(strategy) error: %s', err.message);
    throw err;
  }

  var store = this._balancerStore;
  store.set('strategy', key);
  store.strategy = fn;
  return this;
};

/*!
 * A balancer may hook into any of the following
 * enable/disable hooks.
 *
 * @param {Function} cb
 * @api private
 */

Base.prototype._preStart = function(cb) { cb(); };
Base.prototype._postStart = function(cb) { cb(); };
Base.prototype._preStop = function(cb) { cb(); };
Base.prototype._postStop = function(cb) { cb(); };

/*!
 * Instruction to enable a single virtual IP. Can
 * be overwritten by implementors of base balancer
 * but it is inadvisable.
 *
 * @param {Object} ip definition (for server)
 * @param {Function} callback
 * @api private
 */

Base.prototype._startVirtualIP = function(ip, cb) {
  var self = this;
  var servers = this.app.servers;
  var type = this.get('type');
  servers.findOrCreate(type, ip, function(err, server) {
    if (err) return cb(err);
    server.use(self.handle);
    server.listen(cb);
  });
};

/*!
 * Instruction to disable a single virtual IP. Can
 * be overwritten by implementors of base balancer
 * but it is inadvisable.
 *
 * @param {Object} ip definition (for server)
 * @param {Function} callback
 * @api private
 */

Base.prototype._stopVirtualIP = function(ip, cb) {
  var self = this;
  var servers = this.app.servers;
  var server = servers.find(ip).at(0);
  if (!server) return cb();
  server.unuse(this.handle);
  debug('(disable ip) disabled: %s', ip.address);
  if (server.stack.length) return cb();
  server.close(function(err) {
    if (err) return cb(err);
    servers.del(server.name);
    cb();
  });
};

/**
 * #### .createShard(opts, cb)
 *
 * Create a shard and add it to this balancer.
 * Will emit `shard:create` on this balancer.
 *
 * @param {Object} options
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Shard} shard created
 * @api public
 */

Base.prototype.createShard = function(opts, cb) {
  this.shards.create(opts, cb);
};

/**
 * #### .deleteShard(shard[, cb])
 *
 * Delete a shard from this balancer. Will emit
 * `delete` event on the shard being removed.
 *
 * @param {Shard|String} shard to remove
 * @param {Function} callback
 * @api public
 */

Base.prototype.deleteShard = function(id, cb) {
  if ('string' !== typeof id) id = shard.get('id');
  cb = cb || function() {};
  var shards = this.shards;
  var shard = shards.get(id);
  if (!shard) return cb(null);
  debug('(delete shard) %s', id);
  shard.disable(function(err) {
    shards.del(id);
    cb(null);
  });
};

/*!
 * Force all shards to drain active connections.
 * When in progress this balancer will no longer
 * accept new connections. Generally, this is used
 * during a stop cycle.
 *
 * @param {Function} callback
 * @api private
 */

Base.prototype.drainShards = function(cb) {
  async.forEach(this.shards.toArray(), function(spec, next) {
    var shard = spec.value;
    if ('disabled' === shard.state) return next();
    debug('(drain shards) draining: %s', shard.id);
    shard.drain(next);
  }, cb);
};

Base.prototype._init = function() {
  throw new Error('_init not implemented');
};

// TODO: more error checking
Base.prototype.handle = function balancerHandle(req, res, next) {
  if ('started' !== this.state) return next();
  debug('(handle)');
  this._handle(req, res, next);
};

Base.prototype._handle = function(req, res, next) {
  var err = new Error('not implemented');
  debug('(_handle) error: %s', err.message);
  next(err);
};

function createShards(ctx) {
  var shards = new Shards(ctx);
  ctx.proxyEvent('create', 'shard', shards);
  return shards;
}
