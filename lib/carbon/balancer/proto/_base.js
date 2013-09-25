
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

var BalancerMachine = require('./_base.machine');
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
 * @param {String} protocol
 * @param {Object} options
 * @return {Balancer}
 * @api public
 */

function Base(app, opts) {
  BalancerMachine.call(this, '_balancerState');
  var state = this._balancerState;
  var store = this._balancerStore = facet({});
  store.schema = Schema(extend({}, this.__schema));

  this.app = app;
  this.shards = new Shards(this);
  this.handle = this.handle.bind(this);

  var options = store.schema.cast(opts || {});

  if (!options.valid) {
    var err = new Error('Found ' + options.errors.length + ' error(s) when validating options.');
    debug('error: %s', err.message);
    err.errors = options.errors;
    state.setError(err);
  } else {
    store.set(options.casted);
    state.ns = store.get('type') + '-state';
    state.debug = sherlock('carbon:balancer:' + store.get('type') + '-state');
    this.strategy(store.get('strategy'));
  }
}

/*!
 * Mixin from Balancer Machine
 */

BalancerMachine.mixin(Base.prototype, '_balancerState', { delimeter: ':' });

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

/*!
 * Force all shards to drain active connections.
 * When in progress this balancer will no longer
 * accept new connections. Generally, this is used
 * during a stop cycle.
 *
 * @param {Function} callback
 * @api private
 */

Base.prototype._drainShards = function(cb) {
  async.forEach(this.shards.toArray(), function(spec, next) {
    var shard = spec.value;
    if ('disabled' === shard.state) return next();
    debug('(drain shards) draining: %s', shard.id);
    shard.drain(next);
  }, cb);
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
