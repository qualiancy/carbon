
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:supervisor');
var EventEmitter = require('drip').EnhancedEmitter;
var facet = require('facet');
var inherits = require('util').inherits;

/*!
 * Internal dependencies
 */

var Balancers = require('./balancers');
var Servers = require('./servers');

/*!
 * Primary exports
 */

module.exports = Supervisor;

/**
 * ### Supervisor
 *
 * @param {Object} options
 * @return {Supervisor}
 * @api public
 */

function Supervisor() {
  if (!(this instanceof Supervisor)) return new Supervisor();
  EventEmitter.call(this, { delimeter: ':' });
  this.set('strategies', [ 'random', 'round robin' ]);
  this.balancers = createBalancers(this);
  this.servers = createServers(this);
}

/*!
 * Inherits from EventEmitter
 */

inherits(Supervisor, EventEmitter);

/*!
 * Settings mixin
 */

facet(Supervisor.prototype);

/**
 * #### .createBalancer(type, name, opts, cb)
 *
 * Find of create a balancer with the given params.
 * Method is asyncronous so any validation errors
 * can be bubble up. Will emit `balancer:create`
 * on success.
 *
 * @param {String} type
 * @param {String} name
 * @param {Object} options
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Server} server
 * @return this
 * @api public
 */

Supervisor.prototype.createBalancer = function(type, name, opts, cb) {
  this.balancers.findOrCreate(type, name, opts, cb);
  return this;
};

/**
 * #### .createServer(type, opts, cb)
 *
 * Find of create a server with the given params.
 * Method is asyncronous so any validation errors
 * can be bubble up. Will emit `server:create` on
 * success.
 *
 * @param {String} type
 * @param {Object} options
 * @param {Function} callback
 * @cb {Error|null} if error
 * @cb {Server} server
 * @return this
 * @api public
 */

Supervisor.prototype.createServer = function(type, opts, cb) {
  this.servers.findOrCreate(type, opts, cb);
  return this;
};

/*!
 * Create a balancers collection and bind
 * events at the `balancer` namespace.
 *
 * @param {Supervisor} context
 * @return {Balancers} collection
 * @api private
 */

function createBalancers(ctx) {
  var balancers = new Balancers(ctx);
  ctx.proxyEvent('create', 'balancer', balancers);
  return balancers;
}

/*!
 * Create a servers collection and bind
 * events at the `server` namespace.
 *
 * @param {Supervisor} context
 * @return {Servers} collection
 * @api private
 */

function createServers(ctx) {
  var servers = new Servers(ctx);
  ctx.proxyEvent('create', 'server', servers);
  return servers;
}
